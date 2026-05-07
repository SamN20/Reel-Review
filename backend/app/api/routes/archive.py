from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api import deps
from app.models.user import User
from app.schemas.archive import ArchiveShelvesOut, ArchiveVoteOrderOut
from app.services.archive_service import ArchiveService

router = APIRouter()


@router.get("/shelves", response_model=ArchiveShelvesOut)
def get_archive_shelves(
    db: Session = Depends(deps.get_db),
    current_user: User | None = Depends(deps.get_optional_user),
    limit: int = Query(default=ArchiveService.DEFAULT_SHELF_LIMIT, ge=1, le=30),
):
    return ArchiveService.get_shelves(db, current_user, limit=limit)


@router.get("/vote-order", response_model=ArchiveVoteOrderOut)
def get_archive_vote_order(
    db: Session = Depends(deps.get_db),
    current_user: User | None = Depends(deps.get_optional_user),
    limit: int = Query(default=60, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    return ArchiveService.get_vote_order(db, current_user, limit=limit, offset=offset)
