from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.main import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:3010"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.on_event("startup")
async def startup_event():
    from app.services.nolofication import nolofication
    await nolofication.setup_default_categories()
    if settings.ENABLE_DROP_SCHEDULER:
        from app.services.drop_scheduler import drop_scheduler
        drop_scheduler.start()

@app.on_event("shutdown")
async def shutdown_event():
    if settings.ENABLE_DROP_SCHEDULER:
        from app.services.drop_scheduler import drop_scheduler
        await drop_scheduler.stop()

@app.get("/")
def read_root():
    return {"message": f"Welcome to {settings.PROJECT_NAME}!"}

@app.get("/api/health")
def health_check():
    return {"status": "ok"}
