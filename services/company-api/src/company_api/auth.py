from dataclasses import dataclass
from typing import Annotated
from uuid import UUID

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from company_api.config import get_settings
from company_api.database import get_db


@dataclass(frozen=True)
class Membership:
    group_id: UUID
    group_code: str
    group_name: str
    role: str


@dataclass(frozen=True)
class CurrentUser:
    id: UUID
    email: str
    display_name: str
    global_role: str
    memberships: tuple[Membership, ...]

    @property
    def has_company_wide_read(self) -> bool:
        return self.global_role in {"ADMIN", "OPERATIONS", "AUDITOR"}

    @property
    def has_company_wide_write(self) -> bool:
        return self.global_role in {"ADMIN", "OPERATIONS"}

    @property
    def can_view_rates(self) -> bool:
        return self.global_role in {"ADMIN", "OPERATIONS"}

    def membership_for(self, group_id: UUID | None) -> Membership | None:
        if group_id is None:
            return None
        return next(
            (membership for membership in self.memberships if membership.group_id == group_id), None
        )


SessionDependency = Annotated[Session, Depends(get_db)]


def get_current_user(
    session: SessionDependency,
    x_user_email: Annotated[str | None, Header()] = None,
    x_user_subject: Annotated[str | None, Header()] = None,
    x_user_issuer: Annotated[str | None, Header()] = None,
) -> CurrentUser:
    settings = get_settings()
    if settings.auth_mode == "development":
        email = x_user_email or settings.dev_user_email
        user_row = (
            session.execute(
                text(
                    """
                select id, email::text, display_name, global_role::text
                from app_users
                where email = :email and status = 'ACTIVE'
                """
                ),
                {"email": email},
            )
            .mappings()
            .one_or_none()
        )
    else:
        if not x_user_subject or not x_user_issuer:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required"
            )
        user_row = (
            session.execute(
                text(
                    """
                select users.id, users.email::text, users.display_name, users.global_role::text
                from user_identities identities
                join app_users users on users.id = identities.user_id
                where identities.issuer = :issuer
                  and identities.external_subject = :subject
                  and identities.disabled_at is null
                  and users.status = 'ACTIVE'
                """
                ),
                {"issuer": x_user_issuer, "subject": x_user_subject},
            )
            .mappings()
            .one_or_none()
        )

    if user_row is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Active user account not found"
        )

    membership_rows = (
        session.execute(
            text(
                """
            select groups.id as group_id, groups.code as group_code,
                   groups.name::text as group_name,
                   memberships.membership_role::text as role
            from group_memberships memberships
            join recruitment_groups groups on groups.id = memberships.group_id
            where memberships.user_id = :user_id
              and memberships.ended_at is null
              and groups.status = 'ACTIVE'
            order by groups.name
            """
            ),
            {"user_id": user_row["id"]},
        )
        .mappings()
        .all()
    )

    return CurrentUser(
        id=user_row["id"],
        email=user_row["email"],
        display_name=user_row["display_name"],
        global_role=user_row["global_role"],
        memberships=tuple(Membership(**row) for row in membership_rows),
    )


CurrentUserDependency = Annotated[CurrentUser, Depends(get_current_user)]


def require_group_read(user: CurrentUser, group_id: UUID) -> Membership | None:
    membership = user.membership_for(group_id)
    if not user.has_company_wide_read and membership is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    return membership


def require_candidate_read(user: CurrentUser, group_id: UUID | None) -> Membership | None:
    membership = user.membership_for(group_id)
    if not user.has_company_wide_read and membership is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")
    return membership


def require_candidate_edit(user: CurrentUser, group_id: UUID | None) -> Membership | None:
    if user.has_company_wide_write:
        return user.membership_for(group_id)
    membership = user.membership_for(group_id)
    if membership is None or membership.role not in {"LEAD", "RECRUITER", "MARKETING"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Candidate update is not permitted"
        )
    return membership
