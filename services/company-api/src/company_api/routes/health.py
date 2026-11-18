from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from company_api.database import get_db
from company_api.schemas import HealthResponse

router = APIRouter(prefix="/health", tags=["health"])
SessionDependency = Annotated[Session, Depends(get_db)]


@router.get("/live", response_model=HealthResponse)
def liveness() -> HealthResponse:
    return HealthResponse(status="ok", service="company-api")


@router.get("/ready", response_model=HealthResponse)
def readiness(session: SessionDependency) -> HealthResponse:
    try:
        session.execute(text("select 1"))
    except SQLAlchemyError as exc:
        raise HTTPException(status_code=503, detail="Database unavailable") from exc
    return HealthResponse(status="ok", service="company-api", database="ready")
