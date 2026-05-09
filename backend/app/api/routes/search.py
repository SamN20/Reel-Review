from difflib import get_close_matches
from typing import Any, Optional

import httpx
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api import deps
from app.core.config import settings
from app.models.movie import Movie
from app.models.movie_request import MovieRequest, MovieRequestSupporter
from app.models.user import User
from app.models.weekly_drop import WeeklyDrop

router = APIRouter()

TMDB_BASE_URL = "https://api.themoviedb.org/3"


def get_tmdb_headers() -> dict[str, str]:
    return {
        "accept": "application/json",
        "Authorization": f"Bearer {settings.TMDB_API_KEY}",
    }


SITE_DESTINATIONS = [
    {
        "title": "Current Week",
        "description": "See this week's movie and cast your rating.",
        "path": "/",
    },
    {
        "title": "The Film Shelf",
        "description": "Browse the Reel Review archive.",
        "path": "/film-shelf",
    },
    {
        "title": "Leaderboards",
        "description": "Explore community ranking tables.",
        "path": "/leaderboards",
    },
    {
        "title": "Discussions",
        "description": "Read spoiler-free and spoiler-zone community takes.",
        "path": "/discussions",
    },
    {
        "title": "Movie Requests",
        "description": "Request movies for the community to rate.",
        "path": "/requests",
    },
]


def normalize_search_text(value: str) -> str:
    value = value.lower().strip()
    for prefix in ("the ", "a ", "an "):
        if value.startswith(prefix):
            return value[len(prefix):]
    return value


def get_latest_drop_for_movie(db: Session, movie_id: int) -> WeeklyDrop | None:
    return (
        db.query(WeeklyDrop)
        .filter(WeeklyDrop.movie_id == movie_id)
        .order_by(WeeklyDrop.start_date.desc(), WeeklyDrop.id.desc())
        .first()
    )


def serialize_local_movie(db: Session, movie: Movie) -> dict[str, Any]:
    drop = get_latest_drop_for_movie(db, movie.id)
    return {
        "type": "movie",
        "id": movie.id,
        "drop_id": drop.id if drop else None,
        "tmdb_id": movie.tmdb_id,
        "title": movie.title,
        "release_date": movie.release_date,
        "overview": movie.overview,
        "poster_path": movie.poster_path,
        "backdrop_path": movie.backdrop_path,
        "path": f"/results/{drop.id}" if drop else None,
    }


def build_search_suggestions(query: str, movies: list[Movie]) -> list[str]:
    choices: dict[str, str] = {}
    for destination in SITE_DESTINATIONS:
        choices[destination["title"]] = destination["title"]
        choices[normalize_search_text(destination["title"])] = destination["title"]
    for movie in movies:
        choices[movie.title] = movie.title
        choices[normalize_search_text(movie.title)] = movie.title

    matches = get_close_matches(
        normalize_search_text(query),
        list(choices.keys()),
        n=4,
        cutoff=0.55,
    )
    suggestions: list[str] = []
    for match in matches:
        suggestion = choices[match]
        if suggestion.lower() != query.lower() and suggestion not in suggestions:
            suggestions.append(suggestion)
    return suggestions[:3]


def serialize_tmdb_result(
    db: Session,
    movie: dict[str, Any],
    imported_by_tmdb_id: dict[int, Movie],
    requests_by_tmdb_id: dict[int, MovieRequest],
    current_user: Optional[User],
) -> dict[str, Any]:
    tmdb_id = movie.get("id")
    imported = imported_by_tmdb_id.get(tmdb_id)
    imported_drop = get_latest_drop_for_movie(db, imported.id) if imported else None
    request = requests_by_tmdb_id.get(tmdb_id)
    user_has_requested = False
    if request and current_user:
        user_has_requested = any(s.user_id == current_user.id for s in request.supporters)

    return {
        "type": "tmdb_movie",
        "tmdb_id": tmdb_id,
        "title": movie.get("title"),
        "release_date": movie.get("release_date"),
        "overview": movie.get("overview"),
        "poster_path": movie.get("poster_path"),
        "backdrop_path": movie.get("backdrop_path"),
        "imported_movie_id": imported.id if imported else None,
        "imported_drop_id": imported_drop.id if imported_drop else None,
        "imported_path": f"/results/{imported_drop.id}" if imported_drop else None,
        "request_id": request.id if request else None,
        "request_status": request.status if request else None,
        "user_has_requested": user_has_requested,
        "requestable": imported is None,
    }


@router.get("")
async def site_search(
    query: str = Query(..., min_length=1),
    include_tmdb: bool = Query(default=True),
    db: Session = Depends(deps.get_db),
    current_user: Optional[User] = Depends(deps.get_optional_user),
):
    normalized_query = query.strip()
    if not normalized_query:
        return {"query": query, "site": [], "movies": [], "tmdb": [], "suggestions": []}

    site_results = [
        destination
        for destination in SITE_DESTINATIONS
        if normalized_query.lower() in destination["title"].lower()
        or normalized_query.lower() in destination["description"].lower()
    ][:5]

    local_movies = (
        db.query(Movie)
        .filter(Movie.title.ilike(f"%{normalized_query}%"))
        .order_by(Movie.title.asc())
        .limit(8)
        .all()
    )
    local_results = [serialize_local_movie(db, movie) for movie in local_movies]
    suggestion_movies = db.query(Movie).order_by(Movie.title.asc()).limit(250).all()
    suggestions = build_search_suggestions(normalized_query, suggestion_movies)

    tmdb_results: list[dict[str, Any]] = []
    if include_tmdb and len(local_results) < 3:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{TMDB_BASE_URL}/search/movie",
                params={
                    "query": normalized_query,
                    "include_adult": "false",
                    "language": "en-US",
                    "page": 1,
                },
                headers=get_tmdb_headers(),
            )
            response.raise_for_status()
            tmdb_movies = response.json().get("results", [])[:8]

        tmdb_ids = [movie.get("id") for movie in tmdb_movies if movie.get("id")]
        imported_movies = (
            db.query(Movie).filter(Movie.tmdb_id.in_(tmdb_ids)).all() if tmdb_ids else []
        )
        requests = (
            db.query(MovieRequest).filter(MovieRequest.tmdb_id.in_(tmdb_ids)).all()
            if tmdb_ids
            else []
        )
        imported_by_tmdb_id = {movie.tmdb_id: movie for movie in imported_movies}
        requests_by_tmdb_id = {request.tmdb_id: request for request in requests}
        tmdb_results = [
            serialize_tmdb_result(
                db,
                movie,
                imported_by_tmdb_id,
                requests_by_tmdb_id,
                current_user,
            )
            for movie in tmdb_movies
        ]

    return {
        "query": normalized_query,
        "site": site_results,
        "movies": local_results,
        "tmdb": tmdb_results,
        "suggestions": suggestions,
    }
