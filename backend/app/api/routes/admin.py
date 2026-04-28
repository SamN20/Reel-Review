from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any, Optional
import httpx
from pydantic import BaseModel

from app.api import deps
from app.models.user import User
from app.models.movie import Movie
from app.models.weekly_drop import WeeklyDrop
from app.models.rating import Rating
from app.core.config import settings

router = APIRouter(dependencies=[Depends(deps.get_current_admin)])

TMDB_BASE_URL = "https://api.themoviedb.org/3"

def get_tmdb_headers():
    return {
        "accept": "application/json",
        "Authorization": f"Bearer {settings.TMDB_API_KEY}"
    }

@router.get("/stats")
def get_admin_stats(db: Session = Depends(deps.get_db)):
    total_users = db.query(User).count()
    total_ratings = db.query(Rating).count()
    total_movies = db.query(Movie).count()
    total_drops = db.query(WeeklyDrop).count()
    return {
        "total_users": total_users,
        "total_ratings": total_ratings,
        "total_movies": total_movies,
        "total_drops": total_drops
    }

@router.get("/tmdb/search")
async def search_tmdb(query: str):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{TMDB_BASE_URL}/search/movie",
            params={"query": query, "include_adult": "false", "language": "en-US", "page": 1},
            headers=get_tmdb_headers()
        )
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="TMDB Search failed")
        return response.json()

@router.get("/tmdb/movie/{tmdb_id}")
async def get_tmdb_movie_details(tmdb_id: int):
    # Fetch movie details with append_to_response for credits, keywords, watch/providers, images
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{TMDB_BASE_URL}/movie/{tmdb_id}",
            params={"append_to_response": "credits,keywords,watch/providers,images"},
            headers=get_tmdb_headers()
        )
        if response.status_code != 200:
            raise HTTPException(status_code=404, detail="TMDB Movie not found")
        data = response.json()
        
        # Process and clean up the data for the frontend to review
        watch_providers = {}
        if "watch/providers" in data and "results" in data["watch/providers"]:
            results = data["watch/providers"]["results"]
            if "CA" in results:
                watch_providers["CA"] = results["CA"]
            if "US" in results:
                watch_providers["US"] = results["US"]
        
        return {
            "tmdb_id": data.get("id"),
            "title": data.get("title"),
            "release_date": data.get("release_date"),
            "overview": data.get("overview"),
            "genres": data.get("genres", []),
            "cast": data.get("credits", {}).get("cast", [])[:10] if data.get("credits") else [],
            "keywords": data.get("keywords", {}).get("keywords", []) if data.get("keywords") else [],
            "watch_providers": watch_providers,
            "images": data.get("images", {"posters": [], "backdrops": []})
        }

class MovieImportSchema(BaseModel):
    tmdb_id: int
    title: str
    release_date: Optional[str] = None
    overview: Optional[str] = None
    poster_path: Optional[str] = None
    backdrop_path: Optional[str] = None
    genres: Optional[List[Dict[str, Any]]] = None
    cast: Optional[List[Dict[str, Any]]] = None
    keywords: Optional[List[Dict[str, Any]]] = None
    watch_providers: Optional[Dict[str, Any]] = None

@router.post("/movies")
def import_movie(movie_data: MovieImportSchema, db: Session = Depends(deps.get_db)):
    existing = db.query(Movie).filter(Movie.tmdb_id == movie_data.tmdb_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Movie already imported")
        
    db_movie = Movie(**movie_data.model_dump())
    db.add(db_movie)
    db.commit()
    db.refresh(db_movie)
    return db_movie

@router.get("/movies")
def get_imported_movies(db: Session = Depends(deps.get_db)):
    # Returns all imported movies, needed for the manage tab
    movies = db.query(Movie).order_by(Movie.id.desc()).all()
    return [{"id": m.id, "title": m.title, "tmdb_id": m.tmdb_id, "release_date": m.release_date, "in_pool": m.in_pool, "poster_path": m.poster_path} for m in movies]

class PoolToggleSchema(BaseModel):
    in_pool: bool

@router.put("/movies/{movie_id}/pool")
def toggle_movie_pool(movie_id: int, pool_data: PoolToggleSchema, db: Session = Depends(deps.get_db)):
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    movie.in_pool = pool_data.in_pool
    db.commit()
    return {"message": "Pool status updated", "in_pool": movie.in_pool}

@router.delete("/movies/{movie_id}")
def delete_movie(movie_id: int, db: Session = Depends(deps.get_db)):
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    # Delete related ratings
    db.query(Rating).filter(Rating.movie_id == movie_id).delete()
    # Delete related drops
    db.query(WeeklyDrop).filter(WeeklyDrop.movie_id == movie_id).delete()
    
    db.delete(movie)
    db.commit()
    return {"message": "Movie deleted successfully"}

from datetime import date

class DropCreateSchema(BaseModel):
    movie_id: Optional[int] = None
    start_date: date
    end_date: date
    mode: str = "admin_pick"
    is_active: bool = False

@router.get("/drops")
def get_drops(db: Session = Depends(deps.get_db)):
    drops = db.query(WeeklyDrop).order_by(WeeklyDrop.start_date.desc()).all()
    result = []
    for drop in drops:
        result.append({
            "id": drop.id,
            "movie_id": drop.movie_id,
            "movie_title": drop.movie.title if drop.movie else None,
            "poster_path": drop.movie.poster_path if drop.movie else None,
            "start_date": drop.start_date,
            "end_date": drop.end_date,
            "is_active": drop.is_active,
            "mode": drop.mode
        })
    return result

@router.post("/drops")
def create_drop(drop_data: DropCreateSchema, db: Session = Depends(deps.get_db)):
    if drop_data.is_active:
        db.query(WeeklyDrop).update({WeeklyDrop.is_active: False})
        
    new_drop = WeeklyDrop(**drop_data.model_dump())
    db.add(new_drop)
    db.commit()
    db.refresh(new_drop)
    return new_drop

@router.put("/drops/{drop_id}/active")
def activate_drop(drop_id: int, db: Session = Depends(deps.get_db)):
    drop = db.query(WeeklyDrop).filter(WeeklyDrop.id == drop_id).first()
    if not drop:
        raise HTTPException(status_code=404, detail="Drop not found")
        
    db.query(WeeklyDrop).update({WeeklyDrop.is_active: False})
    drop.is_active = True
    db.commit()
    return {"message": "Drop activated"}

@router.delete("/drops/{drop_id}")
def delete_drop(drop_id: int, db: Session = Depends(deps.get_db)):
    drop = db.query(WeeklyDrop).filter(WeeklyDrop.id == drop_id).first()
    if not drop:
        raise HTTPException(status_code=404, detail="Drop not found")
        
    db.delete(drop)
    db.commit()
    return {"message": "Drop deleted"}
