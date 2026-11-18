# ruff: noqa: E501

from typing import Any
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from company_api.auth import (
    CurrentUser,
    require_candidate_edit,
    require_candidate_read,
    require_group_read,
)

LIFECYCLE_TRANSITIONS: dict[str, set[str]] = {
    "INTAKE": {"SCREENING", "ON_HOLD", "WITHDRAWN", "ARCHIVED"},
    "SCREENING": {"BENCH", "ON_HOLD", "WITHDRAWN", "ARCHIVED"},
    "BENCH": {"MARKETING_READY", "ON_HOLD", "WITHDRAWN", "ARCHIVED"},
    "MARKETING_READY": {"MARKETING_ACTIVE", "BENCH", "ON_HOLD", "WITHDRAWN"},
    "MARKETING_ACTIVE": {"INTERVIEWING", "BENCH", "ON_HOLD", "WITHDRAWN"},
    "INTERVIEWING": {"OFFERED", "MARKETING_ACTIVE", "BENCH", "ON_HOLD", "WITHDRAWN"},
    "OFFERED": {"PLACED", "INTERVIEWING", "BENCH", "WITHDRAWN"},
    "PLACED": {"BENCH", "ARCHIVED"},
    "ON_HOLD": {"SCREENING", "BENCH", "MARKETING_READY", "WITHDRAWN", "ARCHIVED"},
    "WITHDRAWN": {"INTAKE", "ARCHIVED"},
    "ARCHIVED": set(),
}

MARKETING_STATES = {"MARKETING_READY", "MARKETING_ACTIVE", "INTERVIEWING", "OFFERED"}


def _scope_parameters(user: CurrentUser) -> dict[str, Any]:
    return {"wide_access": user.has_company_wide_read, "scope_user_id": user.id}


def current_user_payload(user: CurrentUser) -> dict[str, Any]:
    return {
        "id": user.id,
        "email": user.email,
        "display_name": user.display_name,
        "global_role": user.global_role,
        "can_view_all_groups": user.has_company_wide_read,
        "can_manage_company": user.has_company_wide_write,
        "can_view_rates": user.can_view_rates,
        "memberships": [membership.__dict__ for membership in user.memberships],
    }


def _group_members(session: Session, group_id: UUID) -> list[dict[str, Any]]:
    return list(
        session.execute(
            text(
                """
                select users.id as user_id, users.display_name, users.email::text,
                       users.global_role::text, memberships.membership_role::text,
                       memberships.started_at
                from group_memberships memberships
                join app_users users on users.id = memberships.user_id
                where memberships.group_id = :group_id
                  and memberships.ended_at is null
                  and users.status = 'ACTIVE'
                order by
                  case memberships.membership_role when 'LEAD' then 0 else 1 end,
                  users.display_name
                """
            ),
            {"group_id": group_id},
        )
        .mappings()
        .all()
    )


def list_groups(session: Session, user: CurrentUser) -> list[dict[str, Any]]:
    rows = (
        session.execute(
            text(
                """
            select groups.id, groups.code, groups.name::text, groups.description,
                   groups.status::text,
                   count(candidates.id) filter (where candidates.archived_at is null)::int as candidate_count
            from recruitment_groups groups
            left join candidates on candidates.current_group_id = groups.id
            where groups.status <> 'ARCHIVED'
              and (
                :wide_access
                or exists (
                  select 1 from group_memberships scope_membership
                  where scope_membership.group_id = groups.id
                    and scope_membership.user_id = :scope_user_id
                    and scope_membership.ended_at is null
                )
              )
            group by groups.id
            order by groups.name
            """
            ),
            _scope_parameters(user),
        )
        .mappings()
        .all()
    )

    groups: list[dict[str, Any]] = []
    for row in rows:
        payload = dict(row)
        members = _group_members(session, row["id"])
        payload["leads"] = [member for member in members if member["membership_role"] == "LEAD"]
        membership = user.membership_for(row["id"])
        payload["current_user_role"] = membership.role if membership else None
        groups.append(payload)
    return groups


