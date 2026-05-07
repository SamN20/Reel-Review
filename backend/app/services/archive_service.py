from __future__ import annotations

from collections import defaultdict
from datetime import date
from statistics import pstdev
from typing import Any

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.rating import Rating
from app.models.user import User
from app.models.weekly_drop import WeeklyDrop
from app.services.movie_metadata import serialize_movie


class ArchiveService:
    DEFAULT_SHELF_LIMIT = 12

    @staticmethod
    def get_shelves(db: Session, current_user: User | None, limit: int = DEFAULT_SHELF_LIMIT) -> dict[str, Any]:
        rows = ArchiveService._archive_rows(db, current_user)
        shelves = []

        missed_rows = [row for row in rows if not row["user_has_rated"]]
        if current_user and missed_rows:
            shelves.append(
                ArchiveService._build_shelf(
                    shelf_id="missed-by-you",
                    title="Missed By You",
                    description="Past drops still waiting for your score.",
                    kind="missed",
                    rows=missed_rows,
                    limit=limit,
                )
            )

        scored_rows = [row for row in rows if row["community_score"] is not None]
        shelves.extend(
            [
                ArchiveService._build_shelf(
                    shelf_id="top-rated-overall",
                    title="Top Rated Overall",
                    description="The community favorites, ranked by official average.",
                    kind="top_rated",
                    rows=ArchiveService._rank_rows(scored_rows, key="community_score"),
                    limit=limit,
                ),
                ArchiveService._build_shelf(
                    shelf_id="complete-archive",
                    title="The Complete Archive",
                    description="Every previous weekly drop, newest first.",
                    kind="chronological",
                    rows=rows,
                    limit=limit,
                    view_all_path="/film-shelf/vote-order",
                ),
                ArchiveService._build_shelf(
                    shelf_id="most-divisive-votes",
                    title="Most Divisive Votes",
                    description="Movies that split the room.",
                    kind="divisive",
                    rows=ArchiveService._rank_rows(
                        [row for row in rows if row["divisiveness"] is not None],
                        key="divisiveness",
                    ),
                    limit=limit,
                ),
            ]
        )

        return {"shelves": [shelf for shelf in shelves if shelf["items"]]}

    @staticmethod
    def get_vote_order(
        db: Session,
        current_user: User | None,
        limit: int,
        offset: int,
    ) -> dict[str, Any]:
        rows = ArchiveService._archive_rows(db, current_user)
        return {
            "items": rows[offset : offset + limit],
            "total": len(rows),
            "limit": limit,
            "offset": offset,
        }

    @staticmethod
    def _build_shelf(
        shelf_id: str,
        title: str,
        description: str,
        kind: str,
        rows: list[dict[str, Any]],
        limit: int,
        view_all_path: str | None = None,
    ) -> dict[str, Any]:
        return {
            "id": shelf_id,
            "title": title,
            "description": description,
            "kind": kind,
            "items": rows[:limit],
            "total_count": len(rows),
            "view_all_path": view_all_path,
        }

    @staticmethod
    def _rank_rows(rows: list[dict[str, Any]], key: str) -> list[dict[str, Any]]:
        ranked_rows = sorted(
            rows,
            key=lambda row: (row[key] if row[key] is not None else -1, row["drop_id"]),
            reverse=True,
        )
        return [{**row, "rank": index + 1} for index, row in enumerate(ranked_rows)]

    @staticmethod
    def _archive_rows(db: Session, current_user: User | None) -> list[dict[str, Any]]:
        today = date.today()
        drops = (
            db.query(WeeklyDrop)
            .filter(
                WeeklyDrop.end_date < today,
                WeeklyDrop.movie_id.isnot(None),
            )
            .order_by(WeeklyDrop.start_date.desc(), WeeklyDrop.id.desc())
            .all()
        )
        drop_ids = [drop.id for drop in drops]

        rating_stats = ArchiveService._rating_stats_by_drop(db, drop_ids)
        user_scores = ArchiveService._user_scores_by_drop(db, drop_ids, current_user)

        rows = []
        for drop in drops:
            stats = rating_stats.get(drop.id, {})
            total_votes = stats.get("total_votes", 0)
            average_score = stats.get("average_score")
            rows.append(
                {
                    "drop_id": drop.id,
                    "movie": serialize_movie(drop.movie),
                    "start_date": drop.start_date,
                    "end_date": drop.end_date,
                    "community_score": average_score,
                    "total_votes": total_votes,
                    "user_has_rated": drop.id in user_scores,
                    "user_score": user_scores.get(drop.id),
                    "rank": None,
                    "divisiveness": stats.get("divisiveness"),
                }
            )

        return rows

    @staticmethod
    def _rating_stats_by_drop(db: Session, drop_ids: list[int]) -> dict[int, dict[str, Any]]:
        if not drop_ids:
            return {}

        aggregate_rows = (
            db.query(
                Rating.weekly_drop_id,
                func.count(Rating.id),
                func.avg(Rating.overall_score),
            )
            .filter(
                Rating.weekly_drop_id.in_(drop_ids),
                Rating.is_approved == True,
            )
            .group_by(Rating.weekly_drop_id)
            .all()
        )
        stats = {
            drop_id: {
                "total_votes": total_votes,
                "average_score": round(float(average_score), 1) if average_score is not None else None,
                "divisiveness": None,
            }
            for drop_id, total_votes, average_score in aggregate_rows
        }

        score_rows = (
            db.query(Rating.weekly_drop_id, Rating.overall_score)
            .filter(
                Rating.weekly_drop_id.in_(drop_ids),
                Rating.is_approved == True,
            )
            .all()
        )
        scores_by_drop: dict[int, list[int]] = defaultdict(list)
        for drop_id, score in score_rows:
            scores_by_drop[drop_id].append(score)

        for drop_id, scores in scores_by_drop.items():
            if len(scores) > 1:
                stats.setdefault(drop_id, {})["divisiveness"] = round(float(pstdev(scores)), 2)

        return stats

    @staticmethod
    def _user_scores_by_drop(
        db: Session,
        drop_ids: list[int],
        current_user: User | None,
    ) -> dict[int, int]:
        if not current_user or not drop_ids:
            return {}

        ratings = (
            db.query(Rating.weekly_drop_id, Rating.overall_score)
            .filter(
                Rating.weekly_drop_id.in_(drop_ids),
                Rating.user_id == current_user.id,
            )
            .all()
        )
        return {drop_id: score for drop_id, score in ratings}
