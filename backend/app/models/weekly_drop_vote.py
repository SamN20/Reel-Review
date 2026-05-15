from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy import JSON
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base_class import Base


class WeeklyDropOption(Base):
    __tablename__ = "weekly_drop_options"
    __table_args__ = (
        UniqueConstraint("weekly_drop_id", "movie_id", name="uq_weekly_drop_option_movie"),
        UniqueConstraint("weekly_drop_id", "display_order", name="uq_weekly_drop_option_order"),
    )

    id = Column(Integer, primary_key=True, index=True)
    weekly_drop_id = Column(Integer, ForeignKey("weekly_drops.id"), nullable=False, index=True)
    movie_id = Column(Integer, ForeignKey("movies.id"), nullable=False, index=True)
    display_order = Column(Integer, nullable=False)
    source = Column(String, nullable=False, default="fallback")
    smart_score = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    drop = relationship("WeeklyDrop", back_populates="options")
    movie = relationship("Movie")


class WeeklyDropBallot(Base):
    __tablename__ = "weekly_drop_ballots"
    __table_args__ = (
        UniqueConstraint("weekly_drop_id", "user_id", name="uq_weekly_drop_ballot_user"),
    )

    id = Column(Integer, primary_key=True, index=True)
    weekly_drop_id = Column(Integer, ForeignKey("weekly_drops.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    source_drop_id = Column(Integer, ForeignKey("weekly_drops.id"), nullable=True, index=True)
    ranked_movie_ids = Column(JSON().with_variant(JSONB, "postgresql"), nullable=False, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    drop = relationship("WeeklyDrop", foreign_keys=[weekly_drop_id], back_populates="ballots")
    source_drop = relationship("WeeklyDrop", foreign_keys=[source_drop_id])
    user = relationship("User")
