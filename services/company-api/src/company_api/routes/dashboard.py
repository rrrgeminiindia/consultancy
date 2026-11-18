from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from company_api.auth import CurrentUserDependency
from company_api.database import get_db
from company_api.repositories import get_dashboard_summary
from company_api.schemas import DashboardSummaryResponse

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])
SessionDependency = Annotated[Session, Depends(get_db)]


@router.get("/summary", response_model=DashboardSummaryResponse)
def dashboard_summary(
    session: SessionDependency, user: CurrentUserDependency
) -> DashboardSummaryResponse:
    return get_dashboard_summary(session, user)
