from __future__ import annotations

from dataclasses import dataclass
from html import escape
from typing import Any

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.rating import Rating
from app.models.user import User
from app.models.weekly_drop import WeeklyDrop
from app.services.drop_scheduler import DropSchedulerService
from app.services.movie_metadata import serialize_movie
from app.services.profile_visibility import apply_public_profile_rating_visibility
from app.services.results_service import ResultsService

SITE_NAME = "Reel Review"
DEFAULT_DESCRIPTION = (
    "A cinematic, community-driven weekly movie club where the byNolo community "
    "rates one featured film together."
)
DEFAULT_IMAGE_PATH = "/hero.png"
TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w1280"


@dataclass
class SeoPayload:
    title: str
    description: str
    canonical_url: str
    image_url: str
    type: str = "website"


def build_seo_payload(db: Session, path: str) -> SeoPayload:
    normalized_path = normalize_path(path)

    if normalized_path == "/":
        return build_home_payload(db)

    if normalized_path == "/vote":
        drop = get_current_or_latest_drop(db)
        if drop:
            return build_vote_payload(drop)
        return default_payload(normalized_path)

    if normalized_path.startswith("/vote/"):
        drop = get_drop_by_path_id(db, normalized_path)
        if drop:
            return build_vote_payload(drop)
        return default_payload(normalized_path)

    if normalized_path.startswith("/results/"):
        drop = get_drop_by_path_id(db, normalized_path)
        if drop:
            return build_results_payload(db, drop)
        return default_payload(normalized_path)

    if normalized_path.startswith("/p/"):
        username = normalized_path.removeprefix("/p/").strip("/")
        if username:
            return build_profile_payload(db, username)
        return default_payload(normalized_path)

    return default_payload(normalized_path)


