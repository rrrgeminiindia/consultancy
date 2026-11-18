from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from portal_api.database import get_db
from portal_api.repositories import list_active_instances
from portal_api.schemas import CompanyInstanceResponse

router = APIRouter(prefix="/api/v1/instances", tags=["instances"])
SessionDependency = Annotated[Session, Depends(get_db)]


@router.get("", response_model=list[CompanyInstanceResponse])
def get_instances(session: SessionDependency) -> list[CompanyInstanceResponse]:
    return [CompanyInstanceResponse.model_validate(item) for item in list_active_instances(session)]
