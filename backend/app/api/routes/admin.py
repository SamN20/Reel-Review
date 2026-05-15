from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any, Optional
from datetime import date, datetime, timezone
from statistics import median, pstdev
import httpx
from pydantic import BaseModel

from app.api import deps
from app.models.user import User
from app.models.movie import Movie
from app.models.weekly_drop import WeeklyDrop
from app.models.weekly_drop_vote import WeeklyDropBallot, WeeklyDropOption
from app.models.rating import Rating
from app.models.review_reply import ReviewReply
from app.models.review_report import ReviewReport
from app.models.movie_request import MovieRequest
from app.schemas.user import UserOut, UserUpdate
from app.schemas.admin_settings import DropSelectionSettings, LeaderboardSettings, OnboardingSettings
from app.core.config import settings
from app.services.admin_settings import (
    DEFAULT_DROP_SELECTION_SETTINGS,
    DEFAULT_LEADERBOARD_SETTINGS,
    DEFAULT_ONBOARDING_SETTINGS,
    ONBOARDING_SETTINGS_KEY,
    get_or_create_setting,
    update_setting,
)
from app.services.drop_scheduler import DropSchedulerService
from app.services.drop_selection import DROP_SELECTION_SETTINGS_KEY, DropSelectionService, normalize_drop_selection_settings
from app.services.movie_metadata import extract_director_name, extract_watch_provider_regions, extract_youtube_trailer_key
from app.services.ratings_calculator import RatingsCalculator
from app.services.nolofication import nolofication

router = APIRouter(dependencies=[Depends(deps.get_current_admin)])

TMDB_BASE_URL = "https://api.themoviedb.org/3"

def normalize_min_ratings(value: int) -> int:
    if value < 1:
        return 1
    return value

def serialize_leaderboard_settings(value: dict) -> LeaderboardSettings:
    defaults = DEFAULT_LEADERBOARD_SETTINGS
    return LeaderboardSettings(
        categories_min_ratings=normalize_min_ratings(
            value.get("categories", {}).get("min_ratings", defaults["categories"]["min_ratings"])
        ),
        actors_min_ratings=normalize_min_ratings(
            value.get("actors", {}).get("min_ratings", defaults["actors"]["min_ratings"])
        ),
        directors_min_ratings=normalize_min_ratings(
            value.get("directors", {}).get("min_ratings", defaults["directors"]["min_ratings"])
        ),
        divisive_min_ratings=normalize_min_ratings(
            value.get("divisive", {}).get("min_ratings", defaults["divisive"]["min_ratings"])
        ),
    )

def serialize_drop_selection_settings(value: dict) -> DropSelectionSettings:
    normalized = normalize_drop_selection_settings(value)
    return DropSelectionSettings(
        user_vote_total_options=normalized["total_options"],
        user_vote_smart_options=normalized["smart_options"],
        user_vote_wildcard_options=normalized["wildcard_options"],
    )

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
    flagged_count += db.query(ReviewReply).filter(ReviewReply.is_flagged == True).count()
    
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

@router.get("/settings/leaderboards", response_model=LeaderboardSettings)
def get_leaderboard_settings(db: Session = Depends(deps.get_db)):
    setting = get_or_create_setting(db, "leaderboards", DEFAULT_LEADERBOARD_SETTINGS)
    return serialize_leaderboard_settings(setting.value)

@router.put("/settings/leaderboards", response_model=LeaderboardSettings)
def update_leaderboard_settings(payload: LeaderboardSettings, db: Session = Depends(deps.get_db)):
    next_value = {
        "categories": {"min_ratings": normalize_min_ratings(payload.categories_min_ratings)},
        "actors": {"min_ratings": normalize_min_ratings(payload.actors_min_ratings)},
        "directors": {"min_ratings": normalize_min_ratings(payload.directors_min_ratings)},
        "divisive": {"min_ratings": normalize_min_ratings(payload.divisive_min_ratings)},
    }
    setting = update_setting(db, "leaderboards", next_value)
    return serialize_leaderboard_settings(setting.value)

