from datetime import datetime, timezone

from app.api.routes.admin import get_referral_admin_summary, get_users
from app.models.user import User


def test_admin_users_normalizes_nullable_legacy_fields(db):
    user = User(
        keyn_id="legacy",
        username="legacy",
        email=None,
        use_display_name=None,
        show_on_leaderboard=None,
        public_profile=None,
        is_admin=None,
        is_active=None,
    )
    db.add(user)
    db.commit()

    users = get_users(db)

    assert users[0]["use_display_name"] is True
    assert users[0]["show_on_leaderboard"] is True
    assert users[0]["public_profile"] is False
    assert users[0]["is_admin"] is False
    assert users[0]["is_active"] is True
    assert users[0]["created_at"] is not None


def test_admin_referrals_summary(db):
    inviter = User(
        keyn_id="inviter",
        username="inviter",
        email="inviter@example.com",
        invite_code="INVITER01",
    )
    referred = User(
        keyn_id="friend",
        username="friend",
        email="friend@example.com",
        referred_by=inviter,
        referral_attributed_at=datetime.now(timezone.utc),
    )
    db.add_all([inviter, referred])
    db.commit()

    summary = get_referral_admin_summary(db)

    assert summary["inviters"][0]["inviter_username"] == "inviter"
    assert summary["inviters"][0]["referral_count"] == 1
    assert summary["recent_signups"][0]["referred_username"] == "friend"
