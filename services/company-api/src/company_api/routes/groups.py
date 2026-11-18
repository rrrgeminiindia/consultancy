from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from company_api.auth import CurrentUserDependency
from company_api.database import get_db
from company_api.operations import (
    add_group_member,
    create_group,
    get_group,
    list_candidates,
    list_eligible_group_users,
    list_groups,
)
from company_api.schemas import (
    CandidateListResponse,
    EligibleGroupUserListResponse,
    GroupCreateRequest,
    GroupDetailResponse,
    GroupMembershipCreateRequest,
    GroupSummaryResponse,
)

router = APIRouter(prefix="/api/v1/groups", tags=["groups"])
SessionDependency = Annotated[Session, Depends(get_db)]


@router.get("", response_model=list[GroupSummaryResponse])
def groups(session: SessionDependency, user: CurrentUserDependency) -> list[dict]:
    return list_groups(session, user)


@router.post("", response_model=GroupDetailResponse, status_code=201)
def create(
    request: GroupCreateRequest,
    session: SessionDependency,
    user: CurrentUserDependency,
) -> dict:
    return create_group(
        session,
        user,
        code=request.code,
        name=request.name,
        description=request.description,
    )


@router.get("/{group_id}", response_model=GroupDetailResponse)
def group(group_id: UUID, session: SessionDependency, user: CurrentUserDependency) -> dict:
    return get_group(session, user, group_id)


@router.get("/{group_id}/candidates", response_model=CandidateListResponse)
def group_candidates(
    group_id: UUID,
    session: SessionDependency,
    user: CurrentUserDependency,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 25,
) -> dict:
    return list_candidates(session, user, page=page, page_size=page_size, group_id=group_id)


@router.get("/{group_id}/eligible-users", response_model=EligibleGroupUserListResponse)
def eligible_users(
    group_id: UUID,
    session: SessionDependency,
    user: CurrentUserDependency,
    search: Annotated[str | None, Query(max_length=200)] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 50,
) -> dict:
    return list_eligible_group_users(
        session,
        user,
        group_id,
        search=search,
        page=page,
        page_size=page_size,
    )


@router.post("/{group_id}/members", response_model=GroupDetailResponse, status_code=201)
def add_member(
    group_id: UUID,
    request: GroupMembershipCreateRequest,
    session: SessionDependency,
    user: CurrentUserDependency,
) -> dict:
    return add_group_member(
        session,
        user,
        group_id=group_id,
        user_id=request.user_id,
        membership_role=request.membership_role,
    )
