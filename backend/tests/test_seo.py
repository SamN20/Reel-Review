from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.config import settings
from app.main import app
from app.models.movie import Movie
from app.models.rating import Rating
from app.models.user import User
from app.models.weekly_drop import WeeklyDrop


@pytest.fixture
def seo_client(db: Session):
    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


def test_results_preview_renders_movie_metadata(seo_client: TestClient, db: Session, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(settings, "FRONTEND_URL", "https://reelreview.example")

    movie = Movie(
        title="Preview Feature",
        overview="A stylish test movie.",
        backdrop_path="/preview-backdrop.jpg",
        release_date=date(2024, 1, 12),
    )
    db.add(movie)
    db.commit()
    db.refresh(movie)

    drop = WeeklyDrop(
        movie_id=movie.id,
        start_date=date.today() - timedelta(days=7),
        end_date=date.today() - timedelta(days=1),
        is_active=False,
    )
    db.add(drop)
    db.commit()
    db.refresh(drop)

    user = User(keyn_id="seo-user", username="seo", email="seo@example.com")
    db.add(user)
    db.commit()
    db.refresh(user)

    db.add(
        Rating(
            user_id=user.id,
            movie_id=movie.id,
            weekly_drop_id=drop.id,
            overall_score=84,
            is_approved=True,
        )
    )
    db.commit()

    response = seo_client.get(f"/seo/render?path=/results/{drop.id}")

    assert response.status_code == 200
    assert "Results: Preview Feature (2024) | Reel Review" in response.text
    assert 'content="https://reelreview.example/results/' in response.text
    assert 'content="https://image.tmdb.org/t/p/w1280/preview-backdrop.jpg"' in response.text
    assert "84/100" in response.text


def test_home_preview_uses_current_drop(seo_client: TestClient, db: Session, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(settings, "FRONTEND_URL", "https://reelreview.example")

    movie = Movie(
        title="Current Week Movie",
        overview="The active feature.",
        poster_path="/current-poster.jpg",
        release_date=date(2023, 5, 5),
    )
    db.add(movie)
    db.commit()
    db.refresh(movie)

    drop = WeeklyDrop(
        movie_id=movie.id,
        start_date=date.today(),
        end_date=date.today() + timedelta(days=6),
        is_active=True,
    )
    db.add(drop)
    db.commit()

    response = seo_client.get("/seo/render?path=/")

    assert response.status_code == 200
    assert "Current Week Movie (2023)" in response.text
    assert 'content="https://reelreview.example"' in response.text
    assert 'content="https://image.tmdb.org/t/p/w1280/current-poster.jpg"' in response.text


def test_public_profile_preview_uses_public_name_and_stats(seo_client: TestClient, db: Session, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(settings, "FRONTEND_URL", "https://reelreview.example")

    user = User(
        keyn_id="public-profile",
        username="cinefan",
        display_name="Cine Fan",
        use_display_name=True,
        public_profile=True,
        email="cinefan@example.com",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    movie = Movie(
        title="Profile Favorite",
        poster_path="/favorite-poster.jpg",
    )
    db.add(movie)
    db.commit()
    db.refresh(movie)

    db.add(
        Rating(
            user_id=user.id,
            movie_id=movie.id,
            overall_score=92,
            is_approved=True,
        )
    )
    db.commit()

    response = seo_client.get("/seo/render?path=/p/cinefan")

    assert response.status_code == 200
    assert "Cine Fan on Reel Review" in response.text
    assert "1 ratings and an average score of 92.0/100" in response.text
    assert 'content="https://reelreview.example/p/cinefan"' in response.text
    assert 'content="https://image.tmdb.org/t/p/w1280/favorite-poster.jpg"' in response.text


def test_public_profile_preview_hides_active_drop_rating(seo_client: TestClient, db: Session, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(settings, "FRONTEND_URL", "https://reelreview.example")

    user = User(
        keyn_id="public-profile-active",
        username="spoilerfree",
        public_profile=True,
        email="spoilerfree@example.com",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    active_movie = Movie(title="Current Week Secret", poster_path="/current-secret.jpg")
    archive_movie = Movie(title="Archive Favorite", poster_path="/archive-favorite.jpg")
    db.add_all([active_movie, archive_movie])
    db.commit()
    db.refresh(active_movie)
    db.refresh(archive_movie)

    active_drop = WeeklyDrop(
        movie_id=active_movie.id,
        start_date=date.today() - timedelta(days=1),
        end_date=date.today() + timedelta(days=5),
        is_active=True,
    )
    db.add(active_drop)
    db.commit()
    db.refresh(active_drop)

    db.add_all(
        [
            Rating(
                user_id=user.id,
                movie_id=active_movie.id,
                weekly_drop_id=active_drop.id,
                overall_score=99,
                is_approved=True,
            ),
            Rating(
                user_id=user.id,
                movie_id=archive_movie.id,
                overall_score=85,
                is_approved=True,
            ),
        ]
    )
    db.commit()

    response = seo_client.get("/seo/render?path=/p/spoilerfree")

    assert response.status_code == 200
    assert "1 ratings and an average score of 85.0/100" in response.text
    assert "Current Week Secret" not in response.text
    assert 'content="https://image.tmdb.org/t/p/w1280/archive-favorite.jpg"' in response.text
