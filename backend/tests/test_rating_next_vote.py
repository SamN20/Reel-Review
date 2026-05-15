from datetime import date

from app.api.routes.ratings import create_rating
from app.models.movie import Movie
from app.models.user import User
from app.models.weekly_drop import WeeklyDrop
from app.schemas.rating import RatingCreate


def create_movie(db, title, in_pool=False):
    movie = Movie(title=title, in_pool=in_pool, genres=[{"name": "Drama"}])
    db.add(movie)
    db.flush()
    return movie


def create_drop(db, movie=None, start=date(2026, 5, 11), mode="admin_pick", active=False):
    drop = WeeklyDrop(
        movie_id=movie.id if movie else None,
        start_date=start,
        end_date=date.fromordinal(start.toordinal() + 6),
        mode=mode,
        is_active=active,
    )
    db.add(drop)
    db.flush()
    return drop


def create_user(db):
    user = User(keyn_id="next-vote-user", username="next-vote-user", email="next@example.com", is_active=True)
    db.add(user)
    db.flush()
    return user


def rating_payload(drop_id: int):
    return RatingCreate(
        weekly_drop_id=drop_id,
        overall_score=80,
        watched_status=True,
    )


def test_next_vote_prompt_only_for_active_current_drop(db):
    user = create_user(db)
    active_drop = create_drop(db, create_movie(db, "Current"), start=date(2026, 5, 11), active=True)
    past_drop = create_drop(db, create_movie(db, "Past"), start=date(2026, 5, 4), active=False)
    create_drop(db, None, start=date(2026, 5, 18), mode="user_vote", active=False)
    for title in ["A", "B", "C", "D", "E", "F"]:
        create_movie(db, title, in_pool=True)
    db.commit()

    past_response = create_rating(rating_payload(past_drop.id), db, user)
    active_response = create_rating(rating_payload(active_drop.id), db, user)

    assert past_response["next_vote"] is None
    assert active_response["next_vote"] is not None
