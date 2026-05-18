from __future__ import annotations

from datetime import datetime, timezone
import secrets
import string

from sqlalchemy.orm import Session

from app.models.user import User

INVITE_CODE_LENGTH = 10
INVITE_CODE_ALPHABET = string.ascii_uppercase + string.digits


def generate_invite_code() -> str:
    return "".join(secrets.choice(INVITE_CODE_ALPHABET) for _ in range(INVITE_CODE_LENGTH))


def is_legacy_invite_code(invite_code: str | None) -> bool:
    return bool(invite_code and invite_code.upper().startswith("LEGACY"))


def ensure_user_invite_code(db: Session, user: User) -> str:
    if user.invite_code and not is_legacy_invite_code(user.invite_code):
        return user.invite_code

    while True:
        candidate = generate_invite_code()
        exists = db.query(User.id).filter(User.invite_code == candidate).first()
        if not exists:
            user.invite_code = candidate
            return candidate


def resolve_inviter_by_code(db: Session, invite_code: str | None) -> User | None:
    if not invite_code:
        return None
    normalized = invite_code.strip().upper()
    if not normalized:
        return None
    return db.query(User).filter(User.invite_code == normalized).first()


def can_attribute_referral(user: User, inviter: User | None) -> bool:
    if inviter is None:
        return False
    if user.id is not None and inviter.id == user.id:
        return False
    if user.referred_by_user_id is not None or user.referral_attributed_at is not None:
        return False
    return True


def attribute_referral(user: User, inviter: User | None) -> bool:
    if not can_attribute_referral(user, inviter):
        return False
    user.referred_by_user_id = inviter.id
    user.referral_attributed_at = datetime.now(timezone.utc)
    return True