@router.get("/settings/drop-selection", response_model=DropSelectionSettings)
def get_drop_selection_settings(db: Session = Depends(deps.get_db)):
    setting = get_or_create_setting(db, DROP_SELECTION_SETTINGS_KEY, DEFAULT_DROP_SELECTION_SETTINGS)
    return serialize_drop_selection_settings(setting.value)

@router.put("/settings/drop-selection", response_model=DropSelectionSettings)
def update_drop_selection_settings(payload: DropSelectionSettings, db: Session = Depends(deps.get_db)):
    total = max(1, payload.user_vote_total_options)
    smart = max(0, payload.user_vote_smart_options)
    wildcard = max(0, payload.user_vote_wildcard_options)
    if smart + wildcard != total:
        raise HTTPException(status_code=400, detail="Smart and wildcard option counts must add up to the total.")

    setting = update_setting(
        db,
        DROP_SELECTION_SETTINGS_KEY,
        {
            "user_vote": {
                "total_options": total,
                "smart_options": smart,
                "wildcard_options": wildcard,
            }
        },
    )
    return serialize_drop_selection_settings(setting.value)


# ── Onboarding settings ────────────────────────────────────────────────────────
# GET is readable by any authenticated user (so Vote.tsx can check always_play).
# PUT is restricted to admins via the main `router`.

public_router = APIRouter(dependencies=[Depends(deps.get_current_user)])


@public_router.get("/settings/onboarding", response_model=OnboardingSettings)
def get_onboarding_settings_public(db: Session = Depends(deps.get_db)):
    setting = get_or_create_setting(db, ONBOARDING_SETTINGS_KEY, DEFAULT_ONBOARDING_SETTINGS)
    return OnboardingSettings(always_play=bool(setting.value.get("always_play", False)))


@router.put("/settings/onboarding", response_model=OnboardingSettings)
def update_onboarding_settings(payload: OnboardingSettings, db: Session = Depends(deps.get_db)):
    setting = update_setting(db, ONBOARDING_SETTINGS_KEY, {"always_play": payload.always_play})
    return OnboardingSettings(always_play=bool(setting.value.get("always_play", False)))

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
            params={"append_to_response": "credits,keywords,watch/providers,images,videos"},
            headers=get_tmdb_headers()
        )
        if response.status_code != 200:
            raise HTTPException(status_code=404, detail="TMDB Movie not found")
        data = response.json()
        
        # Process and clean up the data for the frontend to review
        watch_providers = extract_watch_provider_regions(data.get("watch/providers", {}).get("results"))
        
        return {
            "tmdb_id": data.get("id"),
            "title": data.get("title"),
            "release_date": data.get("release_date"),
            "overview": data.get("overview"),
            "director_name": extract_director_name(data.get("credits")),
            "genres": data.get("genres", []),
            "cast": data.get("credits", {}).get("cast", [])[:10] if data.get("credits") else [],
            "keywords": data.get("keywords", {}).get("keywords", []) if data.get("keywords") else [],
            "watch_providers": watch_providers,
            "trailer_youtube_key": extract_youtube_trailer_key(data.get("videos")),
            "images": data.get("images", {"posters": [], "backdrops": []})
        }

class MovieImportSchema(BaseModel):
    tmdb_id: int
    title: str
    release_date: Optional[str] = None
    overview: Optional[str] = None
    director_name: Optional[str] = None
    poster_path: Optional[str] = None
    backdrop_path: Optional[str] = None
    trailer_youtube_key: Optional[str] = None
    genres: Optional[List[Dict[str, Any]]] = None
    cast: Optional[List[Dict[str, Any]]] = None
    keywords: Optional[List[Dict[str, Any]]] = None
    watch_providers: Optional[Dict[str, Any]] = None

class MovieRequestRejectSchema(BaseModel):
    reason: Optional[str] = None

