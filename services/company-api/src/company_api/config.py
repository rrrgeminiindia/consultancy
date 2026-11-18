from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "BenchOS Company API"
    environment: str = "development"
    database_url: str = (
        "postgresql+psycopg://flyhigh_app:change-me-flyhigh@127.0.0.1:5543/flyhigh_recruitment"
    )
    cors_origins: tuple[str, ...] = ("http://localhost:3001", "http://127.0.0.1:3001")
    auth_mode: str = "development"
    dev_user_email: str = "admin@company.local"

    model_config = SettingsConfigDict(
        env_prefix="COMPANY_",
        env_file=".env",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
