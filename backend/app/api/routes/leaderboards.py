from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from pydantic import BaseModel

from app.api import deps
from app.models.user import User
from app.models.rating import Rating
from app.models.movie import Movie
from app.models.weekly_drop import WeeklyDrop

router = APIRouter()

class LeaderboardUser(BaseModel):
    id: int
    username: str
    display_name: Optional[str]
    use_display_name: bool
    public_profile: bool
    total_votes: int
    
class LeaderboardDirector(BaseModel):
    name: str
    average_score: float
    movie_count: int

class LeaderboardDivisive(BaseModel):
    id: int
    title: str
    poster_path: Optional[str]
    drop_id: Optional[int] = None
    std_dev: float
    vote_count: int

@router.get("/users", response_model=List[LeaderboardUser])
def get_top_users(db: Session = Depends(deps.get_db)):
    users = (
        db.query(
            User.id, 
            User.username, 
            User.display_name, 
            func.coalesce(User.use_display_name, True).label("use_display_name"),
            func.coalesce(User.public_profile, False).label("public_profile"),
            func.count(Rating.id).label("total_votes")
        )
        .join(Rating, Rating.user_id == User.id)
        .filter(func.coalesce(User.show_on_leaderboard, True) == True)
        .group_by(User.id)
        .order_by(desc("total_votes"))
        .limit(20)
        .all()
    )
    return users

@router.get("/directors", response_model=List[LeaderboardDirector])
def get_top_directors(db: Session = Depends(deps.get_db)):
    directors = (
        db.query(
            Movie.director_name.label("name"),
            func.avg(Rating.overall_score).label("average_score"),
            func.count(func.distinct(Movie.id)).label("movie_count")
        )
        .join(Rating, Rating.movie_id == Movie.id)
        .filter(Movie.director_name.isnot(None))
        .filter(Movie.director_name != "")
        .group_by(Movie.director_name)
        .having(func.count(Rating.id) >= 5) # Minimum 5 ratings across all movies
        .order_by(desc("average_score"))
        .limit(20)
        .all()
    )
    # Ensure average_score is rounded
    return [{"name": d.name, "average_score": round(d.average_score, 1), "movie_count": d.movie_count} for d in directors]

@router.get("/divisive", response_model=List[LeaderboardDivisive])
def get_divisive_movies(db: Session = Depends(deps.get_db)):
    latest_drops = (
        db.query(WeeklyDrop.movie_id, func.max(WeeklyDrop.id).label("drop_id"))
        .group_by(WeeklyDrop.movie_id)
        .subquery()
    )
    movies = (
        db.query(
            Movie.id,
            Movie.title,
            Movie.poster_path,
            latest_drops.c.drop_id,
            func.stddev(Rating.overall_score).label("std_dev"),
            func.count(Rating.id).label("vote_count")
        )
        .join(Rating, Rating.movie_id == Movie.id)
        .outerjoin(latest_drops, latest_drops.c.movie_id == Movie.id)
        .group_by(Movie.id, latest_drops.c.drop_id)
        .having(func.count(Rating.id) >= 5) # Minimum 5 ratings to be considered
        .order_by(desc("std_dev"))
        .limit(20)
        .all()
    )
    return [
        {
            "id": m.id,
            "title": m.title,
            "poster_path": m.poster_path,
            "drop_id": m.drop_id,
            "std_dev": round(m.std_dev or 0, 2),
            "vote_count": m.vote_count,
        }
        for m in movies
    ]

class LeaderboardActor(BaseModel):
    name: str
    profile_path: Optional[str] = None
    average_score: float
    movie_count: int

@router.get("/actors", response_model=List[LeaderboardActor])
def get_top_actors(db: Session = Depends(deps.get_db)):
    # Unnest the cast JSONB array
    cast_elem = func.jsonb_array_elements(Movie.cast).column_valued("cast_elem")
    
    # We use a subquery to unnest first
    subquery = (
        db.query(
            Movie.id.label("movie_id"),
            cast_elem.op("->>")("name").label("name"),
            cast_elem.op("->>")("profile_path").label("profile_path")
        )
        .select_from(Movie)
        .filter(Movie.cast.isnot(None))
        .subquery()
    )
    
    actors = (
        db.query(
            subquery.c.name,
            func.max(subquery.c.profile_path).label("profile_path"),
            func.avg(Rating.overall_score).label("average_score"),
            func.count(func.distinct(Rating.movie_id)).label("movie_count")
        )
        .join(Rating, Rating.movie_id == subquery.c.movie_id)
        .group_by(subquery.c.name)
        .having(func.count(Rating.id) >= 5) # Minimum 5 ratings across all movies
        .order_by(desc("average_score"))
        .limit(20)
        .all()
    )
    return [{"name": a.name, "profile_path": a.profile_path, "average_score": round(a.average_score, 1), "movie_count": a.movie_count} for a in actors]

class CategoryLeaderboardMovie(BaseModel):
    id: int
    title: str
    poster_path: Optional[str]
    drop_id: Optional[int] = None
    score: float

class CategoryLeaderboards(BaseModel):
    story: List[CategoryLeaderboardMovie]
    performances: List[CategoryLeaderboardMovie]
    visuals: List[CategoryLeaderboardMovie]
    sound: List[CategoryLeaderboardMovie]
    rewatchability: List[CategoryLeaderboardMovie]
    enjoyment: List[CategoryLeaderboardMovie]
    emotional_impact: List[CategoryLeaderboardMovie]

@router.get("/categories", response_model=CategoryLeaderboards)
def get_category_leaderboards(db: Session = Depends(deps.get_db)):
    latest_drops = (
        db.query(WeeklyDrop.movie_id, func.max(WeeklyDrop.id).label("drop_id"))
        .group_by(WeeklyDrop.movie_id)
        .subquery()
    )
    movies = (
        db.query(
            Movie.id,
            Movie.title,
            Movie.poster_path,
            latest_drops.c.drop_id,
            func.avg(Rating.story_score).label("story"),
            func.avg(Rating.performances_score).label("performances"),
            func.avg(Rating.visuals_score).label("visuals"),
            func.avg(Rating.sound_score).label("sound"),
            func.avg(Rating.rewatchability_score).label("rewatchability"),
            func.avg(Rating.enjoyment_score).label("enjoyment"),
            func.avg(Rating.emotional_impact_score).label("emotional_impact"),
        )
        .join(Rating, Rating.movie_id == Movie.id)
        .outerjoin(latest_drops, latest_drops.c.movie_id == Movie.id)
        .group_by(Movie.id, latest_drops.c.drop_id)
        .having(func.count(Rating.id) >= 5)
        .all()
    )
    
    def get_top_5(category: str):
        valid_movies = [m for m in movies if getattr(m, category) is not None]
        sorted_movies = sorted(valid_movies, key=lambda x: getattr(x, category), reverse=True)[:5]
        return [
            {
                "id": m.id,
                "title": m.title,
                "poster_path": m.poster_path,
                "drop_id": m.drop_id,
                "score": round(getattr(m, category), 1),
            }
            for m in sorted_movies
        ]
        
    return {
        "story": get_top_5("story"),
        "performances": get_top_5("performances"),
        "visuals": get_top_5("visuals"),
        "sound": get_top_5("sound"),
        "rewatchability": get_top_5("rewatchability"),
        "enjoyment": get_top_5("enjoyment"),
        "emotional_impact": get_top_5("emotional_impact")
    }
