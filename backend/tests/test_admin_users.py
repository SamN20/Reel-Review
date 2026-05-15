from app.api.routes.admin import get_users
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
