import argparse
import logging
import random
from datetime import date, datetime, timedelta, timezone

import httpx

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.movie import Movie
from app.models.rating import Rating
from app.models.user import User
from app.models.weekly_drop import WeeklyDrop
from app.services.movie_metadata import extract_director_name, extract_watch_provider_regions

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

TMDB_BASE_URL = "https://api.themoviedb.org/3"

# Deterministic list of real TMDB titles so local seeding stays stable.
SEEDED_TMDB_IDS = [
    27205,   # Inception
    693134,  # Dune: Part Two
    335984,  # Blade Runner 2049
    545611,  # Everything Everywhere All at Once
    414906,  # The Batman
]

FALLBACK_MOVIES = [
    {
        "tmdb_id": 27205,
        "title": "Inception",
        "release_date": date(2010, 7, 16),
        "overview": "A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea.",
        "director_name": "Christopher Nolan",
        "poster_path": "/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
        "backdrop_path": "/s3TBrRGB1inv7gFpzPhf0P0tYdr.jpg",
        "genres": [{"id": 28, "name": "Action"}, {"id": 878, "name": "Science Fiction"}],
        "cast": [],
        "keywords": [],
        "watch_providers": {},
    },
    {
        "tmdb_id": 693134,
        "title": "Dune: Part Two",
        "release_date": date(2024, 3, 1),
        "overview": "Paul Atreides unites with Chani and the Fremen while seeking revenge against those who destroyed his family.",
        "director_name": "Denis Villeneuve",
        "poster_path": "/1pdfLvkbY9ohJlCjQH2TGpiH057.jpg",
        "backdrop_path": "/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg",
        "genres": [{"id": 878, "name": "Science Fiction"}],
        "cast": [],
        "keywords": [],
        "watch_providers": {},
    },
    {
        "tmdb_id": 335984,
        "title": "Blade Runner 2049",
        "release_date": date(2017, 10, 4),
        "overview": "A new blade runner unearths a long-buried secret that could plunge what remains of society into chaos.",
        "director_name": "Denis Villeneuve",
        "poster_path": "/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg",
        "backdrop_path": "/ilRyazdQYKEebnv9VtOVKlpmOQ.jpg",
        "genres": [{"id": 878, "name": "Science Fiction"}],
        "cast": [],
        "keywords": [],
        "watch_providers": {},
    },
    {
        "tmdb_id": 545611,
        "title": "Everything Everywhere All at Once",
        "release_date": date(2022, 3, 24),
        "overview": "An aging Chinese immigrant is swept up in an absurd adventure where she alone can save existence.",
        "director_name": "Daniel Kwan, Daniel Scheinert",
        "poster_path": "/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg",
        "backdrop_path": "/wp3vpSWq1R6hD4jI6hE18rN0S2O.jpg",
        "genres": [{"id": 12, "name": "Adventure"}],
        "cast": [],
        "keywords": [],
        "watch_providers": {},
    },
    {
        "tmdb_id": 414906,
        "title": "The Batman",
        "release_date": date(2022, 3, 1),
        "overview": "Batman ventures into Gotham City's underworld when a sadistic killer leaves behind a trail of cryptic clues.",
        "director_name": "Matt Reeves",
        "poster_path": "/74xTEgt7R36Fpooo50r9T25onhq.jpg",
        "backdrop_path": "/eUORREWq2ThkkxyiCESCu3sVdGg.jpg",
        "genres": [{"id": 80, "name": "Crime"}],
        "cast": [],
        "keywords": [],
        "watch_providers": {},
    },
]

SEED_USER_PREFIX = "seed_test_id_"


def get_tmdb_headers() -> dict[str, str]:
    return {
        "accept": "application/json",
        "Authorization": f"Bearer {settings.TMDB_API_KEY}",
    }


def parse_release_date(value: str | None) -> date | None:
    if not value:
        return None
    return date.fromisoformat(value)


