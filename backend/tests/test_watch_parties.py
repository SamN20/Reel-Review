from datetime import date, datetime, timedelta, timezone
from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.api.routes.watch_parties import (
    cancel_watch_party,
    create_watch_party,
    get_current_watch_parties,
    update_watch_party,
    update_watch_party_rsvp,
)
from app.models.admin_setting import AdminSetting
from app.models.movie import Movie
from app.models.user import User
from app.models.watch_party import WatchParty, WatchPartyRsvp
from app.models.weekly_drop import WeeklyDrop
from app.schemas.watch_party import WatchPartyCreate, WatchPartyRsvpUpdate, WatchPartyUpdate
from app.services.watch_party_reminders import send_due_watch_party_reminders


def configure_discord_channels(db: Session):
    db.add(
        AdminSetting(
            key="watch_party_discord",
            value={
                "channels": [
                    {
                        "key": "bynolo_public_one",
                        "label": "byNolo Public One",
                        "link_url": "https://discord.com/channels/public-one",
                        "description": "Open watch room one.",
                    },
                    {
                        "key": "bynolo_public_two",
                        "label": "byNolo Public Two",
                        "link_url": "https://discord.com/channels/public-two",
                        "description": "Open watch room two.",
                    },
                ]
            },
        )
    )
    db.commit()


@pytest.fixture
def watch_party_data(db: Session):
    admin = User(keyn_id="1", username="admin_user", email="admin@example.com", is_admin=True)
    host = User(keyn_id="2", username="host_user", email="host@example.com")
    guest = User(keyn_id="3", username="guest_user", email="guest@example.com")
    db.add_all([admin, host, guest])
    db.commit()
    db.refresh(admin)
    db.refresh(host)
    db.refresh(guest)

    movie = Movie(title="Watch Party Movie")
    db.add(movie)
    db.commit()
    db.refresh(movie)

    today = date.today()
    active_drop = WeeklyDrop(
        movie_id=movie.id,
        start_date=today - timedelta(days=1),
        end_date=today + timedelta(days=5),
        is_active=True,
    )
    old_drop = WeeklyDrop(
        movie_id=movie.id,
        start_date=today - timedelta(days=14),
        end_date=today - timedelta(days=7),
        is_active=False,
    )
    db.add_all([active_drop, old_drop])
    db.commit()
    db.refresh(active_drop)
    db.refresh(old_drop)

    configure_discord_channels(db)

    return db, admin, host, guest, active_drop, old_drop


def test_create_bynolo_discord_watch_party_success(watch_party_data):
    db, _admin, host, _guest, active_drop, _old_drop = watch_party_data

    payload = WatchPartyCreate(
        title="Friday Public Server Watch",
        host_mode="bynolo_discord",
        discord_channel_key="bynolo_public_one",
        scheduled_for=datetime.now(timezone.utc) + timedelta(hours=2),
        timezone_label="America/Toronto",
        platform="Discord",
        region="Canada",
        notes="Open to the whole crew.",
        visibility_hint="public",
    )

    data = create_watch_party(payload, db, host)

    assert data["title"] == "Friday Public Server Watch"
    assert data["weekly_drop_id"] == active_drop.id
    assert data["host_mode"] == "bynolo_discord"
    assert data["destination_label"] == "byNolo Public One"
    assert data["can_edit"] is True


def test_create_watch_party_fails_without_active_drop(watch_party_data):
    db, _admin, host, _guest, active_drop, _old_drop = watch_party_data
    active_drop.is_active = False
    active_drop.end_date = date.today() - timedelta(days=1)
    db.commit()

    payload = WatchPartyCreate(
        title="No Active Drop",
        host_mode="custom_link",
        external_url="https://teleparty.com/room/test",
        scheduled_for=datetime.now(timezone.utc) + timedelta(hours=2),
        timezone_label="America/Toronto",
    )

    with pytest.raises(HTTPException, match="No active weekly drop"):
        create_watch_party(payload, db, host)


