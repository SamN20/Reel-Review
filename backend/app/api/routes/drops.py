from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date

from app.api import deps
from app.models.weekly_drop import WeeklyDrop
from app.schemas.drop import WeeklyDropOut

router = APIRouter()

@router.get("/current", response_model=WeeklyDropOut)
def get_current_drop(db: Session = Depends(deps.get_db)):
    """
    Get the currently active weekly drop.
    """
    today = date.today()
    drop = db.query(WeeklyDrop).filter(
        WeeklyDrop.is_active == True,
        WeeklyDrop.start_date <= today,
        WeeklyDrop.end_date >= today
    ).first()

    if not drop:
        # For development/testing purposes, if no drop is active today,
        # return the latest active drop or 404
        drop = db.query(WeeklyDrop).filter(WeeklyDrop.is_active == True).order_by(WeeklyDrop.id.desc()).first()
        if not drop:
            raise HTTPException(status_code=404, detail="No active weekly drop found")

    return drop
