from app.api.routes.admin import (
    get_leaderboard_settings,
    get_watch_party_discord_settings,
    update_leaderboard_settings,
    update_watch_party_discord_settings,
)
from app.models.admin_setting import AdminSetting
from app.schemas.admin_settings import LeaderboardSettings, WatchPartyDiscordSettings, WatchPartyChannelConfig


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


def test_watch_party_discord_settings_defaults(db):
    settings = get_watch_party_discord_settings(db)

    assert len(settings.channels) == 2
    assert settings.channels[0].key == "bynolo_discord_one"

    stored = db.query(AdminSetting).filter(AdminSetting.key == "watch_party_discord").first()
    assert stored is not None


def test_update_watch_party_discord_settings(db):
    payload = WatchPartyDiscordSettings(
        channels=[
            WatchPartyChannelConfig(
                key="public_watch_party_one",
                label="Public Watch Party One",
                link_url="https://discord.com/channels/1",
                description="Open server room one.",
            ),
            WatchPartyChannelConfig(
                key="public_watch_party_two",
                label="Public Watch Party Two",
                link_url="https://discord.com/channels/2",
                description="Open server room two.",
            ),
        ]
    )

    updated = update_watch_party_discord_settings(payload, db)

    assert updated.channels[0].key == "public_watch_party_one"
    assert updated.channels[1].label == "Public Watch Party Two"

    stored = db.query(AdminSetting).filter(AdminSetting.key == "watch_party_discord").first()
    assert stored is not None
    assert stored.value["channels"][0]["link_url"] == "https://discord.com/channels/1"
