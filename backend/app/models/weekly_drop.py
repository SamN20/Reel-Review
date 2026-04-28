from sqlalchemy import Column, Integer, Date, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base_class import Base

class WeeklyDrop(Base):
    __tablename__ = "weekly_drops"

    id = Column(Integer, primary_key=True, index=True)
    movie_id = Column(Integer, ForeignKey("movies.id"), nullable=False)
    
    start_date = Column(Date, nullable=False, index=True) # Monday
    end_date = Column(Date, nullable=False, index=True)   # Sunday

    is_active = Column(Boolean, default=True)

    movie = relationship("Movie")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
