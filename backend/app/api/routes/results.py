from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from app.api import deps
from app.models.weekly_drop import WeeklyDrop
from app.models.rating import Rating
from app.models.user import User
from app.schemas.result import ResultsOut, ReviewOut, SubCategoryAverages
from app.services.ratings_calculator import RatingsCalculator

router = APIRouter()

@router.get("/{drop_id}", response_model=ResultsOut)
def get_drop_results(
    drop_id: int, 
    db: Session = Depends(deps.get_db), 
    current_user: Optional[User] = Depends(deps.get_optional_user)
):
    drop = db.query(WeeklyDrop).filter(WeeklyDrop.id == drop_id).first()
    if not drop:
        raise HTTPException(status_code=404, detail="Weekly drop not found")
        
    total_votes = db.query(Rating).filter(Rating.weekly_drop_id == drop_id).count()
    official_score = RatingsCalculator.calculate_drop_average_score(db, drop_id)
    
    user_score = None
    if current_user:
        user_rating = db.query(Rating).filter(
            Rating.weekly_drop_id == drop_id, 
            Rating.user_id == current_user.id
        ).first()
        if user_rating:
            user_score = user_rating.overall_score

    # Subcategory averages
    sub_cats = SubCategoryAverages()
    if total_votes > 0:
        avgs = db.query(
            func.avg(Rating.story_score).label("story"),
            func.avg(Rating.performances_score).label("performances"),
            func.avg(Rating.visuals_score).label("visuals"),
            func.avg(Rating.sound_score).label("sound"),
            func.avg(Rating.rewatchability_score).label("rewatchability"),
            func.avg(Rating.enjoyment_score).label("enjoyment"),
            func.avg(Rating.emotional_impact_score).label("emotional_impact"),
        ).filter(Rating.weekly_drop_id == drop_id, Rating.is_approved == True).first()
        
        if avgs:
            sub_cats.story = round(float(avgs.story), 1) if avgs.story else None
            sub_cats.performances = round(float(avgs.performances), 1) if avgs.performances else None
            sub_cats.visuals = round(float(avgs.visuals), 1) if avgs.visuals else None
            sub_cats.sound = round(float(avgs.sound), 1) if avgs.sound else None
            sub_cats.rewatchability = round(float(avgs.rewatchability), 1) if avgs.rewatchability else None
            sub_cats.enjoyment = round(float(avgs.enjoyment), 1) if avgs.enjoyment else None
            sub_cats.emotional_impact = round(float(avgs.emotional_impact), 1) if avgs.emotional_impact else None

    # Reviews
    reviews_data = db.query(Rating, User).join(User, Rating.user_id == User.id).filter(
        Rating.weekly_drop_id == drop_id, 
        Rating.review_text.isnot(None),
        Rating.is_approved == True
    ).all()
    
    reviews = []
    for r, u in reviews_data:
        reviews.append(ReviewOut(
            id=r.id,
            user_name="Anonymous" if r.is_anonymous else u.username,
            overall_score=r.overall_score,
            review_text=r.review_text,
            is_spoiler=r.has_spoilers
        ))

    from app.schemas.drop import MovieOut
    return ResultsOut(
        drop_id=drop.id,
        movie=MovieOut.model_validate(drop.movie),
        official_score=official_score,
        user_score=user_score,
        total_votes=total_votes,
        sub_categories=sub_cats,
        reviews=reviews
    )
