from fastapi import APIRouter, Depends
import json
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List, Optional

from app.api import deps
from app.models.movie import Movie
from app.models.weekly_drop import WeeklyDrop

router = APIRouter()

class MovieOut(BaseModel):
    id: int
    title: str
    poster_path: Optional[str]
    drop_id: Optional[int] = None

class ActorProfileOut(BaseModel):
    name: str
    profile_path: Optional[str]

class ActorMoviesOut(BaseModel):
    actor: ActorProfileOut
    movies: List[MovieOut]

def _attach_latest_drop_ids(db: Session, movies: List[Movie]):
    if not movies:
        return []

    movie_ids = [movie.id for movie in movies]
    drop_rows = (
        db.query(WeeklyDrop.movie_id, func.max(WeeklyDrop.id).label("drop_id"))
        .filter(WeeklyDrop.movie_id.in_(movie_ids))
        .group_by(WeeklyDrop.movie_id)
        .all()
    )
    drop_map = {row.movie_id: row.drop_id for row in drop_rows}
    return [
        {
            "id": movie.id,
            "title": movie.title,
            "poster_path": movie.poster_path,
            "drop_id": drop_map.get(movie.id),
        }
        for movie in movies
    ]

@router.get("/actor/{name}", response_model=ActorMoviesOut)
def get_movies_by_actor(name: str, db: Session = Depends(deps.get_db)):
    search_json = json.dumps([{"name": name}])
    movies = db.query(Movie).filter(Movie.cast.op('@>')(search_json)).all()
    
    profile_path = None
    for movie in movies:
        if movie.cast:
            for cast_member in movie.cast:
                if cast_member.get("name") == name:
                    if cast_member.get("profile_path"):
                        profile_path = cast_member.get("profile_path")
                        break
        if profile_path:
            break

    return {
        "actor": {"name": name, "profile_path": profile_path},
        "movies": _attach_latest_drop_ids(db, movies),
    }

@router.get("/director/{name}", response_model=List[MovieOut])
def get_movies_by_director(name: str, db: Session = Depends(deps.get_db)):
    movies = db.query(Movie).filter(Movie.director_name == name).all()
    return _attach_latest_drop_ids(db, movies)
