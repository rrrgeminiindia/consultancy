from sqlalchemy import text
from sqlalchemy.orm import Session

from company_api.auth import CurrentUser
from company_api.schemas import CompanySummary, DashboardMetrics, DashboardSummaryResponse


def get_dashboard_summary(session: Session, user: CurrentUser) -> DashboardSummaryResponse:
    company_row = (
        session.execute(
            text(
                """
            select instance_code, display_name, status::text
            from company_profile
            limit 1
            """
            )
        )
        .mappings()
        .one()
    )

    metrics_row = (
        session.execute(
            text(
                """
            select
              (select count(*) from candidates where archived_at is null
                and (:wide_access or current_group_id in (
                  select group_id from group_memberships
                  where user_id = :scope_user_id and ended_at is null
                ))) as total_candidates,
              (
                select count(*)
                from candidates
                where archived_at is null and lifecycle_state = 'BENCH'
                  and (:wide_access or current_group_id in (
                    select group_id from group_memberships
                    where user_id = :scope_user_id and ended_at is null
                  ))
              ) as bench_candidates,
              (
                select count(*)
                from candidates
                where archived_at is null
                  and lifecycle_state in (
                    'MARKETING_READY', 'MARKETING_ACTIVE', 'INTERVIEWING', 'OFFERED'
                  )
                  and (:wide_access or current_group_id in (
                    select group_id from group_memberships
                    where user_id = :scope_user_id and ended_at is null
                  ))
              ) as marketing_candidates,
              (
                select count(*)
                from interviews
                where archived_at is null
                  and status in ('SCHEDULED', 'RESCHEDULED')
                  and scheduled_start_at >= now()
                  and (:wide_access or candidate_id in (
                    select id from candidates where current_group_id in (
                      select group_id from group_memberships
                      where user_id = :scope_user_id and ended_at is null
                    )
                  ))
              ) as upcoming_interviews,
              (
                select count(*)
                from placements
                where archived_at is null
                  and status = 'ACTIVE'
                  and (:wide_access or candidate_id in (
                    select id from candidates where current_group_id in (
                      select group_id from group_memberships
                      where user_id = :scope_user_id and ended_at is null
                    )
                  ))
              ) as active_placements
            """
            ),
            {"wide_access": user.has_company_wide_read, "scope_user_id": user.id},
        )
        .mappings()
        .one()
    )

    return DashboardSummaryResponse(
        company=CompanySummary(**company_row),
        metrics=DashboardMetrics(**metrics_row),
    )
