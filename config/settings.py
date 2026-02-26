"""
Configuration settings for the AI Chatbot system.
Uses pydantic-settings for environment variable management.
"""

import os
from typing import Optional, Literal
from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # ==================== APPLICATION ====================
    app_name: str = Field(default="AI Employee Chatbot", description="Application name")
    app_version: str = Field(default="1.0.0", description="Application version")
    environment: Literal["development", "staging", "production"] = Field(
        default="development", 
        description="Deployment environment"
    )
    debug: bool = Field(default=True, description="Debug mode")
    
    # ==================== DATABASE ====================
    database_url: str = Field(
        default="sqlite:///./chatbot.db",
        description="Database connection URL (SQLite for dev, PostgreSQL for prod)"
    )
    db_echo: bool = Field(default=False, description="Echo SQL queries for debugging")
    db_pool_size: int = Field(default=5, description="Database connection pool size")
    db_max_overflow: int = Field(default=10, description="Max connections beyond pool size")
    
    # ==================== BACKEND API ====================
    backend_base_url: str = Field(
        default="http://127.0.0.1:8000/api/v1",
        description="Base URL for the employee services backend API"
    )
    api_timeout: int = Field(default=30, description="API request timeout in seconds")
    
    # ==================== LLM CONFIGURATION ====================
    llm_provider: Literal["groq", "openai", "anthropic"] = Field(
        default="groq",
        description="LLM provider to use"
    )
    
    # Groq settings (primary)
    groq_api_key: Optional[str] = Field(default=None, description="Groq API key (primary)")
    groq_model: str = Field(
        default="llama-3.3-70b-versatile",
        description="Groq model to use"
    )
    
    # Groq settings (secondary - for rate limit fallback)
    groq_api_key_2: Optional[str] = Field(default=None, description="Groq API key (secondary, for rate limit fallback)")
    groq_model_2: str = Field(
        default="llama-3.3-70b-versatile",
        description="Groq model to use for secondary key"
    )
    
    # OpenAI settings (alternative)
    openai_api_key: Optional[str] = Field(default=None, description="OpenAI API key")
    openai_model: str = Field(default="gpt-4o-mini", description="OpenAI model to use")
    
    # LLM parameters
    llm_temperature: float = Field(default=0.7, ge=0.0, le=2.0, description="LLM temperature")
    llm_max_tokens: int = Field(default=1024, description="Max tokens in LLM response")
    
    # ==================== AGENT SETTINGS ====================
    routing_confidence_threshold: float = Field(
        default=0.7, 
        ge=0.0, 
        le=1.0,
        description="Minimum confidence for agent routing"
    )
    max_conversation_history: int = Field(
        default=20,
        description="Max messages to include in conversation context"
    )
    max_followup_questions: int = Field(
        default=3,
        description="Max follow-up questions before forcing an action"
    )
    
    # ==================== SESSION SETTINGS ====================
    session_timeout_minutes: int = Field(
        default=60,
        description="Session timeout in minutes"
    )
    
    # ==================== LOGGING ====================
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = Field(
        default="INFO",
        description="Logging level"
    )
    log_file: str = Field(
        default="logs/chatbot.log",
        description="Log file path"
    )
    log_format: str = Field(
        default="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        description="Log format string"
    )
    
    # ==================== PATHS ====================
    knowledge_base_path: str = Field(
        default="knowledge/user_services_kb.json",
        description="Path to knowledge base JSON file"
    )
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.
    Use this function to access settings throughout the application.
    """
    return Settings()


# Convenience function for quick access
settings = get_settings()


# ==================== LOGGING SETUP ====================

import logging
import sys
from pathlib import Path


def setup_logging(settings: Settings = None) -> logging.Logger:
    """
    Setup application logging configuration.
    
    Args:
        settings: Application settings (uses default if not provided)
        
    Returns:
        Root logger instance
    """
    if settings is None:
        settings = get_settings()
    
    # Create logs directory if it doesn't exist
    log_path = Path(settings.log_file)
    log_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Configure root logger
    logging.basicConfig(
        level=getattr(logging, settings.log_level),
        format=settings.log_format,
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler(settings.log_file)
        ]
    )
    
    # Get root logger
    logger = logging.getLogger("chatbot")
    logger.setLevel(getattr(logging, settings.log_level))
    
    # Reduce noise from third-party libraries
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(
        logging.DEBUG if settings.db_echo else logging.WARNING
    )
    
    return logger


# ==================== VALIDATION ====================

def validate_settings() -> tuple[bool, list[str]]:
    """
    Validate that all required settings are properly configured.
    
    Returns:
        Tuple of (is_valid, list of error messages)
    """
    errors = []
    settings = get_settings()
    
    # Check LLM API key based on provider
    if settings.llm_provider == "groq" and not settings.groq_api_key:
        errors.append("GROQ_API_KEY is required when using Groq as LLM provider")
    elif settings.llm_provider == "openai" and not settings.openai_api_key:
        errors.append("OPENAI_API_KEY is required when using OpenAI as LLM provider")
    
    # Check knowledge base file exists
    if not Path(settings.knowledge_base_path).exists():
        errors.append(f"Knowledge base file not found: {settings.knowledge_base_path}")
    
    return len(errors) == 0, errors
