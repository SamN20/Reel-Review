from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date

from app.api import deps
from app.models.user import User
from app.models.weekly_drop import WeeklyDrop
from app.models.rating import Rating
from app.schemas.rating import RatingCreate, RatingOut

router = APIRouter()

@router.post("/", response_model=RatingOut)
def create_rating(
    rating_in: RatingCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Submit a rating for a weekly drop.
    """
    # 1. Verify the drop exists
    drop = db.query(WeeklyDrop).filter(WeeklyDrop.id == rating_in.weekly_drop_id).first()
    if not drop:
        raise HTTPException(status_code=404, detail="Weekly drop not found")

    # 2. Check if vote is late
    today = date.today()
    is_late = today > drop.end_date

    # 3. Check if user already rated this drop
    existing = db.query(Rating).filter(
        Rating.user_id == current_user.id,
        Rating.weekly_drop_id == drop.id
    ).first()
    
    if existing:
        if is_late:
            raise HTTPException(status_code=400, detail="The voting week has ended. You can no longer change your rating.")
            
        # Check auto-flag
        bad_words = ["fuck", "shit", "bitch", "asshole", "cunt", "nigger", "faggot", "slut"]
        is_flagged = False
        if rating_in.review_text:
            text_lower = rating_in.review_text.lower()
            if any(word in text_lower for word in bad_words):
                is_flagged = True

        # Update existing
        for key, value in rating_in.dict(exclude={'weekly_drop_id'}).items():
            setattr(existing, key, value)
        
        # Override auto-flag properties
        existing.is_flagged = is_flagged
        if is_flagged:
            existing.is_approved = False
        
        db.commit()
        db.refresh(existing)
        return existing

    # 4. Create rating
    bad_words = ["fuck", "shit", "bitch", "asshole", "cunt", "nigger", "faggot", "slut"]
    is_flagged = False
    is_approved = True
    if rating_in.review_text:
        text_lower = rating_in.review_text.lower()
        if any(word in text_lower for word in bad_words):
            is_flagged = True
            is_approved = False

    rating = Rating(
        user_id=current_user.id,
        movie_id=drop.movie_id,
        weekly_drop_id=drop.id,
        is_late=is_late,
        is_flagged=is_flagged,
        is_approved=is_approved,
        **rating_in.dict(exclude={'weekly_drop_id'})
    )
    db.add(rating)
    db.commit()
    db.refresh(rating)

    return rating

@router.get("/me/{drop_id}", response_model=RatingOut)
def get_my_rating(
    drop_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    rating = db.query(Rating).filter(
        Rating.user_id == current_user.id,
        Rating.weekly_drop_id == drop_id
    ).first()
    if not rating:
        raise HTTPException(status_code=404, detail="Rating not found")
    return rating
