from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base_class import Base


class WatchParty(Base):
    __tablename__ = "watch_parties"

    id = Column(Integer, primary_key=True, index=True)
    weekly_drop_id = Column(Integer, ForeignKey("weekly_drops.id"), nullable=False, index=True)
    creator_user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(160), nullable=False)
    host_mode = Column(String(32), nullable=False)
    external_url = Column(String(500), nullable=True)
    discord_channel_key = Column(String(64), nullable=True)
    scheduled_for = Column(DateTime(timezone=True), nullable=False, index=True)
    timezone_label = Column(String(80), nullable=False)
    region = Column(String(120), nullable=True)
    platform = Column(String(120), nullable=True)
    capacity = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    visibility_hint = Column(String(32), nullable=True)
    status = Column(String(32), nullable=False, default="scheduled", index=True)
    reminder_sent_at = Column(DateTime(timezone=True), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    drop = relationship("WeeklyDrop")
    creator = relationship("User")
    rsvps = relationship("WatchPartyRsvp", back_populates="watch_party", cascade="all, delete-orphan")


class WatchPartyRsvp(Base):
    __tablename__ = "watch_party_rsvps"
    __table_args__ = (
        UniqueConstraint("watch_party_id", "user_id", name="uq_watch_party_rsvp_user"),
    )

    id = Column(Integer, primary_key=True, index=True)
    watch_party_id = Column(Integer, ForeignKey("watch_parties.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    status = Column(String(32), nullable=False, default="going")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    watch_party = relationship("WatchParty", back_populates="rsvps")
    user = relationship("User")
