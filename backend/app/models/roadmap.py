from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base_class import Base


class RoadmapItem(Base):
    __tablename__ = "roadmap_items"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, nullable=False, default="next", index=True)
    is_public = Column(Boolean, nullable=False, default=False, index=True)
    sort_order = Column(Integer, nullable=False, default=0, index=True)
    cta_label = Column(String(80), nullable=True)
    cta_url = Column(String(500), nullable=True)
    source_suggestion_id = Column(
        Integer,
        ForeignKey(
            "feature_suggestions.id",
            use_alter=True,
            name="fk_roadmap_items_source_suggestion_id_feature_suggestions",
        ),
        nullable=True,
    )
    shipped_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    source_suggestion = relationship(
        "FeatureSuggestion",
        foreign_keys=[source_suggestion_id],
        post_update=True,
    )


class FeatureSuggestion(Base):
    __tablename__ = "feature_suggestions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, nullable=False, default="pending", index=True)
    admin_note = Column(Text, nullable=True)
    promoted_item_id = Column(Integer, ForeignKey("roadmap_items.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User")
    promoted_item = relationship("RoadmapItem", foreign_keys=[promoted_item_id])