def test_create_custom_watch_party_rejects_invalid_url(watch_party_data):
    _db, _admin, _host, _guest, _active_drop, _old_drop = watch_party_data

    with pytest.raises(ValidationError, match="Custom links must start with http:// or https://"):
        WatchPartyCreate(
            title="Bad Link Party",
            host_mode="custom_link",
            external_url="discord.gg/not-allowed",
            scheduled_for=datetime.now(timezone.utc) + timedelta(hours=2),
            timezone_label="America/Toronto",
        )


def test_create_bynolo_discord_watch_party_rejects_unknown_channel(watch_party_data):
    db, _admin, host, _guest, _active_drop, _old_drop = watch_party_data

    payload = WatchPartyCreate(
        title="Wrong Channel Party",
        host_mode="bynolo_discord",
        discord_channel_key="unknown_channel",
        scheduled_for=datetime.now(timezone.utc) + timedelta(hours=2),
        timezone_label="America/Toronto",
    )

    with pytest.raises(HTTPException, match="Unknown byNolo Discord channel"):
        create_watch_party(payload, db, host)


def test_member_can_rsvp_and_update_status(watch_party_data):
    db, _admin, host, guest, active_drop, _old_drop = watch_party_data
    party = WatchParty(
        weekly_drop_id=active_drop.id,
        creator_user_id=host.id,
        title="RSVP Party",
        host_mode="custom_link",
        external_url="https://teleparty.com/room/test",
        scheduled_for=datetime.now(timezone.utc) + timedelta(hours=2),
        timezone_label="America/Toronto",
        status="scheduled",
    )
    db.add(party)
    db.commit()
    db.refresh(party)

    going_response = update_watch_party_rsvp(
        party.id,
        WatchPartyRsvpUpdate(status="going"),
        db,
        guest,
    )
    not_going_response = update_watch_party_rsvp(
        party.id,
        WatchPartyRsvpUpdate(status="not_going"),
        db,
        guest,
    )

    assert going_response["viewer_rsvp_status"] == "going"
    assert going_response["rsvp_count"] == 1
    assert not_going_response["viewer_rsvp_status"] == "not_going"
    assert not_going_response["rsvp_count"] == 0


def test_host_can_edit_and_cancel_own_watch_party(watch_party_data):
    db, _admin, host, _guest, active_drop, _old_drop = watch_party_data
    party = WatchParty(
        weekly_drop_id=active_drop.id,
        creator_user_id=host.id,
        title="Editable Party",
        host_mode="custom_link",
        external_url="https://teleparty.com/room/test",
        scheduled_for=datetime.now(timezone.utc) + timedelta(hours=2),
        timezone_label="America/Toronto",
        status="scheduled",
    )
    db.add(party)
    db.commit()
    db.refresh(party)

    update_response = update_watch_party(
        party.id,
        WatchPartyUpdate(title="Edited Party Title"),
        db,
        host,
    )
    cancel_response = cancel_watch_party(party.id, db, host)

    assert update_response["title"] == "Edited Party Title"
    assert cancel_response["message"] == "Watch party cancelled."
    db.refresh(party)
    assert party.status == "cancelled"


def test_non_host_cannot_edit_or_cancel_watch_party(watch_party_data):
    db, _admin, host, guest, active_drop, _old_drop = watch_party_data
    party = WatchParty(
        weekly_drop_id=active_drop.id,
        creator_user_id=host.id,
        title="Protected Party",
        host_mode="custom_link",
        external_url="https://teleparty.com/room/test",
        scheduled_for=datetime.now(timezone.utc) + timedelta(hours=2),
        timezone_label="America/Toronto",
        status="scheduled",
    )
    db.add(party)
    db.commit()
    db.refresh(party)

    with pytest.raises(HTTPException, match="cannot manage this watch party"):
        update_watch_party(party.id, WatchPartyUpdate(title="Bad Edit"), db, guest)

    with pytest.raises(HTTPException, match="cannot manage this watch party"):
        cancel_watch_party(party.id, db, guest)


