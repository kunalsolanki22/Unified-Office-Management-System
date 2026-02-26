"""
Pydantic schemas for API request/response models.
"""

from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from datetime import datetime


# ==================== Authentication ====================

class LoginRequest(BaseModel):
    """Login request payload."""
    email: str = Field(..., description="User email address")
    password: str = Field(..., description="User password")


class LoginResponse(BaseModel):
    """Login response."""
    success: bool
    message: str
    session_id: Optional[str] = None
    user_name: Optional[str] = None
    user_email: Optional[str] = None


class LogoutResponse(BaseModel):
    """Logout response."""
    success: bool
    message: str


# ==================== Chat ====================

class ChatRequest(BaseModel):
    """Chat message request."""
    message: str = Field(..., description="User message to the chatbot", min_length=1)
    session_id: Optional[str] = Field(None, description="Session ID for authenticated users")


class ChatResponse(BaseModel):
    """Chat response from the chatbot."""
    success: bool
    message: str
    agent_used: Optional[str] = None
    action_type: Optional[str] = None
    needs_followup: bool = False
    session_ended: bool = False
    metadata: Optional[Dict[str, Any]] = None
    tokens_used: Optional[int] = Field(None, description="Total LLM tokens used for this request")
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ==================== Session ====================

class SessionInfo(BaseModel):
    """Session information."""
    session_id: str
    user_email: str
    user_name: str
    is_authenticated: bool
    created_at: datetime
    message_count: int


class SessionResponse(BaseModel):
    """Session info response."""
    success: bool
    session: Optional[SessionInfo] = None
    message: Optional[str] = None


# ==================== Conversation History ====================

class ConversationMessage(BaseModel):
    """Single message in conversation."""
    role: str  # "user" or "assistant"
    content: str
    timestamp: Optional[datetime] = None
    agent_used: Optional[str] = None


class ConversationHistoryResponse(BaseModel):
    """Conversation history response."""
    success: bool
    messages: List[ConversationMessage] = []
    total_messages: int = 0


# ==================== Health Check ====================

class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    version: str
    llm_provider: str
    database_connected: bool
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ==================== Error ====================

class ErrorResponse(BaseModel):
    """Error response."""
    success: bool = False
    error: str
    detail: Optional[str] = None
