from datetime import date
from app.models.user import User
from app.models.movie import Movie
from app.models.weekly_drop import WeeklyDrop
from app.models.rating import Rating

def test_create_user(db):
    user = User(keyn_id="123", username="testuser", email="test@test.com")
    db.add(user)
    db.commit()
    
    assert user.id is not None
    assert user.keyn_id == "123"
    assert user.username == "testuser"

def test_create_movie(db):
    movie = Movie(title="Test Movie", overview="Test Overview")
    db.add(movie)
    db.commit()
    
    assert movie.id is not None
    assert movie.title == "Test Movie"

def test_create_weekly_drop_and_rating(db):
    # Setup user and movie
    user = User(keyn_id="456", username="rater")
    movie = Movie(title="Rate Me")
    db.add_all([user, movie])
    db.commit()
    
    # Setup weekly drop
    weekly_drop = WeeklyDrop(
        movie_id=movie.id, 
        start_date=date(2026, 4, 27),
        end_date=date(2026, 5, 3)
    )
    db.add(weekly_drop)
    db.commit()
    
    # Setup rating
    rating = Rating(
        user_id=user.id,
        movie_id=movie.id,
        weekly_drop_id=weekly_drop.id,
        overall_score=80,
        story_score=90
    )
    db.add(rating)
    db.commit()
    
    assert rating.id is not None
    assert rating.overall_score == 80
    assert rating.user.username == "rater"
    assert rating.movie.title == "Rate Me"
    assert rating.weekly_drop.start_date == date(2026, 4, 27)
