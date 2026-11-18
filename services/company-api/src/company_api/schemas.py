from datetime import date, datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str
    service: str
    database: str | None = None


class CompanySummary(BaseModel):
    instance_code: str
    display_name: str
    status: str


class DashboardMetrics(BaseModel):
    total_candidates: int
    bench_candidates: int
    marketing_candidates: int
    upcoming_interviews: int
    active_placements: int


class DashboardSummaryResponse(BaseModel):
    company: CompanySummary
    metrics: DashboardMetrics


class MembershipResponse(BaseModel):
    group_id: UUID
    group_code: str
    group_name: str
    role: str


class CurrentUserResponse(BaseModel):
    id: UUID
    email: str
    display_name: str
    global_role: str
    can_view_all_groups: bool
    can_manage_company: bool
    can_view_rates: bool
    memberships: list[MembershipResponse]


class GroupMemberResponse(BaseModel):
    user_id: UUID
    display_name: str
    email: str
    global_role: str
    membership_role: str
    started_at: datetime


class GroupSummaryResponse(BaseModel):
    id: UUID
    code: str
    name: str
    description: str | None
    status: str
    candidate_count: int
    leads: list[GroupMemberResponse]
    current_user_role: str | None = None


class GroupDetailResponse(GroupSummaryResponse):
    members: list[GroupMemberResponse]


class GroupCreateRequest(BaseModel):
    code: str = Field(min_length=2, max_length=32, pattern=r"^[A-Z][A-Z0-9_-]{1,31}$")
    name: str = Field(min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=1000)


class GroupMembershipCreateRequest(BaseModel):
    user_id: UUID
    membership_role: Literal["LEAD", "RECRUITER", "MARKETING", "VIEWER"]


class EligibleUserMembershipResponse(BaseModel):
    group_id: UUID
    group_name: str
    role: str


class EligibleGroupUserResponse(BaseModel):
    id: UUID
    display_name: str
    email: str
    global_role: str
    memberships: list[EligibleUserMembershipResponse]


class EligibleGroupUserListResponse(BaseModel):
    items: list[EligibleGroupUserResponse]
    total: int
    page: int
    page_size: int


class CandidateSummaryResponse(BaseModel):
    id: UUID
    candidate_number: str
    first_name: str
    last_name: str
    display_name: str
    professional_title: str | None
    email: str | None
    phone: str | None
    lifecycle_state: str
    lifecycle_entered_at: datetime
    last_activity_at: datetime
    availability_date: date | None
    stream_name: str | None
    group_id: UUID | None
    group_name: str | None
    owner_user_id: UUID | None
    owner_name: str | None


class CandidateListResponse(BaseModel):
    items: list[CandidateSummaryResponse]
    total: int
    page: int
    page_size: int


class CandidateDetailResponse(CandidateSummaryResponse):
    middle_name: str | None
    preferred_name: str | None
    summary: str | None
    marketing_summary: str | None
    total_experience_months: int | None
    relevant_experience_months: int | None
    city: str | None
    state_region: str | None
    country: str | None
    current_location: str | None
    relocation_preference: str | None
    remote_preference: str | None
    work_authorization: str | None
    employment_preference: str | None
    current_pay_rate: float | None
    target_pay_rate: float | None
    target_bill_rate: float | None
    currency: str
    notice_period_days: int | None
    profile_completeness: int
    created_at: datetime
    updated_at: datetime
    can_edit: bool
    can_view_rates: bool
    current_user_group_role: str | None


class TimelineEventResponse(BaseModel):
    id: str
    category: str
    event_type: str
    summary: str
    occurred_at: datetime
    actor_name: str | None
    group_name: str | None
    metadata: dict[str, Any] = Field(default_factory=dict)


class CandidateHistoryResponse(BaseModel):
    candidate_id: UUID
    items: list[TimelineEventResponse]


class CandidateTransitionRequest(BaseModel):
    to_state: str
    reason: str = Field(min_length=2, max_length=1000)


class CandidateTransferRequest(BaseModel):
    group_id: UUID
    reason: str = Field(min_length=2, max_length=1000)
    transfer_note: str | None = Field(default=None, max_length=2000)


class CandidateOwnerRequest(BaseModel):
    owner_user_id: UUID | None
    reason: str = Field(min_length=2, max_length=1000)
