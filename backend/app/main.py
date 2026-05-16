from fastapi import Depends, FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

from app.api import deps
from app.core.config import settings
from app.api.main import api_router
from app.seo import build_seo_payload, render_preview_html

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


@app.get("/seo/render", response_class=HTMLResponse)
def render_seo_preview(
    path: str = Query(default="/"),
    db=Depends(deps.get_db),
):
    payload = build_seo_payload(db, path)
    return HTMLResponse(content=render_preview_html(payload))
