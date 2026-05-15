from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date

from typing import List
from app.api import deps
from app.models.weekly_drop import WeeklyDrop
from app.models.rating import Rating
from app.models.user import User
from app.schemas.drop import WeeklyDropOut, PastDropOut
from app.schemas.drop_selection import BallotUpdate, NextVoteOut, WeeklyDropBallotOut
from app.services.movie_metadata import serialize_movie, serialize_movie_for_response
from app.services.ratings_calculator import RatingsCalculator
from app.services.drop_scheduler import DropSchedulerService
from app.services.drop_selection import DropSelectionService

router = APIRouter()

@router.get("/current", response_model=WeeklyDropOut)
def get_current_drop(db: Session = Depends(deps.get_db)):
    """
    Get the currently active weekly drop.
    """
    DropSchedulerService.rollover(db)
    today = DropSchedulerService.eastern_today()
    drop = db.query(WeeklyDrop).filter(
        WeeklyDrop.is_active == True,
        WeeklyDrop.movie_id.isnot(None),
        WeeklyDrop.start_date <= today,
        WeeklyDrop.end_date >= today
    ).first()

    if not drop:
        # For development/testing purposes, if no drop is active today,
        # return the latest active drop or 404
        drop = db.query(WeeklyDrop).filter(
            WeeklyDrop.is_active == True,
            WeeklyDrop.movie_id.isnot(None)
        ).order_by(WeeklyDrop.id.desc()).first()
        if not drop:
            raise HTTPException(status_code=404, detail="No active weekly drop found")

    return {
        "id": drop.id,
        "movie": serialize_movie_for_response(db, drop.movie),
        "start_date": drop.start_date,
        "end_date": drop.end_date,
        "is_active": drop.is_active,
    }


@router.get("/past", response_model=List[PastDropOut])
def get_past_drops(db: Session = Depends(deps.get_db), current_user: User | None = Depends(deps.get_optional_user)):
    """
    Get all past drops with their community average score and whether the current user has rated them.
    """
    today = DropSchedulerService.eastern_today()
    past_drops = db.query(WeeklyDrop).filter(
        WeeklyDrop.end_date < today,
        WeeklyDrop.movie_id.isnot(None)
    ).order_by(WeeklyDrop.start_date.desc()).all()

    result = []
    for drop in past_drops:
        avg_score = RatingsCalculator.calculate_drop_average_score(db, drop.id)
        
        user_rated = False
        if current_user:
            user_rated = db.query(Rating).filter(
                Rating.weekly_drop_id == drop.id,
                Rating.user_id == current_user.id
            ).first() is not None

        drop_dict = {
            "id": drop.id,
            "movie": serialize_movie(drop.movie),
            "start_date": drop.start_date,
            "end_date": drop.end_date,
            "is_active": drop.is_active,
            "community_score": avg_score if avg_score > 0 else None,
            "user_has_rated": user_rated
        }
        result.append(drop_dict)

    return result


@router.get("/{drop_id}/next-vote", response_model=NextVoteOut)
def get_next_vote(
    drop_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    source_drop = db.query(WeeklyDrop).filter(WeeklyDrop.id == drop_id).first()
    if not source_drop:
        raise HTTPException(status_code=404, detail="Weekly drop not found")

    target_drop = DropSelectionService.find_next_user_vote_drop(db, source_drop)
    if not target_drop:
        raise HTTPException(status_code=404, detail="No upcoming User Vote drop found")

    payload = DropSelectionService.serialize_next_vote(
        db,
        source_drop=source_drop,
        target_drop=target_drop,
        user=current_user,
        today=DropSchedulerService.eastern_today(),
    )
    db.commit()
    return payload


@router.put("/{target_drop_id}/ballot", response_model=WeeklyDropBallotOut)
def update_next_vote_ballot(
    target_drop_id: int,
    payload: BallotUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    target_drop = db.query(WeeklyDrop).filter(WeeklyDrop.id == target_drop_id).first()
    if not target_drop:
        raise HTTPException(status_code=404, detail="Weekly drop not found")

    source_drop = (
        db.query(WeeklyDrop)
        .filter(
            WeeklyDrop.is_active == True,
            WeeklyDrop.start_date < target_drop.start_date,
        )
        .order_by(WeeklyDrop.start_date.desc(), WeeklyDrop.id.desc())
        .first()
    )
    if not source_drop:
        source_drop = (
            db.query(WeeklyDrop)
            .filter(WeeklyDrop.start_date < target_drop.start_date)
            .order_by(WeeklyDrop.start_date.desc(), WeeklyDrop.id.desc())
            .first()
        )
    if not source_drop:
        raise HTTPException(status_code=400, detail="No current drop found for this ballot window.")

    ballot = DropSelectionService.upsert_ballot(
        db,
        target_drop=target_drop,
        source_drop=source_drop,
        user=current_user,
        ranked_movie_ids=payload.ranked_movie_ids,
        today=DropSchedulerService.eastern_today(),
    )
    db.commit()
    db.refresh(ballot)
    return {
        "target_drop_id": target_drop.id,
        "ranked_movie_ids": ballot.ranked_movie_ids,
        "updated_at": ballot.updated_at,
    }

@router.get("/{drop_id}", response_model=WeeklyDropOut)
def get_drop_by_id(drop_id: int, db: Session = Depends(deps.get_db)):
    """
    Get a specific weekly drop by ID.
    """
    drop = db.query(WeeklyDrop).filter(WeeklyDrop.id == drop_id).first()
    if not drop:
        raise HTTPException(status_code=404, detail="Weekly drop not found")
    return {
        "id": drop.id,
        "movie": serialize_movie_for_response(db, drop.movie),
        "start_date": drop.start_date,
        "end_date": drop.end_date,
        "is_active": drop.is_active,
    }
