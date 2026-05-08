from datetime import date
from pydantic import BaseModel
from typing import List, Optional

class GenreOut(BaseModel):
    id: Optional[int] = None
    name: str

class WatchProviderOut(BaseModel):
    provider_id: int
    provider_name: str
    logo_path: Optional[str] = None
    category: str
    region: str
    link_url: Optional[str] = None

class MovieBase(BaseModel):
    title: str
    overview: Optional[str] = None
    poster_path: Optional[str] = None
    backdrop_path: Optional[str] = None
    trailer_youtube_key: Optional[str] = None
    director_name: Optional[str] = None
    genres: List[GenreOut] = []
    watch_providers: List[WatchProviderOut] = []

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
