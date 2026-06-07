from datetime import datetime
from typing import Any, Dict
from pydantic import BaseModel


class AdminSettingOut(BaseModel):
    key: str
    value: Dict[str, Any]
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


class LeaderboardSettings(BaseModel):
    categories_min_ratings: int
    actors_min_ratings: int
    directors_min_ratings: int
    divisive_min_ratings: int


class DropSelectionSettings(BaseModel):
    user_vote_total_options: int
    user_vote_smart_options: int
    user_vote_wildcard_options: int


class OnboardingSettings(BaseModel):
    always_play: bool


class NotificationBannerSettings(BaseModel):
    enabled: bool
    messages: list[str]
    scroll_enabled: bool
    link_url: str


class WatchPartyChannelConfig(BaseModel):
    key: str
    label: str
    link_url: str
    description: str = ""


class WatchPartyDiscordSettings(BaseModel):
    channels: list[WatchPartyChannelConfig]
