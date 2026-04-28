from sqlalchemy import Column, Integer, String, Date, Text, DateTime
from sqlalchemy.sql import func

from app.db.base_class import Base

class Movie(Base):
    __tablename__ = "movies"

    id = Column(Integer, primary_key=True, index=True)
    tmdb_id = Column(Integer, unique=True, index=True, nullable=True) # Optional for custom movies
    title = Column(String, index=True, nullable=False)
    release_date = Column(Date, nullable=True)
    overview = Column(Text, nullable=True)
    poster_path = Column(String, nullable=True)
    backdrop_path = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