def get_group(session: Session, user: CurrentUser, group_id: UUID) -> dict[str, Any]:
    require_group_read(user, group_id)
    row = (
        session.execute(
            text(
                """
            select groups.id, groups.code, groups.name::text, groups.description,
                   groups.status::text,
                   count(candidates.id) filter (where candidates.archived_at is null)::int as candidate_count
            from recruitment_groups groups
            left join candidates on candidates.current_group_id = groups.id
            where groups.id = :group_id
            group by groups.id
            """
            ),
            {"group_id": group_id},
        )
        .mappings()
        .one_or_none()
    )
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    members = _group_members(session, group_id)
    membership = user.membership_for(group_id)
    return {
        **dict(row),
        "leads": [member for member in members if member["membership_role"] == "LEAD"],
        "members": members,
        "current_user_role": membership.role if membership else None,
    }


def _require_membership_manager(user: CurrentUser) -> None:
    if not user.has_company_wide_write:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators and operations can manage groups",
        )


def create_group(
    session: Session,
    user: CurrentUser,
    *,
    code: str,
    name: str,
    description: str | None,
) -> dict[str, Any]:
    _require_membership_manager(user)
    duplicate = session.execute(
        text(
            """
            select 1 from recruitment_groups
            where code = :code or lower(name::text) = lower(:name)
            """
        ),
        {"code": code, "name": name},
    ).scalar_one_or_none()
    if duplicate is not None:
        raise HTTPException(status_code=409, detail="A group with this code or name already exists")

    group_id = session.execute(
        text(
            """
            insert into recruitment_groups (code, name, description, created_by_user_id)
            values (:code, :name, :description, :actor_id)
            returning id
            """
        ),
        {
            "code": code,
            "name": name.strip(),
            "description": description.strip() if description else None,
            "actor_id": user.id,
        },
    ).scalar_one()
    session.commit()
    return get_group(session, user, group_id)


def list_eligible_group_users(
    session: Session,
    user: CurrentUser,
    group_id: UUID,
    *,
    search: str | None,
    page: int,
    page_size: int,
) -> dict[str, Any]:
    _require_membership_manager(user)
    group_exists = session.execute(
        text("select 1 from recruitment_groups where id = :group_id and status = 'ACTIVE'"),
        {"group_id": group_id},
    ).scalar_one_or_none()
    if group_exists is None:
        raise HTTPException(status_code=404, detail="Group not found")

    rows = (
        session.execute(
            text(
                """
            select users.id, users.display_name, users.email::text, users.global_role::text,
                   coalesce((
                     select jsonb_agg(
                       jsonb_build_object(
                         'group_id', groups.id,
                         'group_name', groups.name::text,
                         'role', existing_memberships.membership_role::text
                       ) order by groups.name
                     )
                     from group_memberships existing_memberships
                     join recruitment_groups groups on groups.id = existing_memberships.group_id
                     where existing_memberships.user_id = users.id
                       and existing_memberships.ended_at is null
                       and groups.status = 'ACTIVE'
                   ), '[]'::jsonb) as memberships,
                   count(*) over()::int as total_count
            from app_users users
            where users.status = 'ACTIVE'
              and users.global_role = 'STANDARD'
              and not exists (
                select 1 from group_memberships target_membership
                where target_membership.group_id = :group_id
                  and target_membership.user_id = users.id
                  and target_membership.ended_at is null
              )
              and (
                cast(:search as text) is null
                or users.display_name ilike :search
                or users.email::text ilike :search
              )
            order by users.display_name
            limit :limit offset :offset
            """
            ),
            {
                "group_id": group_id,
                "search": f"%{search.strip()}%" if search else None,
                "limit": page_size,
                "offset": (page - 1) * page_size,
            },
        )
        .mappings()
        .all()
    )
    total = rows[0]["total_count"] if rows else 0
    items = [
        {key: value for key, value in dict(row).items() if key != "total_count"} for row in rows
    ]
    return {"items": items, "total": total, "page": page, "page_size": page_size}


