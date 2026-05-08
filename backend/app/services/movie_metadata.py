from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
from sqlalchemy.orm import Session

from app.core.config import settings


logger = logging.getLogger(__name__)

TMDB_BASE_URL = "https://api.themoviedb.org/3"
WATCH_PROVIDER_REFRESH_INTERVAL = timedelta(days=30)


def extract_director_name(credits: dict[str, Any] | None = None, cast: list[dict[str, Any]] | None = None) -> str | None:
    crew = credits.get("crew", []) if credits else cast or []
    for member in crew:
        if member.get("job") == "Director":
            return member.get("name")
    return None


def get_tmdb_headers() -> dict[str, str]:
    return {
        "accept": "application/json",
        "Authorization": f"Bearer {settings.TMDB_API_KEY}",
    }


def extract_watch_provider_regions(provider_results: dict[str, Any] | None) -> dict[str, Any]:
    if not provider_results:
        return {}

    watch_providers: dict[str, Any] = {}
    for country_code in ("CA", "US"):
        if country_code in provider_results:
            watch_providers[country_code] = provider_results[country_code]
    return watch_providers


def extract_youtube_trailer_key(videos: dict[str, Any] | None) -> str | None:
    """Pick the best official YouTube trailer key from a TMDB videos payload."""
    video_results = videos.get("results", []) if videos else []
    youtube_videos = [
        video
        for video in video_results
        if video.get("site") == "YouTube" and video.get("key")
    ]
    if not youtube_videos:
        return None

    def trailer_rank(video: dict[str, Any]) -> tuple[int, int, str]:
        video_type = video.get("type")
        name = (video.get("name") or "").lower()
        official = 1 if video.get("official") else 0
        type_score = 3 if video_type == "Trailer" else 2 if video_type == "Teaser" else 1
        name_score = 1 if "official" in name or "trailer" in name else 0
        return (type_score, official + name_score, video.get("published_at") or "")

    best_video = max(youtube_videos, key=trailer_rank)
    return best_video.get("key")


def fetch_tmdb_watch_providers(tmdb_id: int) -> dict[str, Any]:
    with httpx.Client(timeout=20.0) as client:
        response = client.get(
            f"{TMDB_BASE_URL}/movie/{tmdb_id}/watch/providers",
            headers=get_tmdb_headers(),
        )
        response.raise_for_status()
    provider_results = response.json().get("results", {})
    return extract_watch_provider_regions(provider_results)


def _as_utc_timestamp(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def is_watch_provider_refresh_due(movie: Any, now: datetime | None = None) -> bool:
    if not movie or not getattr(movie, "tmdb_id", None):
        return False

    refreshed_at = _as_utc_timestamp(getattr(movie, "watch_providers_updated_at", None))
    if refreshed_at is None:
        return True

    current_time = _as_utc_timestamp(now) or datetime.now(timezone.utc)
    return current_time - refreshed_at >= WATCH_PROVIDER_REFRESH_INTERVAL


def refresh_watch_providers_if_needed(db: Session, movie: Any, now: datetime | None = None) -> Any:
    if not is_watch_provider_refresh_due(movie, now=now):
        return movie

    refreshed_at = _as_utc_timestamp(now) or datetime.now(timezone.utc)
    try:
        movie.watch_providers = fetch_tmdb_watch_providers(movie.tmdb_id)
        movie.watch_providers_updated_at = refreshed_at
        db.add(movie)
        db.commit()
        db.refresh(movie)
    except httpx.HTTPError as exc:
        logger.warning("Unable to refresh watch providers for movie %s: %s", getattr(movie, "id", None), exc)

    return movie


def normalize_watch_providers(raw_watch_providers: dict[str, Any] | None) -> list[dict[str, Any]]:
    if not raw_watch_providers:
        return []

    chosen_region = "CA" if raw_watch_providers.get("CA") else "US" if raw_watch_providers.get("US") else None
    if not chosen_region:
        return []

    ordered_categories = ("flatrate", "free", "ads", "rent", "buy")
    region_payload = raw_watch_providers.get(chosen_region, {})
    region_link = region_payload.get("link")
    providers: list[dict[str, Any]] = []
    seen_ids: set[int] = set()

    for category in ordered_categories:
        for provider in region_payload.get(category, []) or []:
            provider_id = provider.get("provider_id")
            if provider_id in seen_ids or provider_id is None:
                continue
            seen_ids.add(provider_id)
            providers.append(
                {
                    "provider_id": provider_id,
                    "provider_name": provider.get("provider_name", "Unknown Provider"),
                    "logo_path": provider.get("logo_path"),
                    "category": category,
                    "region": chosen_region,
                    "link_url": region_link,
                }
            )

    return providers


def serialize_movie(movie: Any) -> dict[str, Any]:
    return {
        "id": movie.id,
        "title": movie.title,
        "overview": movie.overview,
        "poster_path": movie.poster_path,
        "backdrop_path": movie.backdrop_path,
        "trailer_youtube_key": getattr(movie, "trailer_youtube_key", None),
        "release_date": movie.release_date,
        "director_name": getattr(movie, "director_name", None),
        "genres": movie.genres or [],
        "watch_providers": normalize_watch_providers(movie.watch_providers),
    }


def serialize_movie_for_response(db: Session, movie: Any) -> dict[str, Any]:
    refresh_watch_providers_if_needed(db, movie)
    return serialize_movie(movie)
