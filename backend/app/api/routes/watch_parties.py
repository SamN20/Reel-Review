from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api import deps
from app.models.user import User
from app.models.watch_party import WatchParty, WatchPartyRsvp
from app.schemas.watch_party import (
    WatchPartyBoardOut,
    WatchPartyCreate,
    WatchPartyOut,
    WatchPartyRsvpUpdate,
    WatchPartyUpdate,
)
from app.services.watch_parties import (
    WATCH_PARTY_HOST_MODE_CUSTOM,
    WATCH_PARTY_HOST_MODE_DISCORD,
    WATCH_PARTY_STATUS_CANCELLED,
    can_manage_party,
    get_channel_by_key,
    get_current_drop_or_400,
    get_discord_channel_settings,
    get_existing_rsvp,
    serialize_watch_party,
)

router = APIRouter(dependencies=[Depends(deps.get_current_user)])


def get_party_or_404(db: Session, party_id: int) -> WatchParty:
    party = db.query(WatchParty).filter(WatchParty.id == party_id).first()
    if not party:
        raise HTTPException(status_code=404, detail="Watch party not found.")
    return party


def ensure_can_manage(party: WatchParty, current_user: User) -> None:
    if not can_manage_party(party, current_user):
        raise HTTPException(status_code=403, detail="You cannot manage this watch party.")


def ensure_party_editable(party: WatchParty) -> None:
    if party.status == WATCH_PARTY_STATUS_CANCELLED:
        raise HTTPException(status_code=400, detail="Cancelled watch parties cannot be edited.")


def build_board(db: Session, current_user: User) -> dict:
    drop = get_current_drop_or_400(db)
    parties = (
        db.query(WatchParty)
        .filter(
            WatchParty.weekly_drop_id == drop.id,
            WatchParty.status != WATCH_PARTY_STATUS_CANCELLED,
        )
        .order_by(WatchParty.scheduled_for.asc(), WatchParty.id.asc())
        .all()
    )
    party_ids = [party.id for party in parties]
    rsvp_counts = {
        party_id: count
        for party_id, count in (
            db.query(WatchPartyRsvp.watch_party_id, func.count(WatchPartyRsvp.id))
            .filter(
                WatchPartyRsvp.watch_party_id.in_(party_ids) if party_ids else False,
                WatchPartyRsvp.status == "going",
            )
            .group_by(WatchPartyRsvp.watch_party_id)
            .all()
        )
    }
    viewer_rsvps = {
        rsvp.watch_party_id: rsvp.status
        for rsvp in (
            db.query(WatchPartyRsvp)
            .filter(
                WatchPartyRsvp.watch_party_id.in_(party_ids) if party_ids else False,
                WatchPartyRsvp.user_id == current_user.id,
            )
            .all()
        )
    }
    return {
        "drop": {
            "id": drop.id,
            "movie_title": drop.movie.title if drop.movie else f"Drop {drop.id}",
            "start_date": drop.start_date,
            "end_date": drop.end_date,
        },
        "parties": [
            serialize_watch_party(
                db,
                party,
                current_user,
                rsvp_counts.get(party.id, 0),
                viewer_rsvps.get(party.id),
            )
            for party in parties
        ],
        "available_discord_channels": get_discord_channel_settings(db),
    }