def normalize_tmdb_movie(data: dict) -> dict:
    watch_providers = {}
    provider_results = data.get("watch/providers", {}).get("results", {})
    watch_providers = extract_watch_provider_regions(provider_results)

    images = data.get("images", {})
    posters = images.get("posters", [])
    backdrops = images.get("backdrops", [])

    poster_path = data.get("poster_path")
    if not poster_path and posters:
        poster_path = posters[0].get("file_path")

    backdrop_path = data.get("backdrop_path")
    if not backdrop_path and backdrops:
        backdrop_path = backdrops[0].get("file_path")

    return {
        "tmdb_id": data.get("id"),
        "title": data.get("title"),
        "release_date": parse_release_date(data.get("release_date")),
        "overview": data.get("overview"),
        "director_name": extract_director_name(data.get("credits")),
        "poster_path": poster_path,
        "backdrop_path": backdrop_path,
        "genres": data.get("genres", []),
        "cast": data.get("credits", {}).get("cast", [])[:10],
        "keywords": data.get("keywords", {}).get("keywords", []),
        "watch_providers": watch_providers,
        "watch_providers_updated_at": datetime.now(timezone.utc),
    }


def fetch_tmdb_movie(tmdb_id: int) -> dict:
    with httpx.Client(timeout=20.0) as client:
        response = client.get(
            f"{TMDB_BASE_URL}/movie/{tmdb_id}",
            params={"append_to_response": "credits,keywords,watch/providers,images"},
            headers=get_tmdb_headers(),
        )
        response.raise_for_status()
        return normalize_tmdb_movie(response.json())


def fetch_seed_movies() -> list[dict]:
    movies = []
    for tmdb_id in SEEDED_TMDB_IDS:
        logger.info("Fetching TMDB movie %s", tmdb_id)
        movies.append(fetch_tmdb_movie(tmdb_id))
    return movies


def get_seed_movies() -> list[dict]:
    try:
        return fetch_seed_movies()
    except Exception as exc:
        logger.warning("Falling back to bundled seed movies because TMDB fetch failed: %s", exc)
        return FALLBACK_MOVIES


def upsert_movie(db, movie_data: dict) -> Movie:
    if "watch_providers" in movie_data and movie_data.get("watch_providers_updated_at") is None:
        movie_data["watch_providers_updated_at"] = datetime.now(timezone.utc)

    movie = None
    if movie_data.get("tmdb_id") is not None:
        movie = db.query(Movie).filter(Movie.tmdb_id == movie_data["tmdb_id"]).first()
    if not movie:
        movie = db.query(Movie).filter(Movie.title == movie_data["title"]).first()

    if not movie:
        movie = Movie(**movie_data)
        db.add(movie)
    else:
        for key, value in movie_data.items():
            setattr(movie, key, value)

    db.commit()
    db.refresh(movie)
    return movie


