from datetime import date
from typing import List, Literal, Optional

from pydantic import BaseModel

from app.schemas.drop import MovieOut


ArchiveShelfKind = Literal[
    "missed",
    "top_rated",
    "chronological",
    "divisive",
]


class ArchiveMovieOut(BaseModel):
    drop_id: int
    movie: MovieOut
    start_date: date
    end_date: date
    community_score: Optional[float] = None
    total_votes: int = 0
    user_has_rated: bool = False
    user_score: Optional[int] = None
    rank: Optional[int] = None
    divisiveness: Optional[float] = None


class ArchiveShelfOut(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    kind: ArchiveShelfKind
    items: List[ArchiveMovieOut]
    total_count: int
    view_all_path: Optional[str] = None


class ArchiveShelvesOut(BaseModel):
    shelves: List[ArchiveShelfOut]


class ArchiveVoteOrderOut(BaseModel):
    items: List[ArchiveMovieOut]
    total: int
    limit: int
    offset: int
