"""
Configuration settings for the Real Estate Project Management System
"""

from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings with environment-based configuration"""
    
    # Application
    APP_NAME: str = "Real Estate Project Management System"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
    DEBUG: bool = Field(default=False, env="DEBUG")
    
    # Security
    SECRET_KEY: str = Field(..., env="SECRET_KEY")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    
    # Database
    DATABASE_URL: str = Field(..., env="DATABASE_URL")
    DATABASE_POOL_SIZE: int = Field(default=20, env="DATABASE_POOL_SIZE")
    DATABASE_MAX_OVERFLOW: int = Field(default=30, env="DATABASE_MAX_OVERFLOW")
    DATABASE_POOL_TIMEOUT: int = Field(default=30, env="DATABASE_POOL_TIMEOUT")
    
    # Redis
    REDIS_URL: str = Field(default="redis://localhost:6379", env="REDIS_URL")
    REDIS_POOL_SIZE: int = Field(default=10, env="REDIS_POOL_SIZE")
    
    # MinIO (File Storage)
    MINIO_ENDPOINT: str = Field(..., env="MINIO_ENDPOINT")
    MINIO_ACCESS_KEY: str = Field(..., env="MINIO_ACCESS_KEY")
    MINIO_SECRET_KEY: str = Field(..., env="MINIO_SECRET_KEY")
    MINIO_BUCKET_NAME: str = Field(default="realestate-files", env="MINIO_BUCKET_NAME")
    MINIO_SECURE: bool = Field(default=False, env="MINIO_SECURE")
    
    # CORS
    ALLOWED_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:8000"],
        env="ALLOWED_ORIGINS"
    )
    
    # Trusted Hosts
    ALLOWED_HOSTS: List[str] = Field(
        default=["localhost", "127.0.0.1"],
        env="ALLOWED_HOSTS"
    )
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = Field(default=100, env="RATE_LIMIT_PER_MINUTE")
    
    # Logging
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")
    LOG_FORMAT: str = Field(default="json", env="LOG_FORMAT")
    
    # Performance
    MAX_UPLOAD_SIZE: int = Field(default=10 * 1024 * 1024, env="MAX_UPLOAD_SIZE")  # 10MB
    UPLOAD_TIMEOUT: int = Field(default=300, env="UPLOAD_TIMEOUT")  # 5 minutes
    
    # Monitoring
    ENABLE_METRICS: bool = Field(default=True, env="ENABLE_METRICS")
    METRICS_PORT: int = Field(default=9090, env="METRICS_PORT")
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Create settings instance
settings = Settings()

# Validate critical settings
if not settings.SECRET_KEY or settings.SECRET_KEY == "your-super-secret-jwt-key-change-in-production":
    raise ValueError(
        "SECRET_KEY must be set to a secure value in production. "
        "Generate a secure key using: openssl rand -hex 32"
    )

if settings.ENVIRONMENT == "production":
    if not settings.DEBUG:
        settings.DEBUG = False
    if "localhost" in settings.ALLOWED_ORIGINS:
        raise ValueError("localhost should not be in ALLOWED_ORIGINS in production")
    if "localhost" in settings.ALLOWED_HOSTS:
        raise ValueError("localhost should not be in ALLOWED_HOSTS in production")
