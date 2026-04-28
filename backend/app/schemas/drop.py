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

class WeeklyDropBase(BaseModel):
    start_date: date
    end_date: date
    is_active: bool

class WeeklyDropOut(WeeklyDropBase):
    id: int
    movie: MovieOut
