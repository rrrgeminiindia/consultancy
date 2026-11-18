from sqlalchemy import String, cast, select
from sqlalchemy.orm import Session

from portal_api.models import CompanyInstance


def list_active_instances(session: Session) -> list[CompanyInstance]:
    statement = (
        select(CompanyInstance)
        .where(cast(CompanyInstance.status, String).in_(["ACTIVE", "READ_ONLY"]))
        .order_by(CompanyInstance.display_name)
    )
    return list(session.scalars(statement))
