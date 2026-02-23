from pydantic_settings import BaseSettings
from typing import Optional
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://office_admin:office_password@localhost:5432/office_management"
    DATABASE_URL_SYNC: str = "postgresql://office_admin:office_password@localhost:5432/office_management"
    
    # Security
    SECRET_KEY: str = "your-super-secret-key-change-in-production-minimum-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Application
    APP_NAME: str = "Unified Office Management System"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"
    
    # Company
    COMPANY_DOMAIN: str = "company.com"
    
    # Vector Search
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    VECTOR_DIMENSION: int = 384
    
    # Redis Configuration
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_MAX_CONNECTIONS: int = 50
    CACHE_DEFAULT_EXPIRE: int = 300  # 5 minutes default cache expiry
    
    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_PER_HOUR: int = 1000
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()