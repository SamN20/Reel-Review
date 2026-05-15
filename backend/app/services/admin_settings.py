from typing import Any, Dict

from sqlalchemy.orm import Session

from app.models.admin_setting import AdminSetting


DEFAULT_LEADERBOARD_SETTINGS: Dict[str, Any] = {
    "categories": {"min_ratings": 3},
    "actors": {"min_ratings": 3},
    "directors": {"min_ratings": 3},
    "divisive": {"min_ratings": 5},
}


def get_setting(db: Session, key: str, default_value: Dict[str, Any]) -> Dict[str, Any]:
    setting = db.query(AdminSetting).filter(AdminSetting.key == key).first()
    if not setting:
        return default_value
    if isinstance(setting.value, dict):
        return setting.value
    return default_value


def get_or_create_setting(db: Session, key: str, default_value: Dict[str, Any]) -> AdminSetting:
    setting = db.query(AdminSetting).filter(AdminSetting.key == key).first()
    if setting:
        return setting
    setting = AdminSetting(key=key, value=default_value)
    db.add(setting)
    db.commit()
    db.refresh(setting)
    return setting


def update_setting(db: Session, key: str, value: Dict[str, Any]) -> AdminSetting:
    setting = db.query(AdminSetting).filter(AdminSetting.key == key).first()
    if not setting:
        setting = AdminSetting(key=key, value=value)
        db.add(setting)
    else:
        setting.value = value
    db.commit()
    db.refresh(setting)
    return setting
