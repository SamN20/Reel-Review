from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base_class import Base


class MovieRequest(Base):
    __tablename__ = "movie_requests"

    id = Column(Integer, primary_key=True, index=True)
    tmdb_id = Column(Integer, unique=True, index=True, nullable=False)
    status = Column(String, default="pending", index=True, nullable=False)
    movie_id = Column(Integer, ForeignKey("movies.id"), nullable=True)
    title = Column(String, nullable=False)
    release_date = Column(String, nullable=True)
    overview = Column(Text, nullable=True)
    poster_path = Column(String, nullable=True)
    backdrop_path = Column(String, nullable=True)
    genres = Column(JSON().with_variant(JSONB, "postgresql"), nullable=True)
    admin_reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    movie = relationship("Movie")
    supporters = relationship(
        "MovieRequestSupporter",
        back_populates="request",
        cascade="all, delete-orphan",
    )


class MovieRequestSupporter(Base):
    __tablename__ = "movie_request_supporters"
    __table_args__ = (
        UniqueConstraint("request_id", "user_id", name="uq_movie_request_supporter"),
    )

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("movie_requests.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    request = relationship("MovieRequest", back_populates="supporters")
    user = relationship("User")
