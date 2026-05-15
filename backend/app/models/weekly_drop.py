from sqlalchemy import Column, Integer, String, Date, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base_class import Base

class WeeklyDrop(Base):
    __tablename__ = "weekly_drops"

    id = Column(Integer, primary_key=True, index=True)
    movie_id = Column(Integer, ForeignKey("movies.id"), nullable=True)
    
    start_date = Column(Date, nullable=False, index=True) # Monday
    end_date = Column(Date, nullable=False, index=True)   # Sunday

    is_active = Column(Boolean, default=True)
    mode = Column(String, default="admin_pick")
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    movie = relationship("Movie")
    options = relationship("WeeklyDropOption", back_populates="drop", cascade="all, delete-orphan")
    ballots = relationship(
        "WeeklyDropBallot",
        back_populates="drop",
        cascade="all, delete-orphan",
        foreign_keys="WeeklyDropBallot.weekly_drop_id",
    )
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
