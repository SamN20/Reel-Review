from datetime import date
from pydantic import BaseModel
from typing import Optional

class MovieBase(BaseModel):
    title: str
    overview: Optional[str] = None
    poster_path: Optional[str] = None
    backdrop_path: Optional[str] = None

class MovieOut(MovieBase):
    id: int
    release_date: Optional[date] = None

    class Config:
        from_attributes = True

class WeeklyDropBase(BaseModel):
    start_date: date
    end_date: date
    is_active: bool

class WeeklyDropOut(WeeklyDropBase):
    id: int
    movie: MovieOut

    class Config:
        from_attributes = True

class PastDropOut(WeeklyDropOut):
    community_score: Optional[float] = None
    user_has_rated: bool = False

    class Config:
        from_attributes = True
