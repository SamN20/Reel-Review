from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.api.deps import get_db
from app.api.routes import leaderboards as leaderboards_routes
from app.models.movie import Movie
from app.models.rating import Rating
from app.models.user import User


class FakeQuery:
    def __init__(self, results, subquery=None):
        self._results = results
        self._subquery = subquery

    def join(self, *args, **kwargs):
        return self

    def outerjoin(self, *args, **kwargs):
        return self

    def filter(self, *args, **kwargs):
        return self

    def group_by(self, *args, **kwargs):
        return self

    def having(self, *args, **kwargs):
        return self

    def order_by(self, *args, **kwargs):
        return self

    def limit(self, *args, **kwargs):
        return self

    def select_from(self, *args, **kwargs):
        return self

    def all(self):
        return self._results

    def first(self):
        return self._results[0] if self._results else None

    def subquery(self):
        return self._subquery


class FakeSubquery:
    def __init__(self):
        self.c = SimpleNamespace(
            name="name",
            profile_path="profile_path",
            movie_id="movie_id",
            drop_id="drop_id",
        )


class FakeSession:
    def __init__(self, results, subquery=None):
        self._results = results
        self._subquery = subquery or FakeSubquery()
        self._calls = 0

    def query(self, *args, **kwargs):
        if args and getattr(args[0], "__tablename__", None) == "admin_settings":
            return FakeQuery([])
        if self._calls == 0:
            self._calls += 1
            return FakeQuery([], subquery=self._subquery)
        return FakeQuery(self._results)


@pytest.fixture
def test_client(db: Session):
    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


def test_get_top_users_filters_and_sorts(test_client, db: Session):
    movie = Movie(title="Votes Movie")
    db.add(movie)
    db.commit()

    user_one = User(
        keyn_id="1",
        username="leader",
        email="leader@example.com",
        show_on_leaderboard=True,
        use_display_name=None,
        public_profile=None,
    )
    user_two = User(
        keyn_id="2",
        username="hidden",
        email="hidden@example.com",
        show_on_leaderboard=False,
    )
    db.add_all([user_one, user_two])
    db.commit()

    db.add_all(
        [
            Rating(user_id=user_one.id, movie_id=movie.id, overall_score=80),
            Rating(user_id=user_one.id, movie_id=movie.id, overall_score=82),
            Rating(user_id=user_two.id, movie_id=movie.id, overall_score=90),
        ]
    )
    db.commit()

    response = test_client.get("/api/v1/leaderboards/users")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["username"] == "leader"
    assert data[0]["total_votes"] == 2
    assert data[0]["use_display_name"] is True
    assert data[0]["public_profile"] is False


def test_get_top_directors_rounds_average(test_client, db: Session):
    movies = [
        Movie(title="Dir Movie 1", director_name="Pat Doe"),
        Movie(title="Dir Movie 2", director_name="Pat Doe"),
        Movie(title="Dir Movie 3", director_name="Pat Doe"),
        Movie(title="Dir Movie 4", director_name="Pat Doe"),
        Movie(title="Dir Movie 5", director_name="Pat Doe"),
    ]
    db.add_all(movies)
    db.commit()

    user = User(keyn_id="3", username="critic", email="critic@example.com")
    db.add(user)
    db.commit()

    scores = [80, 80, 81, 82, 83]
    db.add_all(
        [
            Rating(user_id=user.id, movie_id=movie.id, overall_score=score)
            for movie, score in zip(movies, scores)
        ]
    )
    db.commit()

    response = test_client.get("/api/v1/leaderboards/directors")

    assert response.status_code == 200
    data = response.json()
    assert data[0]["name"] == "Pat Doe"
    assert data[0]["average_score"] == 81.2
    assert data[0]["movie_count"] == 5


def test_get_category_leaderboards_sorting(test_client, db: Session):
    movie_one = Movie(title="Story Winner")
    movie_two = Movie(title="Story Runner")
    db.add_all([movie_one, movie_two])
    db.commit()

    user = User(keyn_id="4", username="rater", email="rater@example.com")
    db.add(user)
    db.commit()

    for _ in range(5):
        db.add(
            Rating(
                user_id=user.id,
                movie_id=movie_one.id,
                overall_score=90,
                story_score=92,
                enjoyment_score=75,
            )
        )
        db.add(
            Rating(
                user_id=user.id,
                movie_id=movie_two.id,
                overall_score=85,
                story_score=80,
                enjoyment_score=70,
            )
        )
    db.commit()

    response = test_client.get("/api/v1/leaderboards/categories")

    assert response.status_code == 200
    data = response.json()
    assert data["story"][0]["title"] == "Story Winner"
    assert data["story"][0]["score"] == 92.0
    assert data["story"][1]["title"] == "Story Runner"


def test_get_divisive_movies_rounding():
    movies = [
        SimpleNamespace(id=1, title="Divisive Movie", poster_path=None, drop_id=3, std_dev=12.345, vote_count=7),
    ]
    fake_db = FakeSession(movies)

    response = leaderboards_routes.get_divisive_movies(fake_db)

    assert response == [
        {
            "id": 1,
            "title": "Divisive Movie",
            "poster_path": None,
            "drop_id": 3,
            "std_dev": 12.35,
            "vote_count": 7,
        }
    ]


def test_get_top_actors_rounding(test_client, db: Session):
    movie_one = Movie(
        title="Actor Showcase 1",
        cast=[
            {"name": "Actor One", "profile_path": "/actor.jpg", "order": 0},
            {"name": "Actor Two", "order": 1},
        ],
    )
    movie_two = Movie(
        title="Actor Showcase 2",
        cast=[
            {"name": "Actor One", "profile_path": "/actor.jpg", "order": 0},
        ],
    )
    db.add_all([movie_one, movie_two])
    db.commit()

    user = User(keyn_id="5", username="actorfan", email="actorfan@example.com")
    db.add(user)
    db.commit()

    db.add_all(
        [
            Rating(user_id=user.id, movie_id=movie_one.id, overall_score=88),
            Rating(user_id=user.id, movie_id=movie_one.id, overall_score=87),
            Rating(user_id=user.id, movie_id=movie_two.id, overall_score=88),
            Rating(user_id=user.id, movie_id=movie_two.id, overall_score=88),
            Rating(user_id=user.id, movie_id=movie_two.id, overall_score=88),
        ]
    )
    db.commit()

    response = test_client.get("/api/v1/leaderboards/actors")

    assert response.status_code == 200
    assert response.json()[0] == {
        "name": "Actor One",
        "profile_path": "/actor.jpg",
        "average_score": 87.8,
        "movie_count": 2,
    }


def test_get_top_actors_only_counts_principal_cast(test_client, db: Session):
    movie = Movie(
        title="Ensemble Movie",
        cast=[
            {"name": "Lead One", "order": 0},
            {"name": "Lead Two", "order": 1},
            {"name": "Lead Three", "order": 2},
            {"name": "Lead Four", "order": 3},
            {"name": "Lead Five", "order": 4},
            {"name": "Supporting Six", "order": 5},
        ],
    )
    db.add(movie)
    db.commit()

    user = User(keyn_id="6", username="ensemblefan", email="ensemble@example.com")
    db.add(user)
    db.commit()

    for score in (90, 92, 94):
        db.add(Rating(user_id=user.id, movie_id=movie.id, overall_score=score))
    db.commit()

    response = test_client.get("/api/v1/leaderboards/actors")

    assert response.status_code == 200
    actor_names = [actor["name"] for actor in response.json()]
    assert "Lead One" in actor_names
    assert "Lead Five" in actor_names
    assert "Supporting Six" not in actor_names
