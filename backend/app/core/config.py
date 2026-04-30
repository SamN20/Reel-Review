from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import PostgresDsn, computed_field
from pydantic_core import MultiHostUrl

BASE_DIR = Path(__file__).resolve().parents[3]
ENV_FILES = [BASE_DIR / ".env", BASE_DIR.parent / ".env"]

class Settings(BaseSettings):
    PROJECT_NAME: str = "Reel-Review API"
    API_V1_STR: str = "/api/v1"

    # PostgreSQL config
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_HOST: str
    POSTGRES_PORT: int = 5432

    @computed_field
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> PostgresDsn:
        return MultiHostUrl.build(
            scheme="postgresql",
            username=self.POSTGRES_USER,
            password=self.POSTGRES_PASSWORD,
            host=self.POSTGRES_HOST,
            port=self.POSTGRES_PORT,
            path=self.POSTGRES_DB,
        )

    # KeyN OAuth config
    KEYN_CLIENT_ID: str
    KEYN_CLIENT_SECRET: str
    KEYN_REDIRECT_URI: str
    KEYN_BASE_URL: str

    # Nolofication config
    NOLOFICATION_URL: str
    NOLOFICATION_SITE_ID: str
    NOLOFICATION_API_KEY: str
    
    # JWT Auth settings
    SECRET_KEY: str = "super-secret-key-for-local-dev-change-in-prod"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days

    # TMDB API
    TMDB_API_KEY: str

    model_config = SettingsConfigDict(
        env_file=tuple(str(path) for path in ENV_FILES),
        env_ignore_empty=True,
        extra="ignore",
    )

settings = Settings()
