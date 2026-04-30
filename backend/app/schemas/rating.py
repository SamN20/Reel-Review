from pydantic import BaseModel
from typing import Optional

class RatingCreate(BaseModel):
    weekly_drop_id: int
    overall_score: int
    watched_status: bool = True
    
    story_score: Optional[int] = None
    performances_score: Optional[int] = None
    visuals_score: Optional[int] = None
    sound_score: Optional[int] = None
    rewatchability_score: Optional[int] = None
    enjoyment_score: Optional[int] = None
    emotional_impact_score: Optional[int] = None
    
    review_text: Optional[str] = None
    is_anonymous: bool = False
    has_spoilers: bool = False

class RatingOut(RatingCreate):
    id: int
    user_id: int
    movie_id: int
    is_late: bool
    is_flagged: bool = False
    is_approved: bool = True

    class Config:
        from_attributes = True
