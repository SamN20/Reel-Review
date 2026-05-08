from __future__ import annotations

import argparse
import logging
from dataclasses import dataclass

import httpx

from app.db.session import SessionLocal
from app.models.movie import Movie
from app.services.movie_metadata import (
    TMDB_BASE_URL,
    extract_director_name,
    extract_youtube_trailer_key,
    get_tmdb_headers,
)


logger = logging.getLogger("refresh_movie_metadata")


@dataclass
class RefreshResult:
    checked: int = 0
    updated: int = 0
    skipped: int = 0
    failed: int = 0


def fetch_movie_metadata(client: httpx.Client, tmdb_id: int) -> tuple[str | None, str | None]:
    response = client.get(
        f"{TMDB_BASE_URL}/movie/{tmdb_id}",
        params={"append_to_response": "credits,videos"},
        headers=get_tmdb_headers(),
    )
    response.raise_for_status()
    data = response.json()
    return extract_director_name(data.get("credits")), extract_youtube_trailer_key(data.get("videos"))


def refresh_movie_metadata(limit: int | None = None, dry_run: bool = False) -> RefreshResult:
    result = RefreshResult()
    db = SessionLocal()
    try:
        query = db.query(Movie).filter(Movie.tmdb_id.isnot(None)).order_by(Movie.id.asc())
        if limit:
            query = query.limit(limit)

        movies = query.all()
        logger.info("Refreshing TMDB metadata for %s movies%s.", len(movies), " (dry run)" if dry_run else "")

        with httpx.Client(timeout=20.0) as client:
            for movie in movies:
                result.checked += 1
                try:
                    director_name, trailer_youtube_key = fetch_movie_metadata(client, movie.tmdb_id)
                except httpx.HTTPError as exc:
                    result.failed += 1
                    logger.warning(
                        "Failed to fetch TMDB metadata for %s (%s): %s",
                        movie.title,
                        movie.tmdb_id,
                        exc,
                    )
                    continue

                changes: dict[str, str | None] = {}
                if movie.director_name != director_name:
                    changes["director_name"] = director_name
                if movie.trailer_youtube_key != trailer_youtube_key:
                    changes["trailer_youtube_key"] = trailer_youtube_key

                if not changes:
                    result.skipped += 1
                    logger.info("No changes for %s.", movie.title)
                    continue

                result.updated += 1
                logger.info(
                    "%s %s: director=%r, trailer=%r",
                    "Would update" if dry_run else "Updating",
                    movie.title,
                    changes.get("director_name", movie.director_name),
                    changes.get("trailer_youtube_key", movie.trailer_youtube_key),
                )

                if dry_run:
                    continue

                for field_name, value in changes.items():
                    setattr(movie, field_name, value)
                db.add(movie)

            if dry_run:
                db.rollback()
            else:
                db.commit()
    finally:
        db.close()

    return result


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Refresh stored director names and YouTube trailer keys from TMDB for existing movies.",
    )
    parser.add_argument("--dry-run", action="store_true", help="Log changes without writing to the database.")
    parser.add_argument("--limit", type=int, default=None, help="Only process the first N TMDB-backed movies.")
    return parser.parse_args()


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    args = parse_args()
    result = refresh_movie_metadata(limit=args.limit, dry_run=args.dry_run)
    logger.info(
        "Done. checked=%s updated=%s skipped=%s failed=%s",
        result.checked,
        result.updated,
        result.skipped,
        result.failed,
    )


if __name__ == "__main__":
    main()
