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
from app.schemas.user import UserOut, UserUpdate
from app.core.config import settings
from app.services.ratings_calculator import RatingsCalculator
from app.services.nolofication import nolofication

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

@router.get("/dashboard-stats")
def get_dashboard_stats(db: Session = Depends(deps.get_db)):
    active_drop = db.query(WeeklyDrop).filter(WeeklyDrop.is_active == True).first()
    
    total_active_users = db.query(User).filter(User.is_active == True).count()
    
    active_drop_data = None
    if active_drop:
        votes_cast = db.query(Rating).filter(Rating.weekly_drop_id == active_drop.id).count()
        active_drop_data = {
            "id": active_drop.id,
            "movie_title": active_drop.movie.title if active_drop.movie else None,
            "total_active_users": total_active_users,
            "votes_cast": votes_cast,
            "start_date": active_drop.start_date,
            "end_date": active_drop.end_date
        }
    
    engagement_data = RatingsCalculator.get_engagement_history(db, total_active_users)
        
    sentiment_payload = RatingsCalculator.get_sentiment_overview(
        db,
        active_drop_id=active_drop.id if active_drop else None,
    )
        
    # Subcategory Insights
    insights = RatingsCalculator.get_subcategory_insights(db)
    
    # Divisiveness
    divisiveness = RatingsCalculator.calculate_divisiveness(db)
    
    # Moderation count
    flagged_count = db.query(Rating).filter(Rating.is_flagged == True).count()
    
    # Retention / Streaks
    top_raters_query = db.query(User.username, func.count(Rating.id).label('rating_count')).join(Rating).group_by(User.id).order_by(func.count(Rating.id).desc()).limit(5).all()
    top_raters = [{"username": u, "count": r} for u, r in top_raters_query]
    
    return {
        "active_drop": active_drop_data,
        "engagement": engagement_data,
        "sentiment": sentiment_payload,
        "insights": insights,
        "divisiveness": divisiveness,
        "moderation_count": flagged_count,
        "top_raters": top_raters
    }

@router.post("/reminders/weekend")
async def send_weekend_reminder(db: Session = Depends(deps.get_db)):
    active_drop = db.query(WeeklyDrop).filter(WeeklyDrop.is_active == True).first()
    if not active_drop:
        raise HTTPException(status_code=400, detail="No active drop to send reminder for.")
        
    # Find active users who haven't voted in this drop
    voted_user_ids = db.query(Rating.user_id).filter(Rating.weekly_drop_id == active_drop.id).all()
    voted_user_ids = [u[0] for u in voted_user_ids]
    
    unvoted_users = db.query(User).filter(User.is_active == True, User.id.notin_(voted_user_ids)).all()
    
    if not unvoted_users:
        return {"message": "All active users have already voted!"}
        
    # extract KeyN IDs
    keyn_ids = [u.keyn_id for u in unvoted_users if u.keyn_id]
    
    movie_title = active_drop.movie.title if active_drop.movie else "this week's movie"
    
    # use bulk notification
    result = await nolofication.send_bulk_notification(
        user_ids=keyn_ids,
        title="Weekend Reminder",
        message=f"Don't forget to vote for {movie_title} before the Sunday deadline!",
        notification_type="warning"
    )
    
    if result:
        if not result.get("success", True):
            raise HTTPException(status_code=500, detail=f"Nolofication Error: {result.get('error')}")
        if result.get("failed", 0) > 0:
            if result.get("successful", 0) == 0:
                raise HTTPException(status_code=500, detail=f"Failed to send to all {result.get('failed')} users. Check Nolofication integration.")
            return {"message": f"Reminders sent to {result.get('successful')} users, but {result.get('failed')} failed."}
            
    return {"message": f"Reminders sent to {len(keyn_ids)} users."}

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

@router.get("/users", response_model=List[UserOut])
def get_users(db: Session = Depends(deps.get_db)):
    """Get all registered users for administration."""
    users = db.query(User).order_by(User.id.desc()).all()
    return users

@router.patch("/users/{user_id}", response_model=UserOut)
def update_user_status(user_id: int, user_update: UserUpdate, current_admin: User = Depends(deps.get_current_admin), db: Session = Depends(deps.get_db)):
    """Update a user's is_active or is_admin status."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.keyn_id == "1" and (user_update.is_admin is False or user_update.is_active is False):
        raise HTTPException(status_code=400, detail="Cannot modify root admin account.")
        
    if user_id == current_admin.id and user_update.is_active is False:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own admin account.")
    if user_id == current_admin.id and user_update.is_admin is False:
        raise HTTPException(status_code=400, detail="Cannot revoke your own admin access.")

    if user_update.is_active is not None:
        user.is_active = user_update.is_active
    if user_update.is_admin is not None:
        user.is_admin = user_update.is_admin
        
    db.commit()
    db.refresh(user)
    return user

@router.get("/moderation/flagged")
def get_flagged_content(db: Session = Depends(deps.get_db)):
    """Get all flagged ratings."""
    flagged = db.query(Rating).filter(Rating.is_flagged == True).order_by(Rating.created_at.desc()).all()
    result = []
    for rating in flagged:
        result.append({
            "id": rating.id,
            "user_id": rating.user_id,
            "username": rating.user.username if rating.user else "Unknown",
            "movie_title": rating.movie.title if rating.movie else "Unknown",
            "review_text": rating.review_text,
            "is_approved": rating.is_approved,
            "created_at": rating.created_at
        })
    return result

@router.post("/moderation/{rating_id}/approve")
def approve_flagged_content(rating_id: int, db: Session = Depends(deps.get_db)):
    """Approve a flagged rating."""
    rating = db.query(Rating).filter(Rating.id == rating_id).first()
    if not rating:
        raise HTTPException(status_code=404, detail="Rating not found")
    rating.is_flagged = False
    rating.is_approved = True
    db.commit()
    return {"message": "Content approved"}

@router.delete("/moderation/{rating_id}")
def delete_flagged_content(rating_id: int, db: Session = Depends(deps.get_db)):
    """Delete a flagged rating (clear the review text, or delete rating entirely if desired, here we just clear the text to keep the score)."""
    rating = db.query(Rating).filter(Rating.id == rating_id).first()
    if not rating:
        raise HTTPException(status_code=404, detail="Rating not found")
    # For now we'll just censor the text
    rating.review_text = "[REMOVED BY MODERATOR]"
    rating.is_flagged = False
    rating.is_approved = False
    db.commit()
    return {"message": "Content removed"}