def render_preview_html(payload: SeoPayload) -> str:
    title = escape(payload.title)
    description = escape(payload.description)
    canonical_url = escape(payload.canonical_url, quote=True)
    image_url = escape(payload.image_url, quote=True)
    site_name = escape(SITE_NAME)
    page_type = escape(payload.type)

    return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>{title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="{description}" />
    <meta name="robots" content="index,follow,max-image-preview:large" />
    <link rel="canonical" href="{canonical_url}" />
    <meta property="og:site_name" content="{site_name}" />
    <meta property="og:type" content="{page_type}" />
    <meta property="og:title" content="{title}" />
    <meta property="og:description" content="{description}" />
    <meta property="og:url" content="{canonical_url}" />
    <meta property="og:image" content="{image_url}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="{title}" />
    <meta name="twitter:description" content="{description}" />
    <meta name="twitter:image" content="{image_url}" />
  </head>
  <body style="margin:0;background:#09090b;color:#f4f4f5;font-family:Inter,system-ui,sans-serif;">
    <main style="min-height:100vh;display:grid;place-items:center;padding:24px;text-align:center;">
      <div>
        <p style="margin:0 0 12px;font-size:12px;letter-spacing:.3em;text-transform:uppercase;color:#a1a1aa;">Reel Review Preview</p>
        <h1 style="margin:0 0 12px;font-size:32px;line-height:1.1;">{title}</h1>
        <p style="margin:0 auto;max-width:640px;color:#d4d4d8;">{description}</p>
        <p style="margin:20px 0 0;"><a href="{canonical_url}" style="color:#f87171;">Open on Reel Review</a></p>
      </div>
    </main>
  </body>
</html>
"""


def build_home_payload(db: Session) -> SeoPayload:
    drop = get_current_or_latest_drop(db)
    canonical_url = absolute_url("/")
    image_url = fallback_image_url()

    if not drop or not drop.movie:
        return SeoPayload(
            title=f"{SITE_NAME} | Weekly Community Movie Night",
            description=DEFAULT_DESCRIPTION,
            canonical_url=canonical_url,
            image_url=image_url,
        )

    movie = serialize_movie(drop.movie)
    year = release_year(movie)
    active_window = f"{drop.start_date:%b %-d} to {drop.end_date:%b %-d}".replace(" 0", " ")
    description = truncate_description(
        f"This week's featured movie is {movie['title']}{year}. Rate it before Sunday night, "
        f"join the conversation, and follow the community drop running {active_window}."
    )
    return SeoPayload(
        title=f"{SITE_NAME} | This Week: {movie['title']}{year}",
        description=description,
        canonical_url=canonical_url,
        image_url=movie_image_url(movie),
    )


def build_vote_payload(drop: WeeklyDrop) -> SeoPayload:
    movie = serialize_movie(drop.movie) if drop.movie else None
    canonical_url = absolute_url(f"/vote/{drop.id}")

    if not movie:
        return SeoPayload(
            title=f"Rate This Week's Movie | {SITE_NAME}",
            description=DEFAULT_DESCRIPTION,
            canonical_url=canonical_url,
            image_url=fallback_image_url(),
        )

    year = release_year(movie)
    description = truncate_description(
        f"Submit your rating for {movie['title']}{year} on Reel Review's weekly drop. "
        f"Voting for this movie runs through {drop.end_date:%A, %B %-d}."
    )
    return SeoPayload(
        title=f"Rate {movie['title']}{year} | {SITE_NAME}",
        description=description,
        canonical_url=canonical_url,
        image_url=movie_image_url(movie),
    )


def build_results_payload(db: Session, drop: WeeklyDrop) -> SeoPayload:
    summary = ResultsService.get_drop_results_summary(db, drop.id, current_user=None)
    movie = summary["movie"]
    year = release_year(movie)
    official_score = round(summary["official_score"])
    total_votes = summary["total_votes"]
    vote_label = "vote" if total_votes == 1 else "votes"
    description = truncate_description(
        f"See the Reel Review results for {movie['title']}{year}. "
        f"The community score landed at {official_score}/100 from {total_votes} {vote_label}."
    )
    return SeoPayload(
        title=f"Results: {movie['title']}{year} | {SITE_NAME}",
        description=description,
        canonical_url=absolute_url(f"/results/{drop.id}"),
        image_url=movie_image_url(movie),
    )


def build_profile_payload(db: Session, username: str) -> SeoPayload:
    canonical_url = absolute_url(f"/p/{username}")
    user = db.query(User).filter(User.username == username).first()

    if not user:
        return SeoPayload(
            title=f"Profile Not Found | {SITE_NAME}",
            description="This Reel Review profile could not be found.",
            canonical_url=canonical_url,
            image_url=fallback_image_url(),
        )

    if not user.public_profile:
        return SeoPayload(
            title=f"Private Profile | {SITE_NAME}",
            description="This Reel Review profile is private.",
            canonical_url=canonical_url,
            image_url=fallback_image_url(),
        )

    profile_name = preferred_profile_name(user)
    visible_ratings = apply_public_profile_rating_visibility(
        db.query(Rating).filter(Rating.user_id == user.id),
        db,
    )
    total_votes = visible_ratings.count()
    average_score = visible_ratings.with_entities(func.avg(Rating.overall_score)).scalar() or 0.0
    top_rating = (
        apply_public_profile_rating_visibility(
            db.query(Rating).filter(Rating.user_id == user.id, Rating.movie_id.isnot(None)),
            db,
        )
        .order_by(Rating.overall_score.desc(), Rating.created_at.desc())
        .first()
    )

    favorite_movie_title = top_rating.movie.title if top_rating and top_rating.movie else None
    favorite_movie_suffix = f' Favorite: "{favorite_movie_title}."' if favorite_movie_title else ""
    description = truncate_description(
        f"{profile_name}'s public Reel Review profile with {total_votes} ratings and an average score of "
        f"{average_score:.1f}/100.{favorite_movie_suffix}"
    )

    image_url = fallback_image_url()
    if top_rating and top_rating.movie:
        image_url = movie_image_url(serialize_movie(top_rating.movie))

    return SeoPayload(
        title=f"{profile_name} on {SITE_NAME}",
        description=description,
        canonical_url=canonical_url,
        image_url=image_url,
        type="profile",
    )


def default_payload(path: str) -> SeoPayload:
    return SeoPayload(
        title=f"{SITE_NAME} | Weekly Community Movie Night",
        description=DEFAULT_DESCRIPTION,
        canonical_url=absolute_url(path),
        image_url=fallback_image_url(),
    )


def get_current_or_latest_drop(db: Session) -> WeeklyDrop | None:
    DropSchedulerService.rollover(db)
    today = DropSchedulerService.eastern_today()

    drop = (
        db.query(WeeklyDrop)
        .filter(
            WeeklyDrop.is_active == True,
            WeeklyDrop.movie_id.isnot(None),
            WeeklyDrop.start_date <= today,
            WeeklyDrop.end_date >= today,
        )
        .first()
    )
    if drop:
        return drop

    return (
        db.query(WeeklyDrop)
        .filter(WeeklyDrop.movie_id.isnot(None))
        .order_by(WeeklyDrop.start_date.desc(), WeeklyDrop.id.desc())
        .first()
    )


def get_drop_by_path_id(db: Session, path: str) -> WeeklyDrop | None:
    try:
        drop_id = int(path.rstrip("/").split("/")[-1])
    except (TypeError, ValueError):
        return None

    return db.query(WeeklyDrop).filter(WeeklyDrop.id == drop_id).first()


def preferred_profile_name(user: User) -> str:
    if user.use_display_name and user.display_name:
        return user.display_name
    return user.username


def normalize_path(path: str | None) -> str:
    if not path:
        return "/"
    if path.startswith("http://") or path.startswith("https://"):
        return "/"
    cleaned = path.split("?", maxsplit=1)[0].strip()
    if not cleaned:
        return "/"
    return cleaned if cleaned.startswith("/") else f"/{cleaned}"


def absolute_url(path: str) -> str:
    base_url = settings.FRONTEND_URL.rstrip("/")
    normalized_path = normalize_path(path)
    return base_url if normalized_path == "/" else f"{base_url}{normalized_path}"


def fallback_image_url() -> str:
    return absolute_url(DEFAULT_IMAGE_PATH)


def movie_image_url(movie: dict[str, Any]) -> str:
    image_path = movie.get("backdrop_path") or movie.get("poster_path")
    if not image_path:
        return fallback_image_url()
    return f"{TMDB_IMAGE_BASE_URL}{image_path}"


def release_year(movie: dict[str, Any]) -> str:
    release_date = movie.get("release_date")
    if not release_date:
        return ""
    return f" ({str(release_date)[:4]})"


def truncate_description(description: str, limit: int = 200) -> str:
    cleaned = " ".join(description.split())
    if len(cleaned) <= limit:
        return cleaned
    return f"{cleaned[: limit - 1].rstrip()}…"
