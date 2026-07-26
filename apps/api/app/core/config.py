from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env.local", ".env"), env_file_encoding="utf-8", extra="ignore"
    )

    app_name: str = "EduLab AI API"
    environment: Literal["development", "test", "production"] = "development"
    api_v1_prefix: str = "/api/v1"
    database_url: str
    supabase_url: str = Field(validation_alias="NEXT_PUBLIC_SUPABASE_URL")
    supabase_jwks_url: str
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    llm_provider: str = "local_teacher"
    llm_model: str | None = None
    openai_api_key: str | None = None
    openai_model: str = "gpt-5.6-terra"
    openai_reasoning_effort: Literal["none", "low", "medium", "high"] = "medium"
    teacher_model_url: str = "http://teacher-model:8010"
    max_upload_mb: int = 20

    tts_provider: str = "elevenlabs"
    stt_provider: str = "elevenlabs"
    elevenlabs_api_key: str | None = None
    elevenlabs_voice_id: str | None = None
    elevenlabs_tts_model: str = "eleven_multilingual_v2"
    elevenlabs_stt_model: str = "scribe_v1"
    elevenlabs_stt_api_key: str | None = None
    elevenlabs_base_url: str = "https://api.elevenlabs.io"
    voice_cache_enabled: bool = True

    @field_validator("database_url")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        # Parameters used by node-postgres/libpq are not all valid psycopg conninfo keys.
        base = value.split("?", 1)[0]
        return base.replace("postgresql://", "postgresql+psycopg://", 1) + "?sslmode=require"

    @property
    def allowed_origins(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
