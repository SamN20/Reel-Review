from fastapi import APIRouter
from app.api.routes import admin, archive, auth, drops, movie_requests, ratings, results, search, users, leaderboards, movies

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(drops.router, prefix="/drops", tags=["drops"])
api_router.include_router(ratings.router, prefix="/ratings", tags=["ratings"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(results.router, prefix="/results", tags=["results"])
api_router.include_router(archive.router, prefix="/archive", tags=["archive"])
api_router.include_router(search.router, prefix="/search", tags=["search"])
api_router.include_router(movie_requests.router, prefix="/movie-requests", tags=["movie-requests"])
api_router.include_router(leaderboards.router, prefix="/leaderboards", tags=["leaderboards"])
api_router.include_router(movies.router, prefix="/movies", tags=["movies"])
