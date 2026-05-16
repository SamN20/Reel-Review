from __future__ import annotations

from datetime import date

from sqlalchemy.orm import Query, Session

from app.models.rating import Rating
from app.models.weekly_drop import WeeklyDrop
from app.services.drop_scheduler import DropSchedulerService


def active_drop_ids_for_public_profiles(db: Session, today: date | None = None) -> list[int]:
    current_day = today or DropSchedulerService.eastern_today()
    rows = (
        db.query(WeeklyDrop.id)
        .filter(
            WeeklyDrop.start_date <= current_day,
            WeeklyDrop.end_date >= current_day,
        )
        .all()
    )
    return [drop_id for (drop_id,) in rows]


def apply_public_profile_rating_visibility(
    query: Query,
    db: Session,
    today: date | None = None,
) -> Query:
    hidden_drop_ids = active_drop_ids_for_public_profiles(db, today=today)
    if not hidden_drop_ids:
        return query

    return query.filter(
        (Rating.weekly_drop_id.is_(None)) | (~Rating.weekly_drop_id.in_(hidden_drop_ids))
    )
