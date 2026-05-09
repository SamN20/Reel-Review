from typing import Any, Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api import deps
from app.core.config import settings
from app.models.movie import Movie
from app.models.movie_request import MovieRequest, MovieRequestSupporter
from app.models.user import User

router = APIRouter()

TMDB_BASE_URL = "https://api.themoviedb.org/3"
PENDING = "pending"


def get_tmdb_headers() -> dict[str, str]:
    return {
        "accept": "application/json",
        "Authorization": f"Bearer {settings.TMDB_API_KEY}",
    }


class MovieRequestCreate(BaseModel):
    tmdb_id: int
    title: Optional[str] = None
    release_date: Optional[str] = None
    overview: Optional[str] = None
    poster_path: Optional[str] = None
    backdrop_path: Optional[str] = None
    genres: Optional[list[dict[str, Any]]] = None
    note: Optional[str] = None


class MovieRequestUpdate(BaseModel):
    note: Optional[str] = None


def serialize_request(request: MovieRequest, current_user: User) -> dict[str, Any]:
    supporter = next((item for item in request.supporters if item.user_id == current_user.id), None)
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
        "user_note": supporter.note if supporter else None,
        "created_at": request.created_at,
        "updated_at": request.updated_at,
        "can_edit": request.status == PENDING and supporter is not None,
        "can_delete": request.status == PENDING and supporter is not None,
    }


async def fetch_tmdb_movie_preview(tmdb_id: int) -> dict[str, Any]:
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{TMDB_BASE_URL}/movie/{tmdb_id}",
            params={"language": "en-US"},
            headers=get_tmdb_headers(),
        )
        if response.status_code != 200:
            raise HTTPException(status_code=404, detail="TMDB movie not found")
        return response.json()


@router.get("")
def get_movie_requests(
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    requests = (
        db.query(MovieRequest)
        .join(MovieRequestSupporter)
        .filter(MovieRequestSupporter.user_id == current_user.id)
        .order_by(MovieRequest.created_at.desc(), MovieRequest.id.desc())
        .all()
    )
    return [serialize_request(request, current_user) for request in requests]


@router.post("")
async def create_movie_request(
    payload: MovieRequestCreate,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    existing_movie = db.query(Movie).filter(Movie.tmdb_id == payload.tmdb_id).first()
    if existing_movie:
        raise HTTPException(status_code=400, detail="Movie is already in Reel Review")

    request = db.query(MovieRequest).filter(MovieRequest.tmdb_id == payload.tmdb_id).first()
    if not request:
        if not payload.title:
            tmdb_movie = await fetch_tmdb_movie_preview(payload.tmdb_id)
            title = tmdb_movie.get("title")
            release_date = tmdb_movie.get("release_date")
            overview = tmdb_movie.get("overview")
            poster_path = tmdb_movie.get("poster_path")
            backdrop_path = tmdb_movie.get("backdrop_path")
            genres = tmdb_movie.get("genres")
        else:
            title = payload.title
            release_date = payload.release_date
            overview = payload.overview
            poster_path = payload.poster_path
            backdrop_path = payload.backdrop_path
            genres = payload.genres

        request = MovieRequest(
            tmdb_id=payload.tmdb_id,
            title=title or "Untitled Movie",
            release_date=release_date,
            overview=overview,
            poster_path=poster_path,
            backdrop_path=backdrop_path,
            genres=genres or [],
            status=PENDING,
        )
        db.add(request)
        db.flush()

    existing_supporter = (
        db.query(MovieRequestSupporter)
        .filter(
            MovieRequestSupporter.request_id == request.id,
            MovieRequestSupporter.user_id == current_user.id,
        )
        .first()
    )
    if existing_supporter:
        raise HTTPException(status_code=400, detail="You already requested this movie")
    if request.status != PENDING:
        raise HTTPException(status_code=400, detail="This request has already been reviewed")

    db.add(
        MovieRequestSupporter(
            request_id=request.id,
            user_id=current_user.id,
            note=payload.note,
        )
    )
    db.commit()
    db.refresh(request)
    return serialize_request(request, current_user)


@router.patch("/{request_id}")
def update_movie_request(
    request_id: int,
    payload: MovieRequestUpdate,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    request = db.query(MovieRequest).filter(MovieRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    if request.status != PENDING:
        raise HTTPException(status_code=400, detail="Reviewed requests cannot be edited")

    supporter = (
        db.query(MovieRequestSupporter)
        .filter(
            MovieRequestSupporter.request_id == request.id,
            MovieRequestSupporter.user_id == current_user.id,
        )
        .first()
    )
    if not supporter:
        raise HTTPException(status_code=404, detail="Request not found")

    supporter.note = payload.note
    db.commit()
    db.refresh(request)
    return serialize_request(request, current_user)


@router.delete("/{request_id}")
def delete_movie_request(
    request_id: int,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    request = db.query(MovieRequest).filter(MovieRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    if request.status != PENDING:
        raise HTTPException(status_code=400, detail="Reviewed requests cannot be deleted")

    supporter = (
        db.query(MovieRequestSupporter)
        .filter(
            MovieRequestSupporter.request_id == request.id,
            MovieRequestSupporter.user_id == current_user.id,
        )
        .first()
    )
    if not supporter:
        raise HTTPException(status_code=404, detail="Request not found")

    db.delete(supporter)
    db.flush()
    remaining_supporters = (
        db.query(MovieRequestSupporter)
        .filter(MovieRequestSupporter.request_id == request.id)
        .count()
    )
    if remaining_supporters == 0:
        db.delete(request)
    db.commit()
    return {"message": "Request deleted"}
