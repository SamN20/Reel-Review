from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.watch_party import WatchParty, WatchPartyRsvp
from app.models.weekly_drop import WeeklyDrop
from app.services.admin_settings import (
    DEFAULT_WATCH_PARTY_DISCORD_SETTINGS,
    WATCH_PARTY_DISCORD_SETTINGS_KEY,
    get_or_create_setting,
)
from app.services.drop_scheduler import DropSchedulerService


WATCH_PARTY_HOST_MODE_DISCORD = "bynolo_discord"
WATCH_PARTY_HOST_MODE_CUSTOM = "custom_link"
WATCH_PARTY_STATUS_SCHEDULED = "scheduled"
WATCH_PARTY_STATUS_CANCELLED = "cancelled"
WATCH_PARTY_RSVP_GOING = "going"


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _coerce_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def get_current_drop_or_400(db: Session) -> WeeklyDrop:
    DropSchedulerService.rollover(db)
    today = DropSchedulerService.eastern_today()
    drop = (
        db.query(WeeklyDrop)
        .filter(
            WeeklyDrop.is_active == True,
            WeeklyDrop.movie_id.isnot(None),
            WeeklyDrop.start_date <= today,
            WeeklyDrop.end_date >= today,
        )
        .order_by(WeeklyDrop.start_date.desc(), WeeklyDrop.id.desc())
        .first()
    )
    if not drop:
        raise HTTPException(status_code=400, detail="No active weekly drop is available for watch parties.")
    return drop


def get_discord_channel_settings(db: Session) -> list[dict[str, str]]:
    setting = get_or_create_setting(
        db,
        WATCH_PARTY_DISCORD_SETTINGS_KEY,
        DEFAULT_WATCH_PARTY_DISCORD_SETTINGS,
    )
    raw_channels = setting.value.get("channels", [])
    channels: list[dict[str, str]] = []
    for index, channel in enumerate(raw_channels):
        if not isinstance(channel, dict):
            continue
        key = str(channel.get("key") or f"bynolo_discord_{index + 1}").strip()
        label = str(channel.get("label") or "").strip()
        link_url = str(channel.get("link_url") or "").strip()
        description = str(channel.get("description") or "").strip()
        channels.append(
            {
                "key": key,
                "label": label,
                "link_url": link_url,
                "description": description,
            }
        )
    return channels


def get_channel_by_key(db: Session, key: str) -> dict[str, str]:
    for channel in get_discord_channel_settings(db):
        if channel["key"] == key:
            if not channel["label"] or not channel["link_url"]:
                raise HTTPException(status_code=400, detail="That byNolo Discord channel is not fully configured yet.")
            return channel
    raise HTTPException(status_code=400, detail="Unknown byNolo Discord channel.")


def can_manage_party(party: WatchParty, user: User) -> bool:
    return party.creator_user_id == user.id or bool(user.is_admin)


def get_host_display_name(user: User) -> str:
    if user.use_display_name and user.display_name:
        return user.display_name
    return user.username


def serialize_watch_party(
    db: Session,
    party: WatchParty,
    current_user: User,
    rsvp_count: int,
    viewer_rsvp_status: str | None,
) -> dict[str, Any]:
    if party.host_mode == WATCH_PARTY_HOST_MODE_DISCORD:
        channel = get_channel_by_key(db, party.discord_channel_key or "")
        destination_label = channel["label"]
        destination_url = channel["link_url"]
        destination_description = channel["description"]
    else:
        destination_label = party.platform or "Custom Link"
        destination_url = party.external_url or ""
        destination_description = party.region or ""

    scheduled_for = _coerce_utc(party.scheduled_for)
    is_past = scheduled_for <= _now_utc()
    can_manage = can_manage_party(party, current_user)
    return {
        "id": party.id,
        "weekly_drop_id": party.weekly_drop_id,
        "title": party.title,
        "host_mode": party.host_mode,
        "status": party.status,
        "scheduled_for": scheduled_for,
        "timezone_label": party.timezone_label,
        "region": party.region,
        "platform": party.platform,
        "capacity": party.capacity,
        "notes": party.notes,
        "visibility_hint": party.visibility_hint,
        "host_display_name": get_host_display_name(party.creator),
        "destination_label": destination_label,
        "destination_url": destination_url,
        "destination_description": destination_description,
        "discord_channel_key": party.discord_channel_key,
        "rsvp_count": rsvp_count,
        "viewer_rsvp_status": viewer_rsvp_status,
        "can_edit": can_manage and party.status != WATCH_PARTY_STATUS_CANCELLED,
        "can_cancel": can_manage and party.status != WATCH_PARTY_STATUS_CANCELLED,
        "is_past": is_past,
    }


def get_existing_rsvp(db: Session, party_id: int, user_id: int) -> WatchPartyRsvp | None:
    return (
        db.query(WatchPartyRsvp)
        .filter(WatchPartyRsvp.watch_party_id == party_id, WatchPartyRsvp.user_id == user_id)
        .first()
    )
