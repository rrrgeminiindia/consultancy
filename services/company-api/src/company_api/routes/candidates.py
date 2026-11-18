from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from company_api.auth import CurrentUserDependency
from company_api.database import get_db
from company_api.operations import (
    assign_candidate_owner,
    get_candidate,
    get_candidate_history,
    list_candidates,
    transfer_candidate,
    transition_candidate,
)
from company_api.schemas import (
    CandidateDetailResponse,
    CandidateHistoryResponse,
    CandidateListResponse,
    CandidateOwnerRequest,
    CandidateTransferRequest,
    CandidateTransitionRequest,
)

router = APIRouter(prefix="/api/v1/candidates", tags=["candidates"])
SessionDependency = Annotated[Session, Depends(get_db)]


@router.get("", response_model=CandidateListResponse)
def candidates(
    session: SessionDependency,
    user: CurrentUserDependency,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 25,
    search: Annotated[str | None, Query(max_length=200)] = None,
    group_id: UUID | None = None,
    lifecycle_state: str | None = None,
) -> dict:
    return list_candidates(
        session,
        user,
        page=page,
        page_size=page_size,
        search=search,
        group_id=group_id,
        lifecycle_state=lifecycle_state,
    )


@router.get("/{candidate_id}", response_model=CandidateDetailResponse)
def candidate(candidate_id: UUID, session: SessionDependency, user: CurrentUserDependency) -> dict:
    return get_candidate(session, user, candidate_id)


@router.get("/{candidate_id}/history", response_model=CandidateHistoryResponse)
def candidate_history(
    candidate_id: UUID, session: SessionDependency, user: CurrentUserDependency
) -> dict:
    return {
        "candidate_id": candidate_id,
        "items": get_candidate_history(session, user, candidate_id),
    }


@router.post("/{candidate_id}/transition", response_model=CandidateDetailResponse)
def candidate_transition(
    candidate_id: UUID,
    request: CandidateTransitionRequest,
    session: SessionDependency,
    user: CurrentUserDependency,
) -> dict:
    return transition_candidate(session, user, candidate_id, request.to_state, request.reason)


@router.post("/{candidate_id}/transfer-group", response_model=CandidateDetailResponse)
def candidate_transfer(
    candidate_id: UUID,
    request: CandidateTransferRequest,
    session: SessionDependency,
    user: CurrentUserDependency,
) -> dict:
    return transfer_candidate(
        session, user, candidate_id, request.group_id, request.reason, request.transfer_note
    )


@router.post("/{candidate_id}/assign-owner", response_model=CandidateDetailResponse)
def candidate_owner(
    candidate_id: UUID,
    request: CandidateOwnerRequest,
    session: SessionDependency,
    user: CurrentUserDependency,
) -> dict:
    return assign_candidate_owner(
        session, user, candidate_id, request.owner_user_id, request.reason
    )
