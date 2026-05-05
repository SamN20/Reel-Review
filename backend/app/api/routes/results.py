from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Literal, Optional

from app.api import deps
from app.models.user import User
from app.schemas.result import (
    LikeToggleOut,
    ReplyCreate,
    ReplyOut,
    ResultsOut,
    ReviewListOut,
    ReviewReportCreate,
)
from app.services.results_service import ResultsService

router = APIRouter()

@router.get("/{drop_id}", response_model=ResultsOut)
def get_drop_results(
    drop_id: int, 
    db: Session = Depends(deps.get_db), 
    current_user: Optional[User] = Depends(deps.get_optional_user)
):
    return ResultsService.get_drop_results_summary(db, drop_id, current_user)


@router.get("/{drop_id}/reviews", response_model=ReviewListOut)
def get_drop_reviews(
    drop_id: int,
    tab: Literal["spoiler-free", "spoilers"] = Query(default="spoiler-free"),
    sort: Literal["top", "recent", "controversial"] = Query(default="top"),
    db: Session = Depends(deps.get_db),
    current_user: Optional[User] = Depends(deps.get_optional_user),
):
    ResultsService.get_drop_or_404(db, drop_id)
    return ResultsService.list_reviews(db, drop_id, current_user, tab, sort)


@router.post("/reviews/{review_id}/likes", response_model=LikeToggleOut)
def toggle_review_like(
    review_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    return ResultsService.toggle_review_like(db, review_id, current_user)


@router.post("/replies/{reply_id}/likes", response_model=LikeToggleOut)
def toggle_reply_like(
    reply_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    return ResultsService.toggle_reply_like(db, reply_id, current_user)


@router.post("/reviews/{review_id}/reports")
def report_review(
    review_id: int,
    payload: ReviewReportCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    ResultsService.report_review(db, review_id, payload.reason, current_user)
    return {"message": "Review reported"}


@router.post("/replies/{reply_id}/reports")
def report_reply(
    reply_id: int,
    payload: ReviewReportCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    ResultsService.report_reply(db, reply_id, payload.reason, current_user)
    return {"message": "Reply reported"}


@router.post("/reviews/{review_id}/replies", response_model=ReplyOut)
def create_reply(
    review_id: int,
    payload: ReplyCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    reply = ResultsService.create_reply(
        db,
        review_id=review_id,
        body=payload.body,
        current_user=current_user,
        parent_reply_id=payload.parent_reply_id,
    )
    return {
        "id": reply.id,
        "user_name": reply.user.username,
        "body": reply.body,
        "like_count": 0,
        "liked_by_me": False,
        "created_at": reply.created_at.isoformat() if reply.created_at else None,
        "replies": [],
    }
