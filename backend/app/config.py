from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent


class Settings(BaseSettings):
    openrouter_api_key: str = ""
    openrouter_model: str = "anthropic/claude-haiku-4.5"
    openrouter_site_url: str = "http://localhost"
    openrouter_site_name: str = "My OpenRouter Chatbot"

    gcp_project_id: str = ""

    cors_origins: str = "http://localhost:5173,http://localhost:3000"
    database_url: str = f"sqlite:///{BASE_DIR / 'data' / 'sales.db'}"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
