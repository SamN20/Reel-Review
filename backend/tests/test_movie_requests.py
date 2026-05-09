from datetime import date
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi.testclient import TestClient

from app.api.deps import get_db
from app.core.security import create_access_token
from app.main import app
from app.models.movie import Movie
from app.models.movie_request import MovieRequest, MovieRequestSupporter
from app.models.user import User
from app.models.weekly_drop import WeeklyDrop

client = TestClient(app)


def auth_headers(user: User) -> dict[str, str]:
    return {"Authorization": f"Bearer {create_access_token(user.id)}"}


def override_db(db):
    def _override_db():
        yield db

    return _override_db


def create_user(db, username="request-user", is_admin=False) -> User:
    user = User(
        keyn_id=f"keyn-{username}",
        username=username,
        email=f"{username}@example.com",
        is_active=True,
        is_admin=is_admin,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def test_movie_request_creation_dedupes_by_tmdb_id_and_blocks_duplicate_support(db):
    user = create_user(db)
    second_user = create_user(db, username="second-user")
    app.dependency_overrides[get_db] = override_db(db)

    try:
        response = client.post(
            "/api/v1/movie-requests",
            headers=auth_headers(user),
            json={
                "tmdb_id": 603,
                "title": "The Matrix",
                "release_date": "1999-03-31",
                "note": "The community needs this one.",
            },
        )
        assert response.status_code == 200
        assert response.json()["supporter_count"] == 1

        duplicate = client.post(
            "/api/v1/movie-requests",
            headers=auth_headers(user),
            json={"tmdb_id": 603, "title": "The Matrix"},
        )
        assert duplicate.status_code == 400

        second = client.post(
            "/api/v1/movie-requests",
            headers=auth_headers(second_user),
            json={"tmdb_id": 603, "title": "The Matrix", "note": "Seconding it."},
        )
        assert second.status_code == 200
        assert second.json()["supporter_count"] == 2

        assert db.query(MovieRequest).count() == 1
        assert db.query(MovieRequestSupporter).count() == 2
    finally:
        app.dependency_overrides.clear()


def test_user_can_edit_and_delete_only_pending_own_support(db):
    user = create_user(db)
    other_user = create_user(db, username="other-user")
    request = MovieRequest(tmdb_id=11, title="Star Wars", status="pending")
    db.add(request)
    db.flush()
    db.add(MovieRequestSupporter(request_id=request.id, user_id=user.id, note="Original"))
    db.commit()
    app.dependency_overrides[get_db] = override_db(db)

    try:
        blocked = client.patch(
            f"/api/v1/movie-requests/{request.id}",
            headers=auth_headers(other_user),
            json={"note": "Not mine"},
        )
        assert blocked.status_code == 404

        edited = client.patch(
            f"/api/v1/movie-requests/{request.id}",
            headers=auth_headers(user),
            json={"note": "Updated"},
        )
        assert edited.status_code == 200
        assert edited.json()["user_note"] == "Updated"

        request.status = "approved"
        db.commit()
        rejected_delete = client.delete(
            f"/api/v1/movie-requests/{request.id}",
            headers=auth_headers(user),
        )
        assert rejected_delete.status_code == 400

        request.status = "pending"
        db.commit()
        deleted = client.delete(
            f"/api/v1/movie-requests/{request.id}",
            headers=auth_headers(user),
        )
        assert deleted.status_code == 200
        assert db.query(MovieRequest).count() == 0
    finally:
        app.dependency_overrides.clear()


def test_admin_approval_imports_movie_and_links_request(db):
    admin = create_user(db, username="admin-user", is_admin=True)
    user = create_user(db)
    request = MovieRequest(tmdb_id=680, title="Pulp Fiction", status="pending")
    db.add(request)
    db.flush()
    db.add(MovieRequestSupporter(request_id=request.id, user_id=user.id))
    db.commit()
    app.dependency_overrides[get_db] = override_db(db)

    try:
        response = client.post(
            f"/api/v1/admin/movie-requests/{request.id}/approve",
            headers=auth_headers(admin),
            json={
                "tmdb_id": 680,
                "title": "Pulp Fiction",
                "release_date": "1994-09-10",
                "overview": "Stories collide.",
                "poster_path": "/poster.jpg",
                "backdrop_path": "/backdrop.jpg",
                "genres": [{"id": 80, "name": "Crime"}],
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "approved"
        assert data["movie_id"] is not None

        movie = db.query(Movie).filter(Movie.tmdb_id == 680).first()
        assert movie is not None
        assert movie.title == "Pulp Fiction"
        assert db.query(MovieRequest).filter(MovieRequest.id == request.id).first().movie_id == movie.id
    finally:
        app.dependency_overrides.clear()


@patch("app.api.routes.search.httpx.AsyncClient.get", new_callable=AsyncMock)
def test_search_returns_local_movies_before_tmdb_and_marks_imported(mock_get, db):
    imported_movie = Movie(tmdb_id=603, title="The Matrix", poster_path="/matrix.jpg")
    db.add(imported_movie)
    db.commit()
    drop = WeeklyDrop(
        movie_id=imported_movie.id,
        start_date=date(2026, 5, 4),
        end_date=date(2026, 5, 10),
        is_active=False,
    )
    db.add(drop)
    db.commit()

    tmdb_response = MagicMock()
    tmdb_response.raise_for_status.return_value = None
    tmdb_response.json.return_value = {
        "results": [
            {"id": 603, "title": "The Matrix", "release_date": "1999-03-31"},
            {"id": 604, "title": "The Matrix Reloaded", "release_date": "2003-05-15"},
        ]
    }
    mock_get.return_value = tmdb_response
    app.dependency_overrides[get_db] = override_db(db)

    try:
        response = client.get("/api/v1/search?query=Matrix")
        assert response.status_code == 200
        data = response.json()
        assert data["movies"][0]["title"] == "The Matrix"
        assert data["movies"][0]["id"] == imported_movie.id
        assert data["movies"][0]["drop_id"] == drop.id
        assert data["movies"][0]["path"] == f"/results/{drop.id}"
        imported_tmdb = next(item for item in data["tmdb"] if item["tmdb_id"] == 603)
        missing_tmdb = next(item for item in data["tmdb"] if item["tmdb_id"] == 604)
        assert imported_tmdb["imported_movie_id"] == imported_movie.id
        assert imported_tmdb["imported_drop_id"] == drop.id
        assert imported_tmdb["imported_path"] == f"/results/{drop.id}"
        assert imported_tmdb["requestable"] is False
        assert missing_tmdb["requestable"] is True
    finally:
        app.dependency_overrides.clear()


@patch("app.api.routes.search.httpx.AsyncClient.get", new_callable=AsyncMock)
def test_search_suggests_close_movie_titles_for_typos(mock_get, db):
    db.add(Movie(tmdb_id=603, title="The Matrix"))
    db.commit()

    tmdb_response = MagicMock()
    tmdb_response.raise_for_status.return_value = None
    tmdb_response.json.return_value = {"results": []}
    mock_get.return_value = tmdb_response
    app.dependency_overrides[get_db] = override_db(db)

    try:
        response = client.get("/api/v1/search?query=matrx")
        assert response.status_code == 200
        assert "The Matrix" in response.json()["suggestions"]
    finally:
        app.dependency_overrides.clear()


@patch("app.api.routes.search.httpx.AsyncClient.get", new_callable=AsyncMock)
def test_search_can_skip_tmdb_for_live_local_suggestions(mock_get, db):
    db.add(Movie(tmdb_id=603, title="The Matrix"))
    db.commit()
    app.dependency_overrides[get_db] = override_db(db)

    try:
        response = client.get("/api/v1/search?query=mat&include_tmdb=false")
        assert response.status_code == 200
        data = response.json()
        assert data["movies"][0]["title"] == "The Matrix"
        assert data["tmdb"] == []
        mock_get.assert_not_called()
    finally:
        app.dependency_overrides.clear()
