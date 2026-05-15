from __future__ import annotations

import asyncio
from contextlib import suppress
from datetime import datetime, timedelta, timezone
import logging
from zoneinfo import ZoneInfo

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.weekly_drop import WeeklyDrop
from app.services.drop_selection import DropSelectionService

logger = logging.getLogger(__name__)
EASTERN = ZoneInfo("America/New_York")
ROLLOVER_LOCK_ID = 2026051501


class DropSchedulerService:
    def __init__(self) -> None:
        self._task: asyncio.Task | None = None

    def start(self) -> None:
        if self._task and not self._task.done():
            return
        self._task = asyncio.create_task(self._run_loop())

    async def stop(self) -> None:
        if not self._task:
            return
        self._task.cancel()
        with suppress(asyncio.CancelledError):
            await self._task
        self._task = None

    async def _run_loop(self) -> None:
        await self._run_once_safely()
        while True:
            next_run = self.next_rollover_at(datetime.now(EASTERN))
            delay = max(1.0, (next_run - datetime.now(EASTERN)).total_seconds())
            await asyncio.sleep(delay)
            await self._run_once_safely()

    async def _run_once_safely(self) -> None:
        try:
            with SessionLocal() as db:
                self.rollover(db)
        except Exception:
            logger.exception("Weekly drop rollover failed.")

    @staticmethod
    def eastern_today(now: datetime | None = None):
        return (now or datetime.now(EASTERN)).astimezone(EASTERN).date()

    @staticmethod
    def next_rollover_at(now: datetime | None = None) -> datetime:
        current = (now or datetime.now(EASTERN)).astimezone(EASTERN)
        monday = current - timedelta(days=current.weekday())
        next_monday = monday.replace(hour=0, minute=0, second=0, microsecond=0)
        if current >= next_monday:
            next_monday += timedelta(days=7)
        return next_monday

    @staticmethod
    def rollover(db: Session, now: datetime | None = None) -> WeeklyDrop | None:
        acquired_lock = DropSchedulerService._try_advisory_lock(db)
        if acquired_lock is False:
            return None
        try:
            today = DropSchedulerService.eastern_today(now)
            drop = (
                db.query(WeeklyDrop)
                .filter(WeeklyDrop.start_date <= today, WeeklyDrop.end_date >= today)
                .order_by(WeeklyDrop.start_date.desc(), WeeklyDrop.id.desc())
                .first()
            )
            if not drop:
                return None

            if drop.mode in {"user_vote", "random_pool"} and drop.movie_id is None:
                DropSchedulerService.resolve_flexible_drop(db, drop)

            db.query(WeeklyDrop).filter(WeeklyDrop.id != drop.id).update({WeeklyDrop.is_active: False})
            drop.is_active = True
            db.commit()
            db.refresh(drop)
            return drop
        finally:
            if acquired_lock:
                DropSchedulerService._release_advisory_lock(db)

    @staticmethod
    def resolve_flexible_drop(db: Session, drop: WeeklyDrop) -> WeeklyDrop:
        if drop.movie_id is not None:
            return drop

        if drop.mode == "random_pool":
            movie = DropSelectionService.random_pool_winner(db, drop)
        elif drop.mode == "user_vote":
            movie = DropSelectionService.instant_runoff_winner(db, drop)
            if movie is None:
                raise HTTPException(status_code=400, detail="No User Vote options available.")
        else:
            return drop

        drop.movie_id = movie.id
        drop.resolved_at = datetime.now(timezone.utc)
        movie.in_pool = False
        db.flush()
        return drop

    @staticmethod
    def _try_advisory_lock(db: Session) -> bool | None:
        if db.bind and db.bind.dialect.name != "postgresql":
            return None
        result = db.execute(text("SELECT pg_try_advisory_lock(:lock_id)"), {"lock_id": ROLLOVER_LOCK_ID}).scalar()
        return bool(result)

    @staticmethod
    def _release_advisory_lock(db: Session) -> None:
        if db.bind and db.bind.dialect.name != "postgresql":
            return
        db.execute(text("SELECT pg_advisory_unlock(:lock_id)"), {"lock_id": ROLLOVER_LOCK_ID})


drop_scheduler = DropSchedulerService()
