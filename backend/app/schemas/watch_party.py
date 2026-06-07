from datetime import datetime, date
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator, model_validator


HostMode = Literal["bynolo_discord", "custom_link"]
RsvpStatus = Literal["going", "not_going"]
WatchPartyStatus = Literal["scheduled", "cancelled"]
VisibilityHint = Literal["public", "private_group"]


class WatchPartyDiscordChannelOut(BaseModel):
    key: str
    label: str
    link_url: str
    description: str = ""


class WatchPartyCreate(BaseModel):
    title: str = Field(min_length=3, max_length=160)
    host_mode: HostMode
    external_url: Optional[str] = None
    discord_channel_key: Optional[str] = None
    scheduled_for: datetime
    timezone_label: str = Field(min_length=2, max_length=80)
    region: Optional[str] = Field(default=None, max_length=120)
    platform: Optional[str] = Field(default=None, max_length=120)
    capacity: Optional[int] = Field(default=None, ge=1, le=5000)
    notes: Optional[str] = Field(default=None, max_length=2000)
    visibility_hint: Optional[VisibilityHint] = None

    @field_validator("title", "timezone_label")
    @classmethod
    def strip_required_fields(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Field cannot be blank.")
        return stripped

    @field_validator("region", "platform", "notes", mode="before")
    @classmethod
    def normalize_optional_text(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None

    @field_validator("external_url")
    @classmethod
    def validate_external_url(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        stripped = value.strip()
        if not stripped:
            return None
        if not (stripped.startswith("http://") or stripped.startswith("https://")):
            raise ValueError("Custom links must start with http:// or https://")
        return stripped

    @field_validator("discord_channel_key")
    @classmethod
    def normalize_discord_key(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None

    @model_validator(mode="after")
    def validate_host_mode_fields(self):
        if self.host_mode == "bynolo_discord":
            if not self.discord_channel_key:
                raise ValueError("A Discord channel must be selected for byNolo Discord parties.")
            self.external_url = None
        elif self.host_mode == "custom_link":
            if not self.external_url:
                raise ValueError("A custom host link is required for custom link parties.")
            self.discord_channel_key = None
        return self


class WatchPartyUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=3, max_length=160)
    external_url: Optional[str] = None
    discord_channel_key: Optional[str] = None
    scheduled_for: Optional[datetime] = None
    timezone_label: Optional[str] = Field(default=None, min_length=2, max_length=80)
    region: Optional[str] = Field(default=None, max_length=120)
    platform: Optional[str] = Field(default=None, max_length=120)
    capacity: Optional[int] = Field(default=None, ge=1, le=5000)
    notes: Optional[str] = Field(default=None, max_length=2000)
    visibility_hint: Optional[VisibilityHint] = None

    @field_validator("title", "timezone_label")
    @classmethod
    def strip_update_fields(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        stripped = value.strip()
        if not stripped:
            raise ValueError("Field cannot be blank.")
        return stripped

    @field_validator("region", "platform", "notes", "discord_channel_key", mode="before")
    @classmethod
    def normalize_update_optionals(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None

    @field_validator("external_url")
    @classmethod
    def validate_update_external_url(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        stripped = value.strip()
        if not stripped:
            return None
        if not (stripped.startswith("http://") or stripped.startswith("https://")):
            raise ValueError("Custom links must start with http:// or https://")
        return stripped


class WatchPartyRsvpUpdate(BaseModel):
    status: RsvpStatus


class WatchPartyOut(BaseModel):
    id: int
    weekly_drop_id: int
    title: str
    host_mode: HostMode
    status: WatchPartyStatus
    scheduled_for: datetime
    timezone_label: str
    region: Optional[str] = None
    platform: Optional[str] = None
    capacity: Optional[int] = None
    notes: Optional[str] = None
    visibility_hint: Optional[str] = None
    host_display_name: str
    destination_label: str
    destination_url: str
    destination_description: str = ""
    discord_channel_key: Optional[str] = None
    rsvp_count: int
    viewer_rsvp_status: Optional[RsvpStatus] = None
    can_edit: bool
    can_cancel: bool
    is_past: bool


class WatchPartyBoardDrop(BaseModel):
    id: int
    movie_title: str
    start_date: date
    end_date: date


class WatchPartyBoardOut(BaseModel):
    drop: WatchPartyBoardDrop
    parties: list[WatchPartyOut]
    available_discord_channels: list[WatchPartyDiscordChannelOut]