def create_movie_from_import_payload(movie_data: MovieImportSchema, db: Session) -> Movie:
    existing = db.query(Movie).filter(Movie.tmdb_id == movie_data.tmdb_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Movie already imported")

    payload = movie_data.model_dump()
    if payload.get("release_date"):
        payload["release_date"] = date.fromisoformat(payload["release_date"])
    if payload.get("tmdb_id") is not None:
        payload["watch_providers_updated_at"] = datetime.now(timezone.utc)

    db_movie = Movie(**payload)
    db.add(db_movie)
    db.flush()
    return db_movie

@router.post("/movies")
def import_movie(movie_data: MovieImportSchema, db: Session = Depends(deps.get_db)):
    db_movie = create_movie_from_import_payload(movie_data, db)
    db.commit()
    db.refresh(db_movie)
    return db_movie

def serialize_admin_movie_request(request: MovieRequest) -> dict[str, Any]:
    return {
        "id": request.id,
        "tmdb_id": request.tmdb_id,
        "status": request.status,
        "movie_id": request.movie_id,
        "title": request.title,
        "release_date": request.release_date,
        "overview": request.overview,
        "poster_path": request.poster_path,
        "backdrop_path": request.backdrop_path,
        "genres": request.genres or [],
        "admin_reason": request.admin_reason,
        "supporter_count": len(request.supporters),
        "created_at": request.created_at,
        "updated_at": request.updated_at,
        "supporters": [
            {
                "id": supporter.id,
                "user_id": supporter.user_id,
                "username": supporter.user.username if supporter.user else "Unknown",
                "note": supporter.note,
                "created_at": supporter.created_at,
            }
            for supporter in request.supporters
        ],
    }

@router.get("/movie-requests")
def get_movie_requests(status: Optional[str] = None, db: Session = Depends(deps.get_db)):
    query = db.query(MovieRequest).order_by(MovieRequest.created_at.desc(), MovieRequest.id.desc())
    if status and status != "all":
        query = query.filter(MovieRequest.status == status)
    return [serialize_admin_movie_request(request) for request in query.all()]

@router.post("/movie-requests/{request_id}/approve")
def approve_movie_request(
    request_id: int,
    movie_data: MovieImportSchema,
    db: Session = Depends(deps.get_db),
):
    request = db.query(MovieRequest).filter(MovieRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    if request.status != "pending":
        raise HTTPException(status_code=400, detail="Request has already been reviewed")
    if request.tmdb_id != movie_data.tmdb_id:
        raise HTTPException(status_code=400, detail="Imported movie does not match request")

    existing_movie = db.query(Movie).filter(Movie.tmdb_id == movie_data.tmdb_id).first()
    if existing_movie:
        db_movie = existing_movie
    else:
        db_movie = create_movie_from_import_payload(movie_data, db)

    request.status = "approved"
    request.movie_id = db_movie.id
    request.admin_reason = None
    request.poster_path = db_movie.poster_path
    request.backdrop_path = db_movie.backdrop_path
    request.genres = db_movie.genres
    db.commit()
    db.refresh(request)
    return serialize_admin_movie_request(request)

@router.post("/movie-requests/{request_id}/reject")
def reject_movie_request(
    request_id: int,
    payload: MovieRequestRejectSchema,
    db: Session = Depends(deps.get_db),
):
    request = db.query(MovieRequest).filter(MovieRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    if request.status != "pending":
        raise HTTPException(status_code=400, detail="Request has already been reviewed")
    request.status = "rejected"
    request.admin_reason = payload.reason
    db.commit()
    db.refresh(request)
    return serialize_admin_movie_request(request)

@router.get("/movies")
def get_imported_movies(db: Session = Depends(deps.get_db)):
    # Returns all imported movies, needed for the manage tab
    movies = db.query(Movie).order_by(Movie.id.desc()).all()
    result = []
    for movie in movies:
        ratings = (
            db.query(Rating.overall_score)
            .filter(
                Rating.movie_id == movie.id,
                Rating.is_approved == True,
                Rating.is_hidden == False,
            )
            .all()
        )
        scores = [score for (score,) in ratings]
        result.append(
            {
                "id": movie.id,
                "title": movie.title,
                "tmdb_id": movie.tmdb_id,
                "release_date": movie.release_date,
                "created_at": movie.created_at,
                "in_pool": movie.in_pool,
                "poster_path": movie.poster_path,
                "genres": movie.genres or [],
                "average_score": round(sum(scores) / len(scores), 1) if scores else None,
                "total_ratings": len(scores),
            }
        )
    return result

@router.get("/movies/{movie_id}/analytics")
def get_movie_analytics(movie_id: int, db: Session = Depends(deps.get_db)):
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")

    ratings = (
        db.query(Rating)
        .filter(
            Rating.movie_id == movie_id,
            Rating.is_approved == True,
            Rating.is_hidden == False,
        )
        .order_by(Rating.created_at.desc(), Rating.id.desc())
        .all()
    )
    scores = [rating.overall_score for rating in ratings]

    categories = [
        ("story", "Story & Pacing", "story_score"),
        ("performances", "Performances", "performances_score"),
        ("visuals", "Visuals & Cinematography", "visuals_score"),
        ("sound", "Sound & Score", "sound_score"),
        ("rewatchability", "Rewatchability", "rewatchability_score"),
        ("enjoyment", "Pure Enjoyment", "enjoyment_score"),
        ("emotional_impact", "Emotional Impact", "emotional_impact_score"),
    ]

    subcategory_averages = []
    for key, label, attr in categories:
        values = [getattr(rating, attr) for rating in ratings if getattr(rating, attr) is not None]
        subcategory_averages.append(
            {
                "key": key,
                "subject": label,
                "count": len(values),
                "average_score": round(sum(values) / len(values), 1) if values else None,
            }
        )

    rating_rows = []
    for rating in ratings:
        drop = rating.weekly_drop
        rating_rows.append(
            {
                "id": rating.id,
                "user_id": rating.user_id,
                "username": rating.user.username if rating.user else "Unknown",
                "is_anonymous": rating.is_anonymous,
                "overall_score": rating.overall_score,
                "review_text": rating.review_text,
                "has_spoilers": rating.has_spoilers,
                "is_late": rating.is_late,
                "weekly_drop_id": rating.weekly_drop_id,
                "weekly_drop_start_date": drop.start_date if drop else None,
                "weekly_drop_end_date": drop.end_date if drop else None,
                "created_at": rating.created_at,
                "subcategories": {
                    "story": rating.story_score,
                    "performances": rating.performances_score,
                    "visuals": rating.visuals_score,
                    "sound": rating.sound_score,
                    "rewatchability": rating.rewatchability_score,
                    "enjoyment": rating.enjoyment_score,
                    "emotional_impact": rating.emotional_impact_score,
                },
            }
        )

    return {
        "movie": {
            "id": movie.id,
            "title": movie.title,
            "tmdb_id": movie.tmdb_id,
            "release_date": movie.release_date,
            "overview": movie.overview,
            "director_name": movie.director_name,
            "poster_path": movie.poster_path,
            "backdrop_path": movie.backdrop_path,
            "genres": movie.genres or [],
        },
        "stats": {
            "total_ratings": len(ratings),
            "average_score": round(sum(scores) / len(scores), 1) if scores else None,
            "highest_score": max(scores) if scores else None,
            "lowest_score": min(scores) if scores else None,
            "median_score": round(float(median(scores)), 1) if scores else None,
            "score_spread": round(float(pstdev(scores)), 2) if len(scores) > 1 else 0.0,
            "spoiler_review_count": sum(1 for rating in ratings if rating.has_spoilers and rating.review_text),
            "text_review_count": sum(1 for rating in ratings if rating.review_text),
        },
        "score_distribution": RatingsCalculator.get_score_distribution(scores),
        "subcategories": subcategory_averages,
        "ratings": rating_rows,
    }

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
            "mode": drop.mode,
            "resolved_at": drop.resolved_at,
            "options_count": db.query(WeeklyDropOption).filter(WeeklyDropOption.weekly_drop_id == drop.id).count(),
            "ballots_count": db.query(WeeklyDropBallot).filter(WeeklyDropBallot.weekly_drop_id == drop.id).count(),
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

@router.post("/drops/{drop_id}/generate-options")
def generate_drop_options(drop_id: int, db: Session = Depends(deps.get_db)):
    drop = db.query(WeeklyDrop).filter(WeeklyDrop.id == drop_id).first()
    if not drop:
        raise HTTPException(status_code=404, detail="Drop not found")
    options = DropSelectionService.generate_options(db, drop, force=True)
    db.commit()
    return {"message": "Options generated", "options_count": len(options)}

@router.post("/drops/rollover")
def run_drop_rollover(db: Session = Depends(deps.get_db)):
    drop = DropSchedulerService.rollover(db)
    if not drop:
        return {"message": "No scheduled drop found for the current Eastern date.", "drop_id": None}
    return {
        "message": "Rollover complete",
        "drop_id": drop.id,
        "movie_id": drop.movie_id,
        "mode": drop.mode,
        "is_active": drop.is_active,
    }

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
    return [serialize_admin_user(user) for user in users]

def serialize_admin_user(user: User) -> dict[str, Any]:
    return {
        "id": user.id,
        "keyn_id": user.keyn_id,
        "username": user.username,
        "email": user.email,
        "display_name": user.display_name,
        "use_display_name": True if user.use_display_name is None else user.use_display_name,
        "show_on_leaderboard": True if user.show_on_leaderboard is None else user.show_on_leaderboard,
        "public_profile": False if user.public_profile is None else user.public_profile,
        "is_admin": False if user.is_admin is None else user.is_admin,
        "is_active": True if user.is_active is None else user.is_active,
        "created_at": user.created_at or datetime.now(timezone.utc),
        "updated_at": user.updated_at,
    }

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
    """Get all flagged ratings and replies with report reason counts."""
    flagged_ratings = db.query(Rating).filter(Rating.is_flagged == True).order_by(Rating.created_at.desc()).all()
    flagged_replies = db.query(ReviewReply).filter(ReviewReply.is_flagged == True).order_by(ReviewReply.created_at.desc()).all()
    result = []
    for rating in flagged_ratings:
        reports = db.query(ReviewReport).filter(ReviewReport.rating_id == rating.id).all()
        reason_counts = {
            "harmful_or_spam": sum(1 for report in reports if report.reason == "harmful_or_spam"),
            "spoiler": sum(1 for report in reports if report.reason == "spoiler"),
        }
        result.append({
            "id": f"review:{rating.id}",
            "target_type": "review",
            "target_id": rating.id,
            "user_id": rating.user_id,
            "username": rating.user.username if rating.user else "Unknown",
            "movie_title": rating.movie.title if rating.movie else "Unknown",
            "review_text": rating.review_text,
            "is_approved": rating.is_approved,
            "created_at": rating.created_at,
            "reason_counts": reason_counts,
        })
    for reply in flagged_replies:
        reports = db.query(ReviewReport).filter(ReviewReport.reply_id == reply.id).all()
        reason_counts = {
            "harmful_or_spam": sum(1 for report in reports if report.reason == "harmful_or_spam"),
            "spoiler": sum(1 for report in reports if report.reason == "spoiler"),
        }
        result.append({
            "id": f"reply:{reply.id}",
            "target_type": "reply",
            "target_id": reply.id,
            "user_id": reply.user_id,
            "username": reply.user.username if reply.user else "Unknown",
            "movie_title": reply.rating.movie.title if reply.rating and reply.rating.movie else "Unknown",
            "review_text": reply.body,
            "is_approved": reply.is_approved,
            "created_at": reply.created_at,
            "reason_counts": reason_counts,
        })
    result.sort(key=lambda item: item["created_at"], reverse=True)
    return result

@router.post("/moderation/reviews/{rating_id}/approve")
def approve_flagged_review(rating_id: int, db: Session = Depends(deps.get_db)):
    rating = db.query(Rating).filter(Rating.id == rating_id).first()
    if not rating:
        raise HTTPException(status_code=404, detail="Rating not found")
    db.query(ReviewReport).filter(ReviewReport.rating_id == rating_id).delete()
    rating.is_flagged = False
    rating.is_hidden = False
    rating.is_approved = True
    db.commit()
    return {"message": "Review approved"}

@router.post("/moderation/replies/{reply_id}/approve")
def approve_flagged_reply(reply_id: int, db: Session = Depends(deps.get_db)):
    reply = db.query(ReviewReply).filter(ReviewReply.id == reply_id).first()
    if not reply:
        raise HTTPException(status_code=404, detail="Reply not found")
    db.query(ReviewReport).filter(ReviewReport.reply_id == reply_id).delete()
    reply.is_flagged = False
    reply.is_hidden = False
    reply.is_approved = True
    db.commit()
    return {"message": "Reply approved"}

@router.post("/moderation/reviews/{rating_id}/mark-spoiler")
def mark_review_as_spoiler(rating_id: int, db: Session = Depends(deps.get_db)):
    rating = db.query(Rating).filter(Rating.id == rating_id).first()
    if not rating:
        raise HTTPException(status_code=404, detail="Rating not found")
    rating.has_spoilers = True
    rating.is_flagged = False
    rating.is_hidden = False
    rating.is_approved = True
    db.query(ReviewReport).filter(ReviewReport.rating_id == rating_id).delete()
    db.commit()
    return {"message": "Review moved to spoiler section"}

@router.post("/moderation/replies/{reply_id}/mark-spoiler")
def mark_reply_as_spoiler(reply_id: int, db: Session = Depends(deps.get_db)):
    reply = db.query(ReviewReply).filter(ReviewReply.id == reply_id).first()
    if not reply:
        raise HTTPException(status_code=404, detail="Reply not found")
    reply.has_spoilers = True
    reply.is_flagged = False
    reply.is_hidden = False
    reply.is_approved = True
    if reply.rating:
        reply.rating.has_spoilers = True
        reply.rating.is_hidden = False
        reply.rating.is_approved = True
    db.query(ReviewReport).filter(ReviewReport.reply_id == reply_id).delete()
    db.commit()
    return {"message": "Reply thread moved to spoiler section"}

@router.delete("/moderation/reviews/{rating_id}")
def delete_flagged_review(rating_id: int, db: Session = Depends(deps.get_db)):
    rating = db.query(Rating).filter(Rating.id == rating_id).first()
    if not rating:
        raise HTTPException(status_code=404, detail="Rating not found")
    rating.review_text = "[REMOVED BY MODERATOR]"
    rating.is_flagged = False
    rating.is_approved = False
    rating.is_hidden = False
    db.query(ReviewReport).filter(ReviewReport.rating_id == rating_id).delete()
    db.commit()
    return {"message": "Review removed"}

@router.delete("/moderation/replies/{reply_id}")
def delete_flagged_reply(reply_id: int, db: Session = Depends(deps.get_db)):
    reply = db.query(ReviewReply).filter(ReviewReply.id == reply_id).first()
    if not reply:
        raise HTTPException(status_code=404, detail="Reply not found")
    reply.body = "[REMOVED BY MODERATOR]"
    reply.is_flagged = False
    reply.is_approved = False
    reply.is_hidden = False
    db.query(ReviewReport).filter(ReviewReport.reply_id == reply_id).delete()
    db.commit()
    return {"message": "Reply removed"}