def add_group_member(
    session: Session,
    user: CurrentUser,
    *,
    group_id: UUID,
    user_id: UUID,
    membership_role: str,
) -> dict[str, Any]:
    _require_membership_manager(user)
    group_exists = session.execute(
        text("select 1 from recruitment_groups where id = :group_id and status = 'ACTIVE'"),
        {"group_id": group_id},
    ).scalar_one_or_none()
    if group_exists is None:
        raise HTTPException(status_code=404, detail="Group not found")

    eligible_user = session.execute(
        text(
            """
            select 1 from app_users
            where id = :user_id and status = 'ACTIVE' and global_role = 'STANDARD'
            """
        ),
        {"user_id": user_id},
    ).scalar_one_or_none()
    if eligible_user is None:
        raise HTTPException(
            status_code=422,
            detail="Only active standard users can be added to recruitment groups",
        )

    existing = session.execute(
        text(
            """
            select 1 from group_memberships
            where group_id = :group_id and user_id = :user_id and ended_at is null
            """
        ),
        {"group_id": group_id, "user_id": user_id},
    ).scalar_one_or_none()
    if existing is not None:
        raise HTTPException(
            status_code=409, detail="User is already an active member of this group"
        )

    session.execute(
        text(
            """
            insert into group_memberships
              (group_id, user_id, membership_role, assigned_by_user_id, reason)
            values (:group_id, :user_id,
                    cast(:membership_role as group_membership_role), :actor_id,
                    'Added through group management')
            """
        ),
        {
            "group_id": group_id,
            "user_id": user_id,
            "membership_role": membership_role,
            "actor_id": user.id,
        },
    )
    session.commit()
    return get_group(session, user, group_id)


CANDIDATE_SUMMARY_SELECT = """
    select candidates.id, candidates.candidate_number, candidates.first_name,
           candidates.last_name,
           concat_ws(' ', candidates.first_name, candidates.last_name) as display_name,
           candidates.professional_title, candidates.email::text, candidates.phone,
           candidates.lifecycle_state::text, candidates.lifecycle_entered_at,
           candidates.last_activity_at, candidates.availability_date,
           streams.name::text as stream_name,
           groups.id as group_id, groups.name::text as group_name,
           owners.id as owner_user_id, owners.display_name as owner_name
    from candidates
    left join streams on streams.id = candidates.primary_stream_id
    left join recruitment_groups groups on groups.id = candidates.current_group_id
    left join app_users owners on owners.id = candidates.current_owner_user_id
"""


def list_candidates(
    session: Session,
    user: CurrentUser,
    *,
    page: int,
    page_size: int,
    search: str | None = None,
    group_id: UUID | None = None,
    lifecycle_state: str | None = None,
) -> dict[str, Any]:
    filters = [
        "candidates.archived_at is null",
        "(:wide_access or exists (select 1 from group_memberships scope_membership where scope_membership.group_id = candidates.current_group_id and scope_membership.user_id = :scope_user_id and scope_membership.ended_at is null))",
    ]
    params = {
        **_scope_parameters(user),
        "limit": page_size,
        "offset": (page - 1) * page_size,
    }
    if search:
        filters.append(
            "(candidates.candidate_number ilike :search or candidates.first_name ilike :search or candidates.last_name ilike :search or candidates.email::text ilike :search or candidates.professional_title ilike :search)"
        )
        params["search"] = f"%{search.strip()}%"
    if group_id:
        require_group_read(user, group_id)
        filters.append("candidates.current_group_id = :group_id")
        params["group_id"] = group_id
    if lifecycle_state:
        if lifecycle_state not in LIFECYCLE_TRANSITIONS:
            raise HTTPException(status_code=422, detail="Unknown lifecycle state")
        filters.append("candidates.lifecycle_state::text = :lifecycle_state")
        params["lifecycle_state"] = lifecycle_state

    where_clause = " and ".join(filters)
    items = (
        session.execute(
            text(
                f"{CANDIDATE_SUMMARY_SELECT} where {where_clause} order by candidates.last_activity_at desc limit :limit offset :offset"
            ),
            params,
        )
        .mappings()
        .all()
    )
    total = session.execute(
        text(f"select count(*) from candidates where {where_clause}"), params
    ).scalar_one()
    return {"items": list(items), "total": total, "page": page, "page_size": page_size}


