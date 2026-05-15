from datetime import date, datetime

import pytest
from fastapi import HTTPException

from app.api.routes.admin import get_drop_selection_settings, update_drop_selection_settings
from app.models.movie import Movie
from app.models.rating import Rating
from app.models.user import User
from app.models.weekly_drop import WeeklyDrop
from app.schemas.admin_settings import DropSelectionSettings
from app.services.drop_scheduler import DropSchedulerService
from app.services.drop_selection import DropSelectionService


def create_user(db, username="critic"):
    user = User(keyn_id=username, username=username, email=f"{username}@example.com", is_active=True)
    db.add(user)
    db.flush()
    return user


def create_movie(db, title, in_pool=True, genres=None):
    movie = Movie(title=title, in_pool=in_pool, genres=genres or [{"name": "Drama"}])
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


def test_drop_selection_settings_defaults_and_validation(db):
    defaults = get_drop_selection_settings(db)

    assert defaults.user_vote_total_options == 6
    assert defaults.user_vote_smart_options == 4
    assert defaults.user_vote_wildcard_options == 2

    with pytest.raises(HTTPException):
        update_drop_selection_settings(
            DropSelectionSettings(
                user_vote_total_options=5,
                user_vote_smart_options=4,
                user_vote_wildcard_options=4,
            ),
            db,
        )


def test_user_vote_options_are_shared_and_stable(db):
    source_movie = create_movie(db, "Current", in_pool=False)
    source = create_drop(db, source_movie, start=date(2026, 5, 11), active=True)
    target = create_drop(db, None, start=date(2026, 5, 18), mode="user_vote")
    for title in ["Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta"]:
        create_movie(db, title, in_pool=True)

    first = DropSelectionService.generate_options(db, target)
    second_payload = DropSelectionService.serialize_next_vote(
        db,
        source_drop=source,
        target_drop=target,
        user=create_user(db),
        today=date(2026, 5, 12),
    )

    assert [option.movie_id for option in first] == [
        option["movie"]["id"] for option in second_payload["options"]
    ]
    assert len(second_payload["options"]) == 6


def test_ballot_rejected_after_source_drop_ends(db):
    source_movie = create_movie(db, "Current", in_pool=False)
    source = create_drop(db, source_movie, start=date(2026, 5, 11), active=True)
    target = create_drop(db, None, start=date(2026, 5, 18), mode="user_vote")
    option = create_movie(db, "Option", in_pool=True)
    user = create_user(db)
    DropSelectionService.generate_options(db, target)

    with pytest.raises(HTTPException):
        DropSelectionService.upsert_ballot(
            db,
            target_drop=target,
            source_drop=source,
            user=user,
            ranked_movie_ids=[option.id],
            today=date(2026, 5, 18),
        )


def test_instant_runoff_redistributes_to_winner(db):
    source = create_drop(db, create_movie(db, "Current", in_pool=False), start=date(2026, 5, 11), active=True)
    target = create_drop(db, None, start=date(2026, 5, 18), mode="user_vote")
    alpha = create_movie(db, "Alpha", in_pool=True)
    beta = create_movie(db, "Beta", in_pool=True)
    gamma = create_movie(db, "Gamma", in_pool=True)
    DropSelectionService.generate_options(db, target)

    rankings = [
        [alpha.id, beta.id, gamma.id],
        [alpha.id, beta.id, gamma.id],
        [beta.id, gamma.id, alpha.id],
        [beta.id, gamma.id, alpha.id],
        [gamma.id, beta.id, alpha.id],
    ]
    for index, ranked_ids in enumerate(rankings):
        DropSelectionService.upsert_ballot(
            db,
            target_drop=target,
            source_drop=source,
            user=create_user(db, f"user{index}"),
            ranked_movie_ids=ranked_ids,
            today=date(2026, 5, 12),
        )

    winner = DropSelectionService.instant_runoff_winner(db, target)

    assert winner.id == beta.id


def test_random_pool_rollover_sets_movie_and_removes_from_pool(db):
    create_drop(db, create_movie(db, "Previous", in_pool=False), start=date(2026, 5, 4), active=True)
    target = create_drop(db, None, start=date(2026, 5, 11), mode="random_pool")
    create_movie(db, "Pool A", in_pool=True)
    create_movie(db, "Pool B", in_pool=True)

    active = DropSchedulerService.rollover(
        db,
        now=datetime(2026, 5, 11, 4, 0, 0),
    )

    assert active.id == target.id
    assert active.movie_id is not None
    assert active.movie.in_pool is False


def test_user_vote_no_ballots_falls_back_to_first_option(db):
    target = create_drop(db, None, start=date(2026, 5, 11), mode="user_vote")
    movie = create_movie(db, "Best Available", in_pool=True)
    create_movie(db, "Another Option", in_pool=True)
    options = DropSelectionService.generate_options(db, target)

    DropSchedulerService.resolve_flexible_drop(db, target)

    assert target.movie_id == options[0].movie_id
    assert movie.in_pool is (False if target.movie_id == movie.id else True)
