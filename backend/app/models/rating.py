from sqlalchemy import Column, Integer, ForeignKey, DateTime, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base_class import Base

class Rating(Base):
    __tablename__ = "ratings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    movie_id = Column(Integer, ForeignKey("movies.id"), nullable=False)
    weekly_drop_id = Column(Integer, ForeignKey("weekly_drops.id"), nullable=True) # If rated during a drop
    
    # Core inputs
    overall_score = Column(Integer, nullable=False) # 0-100 scale
    watched_status = Column(Boolean, default=True)
    
    # Sub-categories
    story_score = Column(Integer, nullable=True)
    performances_score = Column(Integer, nullable=True)
    visuals_score = Column(Integer, nullable=True)
    sound_score = Column(Integer, nullable=True)
    rewatchability_score = Column(Integer, nullable=True)
    enjoyment_score = Column(Integer, nullable=True)
    emotional_impact_score = Column(Integer, nullable=True)
    
    # Text Review
    review_text = Column(Text, nullable=True)
    is_anonymous = Column(Boolean, default=False)
    has_spoilers = Column(Boolean, default=False)
    
    # Moderation
    is_flagged = Column(Boolean, default=False)
    is_approved = Column(Boolean, default=True)
    is_hidden = Column(Boolean, default=False)
    
    is_late = Column(Boolean, default=False)
    
    user = relationship("User")
    movie = relationship("Movie")
    weekly_drop = relationship("WeeklyDrop")
    replies = relationship("ReviewReply", back_populates="rating")
    likes = relationship("ReviewLike", back_populates="rating")
    reports = relationship("ReviewReport", back_populates="rating")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
