from datetime import date, timedelta

import pytest

from fastapi import HTTPException
from app.api.routes.admin import get_imported_movies, get_movie_analytics
from app.models.movie import Movie
from app.models.rating import Rating
from app.models.user import User
from app.models.weekly_drop import WeeklyDrop


def test_movie_analytics_rejects_missing_movie(db):
    with pytest.raises(HTTPException) as exc_info:
        get_movie_analytics(404, db)

    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Movie not found"


def test_movie_analytics_aggregates_approved_visible_ratings(db):
    user_one = User(keyn_id="user-1", username="visible-user")
    user_two = User(keyn_id="user-2", username="anonymous-user")
    hidden_user = User(keyn_id="user-3", username="hidden-user")
    movie = Movie(
        title="Analytics Movie",
        release_date=date(2024, 1, 5),
        poster_path="/poster.jpg",
        backdrop_path="/backdrop.jpg",
        director_name="Sample Director",
        genres=[{"id": 18, "name": "Drama"}],
    )
    db.add_all([user_one, user_two, hidden_user, movie])
    db.commit()

    drop = WeeklyDrop(
        movie_id=movie.id,
        start_date=date.today() - timedelta(days=7),
        end_date=date.today(),
        is_active=False,
    )
    db.add(drop)
    db.commit()

    db.add_all(
        [
            Rating(
                user_id=user_one.id,
                movie_id=movie.id,
                weekly_drop_id=drop.id,
                overall_score=80,
                story_score=70,
                visuals_score=90,
                review_text="Strong movie.",
                has_spoilers=False,
                is_anonymous=False,
                is_late=False,
                is_approved=True,
                is_hidden=False,
            ),
            Rating(
                user_id=user_two.id,
                movie_id=movie.id,
                weekly_drop_id=drop.id,
                overall_score=100,
                story_score=90,
                visuals_score=100,
                review_text="Secret spoiler take.",
                has_spoilers=True,
                is_anonymous=True,
                is_late=True,
                is_approved=True,
                is_hidden=False,
            ),
            Rating(
                user_id=hidden_user.id,
                movie_id=movie.id,
                weekly_drop_id=drop.id,
                overall_score=10,
                review_text="Hidden rating.",
                is_approved=True,
                is_hidden=True,
            ),
            Rating(
                user_id=hidden_user.id,
                movie_id=movie.id,
                weekly_drop_id=drop.id,
                overall_score=20,
                review_text="Unapproved rating.",
                is_approved=False,
                is_hidden=False,
            ),
        ]
    )
    db.commit()

    data = get_movie_analytics(movie.id, db)
    movie_rows = get_imported_movies(db)

    assert data["movie"]["title"] == "Analytics Movie"
    assert data["movie"]["genres"] == [{"id": 18, "name": "Drama"}]
    movie_row = next(item for item in movie_rows if item["id"] == movie.id)
    assert movie_row["genres"] == [{"id": 18, "name": "Drama"}]
    assert movie_row["average_score"] == 90.0
    assert movie_row["total_ratings"] == 2

    assert data["stats"]["total_ratings"] == 2
    assert data["stats"]["average_score"] == 90.0
    assert data["stats"]["highest_score"] == 100
    assert data["stats"]["lowest_score"] == 80
    assert data["stats"]["median_score"] == 90.0
    assert data["stats"]["score_spread"] == 10.0
    assert data["stats"]["text_review_count"] == 2
    assert data["stats"]["spoiler_review_count"] == 1

    buckets = {bucket["score"]: bucket["count"] for bucket in data["score_distribution"]}
    assert buckets[80] == 1
    assert buckets[100] == 1
    assert buckets[10] == 0
    assert buckets[20] == 0

    story = next(item for item in data["subcategories"] if item["key"] == "story")
    visuals = next(item for item in data["subcategories"] if item["key"] == "visuals")
    sound = next(item for item in data["subcategories"] if item["key"] == "sound")
    assert story["count"] == 2
    assert story["average_score"] == 80.0
    assert visuals["count"] == 2
    assert visuals["average_score"] == 95.0
    assert sound["count"] == 0
    assert sound["average_score"] is None

    assert len(data["ratings"]) == 2
    usernames = {rating["username"] for rating in data["ratings"]}
    assert usernames == {"visible-user", "anonymous-user"}
    anonymous_rating = next(rating for rating in data["ratings"] if rating["username"] == "anonymous-user")
    assert anonymous_rating["is_anonymous"] is True
    assert anonymous_rating["has_spoilers"] is True
    assert anonymous_rating["is_late"] is True
    assert anonymous_rating["weekly_drop_id"] == drop.id
