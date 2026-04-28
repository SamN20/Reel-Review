import logging
from app.db.session import engine
from app.db.base import Base

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_db() -> None:
    logger.info("Creating initial data")
    Base.metadata.create_all(bind=engine)
    logger.info("Initial data created")

if __name__ == "__main__":
    init_db()
