from fastapi import APIRouter
from app.api.routes import auth, drops, ratings, admin, results

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(drops.router, prefix="/drops", tags=["drops"])
api_router.include_router(ratings.router, prefix="/ratings", tags=["ratings"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(results.router, prefix="/results", tags=["results"])
