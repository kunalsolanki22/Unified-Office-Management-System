"""
Database models for the AI Chatbot system.

Tables:
- users: User information (synced from backend)
- sessions: Chat sessions
- conversations: Conversation threads within sessions
- messages: Individual messages in conversations
- agent_routing_logs: Logs of routing decisions
- agent_execution_logs: Logs of agent executions and API calls
"""

import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import (
    Column, String, Text, Integer, Float, Boolean, DateTime, 
    ForeignKey, JSON, Enum as SQLEnum, Index
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.sql import func
import enum

Base = declarative_base()


# ==================== ENUMS ====================

class MessageRole(str, enum.Enum):
    """Role of message sender."""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class SessionStatus(str, enum.Enum):
    """Session status."""
    ACTIVE = "active"
    ENDED = "ended"
    EXPIRED = "expired"


class AgentType(str, enum.Enum):
    """Types of agents in the system."""
    ROUTING = "routing"
    GENERAL = "general"
    ATTENDANCE = "attendance"
    LEAVE = "leave"
    DESK_CONFERENCE = "desk_conference"
    CAFETERIA = "cafeteria"
    IT_MANAGEMENT = "it_management"


# ==================== MODELS ====================

class User(Base):
    """
    User model - stores user information from backend.
    This is a cache of user data for the chatbot system.
    Each user has exactly ONE session (1:1 relationship).
    """
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_code = Column(String(20), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    role = Column(String(50), nullable=False)  # employee, team_lead, manager, admin
    department = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship: One user has exactly ONE session
    session = relationship("Session", back_populates="user", uselist=False, cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User {self.user_code}: {self.first_name} {self.last_name}>"


class Session(Base):
    """
    Session model - represents a user's single chat session.
    Each user has exactly ONE session (1:1 with User).
    Within a session, there can be N conversations, but only ONE can be active at a time.
    """
    __tablename__ = "sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True)  # 1:1 with user
    user_code = Column(String(20), nullable=False, unique=True, index=True)  # Also unique per session
    
    # Session info
    status = Column(SQLEnum(SessionStatus), default=SessionStatus.ACTIVE)
    access_token = Column(Text, nullable=True)  # JWT token for API calls
    
    # Active conversation tracking (only ONE can be active)
    active_conversation_id = Column(UUID(as_uuid=True), nullable=True)
    
    # Timestamps
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    ended_at = Column(DateTime(timezone=True), nullable=True)
    last_activity_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="session")
    conversations = relationship("Conversation", back_populates="session", cascade="all, delete-orphan")
    routing_logs = relationship("AgentRoutingLog", back_populates="session", cascade="all, delete-orphan")
    execution_logs = relationship("AgentExecutionLog", back_populates="session", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index("idx_session_last_activity", "last_activity_at"),
    )
    
    def __repr__(self):
        return f"<Session {self.id} for user {self.user_code}>"
    
    def get_active_conversation(self):
        """Get the currently active conversation."""
        for conv in self.conversations:
            if conv.is_active:
                return conv
        return None


class Conversation(Base):
    """
    Conversation model - represents a conversation thread.
    Multiple conversations can exist within a session, but ONLY ONE can be active at a time.
    When a new conversation starts, the previous active one is automatically deactivated.
    """
    __tablename__ = "conversations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False)
    
    # Conversation metadata
    title = Column(String(255), nullable=True)  # Auto-generated from first message
    current_agent = Column(SQLEnum(AgentType), nullable=True)  # Currently handling agent
    context_summary = Column(Text, nullable=True)  # Summarized context for long conversations
    
    # State management
    pending_action = Column(JSON, nullable=True)  # For multi-turn interactions
    is_active = Column(Boolean, default=False)  # Only ONE conversation can be active per session
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    ended_at = Column(DateTime(timezone=True), nullable=True)  # When conversation was deactivated
    
    # Relationships
    session = relationship("Session", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at")
    
    # Indexes
    __table_args__ = (
        Index("idx_conversation_session", "session_id"),
        Index("idx_conversation_active", "session_id", "is_active"),
    )
    
    def __repr__(self):
        return f"<Conversation {self.id} active={self.is_active}>"


class Message(Base):
    """
    Message model - individual messages in a conversation.
    """
    __tablename__ = "messages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id"), nullable=False)
    
    # Message content
    role = Column(SQLEnum(MessageRole), nullable=False)
    content = Column(Text, nullable=False)
    
    # Metadata
    agent_id = Column(String(50), nullable=True)  # Which agent generated this response
    tokens_used = Column(Integer, nullable=True)  # LLM tokens consumed
    latency_ms = Column(Integer, nullable=True)  # Response time in milliseconds
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    conversation = relationship("Conversation", back_populates="messages")
    
    # Indexes
    __table_args__ = (
        Index("idx_message_conversation", "conversation_id"),
        Index("idx_message_created", "conversation_id", "created_at"),
    )
    
    def __repr__(self):
        return f"<Message {self.id} ({self.role})>"


class AgentRoutingLog(Base):
    """
    Logs routing decisions made by the routing agent.
    Useful for debugging and improving routing accuracy.
    """
    __tablename__ = "agent_routing_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False)
    conversation_id = Column(UUID(as_uuid=True), nullable=True)
    
    # Routing decision
    user_input = Column(Text, nullable=False)
    detected_intent = Column(String(100), nullable=True)
    selected_agent = Column(SQLEnum(AgentType), nullable=True)
    confidence_score = Column(Float, nullable=True)
    
    # Reasoning
    routing_reason = Column(Text, nullable=True)
    alternative_agents = Column(JSON, nullable=True)  # Other possible agents considered
    
    # Performance
    latency_ms = Column(Integer, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    session = relationship("Session", back_populates="routing_logs")
    
    # Indexes
    __table_args__ = (
        Index("idx_routing_session", "session_id"),
        Index("idx_routing_agent", "selected_agent"),
        Index("idx_routing_created", "created_at"),
    )
    
    def __repr__(self):
        return f"<RoutingLog {self.id}: {self.selected_agent}>"


class AgentExecutionLog(Base):
    """
    Logs agent execution details including API calls.
    Tracks what each agent did in response to user requests.
    """
    __tablename__ = "agent_execution_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False)
    conversation_id = Column(UUID(as_uuid=True), nullable=True)
    
    # Execution details
    agent_id = Column(SQLEnum(AgentType), nullable=False)
    action_type = Column(String(100), nullable=False)  # e.g., "check_in", "apply_leave"
    
    # LLM interaction details
    user_input = Column(Text, nullable=True)  # Original user message
    prompt_sent = Column(Text, nullable=True)  # Full prompt sent to LLM
    llm_response = Column(Text, nullable=True)  # Raw LLM response
    parsed_response = Column(JSON, nullable=True)  # Parsed JSON from LLM
    
    # API call details
    api_endpoint = Column(String(255), nullable=True)
    api_method = Column(String(10), nullable=True)
    request_payload = Column(JSON, nullable=True)
    response_data = Column(JSON, nullable=True)
    
    # Status
    success = Column(Boolean, nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Performance
    execution_time_ms = Column(Integer, nullable=True)
    llm_tokens_used = Column(Integer, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    session = relationship("Session", back_populates="execution_logs")
    
    # Indexes
    __table_args__ = (
        Index("idx_execution_session", "session_id"),
        Index("idx_execution_agent", "agent_id"),
        Index("idx_execution_action", "action_type"),
        Index("idx_execution_success", "success"),
        Index("idx_execution_created", "created_at"),
    )
    
    def __repr__(self):
        return f"<ExecutionLog {self.id}: {self.agent_id} - {self.action_type}>"


# ==================== HELPER FUNCTIONS ====================

def create_tables(engine):
    """Create all tables in the database."""
    Base.metadata.create_all(engine)


def drop_tables(engine):
    """Drop all tables from the database."""
    Base.metadata.drop_all(engine)
