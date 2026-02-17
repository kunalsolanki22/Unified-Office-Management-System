"""
Database models for LLM call logging
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Boolean, Integer, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()


class LLMCall1Log(Base):
    """Log table for LLM Call 1 - API Selection"""
    __tablename__ = "llm_call_1_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), nullable=False, index=True)
    user_email = Column(String(255), nullable=True)
    
    # Input
    user_input = Column(Text, nullable=False)
    prompt_sent = Column(Text, nullable=False)
    
    # Output
    raw_response = Column(Text, nullable=True)
    selected_apis = Column(JSON, nullable=True)  # List of API IDs selected
    reasoning = Column(Text, nullable=True)
    
    # Status
    success = Column(Boolean, default=False)
    error_message = Column(Text, nullable=True)
    
    # Metadata
    model_used = Column(String(100), nullable=True)
    tokens_used = Column(Integer, nullable=True)
    latency_ms = Column(Integer, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)


class LLMCall2Log(Base):
    """Log table for LLM Call 2 - Payload Generation & Execution"""
    __tablename__ = "llm_call_2_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), nullable=False, index=True)
    call1_log_id = Column(String(36), ForeignKey("llm_call_1_logs.id"), nullable=True)
    user_email = Column(String(255), nullable=True)
    
    # Input
    user_input = Column(Text, nullable=False)
    api_context = Column(JSON, nullable=True)  # API details from knowledge base
    prompt_sent = Column(Text, nullable=False)
    
    # Follow-up handling
    is_followup = Column(Boolean, default=False)
    followup_question = Column(Text, nullable=True)
    followup_response = Column(Text, nullable=True)
    
    # Generated payload and execution
    generated_payloads = Column(JSON, nullable=True)  # {api_id: payload}
    api_execution_order = Column(JSON, nullable=True)  # List of API IDs in execution order
    
    # API Responses
    api_responses = Column(JSON, nullable=True)  # {api_id: response}
    final_response_to_user = Column(Text, nullable=True)
    
    # Status
    success = Column(Boolean, default=False)
    error_message = Column(Text, nullable=True)
    api_errors = Column(JSON, nullable=True)  # {api_id: error}
    
    # Metadata
    model_used = Column(String(100), nullable=True)
    tokens_used = Column(Integer, nullable=True)
    latency_ms = Column(Integer, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)


class ConversationHistory(Base):
    """Store conversation history for context"""
    __tablename__ = "conversation_history"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), nullable=False, index=True)
    user_email = Column(String(255), nullable=True)
    
    role = Column(String(20), nullable=False)  # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
