from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "BenchOS Portal API"
    environment: str = "development"
    database_url: str = (
        "postgresql+psycopg://portal_app:change-me-portal@127.0.0.1:5542/portal_control"
    )
    cors_origins: tuple[str, ...] = ("http://localhost:3000", "http://127.0.0.1:3000")

    model_config = SettingsConfigDict(
        env_prefix="PORTAL_",
        env_file=".env",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
