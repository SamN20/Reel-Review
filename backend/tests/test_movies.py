from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.api.deps import get_db
from app.api.routes import movies as movies_routes
from app.models.movie import Movie


class FakeQuery:
    def __init__(self, results):
        self._results = results

    def filter(self, *args, **kwargs):
        return self

    def group_by(self, *args, **kwargs):
        return self

    def all(self):
        return self._results


class FakeSession:
    def __init__(self, movies, drop_rows):
        self._movies = movies
        self._drop_rows = drop_rows

    def query(self, *args, **kwargs):
        if args and args[0] is Movie:
            return FakeQuery(self._movies)
        return FakeQuery(self._drop_rows)


@pytest.fixture
def test_client(db: Session):
    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


def test_get_movies_by_director(test_client, db: Session):
    movies = [
        Movie(title="Director Movie 1", director_name="Ava Writer"),
        Movie(title="Director Movie 2", director_name="Ava Writer"),
        Movie(title="Other Movie", director_name="Other Director"),
    ]
    db.add_all(movies)
    db.commit()

    response = test_client.get("/api/v1/movies/director/Ava Writer")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert {movie["title"] for movie in data} == {"Director Movie 1", "Director Movie 2"}


def test_get_movies_by_actor_profile():
    movies = [
        SimpleNamespace(
            id=1,
            title="Actor Movie 1",
            poster_path=None,
            cast=[{"name": "Actor One"}],
        ),
        SimpleNamespace(
            id=2,
            title="Actor Movie 2",
            poster_path=None,
            cast=[{"name": "Actor One", "profile_path": "/actor.jpg"}],
        ),
    ]
    drop_rows = [SimpleNamespace(movie_id=2, drop_id=9)]
    fake_db = FakeSession(movies, drop_rows)

    response = movies_routes.get_movies_by_actor("Actor One", fake_db)

    assert response["actor"]["name"] == "Actor One"
    assert response["actor"]["profile_path"] == "/actor.jpg"
    assert len(response["movies"]) == 2
    assert response["movies"][1]["drop_id"] == 9
