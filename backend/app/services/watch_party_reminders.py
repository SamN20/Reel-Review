from __future__ import annotations

import asyncio
from contextlib import suppress
from datetime import datetime, timedelta, timezone
import logging
from typing import Any

from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.watch_party import WatchParty, WatchPartyRsvp
from app.services.nolofication import nolofication
from app.services.watch_parties import WATCH_PARTY_RSVP_GOING, WATCH_PARTY_STATUS_SCHEDULED

logger = logging.getLogger(__name__)

REMINDER_LEAD_TIME = timedelta(minutes=10)
REMINDER_POLL_INTERVAL_SECONDS = 60
REMINDER_CATEGORY = "social_interactions"


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _coerce_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _watch_party_target_url() -> str:
    return f"{settings.FRONTEND_URL.rstrip('/')}/community#watch-parties"


def _format_start_time(party: WatchParty) -> str:
    start = _coerce_utc(party.scheduled_for)
    return f"{start.strftime('%I:%M %p').lstrip('0')} {party.timezone_label}"


async def send_due_watch_party_reminders(
    db: Session,
    now: datetime | None = None,
    notifier: Any = nolofication,
) -> dict[str, int]:
    current_time = _coerce_utc(now or _now_utc())
    reminder_window_end = current_time + REMINDER_LEAD_TIME
    due_parties = (
        db.query(WatchParty)
        .options(joinedload(WatchParty.rsvps).joinedload(WatchPartyRsvp.user))
        .filter(
            WatchParty.status == WATCH_PARTY_STATUS_SCHEDULED,
            WatchParty.reminder_sent_at.is_(None),
            WatchParty.scheduled_for > current_time,
            WatchParty.scheduled_for <= reminder_window_end,
        )
        .order_by(WatchParty.scheduled_for.asc(), WatchParty.id.asc())
        .all()
    )

    sent_parties = 0
    notified_users = 0
    skipped_parties = 0
    for party in due_parties:
        recipient_keyn_ids = [
            rsvp.user.keyn_id
            for rsvp in party.rsvps
            if rsvp.status == WATCH_PARTY_RSVP_GOING and rsvp.user and rsvp.user.keyn_id
        ]

        if not recipient_keyn_ids:
            party.reminder_sent_at = current_time
            skipped_parties += 1
            continue

        result = await notifier.send_bulk_notification(
            user_ids=recipient_keyn_ids,
            title="Watch Party Starting Soon",
            message=f"{party.title} starts in about 10 minutes at {_format_start_time(party)}.",
            notification_type="info",
            category=REMINDER_CATEGORY,
            target_url=_watch_party_target_url(),
            metadata={
                "watch_party_id": party.id,
                "weekly_drop_id": party.weekly_drop_id,
            },
        )
        if result and result.get("success", True) is False:
            logger.warning(
                "Watch party reminder failed for party %s: %s",
                party.id,
                result.get("error", "unknown error"),
            )
            continue

        party.reminder_sent_at = current_time
        sent_parties += 1
        notified_users += len(recipient_keyn_ids)

    if due_parties:
        db.commit()

    return {
        "due_parties": len(due_parties),
        "sent_parties": sent_parties,
        "skipped_parties": skipped_parties,
        "notified_users": notified_users,
    }


class WatchPartyReminderService:
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
        while True:
            await self._run_once_safely()
            await asyncio.sleep(REMINDER_POLL_INTERVAL_SECONDS)

    async def _run_once_safely(self) -> None:
        try:
            with SessionLocal() as db:
                await send_due_watch_party_reminders(db)
        except Exception:
            logger.exception("Watch party reminder check failed.")


watch_party_reminders = WatchPartyReminderService()