def ensure_seed_users(db) -> list[User]:
    users = []
    for i in range(1, 5):
        username = f"testuser{i}"
        user = db.query(User).filter(User.username == username).first()
        if not user:
            user = User(
                keyn_id=f"{SEED_USER_PREFIX}{i}",
                username=username,
                email=f"{username}@example.com",
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        users.append(user)
    return users


def ensure_drop(db, movie: Movie, start_date: date, end_date: date, is_active: bool) -> WeeklyDrop:
    drop = db.query(WeeklyDrop).filter(WeeklyDrop.start_date == start_date).first()
    if not drop:
        drop = WeeklyDrop(
            movie_id=movie.id,
            start_date=start_date,
            end_date=end_date,
            is_active=is_active,
            mode="admin_pick",
        )
        db.add(drop)
    else:
        drop.movie_id = movie.id
        drop.end_date = end_date
        drop.is_active = is_active
        drop.mode = "admin_pick"

    db.commit()
    db.refresh(drop)
    return drop


def ensure_ratings(db, users: list[User], movie: Movie, drop: WeeklyDrop, late: bool = False) -> None:
    for idx, user in enumerate(users):
        rating = db.query(Rating).filter(
            Rating.user_id == user.id,
            Rating.weekly_drop_id == drop.id,
        ).first()

        if not rating:
            base_score = 68 + ((idx * 9 + movie.id) % 28)
            rating = Rating(
                user_id=user.id,
                movie_id=movie.id,
                weekly_drop_id=drop.id,
                overall_score=min(base_score, 96),
                story_score=min(base_score + 4, 100),
                performances_score=min(base_score + 6, 100),
                visuals_score=min(base_score + 8, 100),
                sound_score=min(base_score + 5, 100),
                rewatchability_score=min(base_score + 2, 100),
                enjoyment_score=min(base_score + 7, 100),
                emotional_impact_score=min(base_score + 3, 100),
                review_text=random.choice(
                    [
                        "Seeded review for local testing.",
                        "Pulled from a realistic local test dataset.",
                        "Helpful sample review so the UI has real content.",
                    ]
                ),
                is_late=late,
                watched_status=True,
            )
            db.add(rating)

    db.commit()


def seed_data() -> None:
    db = SessionLocal()
    try:
        logger.info("Seeding database with TMDB-backed sample content...")
        seed_movies = get_seed_movies()
        if not seed_movies:
            logger.warning("No seed movies available.")
            return

        users = ensure_seed_users(db)
        today = date.today()
        current_week_start = today - timedelta(days=today.weekday())

        db.query(WeeklyDrop).update({WeeklyDrop.is_active: False})
        db.commit()

        for index, movie_data in enumerate(seed_movies):
            movie = upsert_movie(db, movie_data)

            if index == 0:
                start_date = current_week_start
                end_date = start_date + timedelta(days=6)
                drop = ensure_drop(db, movie, start_date, end_date, is_active=True)
                ensure_ratings(db, users, movie, drop, late=False)
                continue

            weeks_ago = index
            start_date = current_week_start - timedelta(weeks=weeks_ago)
            end_date = start_date + timedelta(days=6)
            drop = ensure_drop(db, movie, start_date, end_date, is_active=False)
            ensure_ratings(db, users, movie, drop, late=False)

        logger.info("Seed data successfully created from TMDB-backed content.")
    except Exception as exc:
        logger.error("Error seeding database: %s", exc)
        db.rollback()
        raise
    finally:
        db.close()


def remove_seed_data() -> None:
    db = SessionLocal()
    try:
        logger.info("Removing seeded sample data...")

        seed_users = db.query(User).filter(User.keyn_id.like(f"{SEED_USER_PREFIX}%")).all()
        seed_user_ids = [user.id for user in seed_users]

        if seed_user_ids:
            db.query(Rating).filter(Rating.user_id.in_(seed_user_ids)).delete(synchronize_session=False)

        seeded_movies = db.query(Movie).filter(Movie.tmdb_id.in_(SEEDED_TMDB_IDS)).all()
        seeded_movie_ids = [movie.id for movie in seeded_movies]

        if seeded_movie_ids:
            db.query(Rating).filter(Rating.movie_id.in_(seeded_movie_ids)).delete(synchronize_session=False)
            db.query(WeeklyDrop).filter(WeeklyDrop.movie_id.in_(seeded_movie_ids)).delete(synchronize_session=False)
            db.query(Movie).filter(Movie.id.in_(seeded_movie_ids)).delete(synchronize_session=False)

        if seed_user_ids:
            db.query(User).filter(User.id.in_(seed_user_ids)).delete(synchronize_session=False)

        db.commit()
        logger.info("Seeded sample data removed.")
    except Exception as exc:
        logger.error("Error removing seeded data: %s", exc)
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed or remove Reel Review sample data.")
    parser.add_argument(
        "command",
        nargs="?",
        default="seed",
        choices=["seed", "unseed"],
        help="Use 'seed' to add sample data or 'unseed' to remove it.",
    )
    args = parser.parse_args()

    if args.command == "seed":
        seed_data()
    else:
        remove_seed_data()
