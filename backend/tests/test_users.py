import pytest
from datetime import date, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.api.deps import get_db, get_current_user, get_optional_user
from app.models.movie import Movie
from app.models.rating import Rating
from app.models.user import User
from app.models.weekly_drop import WeeklyDrop

@pytest.fixture
def test_client(db: Session):
    def override_get_db():
        yield db

    user = User(keyn_id="123456", username="public_tester", email="public@example.com", public_profile=True)
    private_user = User(keyn_id="654321", username="private_tester", email="private@example.com", public_profile=False)
    db.add_all([user, private_user])
    db.commit()
    db.refresh(user)

    def override_get_optional_user():
        return None # Anonymous by default

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_optional_user] = override_get_optional_user

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()

def test_get_public_profile(test_client, db: Session):
    response = test_client.get("/api/v1/users/by-username/public_tester/profile")
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "public_tester"

def test_get_private_profile_anonymous(test_client, db: Session):
    response = test_client.get("/api/v1/users/by-username/private_tester/profile")
    assert response.status_code == 403

def test_get_private_profile_owner(test_client, db: Session):
    private_user = db.query(User).filter_by(username="private_tester").first()
    
    # Override get_optional_user to simulate the owner is logged in
    def override_get_optional_user():
        return private_user
    
    app.dependency_overrides[get_optional_user] = override_get_optional_user
    
    response = test_client.get("/api/v1/users/by-username/private_tester/profile")
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "private_tester"

def test_get_nonexistent_profile(test_client, db: Session):
    response = test_client.get("/api/v1/users/by-username/nobody/profile")
    assert response.status_code == 404

def test_update_preferences(test_client, db: Session):
    user = db.query(User).filter_by(username="public_tester").first()

    def override_get_current_user():
        return user

    app.dependency_overrides[get_current_user] = override_get_current_user

    response = test_client.put(
        "/api/v1/users/me/preferences",
        json={
            "use_display_name": False,
            "show_on_leaderboard": False,
            "public_profile": True,
        },
    )

    app.dependency_overrides.pop(get_current_user, None)

    assert response.status_code == 200
    data = response.json()
    assert data["use_display_name"] is False
    assert data["show_on_leaderboard"] is False
    assert data["public_profile"] is True

    db.refresh(user)
    assert user.use_display_name is False
    assert user.show_on_leaderboard is False
    assert user.public_profile is True

def test_private_profile_owner_defaults(test_client, db: Session):
    private_user = db.query(User).filter_by(username="private_tester").first()
    private_user.use_display_name = None
    db.commit()
    db.refresh(private_user)

    def override_get_optional_user():
        return private_user

    app.dependency_overrides[get_optional_user] = override_get_optional_user

    response = test_client.get(f"/api/v1/users/{private_user.id}/profile")

    app.dependency_overrides.pop(get_optional_user, None)

    assert response.status_code == 200
    data = response.json()
    assert data["use_display_name"] is True


def test_public_profile_hides_active_drop_ratings(test_client, db: Session):
    user = db.query(User).filter_by(username="public_tester").first()
    today = date.today()

    current_movie = Movie(title="Current Drop Movie")
    archive_movie = Movie(title="Archive Movie")
    db.add_all([current_movie, archive_movie])
    db.commit()
    db.refresh(current_movie)
    db.refresh(archive_movie)

    active_drop = WeeklyDrop(
        movie_id=current_movie.id,
        start_date=today - timedelta(days=1),
        end_date=today + timedelta(days=5),
        is_active=True,
    )
    past_drop = WeeklyDrop(
        movie_id=archive_movie.id,
        start_date=today - timedelta(days=14),
        end_date=today - timedelta(days=7),
        is_active=False,
    )
    db.add_all([active_drop, past_drop])
    db.commit()
    db.refresh(active_drop)
    db.refresh(past_drop)

    db.add_all(
        [
            Rating(
                user_id=user.id,
                movie_id=current_movie.id,
                weekly_drop_id=active_drop.id,
                overall_score=95,
            ),
            Rating(
                user_id=user.id,
                movie_id=archive_movie.id,
                weekly_drop_id=past_drop.id,
                overall_score=80,
            ),
        ]
    )
    db.commit()

    response = test_client.get("/api/v1/users/by-username/public_tester/profile")

    assert response.status_code == 200
    data = response.json()
    assert data["total_votes"] == 1
    assert data["average_score"] == 80.0
    assert [item["movie"]["title"] for item in data["recent_ratings"]] == ["Archive Movie"]


def test_private_profile_owner_still_sees_active_drop_ratings(test_client, db: Session):
    user = db.query(User).filter_by(username="private_tester").first()
    today = date.today()

    movie = Movie(title="Owner Current Drop Movie")
    db.add(movie)
    db.commit()
    db.refresh(movie)

    active_drop = WeeklyDrop(
        movie_id=movie.id,
        start_date=today - timedelta(days=1),
        end_date=today + timedelta(days=5),
        is_active=True,
    )
    db.add(active_drop)
    db.commit()
    db.refresh(active_drop)

    db.add(
        Rating(
            user_id=user.id,
            movie_id=movie.id,
            weekly_drop_id=active_drop.id,
            overall_score=88,
        )
    )
    db.commit()

    def override_get_optional_user():
        return user

    app.dependency_overrides[get_optional_user] = override_get_optional_user

    response = test_client.get(f"/api/v1/users/{user.id}/profile")

    app.dependency_overrides.pop(get_optional_user, None)

    assert response.status_code == 200
    data = response.json()
    assert data["total_votes"] == 1
    assert data["average_score"] == 88.0
    assert [item["movie"]["title"] for item in data["recent_ratings"]] == ["Owner Current Drop Movie"]
