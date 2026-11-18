from fastapi import APIRouter

from company_api.auth import CurrentUserDependency
from company_api.operations import current_user_payload
from company_api.schemas import CurrentUserResponse

router = APIRouter(prefix="/api/v1", tags=["access"])


@router.get("/me", response_model=CurrentUserResponse)
def current_user(user: CurrentUserDependency) -> dict:
    return current_user_payload(user)
