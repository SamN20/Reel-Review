from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel

from app.schemas.drop import MovieOut


OptionSource = Literal["smart", "wildcard", "fallback"]


class WeeklyDropOptionOut(BaseModel):
    id: int
    movie: MovieOut
    display_order: int
    source: OptionSource
    smart_score: float = 0.0


class WeeklyDropBallotOut(BaseModel):
    target_drop_id: int
    ranked_movie_ids: list[int]
    updated_at: datetime | None = None


class NextVoteOut(BaseModel):
    target_drop_id: int
    source_drop_id: int
    start_date: date
    end_date: date
    locked: bool
    options: list[WeeklyDropOptionOut]
    ballot: WeeklyDropBallotOut | None = None


class BallotUpdate(BaseModel):
    ranked_movie_ids: list[int]
