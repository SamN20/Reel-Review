from datetime import date, timedelta

from app.models.movie import Movie
from app.models.rating import Rating
from app.models.user import User
from app.models.weekly_drop import WeeklyDrop
from app.services.ratings_calculator import RatingsCalculator


def test_sentiment_overview_uses_most_recent_rated_drop_when_no_active_drop(db):
    user = User(keyn_id="900", username="dashboard-user")
    rated_movie = Movie(title="Rated Movie")
    unrated_movie = Movie(title="Unrated Movie")
    db.add_all([user, rated_movie, unrated_movie])
    db.commit()

    rated_drop = WeeklyDrop(
        movie_id=rated_movie.id,
        start_date=date.today() - timedelta(days=14),
        end_date=date.today() - timedelta(days=7),
        is_active=False,
    )
    unrated_drop = WeeklyDrop(
        movie_id=unrated_movie.id,
        start_date=date.today() - timedelta(days=7),
        end_date=date.today(),
        is_active=False,
    )
    db.add_all([rated_drop, unrated_drop])
    db.commit()

    db.add(
        Rating(
            user_id=user.id,
            movie_id=rated_movie.id,
            weekly_drop_id=rated_drop.id,
            overall_score=82,
            is_approved=True,
        )
    )
    db.commit()

    sentiment = RatingsCalculator.get_sentiment_overview(db)

    assert sentiment["drop_id"] == rated_drop.id
    assert sentiment["movie_title"] == "Rated Movie"
    assert sentiment["total_ratings"] == 1
    assert sum(bucket["count"] for bucket in sentiment["data"]) == 1


def test_subcategory_insights_include_average_scores(db):
    user = User(keyn_id="901", username="insights-user")
    movie = Movie(title="Insights Movie")
    drop = WeeklyDrop(
        movie=movie,
        start_date=date.today() - timedelta(days=7),
        end_date=date.today(),
        is_active=True,
    )
    db.add_all([user, movie, drop])
    db.commit()

    db.add_all(
        [
            Rating(
                user_id=user.id,
                movie_id=movie.id,
                weekly_drop_id=drop.id,
                overall_score=70,
                visuals_score=80,
                story_score=60,
                is_approved=True,
            ),
            Rating(
                user_id=user.id,
                movie_id=movie.id,
                weekly_drop_id=drop.id,
                overall_score=90,
                visuals_score=100,
                is_approved=True,
            ),
        ]
    )
    db.commit()

    insights = RatingsCalculator.get_subcategory_insights(db)
    visuals = next(item for item in insights if item["subject"] == "Visuals")
    story = next(item for item in insights if item["subject"] == "Story")
    sound = next(item for item in insights if item["subject"] == "Sound")

    assert visuals["count"] == 2
    assert visuals["average_score"] == 90.0
    assert story["count"] == 1
    assert story["average_score"] == 60.0
    assert sound["count"] == 0
    assert sound["average_score"] is None


def test_engagement_history_excludes_future_drops(db):
    user = User(keyn_id="902", username="history-user")
    current_movie = Movie(title="Current Movie")
    future_movie = Movie(title="Future Movie")
    db.add_all([user, current_movie, future_movie])
    db.commit()

    current_drop = WeeklyDrop(
        movie_id=current_movie.id,
        start_date=date.today() - timedelta(days=7),
        end_date=date.today(),
        is_active=False,
    )
    future_drop = WeeklyDrop(
        movie_id=future_movie.id,
        start_date=date.today() + timedelta(days=7),
        end_date=date.today() + timedelta(days=14),
        is_active=False,
    )
    db.add_all([current_drop, future_drop])
    db.commit()

    db.add(
        Rating(
            user_id=user.id,
            movie_id=current_movie.id,
            weekly_drop_id=current_drop.id,
            overall_score=88,
            is_approved=True,
        )
    )
    db.commit()

    history = RatingsCalculator.get_engagement_history(db, total_active_users=1)

    assert len(history) == 1
    assert history[0]["movie_title"] == "Current Movie"