def _candidate_group(session: Session, candidate_id: UUID) -> UUID | None:
    row = (
        session.execute(
            text("select current_group_id from candidates where id = :candidate_id"),
            {"candidate_id": candidate_id},
        )
        .mappings()
        .one_or_none()
    )
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")
    return row["current_group_id"]


def get_candidate(session: Session, user: CurrentUser, candidate_id: UUID) -> dict[str, Any]:
    group_id = _candidate_group(session, candidate_id)
    membership = require_candidate_read(user, group_id)
    row = (
        session.execute(
            text(
                f"""
            {CANDIDATE_SUMMARY_SELECT}
            where candidates.id = :candidate_id
            """
            ),
            {"candidate_id": candidate_id},
        )
        .mappings()
        .one()
    )
    detail = (
        session.execute(
            text(
                """
            select middle_name, preferred_name, summary, marketing_summary,
                   total_experience_months, relevant_experience_months,
                   city, state_region, country, current_location, relocation_preference,
                   remote_preference, work_authorization, employment_preference,
                   current_pay_rate, target_pay_rate, target_bill_rate, currency,
                   notice_period_days, profile_completeness, created_at, updated_at
            from candidates where id = :candidate_id
            """
            ),
            {"candidate_id": candidate_id},
        )
        .mappings()
        .one()
    )
    payload = {**dict(row), **dict(detail)}
    if not user.can_view_rates:
        payload.update(current_pay_rate=None, target_pay_rate=None, target_bill_rate=None)
    payload["can_view_rates"] = user.can_view_rates
    payload["can_edit"] = user.has_company_wide_write or (
        membership is not None and membership.role in {"LEAD", "RECRUITER", "MARKETING"}
    )
    payload["current_user_group_role"] = membership.role if membership else None
    return payload


