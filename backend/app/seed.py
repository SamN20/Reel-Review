import logging
from datetime import date, timedelta
from app.db.session import SessionLocal
from app.models.movie import Movie
from app.models.weekly_drop import WeeklyDrop

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def seed_data() -> None:
    db = SessionLocal()
    try:
        # Check if drop exists
        if db.query(WeeklyDrop).first():
            logger.info("Database already seeded with a weekly drop.")
            return

        logger.info("Creating seed movie...")
        movie = Movie(
            title="Inception",
            release_date=date(2010, 7, 16),
            overview="A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
            poster_path="/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
            backdrop_path="/s3TBrRGB1inv7gFpzPhf0P0tYdr.jpg"
        )
        db.add(movie)
        db.commit()
        db.refresh(movie)

        logger.info("Creating active weekly drop...")
        today = date.today()
        # Ensure it covers today
        start_date = today - timedelta(days=today.weekday()) # Monday
        end_date = start_date + timedelta(days=6) # Sunday
        
        drop = WeeklyDrop(
            movie_id=movie.id,
            start_date=start_date,
            end_date=end_date,
            is_active=True
        )
        db.add(drop)
        db.commit()
        logger.info("Seed data successfully created!")
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
