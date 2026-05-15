from app.api.routes.admin import get_leaderboard_settings, update_leaderboard_settings
from app.models.admin_setting import AdminSetting
from app.schemas.admin_settings import LeaderboardSettings


def test_leaderboard_settings_defaults(db):
    settings = get_leaderboard_settings(db)

    assert settings.categories_min_ratings == 3
    assert settings.actors_min_ratings == 3
    assert settings.directors_min_ratings == 3
    assert settings.divisive_min_ratings == 5

    stored = db.query(AdminSetting).filter(AdminSetting.key == "leaderboards").first()
    assert stored is not None


def test_update_leaderboard_settings(db):
    payload = LeaderboardSettings(
        categories_min_ratings=4,
        actors_min_ratings=2,
        directors_min_ratings=3,
        divisive_min_ratings=6,
    )

    updated = update_leaderboard_settings(payload, db)

    assert updated.categories_min_ratings == 4
    assert updated.actors_min_ratings == 2
    assert updated.directors_min_ratings == 3
    assert updated.divisive_min_ratings == 6

    stored = db.query(AdminSetting).filter(AdminSetting.key == "leaderboards").first()
    assert stored is not None
    assert stored.value["categories"]["min_ratings"] == 4
