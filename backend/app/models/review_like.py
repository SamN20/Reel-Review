from sqlalchemy import CheckConstraint, Column, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class ReviewLike(Base):
    __tablename__ = "review_likes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rating_id = Column(Integer, ForeignKey("ratings.id"), nullable=True, index=True)
    reply_id = Column(Integer, ForeignKey("review_replies.id"), nullable=True, index=True)

    __table_args__ = (
        UniqueConstraint("user_id", "rating_id", name="uq_review_like_user_rating"),
        UniqueConstraint("user_id", "reply_id", name="uq_review_like_user_reply"),
        CheckConstraint(
            "(rating_id IS NOT NULL AND reply_id IS NULL) OR (rating_id IS NULL AND reply_id IS NOT NULL)",
            name="ck_review_like_single_target",
        ),
    )

    user = relationship("User")
    rating = relationship("Rating", back_populates="likes")
    reply = relationship("ReviewReply")

