from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
import secrets
import string

from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base_class import Base


def _generate_invite_code() -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(10))

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    keyn_id = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=True)
    display_name = Column(String, nullable=True)
    invite_code = Column(String, unique=True, index=True, nullable=False, default=_generate_invite_code)
    referred_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    referral_attributed_at = Column(DateTime(timezone=True), nullable=True)

    # Privacy & Preferences
    use_display_name = Column(Boolean, default=True)
    show_on_leaderboard = Column(Boolean, default=True)
    public_profile = Column(Boolean, default=False)
    
    # Preferences and stats could be added later
    is_admin = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    referred_by = relationship("User", remote_side=[id], backref="referred_users")
