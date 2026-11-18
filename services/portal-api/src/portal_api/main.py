from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from portal_api.config import get_settings
from portal_api.routes import health, instances

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    docs_url="/docs" if settings.environment != "production" else None,
    redoc_url="/redoc" if settings.environment != "production" else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type", "Idempotency-Key", "If-Match"],
)

app.include_router(health.router)
app.include_router(instances.router)


@app.get("/")
def root() -> dict[str, str]:
    return {"service": "portal-api", "status": "ok"}
