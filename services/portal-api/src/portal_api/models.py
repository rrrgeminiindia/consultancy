from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from portal_api.database import Base


class CompanyInstance(Base):
    __tablename__ = "company_instances"

    id: Mapped[UUID] = mapped_column(primary_key=True)
    instance_code: Mapped[str] = mapped_column(String)
    legal_name: Mapped[str] = mapped_column(String)
    display_name: Mapped[str] = mapped_column(String)
    slug: Mapped[str] = mapped_column(String)
    base_url: Mapped[str] = mapped_column(String)
    status: Mapped[str] = mapped_column(String)
    deployment_version: Mapped[str] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
