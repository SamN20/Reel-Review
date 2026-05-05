from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session


BANNED_WORDS = {
    "fuck",
    "shit",
    "bitch",
    "asshole",
    "cunt",
    "nigger",
    "faggot",
    "slut",
}
REPORT_THRESHOLD = 3


def get_text_content(target: Any) -> str:
    if hasattr(target, "review_text") and target.review_text:
        return target.review_text
    if hasattr(target, "body") and target.body:
        return target.body
    return ""


def contains_banned_language(text: str | None) -> bool:
    if not text:
        return False
    lowered = text.lower()
    return any(word in lowered for word in BANNED_WORDS)


def apply_auto_moderation(target: Any) -> None:
    has_banned_language = contains_banned_language(get_text_content(target))
    if has_banned_language:
        target.is_flagged = True
        target.is_approved = False
    elif not getattr(target, "is_hidden", False):
        target.is_approved = True


def sync_report_state(db: Session, target: Any, report_model: Any, foreign_key_name: str) -> int:
    report_count = (
        db.query(report_model)
        .filter(getattr(report_model, foreign_key_name) == target.id)
        .count()
    )
    auto_flagged = contains_banned_language(get_text_content(target))
    target.is_hidden = report_count >= REPORT_THRESHOLD
    target.is_flagged = auto_flagged or report_count > 0
    if auto_flagged:
        target.is_approved = False
    return report_count
