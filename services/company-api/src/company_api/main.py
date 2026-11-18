from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from company_api.config import get_settings
from company_api.routes import access, candidates, dashboard, groups, health

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
    allow_headers=[
        "Authorization",
        "Content-Type",
        "Idempotency-Key",
        "If-Match",
        "X-User-Email",
        "X-User-Issuer",
        "X-User-Subject",
    ],
)

app.include_router(health.router)
app.include_router(access.router)
app.include_router(dashboard.router)
app.include_router(groups.router)
app.include_router(candidates.router)


@app.get("/")
def root() -> dict[str, str]:
    return {"service": "company-api", "status": "ok"}
