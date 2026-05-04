from pydantic import BaseModel
from typing import List, Optional
from app.schemas.drop import MovieOut

class ReviewOut(BaseModel):
    id: int
    user_name: str
    overall_score: int
    review_text: str
    is_spoiler: bool

class SubCategoryAverages(BaseModel):
    story: Optional[float] = None
    performances: Optional[float] = None
    visuals: Optional[float] = None
    sound: Optional[float] = None
    rewatchability: Optional[float] = None
    enjoyment: Optional[float] = None
    emotional_impact: Optional[float] = None

class ResultsOut(BaseModel):
    drop_id: int
    movie: MovieOut
    official_score: float
    user_score: Optional[int] = None
    total_votes: int
    sub_categories: SubCategoryAverages
    reviews: List[ReviewOut]

    class Config:
        from_attributes = True
