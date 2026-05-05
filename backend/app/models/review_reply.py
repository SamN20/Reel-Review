from sqlalchemy import Column, Integer, ForeignKey, DateTime, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base_class import Base


class ReviewReply(Base):
    __tablename__ = "review_replies"

    id = Column(Integer, primary_key=True, index=True)
    rating_id = Column(Integer, ForeignKey("ratings.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    parent_reply_id = Column(Integer, ForeignKey("review_replies.id"), nullable=True, index=True)
    body = Column(Text, nullable=False)
    has_spoilers = Column(Boolean, default=False)
    is_flagged = Column(Boolean, default=False)
    is_approved = Column(Boolean, default=True)
    is_hidden = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    rating = relationship("Rating", back_populates="replies")
    user = relationship("User")
    parent_reply = relationship("ReviewReply", remote_side=[id], back_populates="child_replies")
    child_replies = relationship("ReviewReply", back_populates="parent_reply")

