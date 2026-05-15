from __future__ import annotations

from collections import Counter
from datetime import date
import random
from typing import Any

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.movie import Movie
from app.models.movie_request import MovieRequest, MovieRequestSupporter
from app.models.rating import Rating
from app.models.user import User
from app.models.weekly_drop import WeeklyDrop
from app.models.weekly_drop_vote import WeeklyDropBallot, WeeklyDropOption
from app.services.admin_settings import DEFAULT_DROP_SELECTION_SETTINGS, get_setting
from app.services.movie_metadata import serialize_movie

FLEXIBLE_DROP_MODES = {"user_vote", "random_pool"}
DROP_SELECTION_SETTINGS_KEY = "drop_selection"


def normalize_drop_selection_settings(value: dict[str, Any]) -> dict[str, int]:
    defaults = DEFAULT_DROP_SELECTION_SETTINGS["user_vote"]
    total = int(value.get("user_vote", {}).get("total_options", defaults["total_options"]))
    smart = int(value.get("user_vote", {}).get("smart_options", defaults["smart_options"]))
    wildcard = int(value.get("user_vote", {}).get("wildcard_options", defaults["wildcard_options"]))

    total = max(1, total)
    smart = max(0, smart)
    wildcard = max(0, wildcard)
    if smart + wildcard != total:
        wildcard = max(0, total - smart)
        if smart > total:
            smart = total
            wildcard = 0

    return {
        "total_options": total,
        "smart_options": smart,
        "wildcard_options": wildcard,
    }