def test_admin_can_cancel_any_watch_party(watch_party_data):
    db, admin, host, _guest, active_drop, _old_drop = watch_party_data
    party = WatchParty(
        weekly_drop_id=active_drop.id,
        creator_user_id=host.id,
        title="Admin Moderated Party",
        host_mode="custom_link",
        external_url="https://teleparty.com/room/test",
        scheduled_for=datetime.now(timezone.utc) + timedelta(hours=2),
        timezone_label="America/Toronto",
        status="scheduled",
    )
    db.add(party)
    db.commit()
    db.refresh(party)

    cancel_response = cancel_watch_party(party.id, db, admin)

    assert cancel_response["message"] == "Watch party cancelled."
    db.refresh(party)
    assert party.status == "cancelled"


def test_current_board_includes_available_channels_and_parties(watch_party_data):
    db, _admin, host, guest, active_drop, _old_drop = watch_party_data
    party = WatchParty(
        weekly_drop_id=active_drop.id,
        creator_user_id=host.id,
        title="Board Party",
        host_mode="bynolo_discord",
        discord_channel_key="bynolo_public_two",
        scheduled_for=datetime.now(timezone.utc) + timedelta(hours=2),
        timezone_label="America/Toronto",
        status="scheduled",
    )
    db.add(party)
    db.commit()
    db.refresh(party)

    board = get_current_watch_parties(db, guest)

    assert board["drop"]["id"] == active_drop.id
    assert len(board["available_discord_channels"]) == 2
    assert board["parties"][0]["destination_label"] == "byNolo Public Two"


@pytest.mark.asyncio
async def test_watch_party_reminder_notifies_going_rsvps(watch_party_data):
    db, _admin, host, guest, active_drop, _old_drop = watch_party_data
    now = datetime(2026, 6, 7, 20, 0, tzinfo=timezone.utc)
    party = WatchParty(
        weekly_drop_id=active_drop.id,
        creator_user_id=host.id,
        title="Reminder Party",
        host_mode="custom_link",
        external_url="https://teleparty.com/room/test",
        scheduled_for=now + timedelta(minutes=9),
        timezone_label="America/Toronto",
        status="scheduled",
    )
    db.add(party)
    db.commit()
    db.refresh(party)
    db.add(WatchPartyRsvp(watch_party_id=party.id, user_id=guest.id, status="going"))
    db.commit()

    notifier = AsyncMock()
    notifier.send_bulk_notification.return_value = {"success": True}

    result = await send_due_watch_party_reminders(db, now=now, notifier=notifier)

    assert result == {
        "due_parties": 1,
        "sent_parties": 1,
        "skipped_parties": 0,
        "notified_users": 1,
    }
    notifier.send_bulk_notification.assert_awaited_once()
    _, kwargs = notifier.send_bulk_notification.call_args
    assert kwargs["user_ids"] == [guest.keyn_id]
    assert kwargs["category"] == "social_interactions"
    assert kwargs["target_url"].endswith("/community#watch-parties")
    assert kwargs["metadata"]["watch_party_id"] == party.id
    db.refresh(party)
    assert party.reminder_sent_at is not None


@pytest.mark.asyncio
async def test_watch_party_reminder_skips_not_going_and_marks_party(watch_party_data):
    db, _admin, host, guest, active_drop, _old_drop = watch_party_data
    now = datetime(2026, 6, 7, 20, 0, tzinfo=timezone.utc)
    party = WatchParty(
        weekly_drop_id=active_drop.id,
        creator_user_id=host.id,
        title="No Recipients Party",
        host_mode="custom_link",
        external_url="https://teleparty.com/room/test",
        scheduled_for=now + timedelta(minutes=9),
        timezone_label="America/Toronto",
        status="scheduled",
    )
    db.add(party)
    db.commit()
    db.refresh(party)
    db.add(WatchPartyRsvp(watch_party_id=party.id, user_id=guest.id, status="not_going"))
    db.commit()

    notifier = AsyncMock()

    result = await send_due_watch_party_reminders(db, now=now, notifier=notifier)

    assert result["due_parties"] == 1
    assert result["sent_parties"] == 0
    assert result["skipped_parties"] == 1
    notifier.send_bulk_notification.assert_not_awaited()
    db.refresh(party)
    assert party.reminder_sent_at is not None
