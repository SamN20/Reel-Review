from sqlalchemy import Column, Integer, String, Date, Text, DateTime, Boolean, JSON
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func

from app.db.base_class import Base

class Movie(Base):
    __tablename__ = "movies"

    id = Column(Integer, primary_key=True, index=True)
    tmdb_id = Column(Integer, unique=True, index=True, nullable=True) # Optional for custom movies
    title = Column(String, index=True, nullable=False)
    release_date = Column(Date, nullable=True)
    overview = Column(Text, nullable=True)
    director_name = Column(String, nullable=True)
    poster_path = Column(String, nullable=True)
    backdrop_path = Column(String, nullable=True)
    trailer_youtube_key = Column(String, nullable=True)
    
    genres = Column(JSON().with_variant(JSONB, 'postgresql'), nullable=True)
    cast = Column(JSON().with_variant(JSONB, 'postgresql'), nullable=True)
    keywords = Column(JSON().with_variant(JSONB, 'postgresql'), nullable=True)
    watch_providers = Column(JSON().with_variant(JSONB, 'postgresql'), nullable=True)
    watch_providers_updated_at = Column(DateTime(timezone=True), nullable=True)
    
    in_pool = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