def get_candidate_history(
    session: Session, user: CurrentUser, candidate_id: UUID
) -> list[dict[str, Any]]:
    group_id = _candidate_group(session, candidate_id)
    require_candidate_read(user, group_id)
    rows = (
        session.execute(
            text(
                """
            select * from (
              select 'candidate-created-' || candidates.id::text as id,
                     'PROFILE' as category, 'CANDIDATE_CREATED' as event_type,
                     'Candidate profile created' as summary, candidates.created_at as occurred_at,
                     creators.display_name as actor_name, groups.name::text as group_name,
                     jsonb_build_object('candidate_number', candidates.candidate_number) as metadata
              from candidates
              left join app_users creators on creators.id = candidates.created_by_user_id
              left join recruitment_groups groups on groups.id = candidates.current_group_id
              where candidates.id = :candidate_id

              union all
              select history.id::text, 'LIFECYCLE', 'STATUS_CHANGED',
                     case when history.from_state is null then 'Entered ' || replace(history.to_state::text, '_', ' ')
                          else replace(history.from_state::text, '_', ' ') || ' → ' || replace(history.to_state::text, '_', ' ') end,
                     history.changed_at, actors.display_name, null,
                     jsonb_build_object('from_state', history.from_state, 'to_state', history.to_state,
                                        'reason', history.reason_text, 'reason_code', history.reason_code)
              from candidate_status_history history
              left join app_users actors on actors.id = history.changed_by_user_id
              where history.candidate_id = :candidate_id

              union all
              select assignments.id::text, 'GROUP', 'GROUP_ASSIGNED',
                     'Assigned to ' || groups.name::text, assignments.started_at,
                     actors.display_name, groups.name::text,
                     jsonb_build_object('reason', assignments.reason, 'transfer_note', assignments.transfer_note,
                                        'ended_at', assignments.ended_at)
              from candidate_group_assignments assignments
              join recruitment_groups groups on groups.id = assignments.group_id
              left join app_users actors on actors.id = assignments.assigned_by_user_id
              where assignments.candidate_id = :candidate_id

              union all
              select 'group-ended-' || assignments.id::text, 'GROUP', 'GROUP_ASSIGNMENT_ENDED',
                     'Left ' || groups.name::text, assignments.ended_at,
                     actors.display_name, groups.name::text,
                     jsonb_build_object('reason', assignments.reason, 'transfer_note', assignments.transfer_note)
              from candidate_group_assignments assignments
              join recruitment_groups groups on groups.id = assignments.group_id
              left join app_users actors on actors.id = assignments.ended_by_user_id
              where assignments.candidate_id = :candidate_id and assignments.ended_at is not null

              union all
              select assignments.id::text, 'OWNERSHIP', 'OWNER_ASSIGNED',
                     'Owner assigned: ' || owners.display_name, assignments.started_at,
                     actors.display_name, groups.name::text,
                     jsonb_build_object('owner_user_id', owners.id, 'reason', assignments.reason,
                                        'ended_at', assignments.ended_at)
              from candidate_owner_assignments assignments
              join app_users owners on owners.id = assignments.owner_user_id
              join recruitment_groups groups on groups.id = assignments.group_id
              left join app_users actors on actors.id = assignments.changed_by_user_id
              where assignments.candidate_id = :candidate_id

              union all
              select 'owner-ended-' || assignments.id::text, 'OWNERSHIP', 'OWNER_UNASSIGNED',
                     'Owner assignment ended: ' || owners.display_name, assignments.ended_at,
                     null, groups.name::text,
                     jsonb_build_object('owner_user_id', owners.id, 'reason', assignments.reason)
              from candidate_owner_assignments assignments
              join app_users owners on owners.id = assignments.owner_user_id
              join recruitment_groups groups on groups.id = assignments.group_id
              where assignments.candidate_id = :candidate_id and assignments.ended_at is not null

              union all
              select notes.id::text, 'NOTE', 'NOTE_ADDED',
                     case when length(notes.body) > 140 then left(notes.body, 137) || '...' else notes.body end,
                     notes.created_at, authors.display_name, null,
                     jsonb_build_object('visibility', notes.visibility)
              from candidate_notes notes
              left join app_users authors on authors.id = notes.author_user_id
              where notes.candidate_id = :candidate_id and notes.archived_at is null
                and (notes.visibility = 'NORMAL' or :can_view_operations)

              union all
              select documents.id::text, 'DOCUMENT', 'DOCUMENT_UPLOADED',
                     'Uploaded ' || replace(documents.category::text, '_', ' ') || ': ' || documents.original_filename,
                     documents.uploaded_at, uploaders.display_name, null,
                     jsonb_build_object('category', documents.category, 'scan_status', documents.scan_status,
                                        'version', documents.version_number)
              from candidate_documents documents
              left join app_users uploaders on uploaders.id = documents.uploaded_by_user_id
              where documents.candidate_id = :candidate_id and documents.archived_at is null
                and (documents.visibility = 'NORMAL' or :can_view_operations)

              union all
              select activities.id::text, 'MARKETING', activities.activity_type,
                     coalesce(activities.outcome, activities.activity_type), activities.occurred_at,
                     actors.display_name, null,
                     jsonb_build_object('submission_id', activities.submission_id,
                                        'outcome', activities.outcome, 'notes', activities.notes,
                                        'next_follow_up_at', activities.next_follow_up_at)
              from marketing_activities activities
              left join app_users actors on actors.id = activities.performed_by_user_id
              where activities.candidate_id = :candidate_id

              union all
              select submissions.id::text, 'SUBMISSION', 'SUBMISSION_CREATED',
                     'Submission to ' || vendors.name::text || ' created (' || replace(submissions.status::text, '_', ' ') || ')',
                     submissions.created_at, creators.display_name, groups.name::text,
                     jsonb_build_object('status', submissions.status, 'client', clients.name,
                                        'external_reference', submissions.external_reference)
              from submissions
              join vendors on vendors.id = submissions.vendor_id
              join recruitment_groups groups on groups.id = submissions.group_id_at_creation
              left join clients on clients.id = submissions.client_id
              left join app_users creators on creators.id = submissions.submitted_by_user_id
              where submissions.candidate_id = :candidate_id

              union all
              select history.id::text, 'SUBMISSION', 'SUBMISSION_STATUS_CHANGED',
                     'Submission ' || replace(coalesce(history.from_status::text, 'NEW'), '_', ' ') || ' → ' || replace(history.to_status::text, '_', ' '),
                     history.changed_at, actors.display_name, null,
                     jsonb_build_object('submission_id', history.submission_id, 'reason', history.reason_text)
              from submission_status_history history
              join submissions on submissions.id = history.submission_id
              left join app_users actors on actors.id = history.changed_by_user_id
              where submissions.candidate_id = :candidate_id

              union all
              select interviews.id::text, 'INTERVIEW', 'INTERVIEW_SCHEDULED',
                     'Interview scheduled: ' || interviews.round_label,
                     interviews.created_at, creators.display_name, null,
                     jsonb_build_object('round', interviews.round_number, 'status', interviews.status,
                                        'scheduled_start_at', interviews.scheduled_start_at,
                                        'scheduled_end_at', interviews.scheduled_end_at,
                                        'method', interviews.method, 'result', interviews.result)
              from interviews
              left join app_users creators on creators.id = interviews.created_by_user_id
              where interviews.candidate_id = :candidate_id

              union all
              select history.id::text, 'INTERVIEW', 'INTERVIEW_RESCHEDULED',
                     'Interview rescheduled', history.changed_at, actors.display_name, null,
                     jsonb_build_object('interview_id', history.interview_id, 'old_start_at', history.old_start_at,
                                        'new_start_at', history.new_start_at, 'reason', history.reason)
              from interview_schedule_history history
              join interviews on interviews.id = history.interview_id
              left join app_users actors on actors.id = history.changed_by_user_id
              where interviews.candidate_id = :candidate_id

              union all
              select tasks.id::text, 'TASK', 'TASK_' || tasks.status::text,
                     tasks.title || ' (' || replace(tasks.status::text, '_', ' ') || ')',
                     coalesce(tasks.completed_at, tasks.created_at), creators.display_name, null,
                     jsonb_build_object('priority', tasks.priority, 'due_at', tasks.due_at,
                                        'assignee_user_id', tasks.assignee_user_id)
              from tasks
              left join submissions task_submissions on task_submissions.id = tasks.submission_id
              left join interviews task_interviews on task_interviews.id = tasks.interview_id
              left join app_users creators on creators.id = tasks.created_by_user_id
              where tasks.candidate_id = :candidate_id
                 or task_submissions.candidate_id = :candidate_id
                 or task_interviews.candidate_id = :candidate_id

              union all
              select offers.id::text, 'OFFER', 'OFFER_CREATED',
                     'Offer created for ' || offers.role_title,
                     offers.created_at, creators.display_name, null,
                     jsonb_build_object('status', offers.status, 'start_date', offers.start_date,
                                        'client_id', offers.client_id)
              from offers
              left join app_users creators on creators.id = offers.created_by_user_id
              where offers.candidate_id = :candidate_id

              union all
              select history.id::text, 'OFFER', 'OFFER_STATUS_CHANGED',
                     'Offer ' || replace(coalesce(history.from_status::text, 'NEW'), '_', ' ') || ' → ' || replace(history.to_status::text, '_', ' '),
                     history.changed_at, actors.display_name, null,
                     jsonb_build_object('offer_id', history.offer_id, 'reason', history.reason)
              from offer_status_history history
              join offers on offers.id = history.offer_id
              left join app_users actors on actors.id = history.changed_by_user_id
              where offers.candidate_id = :candidate_id

              union all
              select placements.id::text, 'PLACEMENT', 'PLACEMENT_CREATED',
                     'Placement created: ' || placements.role_title,
                     placements.created_at, creators.display_name, groups.name::text,
                     jsonb_build_object('status', placements.status, 'start_date', placements.start_date,
                                        'end_date', placements.end_date)
              from placements
              join recruitment_groups groups on groups.id = placements.group_id_at_placement
              left join app_users creators on creators.id = placements.created_by_user_id
              where placements.candidate_id = :candidate_id

              union all
              select history.id::text, 'PLACEMENT', 'PLACEMENT_STATUS_CHANGED',
                     'Placement ' || replace(coalesce(history.from_status::text, 'NEW'), '_', ' ') || ' → ' || replace(history.to_status::text, '_', ' '),
                     history.changed_at, actors.display_name, null,
                     jsonb_build_object('placement_id', history.placement_id, 'reason', history.reason)
              from placement_status_history history
              join placements on placements.id = history.placement_id
              left join app_users actors on actors.id = history.changed_by_user_id
              where placements.candidate_id = :candidate_id

              union all
              select events.id::text, 'ACTIVITY', events.event_type, events.summary,
                     events.occurred_at, actors.display_name, groups.name::text, events.metadata
              from activity_events events
              left join app_users actors on actors.id = events.actor_user_id
              left join recruitment_groups groups on groups.id = events.group_id_at_event
              where events.candidate_id = :candidate_id
            ) timeline
            order by occurred_at desc, id desc
            """
            ),
            {
                "candidate_id": candidate_id,
                "can_view_operations": user.global_role in {"ADMIN", "OPERATIONS"},
            },
        )
        .mappings()
        .all()
    )
    return [dict(row) for row in rows]


