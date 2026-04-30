from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date

from typing import List
from app.api import deps
from app.models.weekly_drop import WeeklyDrop
from app.models.rating import Rating
from app.models.user import User
from app.schemas.drop import WeeklyDropOut, PastDropOut

router = APIRouter()

@router.get("/current", response_model=WeeklyDropOut)
def get_current_drop(db: Session = Depends(deps.get_db)):
    """
    Get the currently active weekly drop.
    """
    today = date.today()
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

    return drop

@router.get("/past", response_model=List[PastDropOut])
def get_past_drops(db: Session = Depends(deps.get_db), current_user: User | None = Depends(deps.get_optional_user)):
    """
    Get all past drops with their community average score and whether the current user has rated them.
    """
    today = date.today()
    past_drops = db.query(WeeklyDrop).filter(
        WeeklyDrop.end_date < today,
        WeeklyDrop.movie_id.isnot(None)
    ).order_by(WeeklyDrop.start_date.desc()).all()

    result = []
    for drop in past_drops:
        from sqlalchemy import func
        avg_score = db.query(func.avg(Rating.overall_score)).filter(Rating.weekly_drop_id == drop.id).scalar()
        
        user_rated = False
        if current_user:
            user_rated = db.query(Rating).filter(
                Rating.weekly_drop_id == drop.id,
                Rating.user_id == current_user.id
            ).first() is not None

        drop_dict = {
            "id": drop.id,
            "movie": {
                "id": drop.movie.id,
                "title": drop.movie.title,
                "overview": drop.movie.overview,
                "poster_path": drop.movie.poster_path,
                "backdrop_path": drop.movie.backdrop_path,
                "release_date": drop.movie.release_date
            },
            "start_date": drop.start_date,
            "end_date": drop.end_date,
            "is_active": drop.is_active,
            "community_score": round(avg_score, 1) if avg_score else None,
            "user_has_rated": user_rated
        }
        result.append(drop_dict)

    return result