class DropSelectionService:
    @staticmethod
    def get_selection_settings(db: Session) -> dict[str, int]:
        value = get_setting(db, DROP_SELECTION_SETTINGS_KEY, DEFAULT_DROP_SELECTION_SETTINGS)
        return normalize_drop_selection_settings(value)

    @staticmethod
    def find_next_user_vote_drop(db: Session, source_drop: WeeklyDrop) -> WeeklyDrop | None:
        return (
            db.query(WeeklyDrop)
            .filter(
                WeeklyDrop.start_date > source_drop.start_date,
                WeeklyDrop.mode == "user_vote",
                WeeklyDrop.movie_id.is_(None),
            )
            .order_by(WeeklyDrop.start_date.asc(), WeeklyDrop.id.asc())
            .first()
        )

    @staticmethod
    def eligible_pool_movies(db: Session, target_drop: WeeklyDrop | None = None) -> list[Movie]:
        scheduled_movie_ids = {
            movie_id
            for (movie_id,) in db.query(WeeklyDrop.movie_id)
            .filter(WeeklyDrop.movie_id.isnot(None))
            .all()
            if movie_id is not None
        }
        if target_drop and target_drop.movie_id:
            scheduled_movie_ids.discard(target_drop.movie_id)

        query = db.query(Movie).filter(Movie.in_pool == True)
        if scheduled_movie_ids:
            query = query.filter(~Movie.id.in_(scheduled_movie_ids))
        return query.order_by(Movie.title.asc(), Movie.id.asc()).all()

    @staticmethod
    def smart_scores(db: Session, movies: list[Movie]) -> dict[int, float]:
        if not movies:
            return {}

        rating_rows = (
            db.query(Rating, Movie)
            .join(Movie, Rating.movie_id == Movie.id)
            .filter(Rating.is_approved == True, Rating.is_hidden == False)
            .all()
        )
        request_counts = dict(
            db.query(MovieRequest.movie_id, func.count(MovieRequestSupporter.id))
            .join(MovieRequestSupporter, MovieRequestSupporter.request_id == MovieRequest.id)
            .filter(MovieRequest.movie_id.isnot(None), MovieRequest.status == "approved")
            .group_by(MovieRequest.movie_id)
            .all()
        )

        genre_affinity: Counter[str] = Counter()
        keyword_affinity: Counter[str] = Counter()
        director_affinity: Counter[str] = Counter()
        cast_affinity: Counter[str] = Counter()

        for rating, rated_movie in rating_rows:
            weight = max(0, rating.overall_score - 50) / 10
            for genre in rated_movie.genres or []:
                name = _name_from_metadata(genre)
                if name:
                    genre_affinity[name] += weight
            for keyword in rated_movie.keywords or []:
                name = _name_from_metadata(keyword)
                if name:
                    keyword_affinity[name] += weight * 0.4
            if rated_movie.director_name:
                director_affinity[rated_movie.director_name.lower()] += weight * 1.2
            for cast_member in (rated_movie.cast or [])[:8]:
                name = _name_from_metadata(cast_member)
                if name:
                    cast_affinity[name] += weight * 0.3

        scores: dict[int, float] = {}
        for movie in movies:
            score = float(request_counts.get(movie.id, 0)) * 1.5
            for genre in movie.genres or []:
                score += genre_affinity[_name_from_metadata(genre)]
            for keyword in movie.keywords or []:
                score += keyword_affinity[_name_from_metadata(keyword)]
            if movie.director_name:
                score += director_affinity[movie.director_name.lower()]
            for cast_member in (movie.cast or [])[:8]:
                score += cast_affinity[_name_from_metadata(cast_member)]
            scores[movie.id] = round(score, 4)
        return scores

    @staticmethod
    def generate_options(db: Session, target_drop: WeeklyDrop, force: bool = False) -> list[WeeklyDropOption]:
        if target_drop.mode != "user_vote":
            raise HTTPException(status_code=400, detail="Options can only be generated for User Vote drops.")

        existing = (
            db.query(WeeklyDropOption)
            .filter(WeeklyDropOption.weekly_drop_id == target_drop.id)
            .order_by(WeeklyDropOption.display_order.asc())
            .all()
        )
        if existing and not force:
            return existing
        if force:
            has_ballots = db.query(WeeklyDropBallot).filter(WeeklyDropBallot.weekly_drop_id == target_drop.id).first()
            if has_ballots:
                raise HTTPException(status_code=400, detail="Cannot regenerate options after ballots have been submitted.")
            for option in existing:
                db.delete(option)
            db.flush()

        eligible = DropSelectionService.eligible_pool_movies(db, target_drop)
        if not eligible:
            raise HTTPException(status_code=400, detail="No eligible pool movies available.")

        settings = DropSelectionService.get_selection_settings(db)
        scores = DropSelectionService.smart_scores(db, eligible)
        smart_count = min(settings["smart_options"], len(eligible))
        ranked = sorted(eligible, key=lambda movie: (-scores.get(movie.id, 0.0), movie.title.lower(), movie.id))
        selected: list[tuple[Movie, str]] = [(movie, "smart") for movie in ranked[:smart_count]]

        remaining = [movie for movie in eligible if movie.id not in {movie.id for movie, _ in selected}]
        wildcard_count = min(settings["wildcard_options"], len(remaining))
        if wildcard_count:
            rng = random.Random(f"user-vote:{target_drop.id}:{target_drop.start_date.isoformat()}")
            rng.shuffle(remaining)
            selected.extend((movie, "wildcard") for movie in remaining[:wildcard_count])

        if len(selected) < min(settings["total_options"], len(eligible)):
            selected_ids = {movie.id for movie, _ in selected}
            fallback_movies = [movie for movie in ranked if movie.id not in selected_ids]
            needed = min(settings["total_options"], len(eligible)) - len(selected)
            selected.extend((movie, "fallback") for movie in fallback_movies[:needed])

        options = []
        for index, (movie, source) in enumerate(selected):
            option = WeeklyDropOption(
                weekly_drop_id=target_drop.id,
                movie_id=movie.id,
                display_order=index,
                source=source,
                smart_score=scores.get(movie.id, 0.0),
            )
            db.add(option)
            options.append(option)
        db.flush()
        return (
            db.query(WeeklyDropOption)
            .filter(WeeklyDropOption.weekly_drop_id == target_drop.id)
            .order_by(WeeklyDropOption.display_order.asc())
            .all()
        )

    @staticmethod
    def upsert_ballot(
        db: Session,
        target_drop: WeeklyDrop,
        source_drop: WeeklyDrop,
        user: User,
        ranked_movie_ids: list[int],
        today: date,
    ) -> WeeklyDropBallot:
        if target_drop.mode != "user_vote":
            raise HTTPException(status_code=400, detail="This drop is not open for User Vote ballots.")
        if today > source_drop.end_date:
            raise HTTPException(status_code=400, detail="Next movie voting has closed for this week.")

        option_ids = {
            movie_id
            for (movie_id,) in db.query(WeeklyDropOption.movie_id)
            .filter(WeeklyDropOption.weekly_drop_id == target_drop.id)
            .all()
        }
        if not option_ids:
            DropSelectionService.generate_options(db, target_drop)
            option_ids = {
                movie_id
                for (movie_id,) in db.query(WeeklyDropOption.movie_id)
                .filter(WeeklyDropOption.weekly_drop_id == target_drop.id)
                .all()
            }

        cleaned: list[int] = []
        for movie_id in ranked_movie_ids:
            if movie_id in option_ids and movie_id not in cleaned:
                cleaned.append(movie_id)
        if not cleaned:
            raise HTTPException(status_code=400, detail="Choose at least one movie from the User Vote options.")

        ballot = (
            db.query(WeeklyDropBallot)
            .filter(WeeklyDropBallot.weekly_drop_id == target_drop.id, WeeklyDropBallot.user_id == user.id)
            .first()
        )
        if ballot:
            ballot.ranked_movie_ids = cleaned
            ballot.source_drop_id = source_drop.id
        else:
            ballot = WeeklyDropBallot(
                weekly_drop_id=target_drop.id,
                source_drop_id=source_drop.id,
                user_id=user.id,
                ranked_movie_ids=cleaned,
            )
            db.add(ballot)
        db.flush()
        return ballot

    @staticmethod
    def instant_runoff_winner(db: Session, target_drop: WeeklyDrop) -> Movie | None:
        options = (
            db.query(WeeklyDropOption)
            .filter(WeeklyDropOption.weekly_drop_id == target_drop.id)
            .order_by(WeeklyDropOption.display_order.asc())
            .all()
        )
        if not options:
            options = DropSelectionService.generate_options(db, target_drop)
        if not options:
            return None

        option_ids = [option.movie_id for option in options]
        option_by_movie = {option.movie_id: option for option in options}
        ballots = [
            [movie_id for movie_id in ballot.ranked_movie_ids if movie_id in option_by_movie]
            for ballot in db.query(WeeklyDropBallot).filter(WeeklyDropBallot.weekly_drop_id == target_drop.id).all()
        ]
        ballots = [ballot for ballot in ballots if ballot]
        if not ballots:
            return options[0].movie

        active = set(option_ids)
        while active:
            counts = {movie_id: 0 for movie_id in active}
            for ballot in ballots:
                for movie_id in ballot:
                    if movie_id in active:
                        counts[movie_id] += 1
                        break

            total = sum(counts.values())
            if total == 0:
                return DropSelectionService._best_tiebreak_option(options, active).movie

            leader_id, leader_votes = max(
                counts.items(),
                key=lambda item: (
                    item[1],
                    option_by_movie[item[0]].smart_score,
                    -option_by_movie[item[0]].display_order,
                    -item[0],
                ),
            )
            if leader_votes > total / 2 or len(active) == 1:
                return option_by_movie[leader_id].movie

            lowest_votes = min(counts.values())
            lowest = [movie_id for movie_id, count in counts.items() if count == lowest_votes]
            eliminate = min(
                lowest,
                key=lambda movie_id: (
                    option_by_movie[movie_id].smart_score,
                    -option_by_movie[movie_id].display_order,
                    -movie_id,
                ),
            )
            active.remove(eliminate)

        return options[0].movie

    @staticmethod
    def random_pool_winner(db: Session, target_drop: WeeklyDrop) -> Movie:
        eligible = DropSelectionService.eligible_pool_movies(db, target_drop)
        if not eligible:
            raise HTTPException(status_code=400, detail="No eligible pool movies available.")
        rng = random.Random(f"random-pool:{target_drop.id}:{target_drop.start_date.isoformat()}")
        return rng.choice(eligible)

    @staticmethod
    def serialize_next_vote(
        db: Session,
        source_drop: WeeklyDrop,
        target_drop: WeeklyDrop,
        user: User | None,
        today: date,
    ) -> dict[str, Any]:
        options = DropSelectionService.generate_options(db, target_drop)
        ballot = None
        if user:
            ballot = (
                db.query(WeeklyDropBallot)
                .filter(WeeklyDropBallot.weekly_drop_id == target_drop.id, WeeklyDropBallot.user_id == user.id)
                .first()
            )

        return {
            "target_drop_id": target_drop.id,
            "source_drop_id": source_drop.id,
            "start_date": target_drop.start_date,
            "end_date": target_drop.end_date,
            "locked": today > source_drop.end_date,
            "options": [
                {
                    "id": option.id,
                    "movie": serialize_movie(option.movie),
                    "display_order": option.display_order,
                    "source": option.source,
                    "smart_score": option.smart_score,
                }
                for option in options
            ],
            "ballot": {
                "target_drop_id": target_drop.id,
                "ranked_movie_ids": ballot.ranked_movie_ids,
                "updated_at": ballot.updated_at,
            }
            if ballot
            else None,
        }

    @staticmethod
    def _best_tiebreak_option(options: list[WeeklyDropOption], active: set[int]) -> WeeklyDropOption:
        return max(
            [option for option in options if option.movie_id in active],
            key=lambda option: (option.smart_score, -option.display_order, -option.movie_id),
        )


def _name_from_metadata(value: Any) -> str:
    if isinstance(value, dict):
        raw = value.get("name") or value.get("title") or ""
    else:
        raw = str(value or "")
    return raw.lower().strip()
