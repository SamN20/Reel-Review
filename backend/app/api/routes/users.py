from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from typing import List

from app.api import deps
from app.models.user import User
from app.models.rating import Rating
from app.schemas.user import UserPreferencesUpdate, UserProfileOut, UserOut
from app.services.profile_visibility import apply_public_profile_rating_visibility

router = APIRouter()


def serialize_profile(
    db: Session,
    user: User,
    is_public_view: bool,
):
    ratings_query = db.query(Rating).filter(Rating.user_id == user.id)
    if is_public_view:
        ratings_query = apply_public_profile_rating_visibility(ratings_query, db)

    total_votes = ratings_query.count()
    average_score = ratings_query.with_entities(func.avg(Rating.overall_score)).scalar() or 0.0
    recent_ratings = ratings_query.order_by(Rating.created_at.desc()).limit(10).all()
    favorite_movies = ratings_query.order_by(Rating.overall_score.desc(), Rating.created_at.desc()).limit(10).all()

    return {
        "id": user.id,
        "username": user.username,
        "display_name": user.display_name,
        "use_display_name": user.use_display_name if user.use_display_name is not None else True,
        "total_votes": total_votes,
        "average_score": round(average_score, 1),
        "recent_ratings": recent_ratings,
        "favorite_movies": favorite_movies,
    }

@router.put("/me/preferences", response_model=UserOut)
def update_preferences(
    preferences: UserPreferencesUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    current_user.use_display_name = preferences.use_display_name
    current_user.show_on_leaderboard = preferences.show_on_leaderboard
    current_user.public_profile = preferences.public_profile
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/{user_id}/profile", response_model=UserProfileOut)
def get_user_profile(
    user_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User | None = Depends(deps.get_optional_user),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    if not user.public_profile:
        if not current_user or current_user.id != user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Profile is private")
            
    return serialize_profile(db, user, is_public_view=False)

@router.get("/by-username/{username}/profile", response_model=UserProfileOut)
def get_user_profile_by_username(
    username: str,
    db: Session = Depends(deps.get_db),
    current_user: User | None = Depends(deps.get_optional_user),
):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    if not user.public_profile:
        if not current_user or current_user.id != user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Profile is private")
            
    return serialize_profile(db, user, is_public_view=True)
