from pydantic import BaseModel
from typing import List, Literal, Optional
from app.schemas.drop import MovieOut

class ReplyCreate(BaseModel):
    body: str
    parent_reply_id: Optional[int] = None

class ReviewReportCreate(BaseModel):
    reason: Literal["harmful_or_spam", "spoiler"]

class LikeToggleOut(BaseModel):
    liked: bool
    like_count: int

class SubCategoryAverages(BaseModel):
    story: Optional[float] = None
    performances: Optional[float] = None
    visuals: Optional[float] = None
    sound: Optional[float] = None
    rewatchability: Optional[float] = None
    enjoyment: Optional[float] = None
    emotional_impact: Optional[float] = None

class StandoutCategoryOut(BaseModel):
    key: str
    label: str
    score: float

class ScoreComparisonOut(BaseModel):
    delta: int
    absolute_delta: int
    direction: Literal["higher", "lower", "equal"]

class RankingNeighborOut(BaseModel):
    rank: int
    title: str
    score: float
    is_current: bool = False

class RankingOut(BaseModel):
    id: str
    label: str
    rank: int
    total_ranked: int
    badge: Optional[str] = None
    surrounding: List[RankingNeighborOut]

class ReplyOut(BaseModel):
    id: int
    user_name: str
    body: str
    like_count: int
    liked_by_me: bool = False
    created_at: Optional[str] = None
    replies: List["ReplyOut"] = []

class ReviewOut(BaseModel):
    id: int
    user_name: str
    overall_score: int
    review_text: str
    is_spoiler: bool
    like_count: int
    liked_by_me: bool = False
    reply_count: int
    created_at: Optional[str] = None
    score_delta: float
    controversy_score: float
    replies: List[ReplyOut] = []

class ReviewListOut(BaseModel):
    items: List[ReviewOut]
    total: int
    tab: Literal["spoiler-free", "spoilers"]
    sort: Literal["top", "recent", "controversial"]

class ResultsOut(BaseModel):
    drop_id: int
    movie: MovieOut
    official_score: float
    user_score: Optional[int] = None
    total_votes: int
    comparison: Optional[ScoreComparisonOut] = None
    sub_categories: SubCategoryAverages
    standout_category: Optional[StandoutCategoryOut] = None
    rankings: List[RankingOut]
    reviews: List[ReviewOut]

    class Config:
        from_attributes = True


ReplyOut.model_rebuild()
