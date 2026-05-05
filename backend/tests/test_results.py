import pytest
from datetime import date, datetime, timedelta, timezone
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.api.deps import get_db, get_current_user, get_optional_user
from app.models.user import User
from app.models.movie import Movie
from app.models.weekly_drop import WeeklyDrop
from app.models.rating import Rating

@pytest.fixture
def test_client(db: Session):
    def override_get_db():
        yield db

    user = User(keyn_id="123456", username="tester", email="tester@example.com")
    db.add(user)
    db.commit()
    db.refresh(user)

    def override_get_optional_user():
        return user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_optional_user] = override_get_optional_user

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()

def test_get_drop_results(test_client, db: Session):
    # Setup test data
    movie = Movie(title="Test Results Movie", overview="A movie for testing results.")
    db.add(movie)
    db.commit()

    drop = WeeklyDrop(movie_id=movie.id, start_date=date.today(), end_date=date.today() + timedelta(days=7))
    db.add(drop)
    db.commit()

    # Create user and rating
    user = db.query(User).filter_by(username="tester").first()
    rating = Rating(
        user_id=user.id,
        movie_id=movie.id,
        weekly_drop_id=drop.id,
        overall_score=85,
        story_score=90,
        performances_score=80,
        review_text="Great movie!",
        is_approved=True,
        has_spoilers=False
    )
    db.add(rating)
    db.commit()

    # Call endpoint
    response = test_client.get(f"/api/v1/results/{drop.id}")
    
    # Assertions
    assert response.status_code == 200
    data = response.json()
    
    assert data["drop_id"] == drop.id
    assert data["movie"]["title"] == "Test Results Movie"
    assert data["official_score"] == 85.0
    assert data["user_score"] == 85
    assert data["total_votes"] == 1
    
    # Check subcategories
    assert data["sub_categories"]["story"] == 90.0
    assert data["sub_categories"]["performances"] == 80.0
    assert data["sub_categories"]["visuals"] is None
    
    # Check reviews
    assert len(data["reviews"]) == 1
    review = data["reviews"][0]
    assert review["user_name"] == "tester"
    assert review["overall_score"] == 85
    assert review["review_text"] == "Great movie!"
    assert review["is_spoiler"] is False


def test_get_drop_results_refreshes_stale_watch_providers(test_client, db: Session, monkeypatch):
    stale_timestamp = datetime.now(timezone.utc) - timedelta(days=31)
    movie = Movie(
        tmdb_id=27205,
        title="Stale Watch Providers",
        watch_providers={
            "CA": {
                "link": "https://old.example/watch",
                "flatrate": [
                    {
                        "provider_id": 1,
                        "provider_name": "Old Streamer",
                        "logo_path": "/old.png",
                    }
                ],
            }
        },
        watch_providers_updated_at=stale_timestamp,
    )
    db.add(movie)
    db.commit()
    db.refresh(movie)

    drop = WeeklyDrop(movie_id=movie.id, start_date=date.today(), end_date=date.today() + timedelta(days=7))
    db.add(drop)
    db.commit()

    user = db.query(User).filter_by(username="tester").first()
    db.add(
        Rating(
            user_id=user.id,
            movie_id=movie.id,
            weekly_drop_id=drop.id,
            overall_score=70,
            is_approved=True,
        )
    )
    db.commit()

    def fake_fetch_tmdb_watch_providers(tmdb_id: int):
        assert tmdb_id == 27205
        return {
            "CA": {
                "link": "https://new.example/watch",
                "flatrate": [
                    {
                        "provider_id": 99,
                        "provider_name": "Fresh Streamer",
                        "logo_path": "/fresh.png",
                    }
                ],
            }
        }

    monkeypatch.setattr(
        "app.services.movie_metadata.fetch_tmdb_watch_providers",
        fake_fetch_tmdb_watch_providers,
    )

    response = test_client.get(f"/api/v1/results/{drop.id}")

    assert response.status_code == 200
    data = response.json()
    assert data["movie"]["watch_providers"][0]["provider_name"] == "Fresh Streamer"
    assert data["movie"]["watch_providers"][0]["link_url"] == "https://new.example/watch"

    db.refresh(movie)
    assert movie.watch_providers["CA"]["flatrate"][0]["provider_name"] == "Fresh Streamer"
    assert movie.watch_providers_updated_at is not None
    assert movie.watch_providers_updated_at != stale_timestamp