@router.get("/current", response_model=WatchPartyBoardOut)
def get_current_watch_parties(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    return build_board(db, current_user)


@router.post("", response_model=WatchPartyOut, include_in_schema=False)
@router.post("/", response_model=WatchPartyOut)
def create_watch_party(
    payload: WatchPartyCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    drop = get_current_drop_or_400(db)
    if payload.host_mode == WATCH_PARTY_HOST_MODE_DISCORD:
        get_channel_by_key(db, payload.discord_channel_key or "")

    party = WatchParty(
        weekly_drop_id=drop.id,
        creator_user_id=current_user.id,
        title=payload.title,
        host_mode=payload.host_mode,
        external_url=payload.external_url if payload.host_mode == WATCH_PARTY_HOST_MODE_CUSTOM else None,
        discord_channel_key=payload.discord_channel_key if payload.host_mode == WATCH_PARTY_HOST_MODE_DISCORD else None,
        scheduled_for=payload.scheduled_for.astimezone(timezone.utc),
        timezone_label=payload.timezone_label,
        region=payload.region,
        platform=payload.platform,
        capacity=payload.capacity,
        notes=payload.notes,
        visibility_hint=payload.visibility_hint,
        status="scheduled",
    )
    db.add(party)
    db.commit()
    db.refresh(party)
    return serialize_watch_party(db, party, current_user, 0, None)


@router.patch("/{party_id}", response_model=WatchPartyOut)
def update_watch_party(
    party_id: int,
    payload: WatchPartyUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    party = get_party_or_404(db, party_id)
    ensure_can_manage(party, current_user)
    ensure_party_editable(party)
    current_drop = get_current_drop_or_400(db)
    if party.weekly_drop_id != current_drop.id:
        raise HTTPException(status_code=400, detail="Only current-drop watch parties can be edited.")

    for field in ("title", "scheduled_for", "timezone_label", "region", "platform", "capacity", "notes", "visibility_hint"):
        value = getattr(payload, field)
        if value is not None:
            if field == "scheduled_for":
                value = value.astimezone(timezone.utc)
            setattr(party, field, value)

    if payload.discord_channel_key is not None:
        if party.host_mode != WATCH_PARTY_HOST_MODE_DISCORD:
            raise HTTPException(status_code=400, detail="Only byNolo Discord parties can change Discord channels.")
        get_channel_by_key(db, payload.discord_channel_key)
        party.discord_channel_key = payload.discord_channel_key

    if payload.external_url is not None:
        if party.host_mode != WATCH_PARTY_HOST_MODE_CUSTOM:
            raise HTTPException(status_code=400, detail="Only custom link parties can change host links.")
        party.external_url = payload.external_url

    db.commit()
    db.refresh(party)
    rsvp_count = (
        db.query(func.count(WatchPartyRsvp.id))
        .filter(WatchPartyRsvp.watch_party_id == party.id, WatchPartyRsvp.status == "going")
        .scalar()
        or 0
    )
    viewer_rsvp = get_existing_rsvp(db, party.id, current_user.id)
    return serialize_watch_party(db, party, current_user, rsvp_count, viewer_rsvp.status if viewer_rsvp else None)


@router.post("/{party_id}/rsvp", response_model=WatchPartyOut)
def update_watch_party_rsvp(
    party_id: int,
    payload: WatchPartyRsvpUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    party = get_party_or_404(db, party_id)
    if party.status == WATCH_PARTY_STATUS_CANCELLED:
        raise HTTPException(status_code=400, detail="Cancelled watch parties cannot accept RSVPs.")

    rsvp = get_existing_rsvp(db, party.id, current_user.id)
    if not rsvp:
        rsvp = WatchPartyRsvp(
            watch_party_id=party.id,
            user_id=current_user.id,
            status=payload.status,
        )
        db.add(rsvp)
    else:
        rsvp.status = payload.status

    db.commit()
    db.refresh(party)
    rsvp_count = (
        db.query(func.count(WatchPartyRsvp.id))
        .filter(WatchPartyRsvp.watch_party_id == party.id, WatchPartyRsvp.status == "going")
        .scalar()
        or 0
    )
    return serialize_watch_party(db, party, current_user, rsvp_count, payload.status)


@router.delete("/{party_id}")
def cancel_watch_party(
    party_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    party = get_party_or_404(db, party_id)
    ensure_can_manage(party, current_user)
    if party.status == WATCH_PARTY_STATUS_CANCELLED:
        return {"message": "Watch party already cancelled."}
    party.status = WATCH_PARTY_STATUS_CANCELLED
    party.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Watch party cancelled."}
