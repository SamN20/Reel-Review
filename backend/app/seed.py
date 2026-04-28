import logging
from datetime import date, timedelta
from app.db.session import SessionLocal
from app.models.movie import Movie
from app.models.weekly_drop import WeeklyDrop

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

import random
from app.models.user import User
from app.models.rating import Rating

def seed_data() -> None:
    db = SessionLocal()
    try:
        if db.query(WeeklyDrop).count() > 1:
            logger.info("Database already seeded with past drops.")
            return

        logger.info("Seeding past movies...")
        past_movies_data = [
            {
                "title": "Dune: Part Two",
                "release_date": date(2024, 3, 1),
                "overview": "Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.",
                "poster_path": "/1pdfLvkbY9ohJlCjQH2TGpiH057.jpg",
                "backdrop_path": "/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg"
            },
            {
                "title": "Blade Runner 2049",
                "release_date": date(2017, 10, 4),
                "overview": "Thirty years after the events of the first film, a new blade runner, LAPD Officer K, unearths a long-buried secret.",
                "poster_path": "/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg",
                "backdrop_path": "/ilRyazdQYKEebnv9VtOVKlpmOQ.jpg"
            },
            {
                "title": "Everything Everywhere All at Once",
                "release_date": date(2022, 3, 24),
                "overview": "An aging Chinese immigrant is swept up in an insane adventure across universes.",
                "poster_path": "/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg",
                "backdrop_path": "/wp3vpSWq1R6hD4jI6hE18rN0S2O.jpg"
            },
            {
                "title": "The Batman",
                "release_date": date(2022, 3, 1),
                "overview": "In his second year of fighting crime, Batman uncovers corruption in Gotham City.",
                "poster_path": "/74xTEgt7R36Fpooo50r9T25onhq.jpg",
                "backdrop_path": "/b0PlSFdSmBg4HHCvB2k7WjJhiP7.jpg"
            }
        ]

        # Ensure seed users exist
        users = []
        for i in range(1, 4):
            user = db.query(User).filter(User.username == f"testuser{i}").first()
            if not user:
                user = User(keyn_id=f"test_id_{i}", username=f"testuser{i}")
                db.add(user)
                db.commit()
                db.refresh(user)
            users.append(user)

        today = date.today()
        # Ensure Inception (Current Drop) exists
        current_movie = db.query(Movie).filter(Movie.title == "Inception").first()
        if not current_movie:
            current_movie = Movie(
                title="Inception",
                release_date=date(2010, 7, 16),
                overview="A thief who steals corporate secrets through the use of dream-sharing technology...",
                poster_path="/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
                backdrop_path="/s3TBrRGB1inv7gFpzPhf0P0tYdr.jpg"
            )
            db.add(current_movie)
            db.commit()
            db.refresh(current_movie)

            start_date = today - timedelta(days=today.weekday())
            end_date = start_date + timedelta(days=6)
            drop = WeeklyDrop(movie_id=current_movie.id, start_date=start_date, end_date=end_date, is_active=True)
            db.add(drop)
            db.commit()

        # Add past drops and ratings
        for i, m_data in enumerate(past_movies_data):
            movie = db.query(Movie).filter(Movie.title == m_data["title"]).first()
            if not movie:
                movie = Movie(**m_data)
                db.add(movie)
                db.commit()
                db.refresh(movie)
            
            # Start dates 1, 2, 3, 4 weeks ago
            weeks_ago = i + 1
            start_date = today - timedelta(days=today.weekday()) - timedelta(weeks=weeks_ago)
            end_date = start_date + timedelta(days=6)

            drop = db.query(WeeklyDrop).filter(WeeklyDrop.movie_id == movie.id).first()
            if not drop:
                drop = WeeklyDrop(movie_id=movie.id, start_date=start_date, end_date=end_date, is_active=True)
                db.add(drop)
                db.commit()
                db.refresh(drop)

                # Add some random ratings for this past drop
                for u in users:
                    rating = Rating(
                        user_id=u.id,
                        movie_id=movie.id,
                        weekly_drop_id=drop.id,
                        overall_score=random.choice([70, 80, 90, 100]),
                        is_late=False
                    )
                    db.add(rating)
                db.commit()

        logger.info("Seed data successfully created with past drops and ratings!")
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
