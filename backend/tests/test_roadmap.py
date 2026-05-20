import inspect

import pytest
from fastapi import HTTPException

from app.api import deps
from app.api.routes.roadmap import (
    FeatureSuggestionCreate,
    RoadmapItemPayload,
    RoadmapItemUpdate,
    SuggestionReviewPayload,
    approve_feature_suggestion,
    create_feature_suggestion,
    get_public_roadmap,
    reject_feature_suggestion,
    update_roadmap_item,
)
from app.models.roadmap import FeatureSuggestion, RoadmapItem
from app.models.user import User


def create_user(db, username="roadmap-user", is_admin=False) -> User:
    user = User(
        keyn_id=f"keyn-{username}",
        username=username,
        email=f"{username}@example.com",
        is_active=True,
        is_admin=is_admin,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def test_public_roadmap_returns_only_public_items(db):
    public_item = RoadmapItem(
        title="Published idea",
        description="Visible to everyone.",
        status="now",
        is_public=True,
        sort_order=1,
    )
    private_item = RoadmapItem(
        title="Internal idea",
        description="Admins only.",
        status="later",
        is_public=False,
        sort_order=0,
    )
    db.add_all([private_item, public_item])
    db.commit()

    data = get_public_roadmap(db)

    assert [item["title"] for item in data["items"]] == ["Published idea"]
    assert data["items"][0]["status"] == "now"
    assert data["groups"]["now"][0]["title"] == "Published idea"
    assert data["groups"]["later"] == []


def test_feature_suggestion_endpoint_requires_current_user_dependency():
    signature = inspect.signature(create_feature_suggestion)
    current_user = signature.parameters["current_user"]

    assert current_user.default.dependency == deps.get_current_user


def test_signed_in_user_can_submit_suggestion(db):
    user = create_user(db)

    data = create_feature_suggestion(
        FeatureSuggestionCreate(
            title="  Calendar invites  ",
            description="  Add movie nights to calendars.  ",
        ),
        current_user=user,
        db=db,
    )

    assert data["title"] == "Calendar invites"
    assert data["description"] == "Add movie nights to calendars."
    assert data["status"] == "pending"
    assert db.query(FeatureSuggestion).count() == 1


def test_admin_can_promote_and_reject_suggestions(db):
    user = create_user(db)
    promoted = FeatureSuggestion(user_id=user.id, title="Watch party RSVP", status="pending")
    rejected = FeatureSuggestion(user_id=user.id, title="Arcade mode", status="pending")
    db.add_all([promoted, rejected])
    db.commit()

    promoted_data = approve_feature_suggestion(
        promoted.id,
        SuggestionReviewPayload(
            admin_note="Fits the roadmap.",
            roadmap_item=RoadmapItemPayload(
                title="Watch party RSVP",
                description="Coordinate attendance for weekly drops.",
                status="next",
                is_public=True,
                sort_order=10,
                cta_label="Open RSVP",
                cta_url="https://example.com/rsvp",
            ),
        ),
        db=db,
    )

    assert promoted_data["suggestion"]["status"] == "approved"
    assert promoted_data["roadmap_item"]["is_public"] is True
    assert promoted_data["roadmap_item"]["cta_label"] == "Open RSVP"
    assert promoted_data["roadmap_item"]["cta_url"] == "https://example.com/rsvp"
    assert db.query(RoadmapItem).count() == 1

    rejected_data = reject_feature_suggestion(
        rejected.id,
        SuggestionReviewPayload(admin_note="Not in scope."),
        db=db,
    )

    assert rejected_data["status"] == "rejected"


def test_roadmap_item_records_shipped_at_when_marked_shipped(db):
    item = RoadmapItem(
        title="Profile badges",
        description="Show member achievements.",
        status="next",
        is_public=True,
        sort_order=1,
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    data = update_roadmap_item(
        item.id,
        RoadmapItemUpdate(status="shipped"),
        db=db,
    )

    assert data["status"] == "shipped"
    assert data["shipped_at"] is not None


def test_non_admin_cannot_access_admin_dependencies(db):
    user = create_user(db)

    with pytest.raises(HTTPException) as exc:
        deps.get_current_admin(user)

    assert exc.value.status_code == 403
