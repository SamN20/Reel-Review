from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session

from app.api import deps
from app.models.roadmap import FeatureSuggestion, RoadmapItem
from app.models.user import User

router = APIRouter()
suggestions_router = APIRouter()
admin_router = APIRouter(dependencies=[Depends(deps.get_current_admin)])

ROADMAP_STATUSES = ("now", "next", "later", "shipped")
ROADMAP_STATUS_SET = set(ROADMAP_STATUSES)
SUGGESTION_STATUSES = {"pending", "approved", "rejected"}
DEFAULT_ROADMAP_STATUS = "next"
DEFAULT_SUGGESTION_STATUS = "pending"
DESCRIPTION_MAX_LENGTH = 1200


def normalize_status(value: str, allowed: set[str], fallback: str) -> str:
    normalized = value.strip().lower()
    if normalized not in allowed:
        raise ValueError(f"Status must be one of: {', '.join(sorted(allowed))}")
    return normalized or fallback


class FeatureSuggestionCreate(BaseModel):
    title: str = Field(..., max_length=120)
    description: Optional[str] = Field(default=None, max_length=DESCRIPTION_MAX_LENGTH)

    @field_validator("title")
    @classmethod
    def title_must_be_present(cls, value: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("Title is required")
        return trimmed

    @field_validator("description")
    @classmethod
    def normalize_description(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        trimmed = value.strip()
        return trimmed or None


class RoadmapItemPayload(BaseModel):
    title: str = Field(..., max_length=120)
    description: Optional[str] = Field(default=None, max_length=DESCRIPTION_MAX_LENGTH)
    status: str = DEFAULT_ROADMAP_STATUS
    is_public: bool = False
    sort_order: int = 0
    cta_label: Optional[str] = Field(default=None, max_length=80)
    cta_url: Optional[str] = Field(default=None, max_length=500)
    source_suggestion_id: Optional[int] = None
    shipped_at: Optional[datetime] = None

    @field_validator("title")
    @classmethod
    def title_must_be_present(cls, value: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("Title is required")
        return trimmed

    @field_validator("description")
    @classmethod
    def normalize_description(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        trimmed = value.strip()
        return trimmed or None

    @field_validator("cta_label", "cta_url")
    @classmethod
    def normalize_optional_text(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        trimmed = value.strip()
        return trimmed or None

    @field_validator("status")
    @classmethod
    def roadmap_status_must_be_valid(cls, value: str) -> str:
        return normalize_status(value, ROADMAP_STATUS_SET, DEFAULT_ROADMAP_STATUS)


class RoadmapItemUpdate(BaseModel):
    title: Optional[str] = Field(default=None, max_length=120)
    description: Optional[str] = Field(default=None, max_length=DESCRIPTION_MAX_LENGTH)
    status: Optional[str] = None
    is_public: Optional[bool] = None
    sort_order: Optional[int] = None
    cta_label: Optional[str] = Field(default=None, max_length=80)
    cta_url: Optional[str] = Field(default=None, max_length=500)
    source_suggestion_id: Optional[int] = None
    shipped_at: Optional[datetime] = None

    @field_validator("title")
    @classmethod
    def normalize_title(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("Title is required")
        return trimmed

    @field_validator("description")
    @classmethod
    def normalize_description(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        trimmed = value.strip()
        return trimmed or None

    @field_validator("cta_label", "cta_url")
    @classmethod
    def normalize_optional_text(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        trimmed = value.strip()
        return trimmed or None

    @field_validator("status")
    @classmethod
    def roadmap_status_must_be_valid(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        return normalize_status(value, ROADMAP_STATUS_SET, DEFAULT_ROADMAP_STATUS)


class SuggestionReviewPayload(BaseModel):
    admin_note: Optional[str] = Field(default=None, max_length=DESCRIPTION_MAX_LENGTH)
    roadmap_item: Optional[RoadmapItemPayload] = None

    @field_validator("admin_note")
    @classmethod
    def normalize_admin_note(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        trimmed = value.strip()
        return trimmed or None


def serialize_roadmap_item(item: RoadmapItem) -> dict[str, Any]:
    return {
        "id": item.id,
        "title": item.title,
        "description": item.description,
        "status": item.status,
        "is_public": item.is_public,
        "sort_order": item.sort_order,
        "cta_label": item.cta_label,
        "cta_url": item.cta_url,
        "source_suggestion_id": item.source_suggestion_id,
        "created_at": item.created_at,
        "updated_at": item.updated_at,
        "shipped_at": item.shipped_at,
    }


def serialize_suggestion(suggestion: FeatureSuggestion) -> dict[str, Any]:
    return {
        "id": suggestion.id,
        "user_id": suggestion.user_id,
        "username": suggestion.user.username if suggestion.user else "Unknown",
        "title": suggestion.title,
        "description": suggestion.description,
        "status": suggestion.status,
        "admin_note": suggestion.admin_note,
        "created_at": suggestion.created_at,
        "updated_at": suggestion.updated_at,
        "promoted_item_id": suggestion.promoted_item_id,
    }


def apply_roadmap_payload(item: RoadmapItem, payload: RoadmapItemPayload | RoadmapItemUpdate) -> RoadmapItem:
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(item, key, value)
    if item.status == "shipped" and item.shipped_at is None:
        item.shipped_at = datetime.now(timezone.utc)
    if item.status != "shipped" and "shipped_at" not in data:
        item.shipped_at = None
    return item


@router.get("")
def get_public_roadmap(db: Session = Depends(deps.get_db)):
    items = (
        db.query(RoadmapItem)
        .filter(RoadmapItem.is_public == True)
        .order_by(RoadmapItem.sort_order.asc(), RoadmapItem.created_at.desc(), RoadmapItem.id.desc())
        .all()
    )
    serialized = [serialize_roadmap_item(item) for item in items]
    groups = {status: [] for status in ROADMAP_STATUSES}
    for item in serialized:
        groups[item["status"]].append(item)
    return {"items": serialized, "groups": groups}


@router.post("/suggestions")
@suggestions_router.post("")
def create_feature_suggestion(
    payload: FeatureSuggestionCreate,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    suggestion = FeatureSuggestion(
        user_id=current_user.id,
        title=payload.title,
        description=payload.description,
        status=DEFAULT_SUGGESTION_STATUS,
    )
    db.add(suggestion)
    db.commit()
    db.refresh(suggestion)
    return serialize_suggestion(suggestion)


@admin_router.get("/roadmap")
def get_admin_roadmap(db: Session = Depends(deps.get_db)):
    items = (
        db.query(RoadmapItem)
        .order_by(RoadmapItem.sort_order.asc(), RoadmapItem.created_at.desc(), RoadmapItem.id.desc())
        .all()
    )
    return [serialize_roadmap_item(item) for item in items]


@admin_router.post("/roadmap")
def create_roadmap_item(payload: RoadmapItemPayload, db: Session = Depends(deps.get_db)):
    item = RoadmapItem()
    apply_roadmap_payload(item, payload)
    db.add(item)
    db.commit()
    db.refresh(item)
    return serialize_roadmap_item(item)


@admin_router.patch("/roadmap/{item_id}")
def update_roadmap_item(
    item_id: int,
    payload: RoadmapItemUpdate,
    db: Session = Depends(deps.get_db),
):
    item = db.query(RoadmapItem).filter(RoadmapItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Roadmap item not found")
    apply_roadmap_payload(item, payload)
    db.commit()
    db.refresh(item)
    return serialize_roadmap_item(item)


@admin_router.get("/feature-suggestions")
def get_feature_suggestions(status: str = "pending", db: Session = Depends(deps.get_db)):
    query = db.query(FeatureSuggestion).order_by(
        FeatureSuggestion.created_at.desc(),
        FeatureSuggestion.id.desc(),
    )
    if status != "all":
        try:
            normalized = normalize_status(status, SUGGESTION_STATUSES, DEFAULT_SUGGESTION_STATUS)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        query = query.filter(FeatureSuggestion.status == normalized)
    return [serialize_suggestion(suggestion) for suggestion in query.all()]


@admin_router.post("/feature-suggestions/{suggestion_id}/approve")
def approve_feature_suggestion(
    suggestion_id: int,
    payload: SuggestionReviewPayload,
    db: Session = Depends(deps.get_db),
):
    suggestion = db.query(FeatureSuggestion).filter(FeatureSuggestion.id == suggestion_id).first()
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    if suggestion.status != DEFAULT_SUGGESTION_STATUS:
        raise HTTPException(status_code=400, detail="Suggestion has already been reviewed")
    if not payload.roadmap_item:
        raise HTTPException(status_code=400, detail="Roadmap item details are required")

    item = RoadmapItem(source_suggestion_id=suggestion.id)
    apply_roadmap_payload(item, payload.roadmap_item)
    db.add(item)
    db.flush()

    suggestion.status = "approved"
    suggestion.admin_note = payload.admin_note
    suggestion.promoted_item_id = item.id
    db.commit()
    db.refresh(suggestion)
    return {
        "suggestion": serialize_suggestion(suggestion),
        "roadmap_item": serialize_roadmap_item(item),
    }


@admin_router.post("/feature-suggestions/{suggestion_id}/reject")
def reject_feature_suggestion(
    suggestion_id: int,
    payload: SuggestionReviewPayload,
    db: Session = Depends(deps.get_db),
):
    suggestion = db.query(FeatureSuggestion).filter(FeatureSuggestion.id == suggestion_id).first()
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    if suggestion.status != DEFAULT_SUGGESTION_STATUS:
        raise HTTPException(status_code=400, detail="Suggestion has already been reviewed")

    suggestion.status = "rejected"
    suggestion.admin_note = payload.admin_note
    db.commit()
    db.refresh(suggestion)
    return serialize_suggestion(suggestion)