def transition_candidate(
    session: Session,
    user: CurrentUser,
    candidate_id: UUID,
    to_state: str,
    reason: str,
) -> dict[str, Any]:
    row = (
        session.execute(
            text(
                "select current_group_id, lifecycle_state::text from candidates where id = :candidate_id and archived_at is null for update"
            ),
            {"candidate_id": candidate_id},
        )
        .mappings()
        .one_or_none()
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Candidate not found")
    membership = require_candidate_edit(user, row["current_group_id"])
    from_state = row["lifecycle_state"]
    if to_state not in LIFECYCLE_TRANSITIONS.get(from_state, set()):
        raise HTTPException(
            status_code=409, detail=f"Transition from {from_state} to {to_state} is not allowed"
        )
    if (
        not user.has_company_wide_write
        and membership
        and membership.role == "MARKETING"
        and (from_state not in MARKETING_STATES or to_state not in MARKETING_STATES)
    ):
        raise HTTPException(
            status_code=403, detail="Marketing users can only manage marketing lifecycle states"
        )

    session.execute(
        text(
            """
            update candidates
            set lifecycle_state = cast(:to_state as candidate_lifecycle_state),
                lifecycle_entered_at = now(), last_activity_at = now(), version = version + 1,
                archived_at = case when :to_state = 'ARCHIVED' then now() else archived_at end,
                archived_by_user_id = case when :to_state = 'ARCHIVED' then :actor_id else archived_by_user_id end
            where id = :candidate_id
            """
        ),
        {"to_state": to_state, "actor_id": user.id, "candidate_id": candidate_id},
    )
    session.execute(
        text(
            """
            insert into candidate_status_history
              (candidate_id, from_state, to_state, reason_text, changed_by_user_id)
            values (:candidate_id, cast(:from_state as candidate_lifecycle_state),
                    cast(:to_state as candidate_lifecycle_state), :reason, :actor_id)
            """
        ),
        {
            "candidate_id": candidate_id,
            "from_state": from_state,
            "to_state": to_state,
            "reason": reason,
            "actor_id": user.id,
        },
    )
    session.commit()
    return get_candidate(session, user, candidate_id)


def transfer_candidate(
    session: Session,
    user: CurrentUser,
    candidate_id: UUID,
    group_id: UUID,
    reason: str,
    transfer_note: str | None,
) -> dict[str, Any]:
    if not user.has_company_wide_write:
        raise HTTPException(
            status_code=403, detail="Only administrators and operations can transfer candidates"
        )
    row = (
        session.execute(
            text(
                "select current_group_id from candidates where id = :candidate_id and archived_at is null for update"
            ),
            {"candidate_id": candidate_id},
        )
        .mappings()
        .one_or_none()
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Candidate not found")
    target = session.execute(
        text("select id from recruitment_groups where id = :group_id and status = 'ACTIVE'"),
        {"group_id": group_id},
    ).scalar_one_or_none()
    if target is None:
        raise HTTPException(status_code=404, detail="Target group not found")
    if row["current_group_id"] == group_id:
        raise HTTPException(status_code=409, detail="Candidate is already assigned to this group")

    session.execute(
        text(
            "update candidate_owner_assignments set ended_at = now() where candidate_id = :candidate_id and ended_at is null"
        ),
        {"candidate_id": candidate_id},
    )
    session.execute(
        text(
            """
            update candidate_group_assignments
            set ended_at = now(), ended_by_user_id = :actor_id
            where candidate_id = :candidate_id and ended_at is null
            """
        ),
        {"candidate_id": candidate_id, "actor_id": user.id},
    )
    session.execute(
        text(
            """
            update candidates set current_group_id = :group_id, current_owner_user_id = null,
                                  last_activity_at = now(), version = version + 1
            where id = :candidate_id
            """
        ),
        {"candidate_id": candidate_id, "group_id": group_id},
    )
    session.execute(
        text(
            """
            insert into candidate_group_assignments
              (candidate_id, group_id, assigned_by_user_id, reason, transfer_note)
            values (:candidate_id, :group_id, :actor_id, :reason, :transfer_note)
            """
        ),
        {
            "candidate_id": candidate_id,
            "group_id": group_id,
            "actor_id": user.id,
            "reason": reason,
            "transfer_note": transfer_note,
        },
    )
    session.commit()
    return get_candidate(session, user, candidate_id)


def assign_candidate_owner(
    session: Session,
    user: CurrentUser,
    candidate_id: UUID,
    owner_user_id: UUID | None,
    reason: str,
) -> dict[str, Any]:
    row = (
        session.execute(
            text(
                "select current_group_id, current_owner_user_id from candidates where id = :candidate_id and archived_at is null for update"
            ),
            {"candidate_id": candidate_id},
        )
        .mappings()
        .one_or_none()
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Candidate not found")
    membership = require_candidate_edit(user, row["current_group_id"])
    if not user.has_company_wide_write and (membership is None or membership.role != "LEAD"):
        raise HTTPException(
            status_code=403, detail="Only a group lead can assign owners in this group"
        )
    if row["current_group_id"] is None:
        raise HTTPException(
            status_code=409, detail="Assign the candidate to a group before assigning an owner"
        )
    if row["current_owner_user_id"] == owner_user_id:
        raise HTTPException(status_code=409, detail="Candidate already has this owner")
    if owner_user_id is not None:
        valid_owner = session.execute(
            text(
                """
                select 1 from group_memberships memberships
                join app_users users on users.id = memberships.user_id
                where memberships.group_id = :group_id and memberships.user_id = :owner_user_id
                  and memberships.ended_at is null and users.status = 'ACTIVE'
                """
            ),
            {"group_id": row["current_group_id"], "owner_user_id": owner_user_id},
        ).scalar_one_or_none()
        if valid_owner is None:
            raise HTTPException(
                status_code=422, detail="Owner must be an active member of the candidate group"
            )

    session.execute(
        text(
            "update candidate_owner_assignments set ended_at = now() where candidate_id = :candidate_id and ended_at is null"
        ),
        {"candidate_id": candidate_id},
    )
    session.execute(
        text(
            "update candidates set current_owner_user_id = :owner_user_id, last_activity_at = now(), version = version + 1 where id = :candidate_id"
        ),
        {"candidate_id": candidate_id, "owner_user_id": owner_user_id},
    )
    if owner_user_id is not None:
        session.execute(
            text(
                """
                insert into candidate_owner_assignments
                  (candidate_id, group_id, owner_user_id, changed_by_user_id, reason)
                values (:candidate_id, :group_id, :owner_user_id, :actor_id, :reason)
                """
            ),
            {
                "candidate_id": candidate_id,
                "group_id": row["current_group_id"],
                "owner_user_id": owner_user_id,
                "actor_id": user.id,
                "reason": reason,
            },
        )
    session.commit()
    return get_candidate(session, user, candidate_id)
