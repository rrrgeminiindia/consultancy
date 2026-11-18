from uuid import UUID

from pydantic import BaseModel, ConfigDict


class CompanyInstanceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    instance_code: str
    display_name: str
    slug: str
    base_url: str
    status: str
    deployment_version: str


class HealthResponse(BaseModel):
    status: str
    service: str
    database: str | None = None
