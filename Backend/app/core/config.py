from typing import Any, Dict, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Calling SaaS"
    
    # Database
    DATABASE_URL: str
    
    # Auth
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # External APIs (Optional fallback)
    N8N_WEBHOOK_URL: Optional[str] = None
    N8N_RESET_PASSWORD_URL: Optional[str] = None
    SARVAM_API: Optional[str] = None

    
    # Brevo SMTP Connection Details
    BREVO_SMTP_HOST: str = "smtp-relay.brevo.com"
    BREVO_SMTP_PORT: int = 587
    BREVO_SMTP_USER: str = ""
    BREVO_SMTP_PASS: str = ""
    BREVO_SMTP_FROM: str = "aotms.marketing@gmail.com"
    
    # Exotel Integration
    EXOTEL_SID: str = ""
    EXOTEL_API_KEY: str = ""
    EXOTEL_TOKEN: str = ""
    EXOTEL_CALLER_ID: str = ""
    EXOTEL_WEBHOOK_URL: str = ""

    @property
    def sync_database_url(self) -> str:
        if self.DATABASE_URL.startswith("postgresql://"):
            return self.DATABASE_URL.replace("postgresql://", "postgresql+psycopg://")
        return self.DATABASE_URL
        
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
