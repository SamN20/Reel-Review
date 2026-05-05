from __future__ import annotations

from collections import defaultdict
from datetime import datetime
from statistics import pstdev
from typing import Any, Iterable

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.movie import Movie
from app.models.rating import Rating
from app.models.review_like import ReviewLike
from app.models.review_reply import ReviewReply
from app.models.review_report import ReviewReport
from app.models.user import User
from app.models.weekly_drop import WeeklyDrop
from app.services.movie_metadata import serialize_movie_for_response
from app.services.ratings_calculator import RatingsCalculator
from app.services.review_moderation import apply_auto_moderation, sync_report_state


SUBCATEGORY_LABELS = {
    "story": "Story & Pacing",
    "performances": "Performances",
    "visuals": "Visuals & Cinematography",
    "sound": "Sound & Score",
    "rewatchability": "Rewatchability",
    "enjoyment": "Pure Enjoyment",
    "emotional_impact": "Emotional Impact",
}


class ResultsService:
    @staticmethod
    def get_drop_or_404(db: Session, drop_id: int) -> WeeklyDrop:
        drop = db.query(WeeklyDrop).filter(WeeklyDrop.id == drop_id).first()
        if not drop:
            from fastapi import HTTPException

            raise HTTPException(status_code=404, detail="Weekly drop not found")
        return drop

    @staticmethod
    def get_drop_results_summary(db: Session, drop_id: int, current_user: User | None) -> dict[str, Any]:
        drop = ResultsService.get_drop_or_404(db, drop_id)
        total_votes = db.query(Rating).filter(Rating.weekly_drop_id == drop_id).count()
        official_score = RatingsCalculator.calculate_drop_average_score(db, drop_id)
        user_score = ResultsService.get_user_score(db, drop_id, current_user)
        sub_categories = ResultsService.get_subcategory_averages(db, drop_id)
        standout_category = ResultsService.get_standout_category(sub_categories)
        rankings = ResultsService.get_rankings(db, drop, official_score)
        default_reviews = ResultsService.list_reviews(db, drop_id, current_user, "spoiler-free", "top")["items"]

        comparison = None
        if user_score is not None:
            delta = int(user_score - round(official_score))
            comparison = {
                "delta": delta,
                "absolute_delta": abs(delta),
                "direction": "equal" if delta == 0 else "higher" if delta > 0 else "lower",
            }

        return {
            "drop_id": drop.id,
            "movie": serialize_movie_for_response(db, drop.movie),
            "official_score": official_score,
            "user_score": user_score,
            "total_votes": total_votes,
            "comparison": comparison,
            "sub_categories": sub_categories,
            "standout_category": standout_category,
            "rankings": rankings,
            "reviews": default_reviews,
        }

    @staticmethod
    def get_user_score(db: Session, drop_id: int, current_user: User | None) -> int | None:
        if not current_user:
            return None
        rating = (
            db.query(Rating)
            .filter(Rating.weekly_drop_id == drop_id, Rating.user_id == current_user.id)
            .first()
        )
        return rating.overall_score if rating else None

    @staticmethod
    def get_subcategory_averages(db: Session, drop_id: int) -> dict[str, float | None]:
        averages = (
            db.query(
                func.avg(Rating.story_score).label("story"),
                func.avg(Rating.performances_score).label("performances"),
                func.avg(Rating.visuals_score).label("visuals"),
                func.avg(Rating.sound_score).label("sound"),
                func.avg(Rating.rewatchability_score).label("rewatchability"),
                func.avg(Rating.enjoyment_score).label("enjoyment"),
                func.avg(Rating.emotional_impact_score).label("emotional_impact"),
            )
            .filter(
                Rating.weekly_drop_id == drop_id,
                Rating.is_approved == True,
            )
            .first()
        )

        if not averages:
            return {key: None for key in SUBCATEGORY_LABELS}

        return {
            key: round(float(getattr(averages, key)), 1) if getattr(averages, key) is not None else None
            for key in SUBCATEGORY_LABELS
        }

    @staticmethod
    def get_standout_category(sub_categories: dict[str, float | None]) -> dict[str, Any] | None:
        populated = [(key, value) for key, value in sub_categories.items() if value is not None]
        if not populated:
            return None
        key, score = max(populated, key=lambda item: item[1])
        return {"key": key, "label": SUBCATEGORY_LABELS[key], "score": score}

    @staticmethod
    def get_rankings(db: Session, drop: WeeklyDrop, official_score: float) -> list[dict[str, Any]]:
        ranked_drops = ResultsService._ranked_drop_rows(db)
        current_year = drop.movie.release_date.year if drop.movie and drop.movie.release_date else None
        primary_genre = None
        if drop.movie and drop.movie.genres:
            first_genre = drop.movie.genres[0]
            primary_genre = first_genre.get("name") if isinstance(first_genre, dict) else None

        rankings = [
            ResultsService._build_ranking_payload(
                ranking_id="overall",
                label="All-Time Ranking",
                rows=ranked_drops,
                current_drop_id=drop.id,
            )
        ]

        if current_year is not None:
            year_rows = [row for row in ranked_drops if row["release_year"] == current_year]
            year_ranking = ResultsService._build_ranking_payload(
                ranking_id="year",
                label=f"{current_year} Releases",
                rows=year_rows,
                current_drop_id=drop.id,
            )
            if year_ranking:
                rankings.append(year_ranking)

        if primary_genre:
            genre_rows = [row for row in ranked_drops if row["primary_genre"] == primary_genre]
            genre_ranking = ResultsService._build_ranking_payload(
                ranking_id="genre",
                label=primary_genre,
                rows=genre_rows,
                current_drop_id=drop.id,
            )
            if genre_ranking:
                rankings.append(genre_ranking)

        divisive_rows = sorted(
            [row for row in ranked_drops if row["divisiveness"] is not None],
            key=lambda row: (row["divisiveness"], row["score"], row["drop_id"]),
            reverse=True,
        )
        divisive_ranking = ResultsService._build_ranking_payload(
            ranking_id="divisive",
            label="Most Divisive",
            rows=divisive_rows,
            current_drop_id=drop.id,
            score_key="divisiveness",
            badge_prefix="Spread",
        )
        if divisive_ranking:
            rankings.append(divisive_ranking)

        return [ranking for ranking in rankings if ranking]

    @staticmethod
    def _ranked_drop_rows(db: Session) -> list[dict[str, Any]]:
        drops = db.query(WeeklyDrop).filter(WeeklyDrop.movie_id.isnot(None)).all()
        rows: list[dict[str, Any]] = []
        for drop in drops:
            score = RatingsCalculator.calculate_drop_average_score(db, drop.id)
            if score <= 0:
                continue
            scores = [
                rating.overall_score
                for rating in db.query(Rating)
                .filter(Rating.weekly_drop_id == drop.id, Rating.is_approved == True)
                .all()
            ]
            divisiveness = round(float(pstdev(scores)), 2) if len(scores) > 1 else None
            primary_genre = None
            if drop.movie and drop.movie.genres:
                first_genre = drop.movie.genres[0]
                primary_genre = first_genre.get("name") if isinstance(first_genre, dict) else None
            rows.append(
                {
                    "drop_id": drop.id,
                    "title": drop.movie.title if drop.movie else f"Drop {drop.id}",
                    "score": score,
                    "release_year": drop.movie.release_date.year if drop.movie and drop.movie.release_date else None,
                    "primary_genre": primary_genre,
                    "divisiveness": divisiveness,
                }
            )
        return sorted(rows, key=lambda row: (row["score"], row["drop_id"]), reverse=True)

    @staticmethod
    def _build_ranking_payload(
        ranking_id: str,
        label: str,
        rows: list[dict[str, Any]],
        current_drop_id: int,
        score_key: str = "score",
        badge_prefix: str = "Top",
    ) -> dict[str, Any] | None:
        if not rows:
            return None

        current_index = next((index for index, row in enumerate(rows) if row["drop_id"] == current_drop_id), None)
        if current_index is None:
            return None

        rank = current_index + 1
        start = max(0, current_index - 1)
        end = min(len(rows), current_index + 2)
        surrounding = []
        for index, row in enumerate(rows[start:end], start=start):
            surrounding.append(
                {
                    "rank": index + 1,
                    "title": row["title"],
                    "score": row[score_key] or 0.0,
                    "is_current": row["drop_id"] == current_drop_id,
                }
            )

        badge = f"{badge_prefix} {max(1, min(len(rows), 10))}" if rank <= 10 else None
        return {
            "id": ranking_id,
            "label": label,
            "rank": rank,
            "total_ranked": len(rows),
            "badge": badge,
            "surrounding": surrounding,
        }

    @staticmethod
    def list_reviews(
        db: Session,
        drop_id: int,
        current_user: User | None,
        tab: str,
        sort: str,
    ) -> dict[str, Any]:
        official_score = RatingsCalculator.calculate_drop_average_score(db, drop_id)
        is_spoiler = tab == "spoilers"
        ratings = (
            db.query(Rating)
            .filter(
                Rating.weekly_drop_id == drop_id,
                Rating.review_text.isnot(None),
                Rating.review_text != "",
                Rating.is_approved == True,
                Rating.is_hidden == False,
                Rating.has_spoilers == is_spoiler,
            )
            .all()
        )

        rating_ids = [rating.id for rating in ratings]
        reply_rows = (
            db.query(ReviewReply)
            .filter(
                ReviewReply.rating_id.in_(rating_ids) if rating_ids else False,
                ReviewReply.is_approved == True,
                ReviewReply.is_hidden == False,
            )
            .order_by(ReviewReply.created_at.asc(), ReviewReply.id.asc())
            .all()
        )
        reply_ids = [reply.id for reply in reply_rows]

        rating_like_counts = ResultsService._aggregate_like_counts(db, rating_ids=rating_ids)
        reply_like_counts = ResultsService._aggregate_like_counts(db, reply_ids=reply_ids)
        liked_rating_ids, liked_reply_ids = ResultsService._liked_targets(db, current_user, rating_ids, reply_ids)

        reply_map = ResultsService._build_reply_tree(reply_rows, reply_like_counts, liked_reply_ids)
        review_rows = []
        for rating in ratings:
            replies = reply_map.get(rating.id, [])
            like_count = rating_like_counts.get(rating.id, 0)
            row = {
                "id": rating.id,
                "user_name": "Anonymous" if rating.is_anonymous else rating.user.username,
                "overall_score": rating.overall_score,
                "review_text": rating.review_text,
                "is_spoiler": rating.has_spoilers,
                "like_count": like_count,
                "liked_by_me": rating.id in liked_rating_ids,
                "reply_count": ResultsService._count_nested_replies(replies),
                "created_at": rating.created_at.isoformat() if rating.created_at else None,
                "score_delta": round(float(rating.overall_score - official_score), 1),
                "controversy_score": round(abs(float(rating.overall_score - official_score)), 2),
                "replies": replies,
            }
            review_rows.append(row)

        review_rows.sort(
            key=lambda row: ResultsService._review_sort_key(row, sort),
            reverse=True,
        )
        return {"items": review_rows, "total": len(review_rows), "tab": tab, "sort": sort}

    @staticmethod
    def _aggregate_like_counts(
        db: Session,
        rating_ids: list[int] | None = None,
        reply_ids: list[int] | None = None,
    ) -> dict[int, int]:
        counts: dict[int, int] = {}
        if rating_ids:
            rows = (
                db.query(ReviewLike.rating_id, func.count(ReviewLike.id))
                .filter(ReviewLike.rating_id.in_(rating_ids))
                .group_by(ReviewLike.rating_id)
                .all()
            )
            counts.update({row[0]: row[1] for row in rows if row[0] is not None})
        if reply_ids:
            rows = (
                db.query(ReviewLike.reply_id, func.count(ReviewLike.id))
                .filter(ReviewLike.reply_id.in_(reply_ids))
                .group_by(ReviewLike.reply_id)
                .all()
            )
            counts.update({row[0]: row[1] for row in rows if row[0] is not None})
        return counts

    @staticmethod
    def _liked_targets(
        db: Session,
        current_user: User | None,
        rating_ids: list[int],
        reply_ids: list[int],
    ) -> tuple[set[int], set[int]]:
        if not current_user:
            return set(), set()

        likes = db.query(ReviewLike).filter(ReviewLike.user_id == current_user.id).all()
        return (
            {like.rating_id for like in likes if like.rating_id in rating_ids},
            {like.reply_id for like in likes if like.reply_id in reply_ids},
        )

    @staticmethod
    def _build_reply_tree(
        replies: Iterable[ReviewReply],
        like_counts: dict[int, int],
        liked_reply_ids: set[int],
    ) -> dict[int, list[dict[str, Any]]]:
        nodes: dict[int, dict[str, Any]] = {}
        roots_by_rating: dict[int, list[dict[str, Any]]] = defaultdict(list)

        for reply in replies:
            nodes[reply.id] = {
                "id": reply.id,
                "user_name": reply.user.username,
                "body": reply.body,
                "like_count": like_counts.get(reply.id, 0),
                "liked_by_me": reply.id in liked_reply_ids,
                "created_at": reply.created_at.isoformat() if reply.created_at else None,
                "replies": [],
            }

        for reply in replies:
            node = nodes[reply.id]
            if reply.parent_reply_id and reply.parent_reply_id in nodes:
                nodes[reply.parent_reply_id]["replies"].append(node)
            else:
                roots_by_rating[reply.rating_id].append(node)

        return roots_by_rating

    @staticmethod
    def _count_nested_replies(replies: list[dict[str, Any]]) -> int:
        total = 0
        for reply in replies:
            total += 1 + ResultsService._count_nested_replies(reply["replies"])
        return total

    @staticmethod
    def _review_sort_key(review: dict[str, Any], sort: str) -> tuple[Any, ...]:
        created_at = review["created_at"] or datetime.min.isoformat()
        if sort == "recent":
            return (created_at, review["id"])
        if sort == "controversial":
            return (review["controversy_score"], review["like_count"], review["reply_count"], created_at)
        return (review["like_count"], created_at, review["id"])

    @staticmethod
    def create_reply(
        db: Session,
        review_id: int,
        body: str,
        current_user: User,
        parent_reply_id: int | None = None,
    ) -> ReviewReply:
        rating = db.query(Rating).filter(Rating.id == review_id).first()
        if not rating:
            from fastapi import HTTPException

            raise HTTPException(status_code=404, detail="Review not found")

        parent_reply = None
        if parent_reply_id is not None:
            parent_reply = db.query(ReviewReply).filter(ReviewReply.id == parent_reply_id).first()
            if not parent_reply or parent_reply.rating_id != rating.id:
                from fastapi import HTTPException

                raise HTTPException(status_code=400, detail="Parent reply is invalid for this review")

        reply = ReviewReply(
            rating_id=rating.id,
            user_id=current_user.id,
            parent_reply_id=parent_reply_id,
            body=body.strip(),
            has_spoilers=rating.has_spoilers,
        )
        apply_auto_moderation(reply)
        db.add(reply)
        db.commit()
        db.refresh(reply)
        return reply

    @staticmethod
    def toggle_review_like(db: Session, review_id: int, current_user: User) -> dict[str, Any]:
        rating = db.query(Rating).filter(Rating.id == review_id).first()
        if not rating:
            from fastapi import HTTPException

            raise HTTPException(status_code=404, detail="Review not found")

        existing = (
            db.query(ReviewLike)
            .filter(ReviewLike.user_id == current_user.id, ReviewLike.rating_id == review_id)
            .first()
        )
        liked = False
        if existing:
            db.delete(existing)
        else:
            db.add(ReviewLike(user_id=current_user.id, rating_id=review_id))
            liked = True
        db.commit()
        like_count = db.query(ReviewLike).filter(ReviewLike.rating_id == review_id).count()
        return {"liked": liked, "like_count": like_count}

    @staticmethod
    def toggle_reply_like(db: Session, reply_id: int, current_user: User) -> dict[str, Any]:
        reply = db.query(ReviewReply).filter(ReviewReply.id == reply_id).first()
        if not reply:
            from fastapi import HTTPException

            raise HTTPException(status_code=404, detail="Reply not found")

        existing = (
            db.query(ReviewLike)
            .filter(ReviewLike.user_id == current_user.id, ReviewLike.reply_id == reply_id)
            .first()
        )
        liked = False
        if existing:
            db.delete(existing)
        else:
            db.add(ReviewLike(user_id=current_user.id, reply_id=reply_id))
            liked = True
        db.commit()
        like_count = db.query(ReviewLike).filter(ReviewLike.reply_id == reply_id).count()
        return {"liked": liked, "like_count": like_count}

    @staticmethod
    def report_review(db: Session, review_id: int, reason: str, current_user: User) -> None:
        rating = db.query(Rating).filter(Rating.id == review_id).first()
        if not rating:
            from fastapi import HTTPException

            raise HTTPException(status_code=404, detail="Review not found")

        existing = (
            db.query(ReviewReport)
            .filter(ReviewReport.user_id == current_user.id, ReviewReport.rating_id == review_id)
            .first()
        )
        if existing:
            from fastapi import HTTPException

            raise HTTPException(status_code=400, detail="You have already reported this review")

        db.add(ReviewReport(user_id=current_user.id, rating_id=review_id, reason=reason))
        db.commit()
        sync_report_state(db, rating, ReviewReport, "rating_id")
        db.commit()

    @staticmethod
    def report_reply(db: Session, reply_id: int, reason: str, current_user: User) -> None:
        reply = db.query(ReviewReply).filter(ReviewReply.id == reply_id).first()
        if not reply:
            from fastapi import HTTPException

            raise HTTPException(status_code=404, detail="Reply not found")

        existing = (
            db.query(ReviewReport)
            .filter(ReviewReport.user_id == current_user.id, ReviewReport.reply_id == reply_id)
            .first()
        )
        if existing:
            from fastapi import HTTPException

            raise HTTPException(status_code=400, detail="You have already reported this reply")

        db.add(ReviewReport(user_id=current_user.id, reply_id=reply_id, reason=reason))
        db.commit()
        sync_report_state(db, reply, ReviewReport, "reply_id")
        db.commit()
