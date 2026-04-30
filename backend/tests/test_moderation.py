import pytest
from datetime import date, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.movie import Movie
from app.models.weekly_drop import WeeklyDrop

@pytest.fixture
def test_client(db: Session):
    def override_get_db():
        yield db

    user = User(keyn_id="12345", username="modtester", email="modtester@example.com")
    db.add(user)
    db.commit()
    db.refresh(user)

    def override_get_current_user():
        return user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()

def test_rating_with_banned_word_is_flagged(test_client, db: Session):
    movie = Movie(title="Inappropriate Movie", overview="A movie with bad words.")
    db.add(movie)
    db.commit()

    drop = WeeklyDrop(movie_id=movie.id, start_date=date.today(), end_date=date.today() + timedelta(days=7))
    db.add(drop)
    db.commit()

    rating_data = {
        "weekly_drop_id": drop.id,
        "overall_score": 40,
        "review_text": "This movie was absolute fuck garbage!"
    }

    response = test_client.post("/api/v1/ratings/", json=rating_data)
    assert response.status_code == 200
    data = response.json()
    
    # Assert moderation auto-flagging logic applied correctly
    assert data["is_flagged"] is True
    assert data["is_approved"] is False

def test_rating_with_clean_review_is_not_flagged(test_client, db: Session):
    movie = Movie(title="Wholesome Movie", overview="A great movie for everyone.")
    db.add(movie)
    db.commit()

    drop = WeeklyDrop(movie_id=movie.id, start_date=date.today(), end_date=date.today() + timedelta(days=7))
    db.add(drop)
    db.commit()

    rating_data = {
        "weekly_drop_id": drop.id,
        "overall_score": 90,
        "review_text": "Such a beautiful experience. Totally recommend it!"
    }

    response = test_client.post("/api/v1/ratings/", json=rating_data)
    assert response.status_code == 200
    data = response.json()
    
    # Assert moderation auto-flagging logic passed clean review
    assert data["is_flagged"] is False
    assert data["is_approved"] is True

def test_rating_update_with_banned_word_is_flagged(test_client, db: Session):
    # This also checks the existing rating override block in app/api/routes/ratings.py
    movie = Movie(title="Update Movie", overview="Testing update logic.")
    db.add(movie)
    db.commit()

    drop = WeeklyDrop(movie_id=movie.id, start_date=date.today(), end_date=date.today() + timedelta(days=7))
    db.add(drop)
    db.commit()

    # Submit initially clean
    clean_data = {
        "weekly_drop_id": drop.id,
        "overall_score": 50,
        "review_text": "It was okay."
    }
    response1 = test_client.post("/api/v1/ratings/", json=clean_data)
    assert response1.status_code == 200
    assert response1.json()["is_flagged"] is False

    # Update with banned word
    dirty_data = {
        "weekly_drop_id": drop.id,
        "overall_score": 50,
        "review_text": "Changed my mind, what a fuck."
    }
    response2 = test_client.post("/api/v1/ratings/", json=dirty_data)
    assert response2.status_code == 200
    data = response2.json()

    assert data["is_flagged"] is True
    assert data["is_approved"] is False