from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.models.movie import Movie
from app.models.rating import Rating
from app.models.user import User
from app.models.weekly_drop import WeeklyDrop
from app.services.archive_service import ArchiveService


def _create_drop(db: Session, title: str, days_ago: int, scores: list[int]) -> WeeklyDrop:
    movie = Movie(
        title=title,
        release_date=date(2024, 1, 1),
        backdrop_path=f"/{title.lower().replace(' ', '-')}.jpg",
        genres=[{"name": "Drama"}],
    )
    db.add(movie)
    db.commit()
    db.refresh(movie)

    end_date = date.today() - timedelta(days=days_ago)
    drop = WeeklyDrop(
        movie_id=movie.id,
        start_date=end_date - timedelta(days=6),
        end_date=end_date,
    )
    db.add(drop)
    db.commit()
    db.refresh(drop)

    for index, score in enumerate(scores):
        user = User(
            keyn_id=f"{title}-{index}",
            username=f"{title.lower().replace(' ', '_')}_{index}",
            email=f"{title.lower().replace(' ', '_')}_{index}@example.com",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        db.add(
            Rating(
                user_id=user.id,
                movie_id=movie.id,
                weekly_drop_id=drop.id,
                overall_score=score,
                is_approved=True,
            )
        )
    db.commit()
    return drop


def test_archive_shelves_are_public_without_personal_state(db: Session):
    _create_drop(db, "Crowd Favorite", 8, [90, 100])
    _create_drop(db, "Quiet Pick", 15, [70])

    data = ArchiveService.get_shelves(db, current_user=None)
    shelf_ids = [shelf["id"] for shelf in data["shelves"]]
    assert "missed-by-you" not in shelf_ids
    assert "top-rated-overall" in shelf_ids

    top_shelf = next(shelf for shelf in data["shelves"] if shelf["id"] == "top-rated-overall")
    assert top_shelf["items"][0]["movie"]["title"] == "Crowd Favorite"
    assert top_shelf["items"][0]["community_score"] == 95.0
    assert top_shelf["items"][0]["user_score"] is None
    assert top_shelf["items"][0]["user_has_rated"] is False


def test_archive_shelves_include_missed_and_user_score_for_signed_in_user(db: Session):
    rated_drop = _create_drop(db, "Rated Classic", 8, [80, 90])
    missed_drop = _create_drop(db, "Missed Gem", 15, [60, 100])
    current_user = User(keyn_id="current", username="current", email="current@example.com")
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    db.add(
        Rating(
            user_id=current_user.id,
            movie_id=rated_drop.movie_id,
            weekly_drop_id=rated_drop.id,
            overall_score=100,
            is_approved=True,
        )
    )
    db.commit()

    data = ArchiveService.get_shelves(db, current_user=current_user)

    missed_shelf = next(shelf for shelf in data["shelves"] if shelf["id"] == "missed-by-you")
    assert missed_shelf["items"][0]["drop_id"] == missed_drop.id
    assert missed_shelf["items"][0]["user_has_rated"] is False

    archive_shelf = next(shelf for shelf in data["shelves"] if shelf["id"] == "complete-archive")
    rated_item = next(item for item in archive_shelf["items"] if item["drop_id"] == rated_drop.id)
    assert rated_item["user_has_rated"] is True
    assert rated_item["user_score"] == 100


def test_archive_vote_order_paginates_chronological_rows(db: Session):
    newest = _create_drop(db, "Newest", 2, [80])
    _create_drop(db, "Older", 9, [70])

    data = ArchiveService.get_vote_order(db, current_user=None, limit=1, offset=0)
    assert data["total"] == 2
    assert data["limit"] == 1
    assert data["offset"] == 0
    assert data["items"][0]["drop_id"] == newest.id
