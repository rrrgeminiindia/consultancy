from uuid import UUID

import pytest
from company_api.auth import (
    CurrentUser,
    Membership,
    require_candidate_edit,
    require_candidate_read,
)
from company_api.operations import LIFECYCLE_TRANSITIONS
from fastapi import HTTPException

JAVA_GROUP_ID = UUID("aaaaaaaa-0000-4000-8000-000000000001")
DATA_GROUP_ID = UUID("aaaaaaaa-0000-4000-8000-000000000002")


def user(global_role: str, membership_role: str | None = None) -> CurrentUser:
    memberships = ()
    if membership_role:
        memberships = (
            Membership(
                group_id=JAVA_GROUP_ID,
                group_code="JAVA_TEAM",
                group_name="Java Team",
                role=membership_role,
            ),
        )
    return CurrentUser(
        id=UUID("bbbbbbbb-0000-4000-8000-000000000001"),
        email="user@example.com",
        display_name="Test User",
        global_role=global_role,
        memberships=memberships,
    )


def test_standard_user_can_only_read_an_active_group_membership() -> None:
    java_lead = user("STANDARD", "LEAD")

    assert require_candidate_read(java_lead, JAVA_GROUP_ID) is not None
    with pytest.raises(HTTPException) as error:
        require_candidate_read(java_lead, DATA_GROUP_ID)
    assert error.value.status_code == 404


def test_viewer_and_auditor_are_read_only() -> None:
    for read_only_user in (user("STANDARD", "VIEWER"), user("AUDITOR")):
        with pytest.raises(HTTPException) as error:
            require_candidate_edit(read_only_user, JAVA_GROUP_ID)
        assert error.value.status_code == 403


def test_group_lead_and_company_operations_can_edit() -> None:
    assert require_candidate_edit(user("STANDARD", "LEAD"), JAVA_GROUP_ID) is not None
    assert require_candidate_edit(user("OPERATIONS"), DATA_GROUP_ID) is None


def test_lifecycle_state_machine_rejects_skipping_directly_to_placed() -> None:
    assert "PLACED" not in LIFECYCLE_TRANSITIONS["BENCH"]
    assert "PLACED" in LIFECYCLE_TRANSITIONS["OFFERED"]
