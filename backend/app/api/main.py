from fastapi import APIRouter
from app.api.routes import auth, drops, ratings

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(drops.router, prefix="/drops", tags=["drops"])
api_router.include_router(ratings.router, prefix="/ratings", tags=["ratings"])
