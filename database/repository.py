"""
Repository pattern for database operations.
Provides clean interface for CRUD operations on all models.
"""

import uuid
from datetime import datetime, timedelta
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc

from database.models import (
    User, Session as ChatSession, Conversation, Message,
    AgentRoutingLog, AgentExecutionLog,
    MessageRole, SessionStatus, AgentType
)


class UserRepository:
    """Repository for User operations."""
    
    def __init__(self, session: Session):
        self.session = session
    
    def create(self, user_code: str, email: str, first_name: str, 
               last_name: str, role: str, department: Optional[str] = None) -> User:
        """Create a new user."""
        user = User(
            user_code=user_code,
            email=email,
            first_name=first_name,
            last_name=last_name,
            role=role,
            department=department
        )
        self.session.add(user)
        self.session.flush()
        return user
    
    def get_by_id(self, user_id: uuid.UUID) -> Optional[User]:
        """Get user by ID."""
        return self.session.query(User).filter(User.id == user_id).first()
    
    def get_by_user_code(self, user_code: str) -> Optional[User]:
        """Get user by user code."""
        return self.session.query(User).filter(User.user_code == user_code).first()
    
    def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        return self.session.query(User).filter(User.email == email).first()
    
    def update(self, user: User, **kwargs) -> User:
        """Update user fields."""
        for key, value in kwargs.items():
            if hasattr(user, key):
                setattr(user, key, value)
        self.session.flush()
        return user
    
    def get_or_create(self, user_code: str, **kwargs) -> tuple[User, bool]:
        """Get existing user or create new one."""
        user = self.get_by_user_code(user_code)
        if user:
            return user, False
        user = self.create(user_code=user_code, **kwargs)
        return user, True


class SessionRepository:
    """Repository for Session operations."""
    
    def __init__(self, session: Session):
        self.session = session
    
    def create(self, user_id: uuid.UUID, user_code: str, 
               access_token: Optional[str] = None) -> ChatSession:
        """Create a new chat session."""
        chat_session = ChatSession(
            user_id=user_id,
            user_code=user_code,
            access_token=access_token
        )
        self.session.add(chat_session)
        self.session.flush()
        return chat_session
    
    def get_or_create_session(self, user_id: uuid.UUID, user_code: str,
                               access_token: Optional[str] = None) -> Tuple[ChatSession, bool]:
        """Get existing session for user or create new one.
        
        Returns:
            Tuple of (session, created) where created is True if new session was created.
        """
        # Check for existing session (since 1 user = 1 session)
        existing = self.session.query(ChatSession).filter(
            ChatSession.user_id == user_id
        ).first()
        
        if existing:
            # Reactivate the session if it was ended
            existing.status = SessionStatus.ACTIVE
            existing.access_token = access_token
            existing.last_activity_at = datetime.utcnow()
            existing.ended_at = None
            self.session.flush()
            return existing, False
        
        # Create new session
        chat_session = ChatSession(
            user_id=user_id,
            user_code=user_code,
            access_token=access_token
        )
        self.session.add(chat_session)
        self.session.flush()
        return chat_session, True
    
    def get_by_id(self, session_id: uuid.UUID) -> Optional[ChatSession]:
        """Get session by ID."""
        return self.session.query(ChatSession).filter(ChatSession.id == session_id).first()
    
    def get_active_session(self, user_id: uuid.UUID) -> Optional[ChatSession]:
        """Get the active session for a user."""
        return self.session.query(ChatSession).filter(
            and_(
                ChatSession.user_id == user_id,
                ChatSession.status == SessionStatus.ACTIVE
            )
        ).first()
    
    def get_user_sessions(self, user_id: uuid.UUID, limit: int = 10) -> List[ChatSession]:
        """Get recent sessions for a user."""
        return self.session.query(ChatSession).filter(
            ChatSession.user_id == user_id
        ).order_by(desc(ChatSession.started_at)).limit(limit).all()
    
    def update_activity(self, chat_session: ChatSession) -> ChatSession:
        """Update last activity timestamp."""
        chat_session.last_activity_at = datetime.utcnow()
        self.session.flush()
        return chat_session
    
    def update_token(self, chat_session: ChatSession, access_token: str) -> ChatSession:
        """Update session access token."""
        chat_session.access_token = access_token
        self.session.flush()
        return chat_session
    
    def end_session(self, chat_session: ChatSession) -> ChatSession:
        """End a chat session."""
        chat_session.status = SessionStatus.ENDED
        chat_session.ended_at = datetime.utcnow()
        self.session.flush()
        return chat_session
    
    def expire_old_sessions(self, timeout_minutes: int = 60) -> int:
        """Expire sessions that have been inactive for too long."""
        cutoff = datetime.utcnow() - timedelta(minutes=timeout_minutes)
        count = self.session.query(ChatSession).filter(
            and_(
                ChatSession.status == SessionStatus.ACTIVE,
                ChatSession.last_activity_at < cutoff
            )
        ).update({
            ChatSession.status: SessionStatus.EXPIRED,
            ChatSession.ended_at: datetime.utcnow()
        })
        return count


class ConversationRepository:
    """Repository for Conversation operations."""
    
    def __init__(self, session: Session):
        self.session = session
    
    def create(self, session_id: uuid.UUID, title: Optional[str] = None) -> Conversation:
        """Create a new conversation."""
        conversation = Conversation(
            session_id=session_id,
            title=title
        )
        self.session.add(conversation)
        self.session.flush()
        return conversation
    
    def get_by_id(self, conversation_id: uuid.UUID) -> Optional[Conversation]:
        """Get conversation by ID."""
        return self.session.query(Conversation).filter(
            Conversation.id == conversation_id
        ).first()
    
    def get_active_conversation(self, session_id: uuid.UUID) -> Optional[Conversation]:
        """Get the active conversation for a session."""
        return self.session.query(Conversation).filter(
            and_(
                Conversation.session_id == session_id,
                Conversation.is_active == True
            )
        ).order_by(desc(Conversation.created_at)).first()
    
    def get_session_conversations(self, session_id: uuid.UUID) -> List[Conversation]:
        """Get all conversations for a session."""
        return self.session.query(Conversation).filter(
            Conversation.session_id == session_id
        ).order_by(desc(Conversation.created_at)).all()
    
    def update_agent(self, conversation: Conversation, agent: AgentType) -> Conversation:
        """Update the current agent handling the conversation."""
        conversation.current_agent = agent
        self.session.flush()
        return conversation
    
    def update_pending_action(self, conversation: Conversation, 
                               pending_action: Optional[dict]) -> Conversation:
        """Update pending action for multi-turn interactions."""
        conversation.pending_action = pending_action
        self.session.flush()
        return conversation
    
    def deactivate(self, conversation: Conversation) -> Conversation:
        """Deactivate a conversation."""
        conversation.is_active = False
        self.session.flush()
        return conversation


class MessageRepository:
    """Repository for Message operations."""
    
    def __init__(self, session: Session):
        self.session = session
    
    def create(self, conversation_id: uuid.UUID, role: MessageRole, 
               content: str, agent_id: Optional[str] = None,
               tokens_used: Optional[int] = None,
               latency_ms: Optional[int] = None) -> Message:
        """Create a new message."""
        message = Message(
            conversation_id=conversation_id,
            role=role,
            content=content,
            agent_id=agent_id,
            tokens_used=tokens_used,
            latency_ms=latency_ms
        )
        self.session.add(message)
        self.session.flush()
        return message
    
    def get_conversation_messages(self, conversation_id: uuid.UUID, 
                                    limit: Optional[int] = None) -> List[Message]:
        """Get messages in a conversation."""
        query = self.session.query(Message).filter(
            Message.conversation_id == conversation_id
        ).order_by(Message.created_at)
        
        if limit:
            query = query.limit(limit)
        
        return query.all()
    
    def get_recent_messages(self, conversation_id: uuid.UUID, 
                            limit: int = 20) -> List[Message]:
        """Get the most recent messages in a conversation."""
        messages = self.session.query(Message).filter(
            Message.conversation_id == conversation_id
        ).order_by(desc(Message.created_at)).limit(limit).all()
        
        # Return in chronological order
        return list(reversed(messages))


class AgentRoutingLogRepository:
    """Repository for AgentRoutingLog operations."""
    
    def __init__(self, session: Session):
        self.session = session
    
    def create(self, session_id: uuid.UUID, user_input: str,
               detected_intent: Optional[str] = None,
               selected_agent: Optional[AgentType] = None,
               confidence_score: Optional[float] = None,
               routing_reason: Optional[str] = None,
               alternative_agents: Optional[list] = None,
               conversation_id: Optional[uuid.UUID] = None,
               latency_ms: Optional[int] = None) -> AgentRoutingLog:
        """Log a routing decision."""
        log = AgentRoutingLog(
            session_id=session_id,
            conversation_id=conversation_id,
            user_input=user_input,
            detected_intent=detected_intent,
            selected_agent=selected_agent,
            confidence_score=confidence_score,
            routing_reason=routing_reason,
            alternative_agents=alternative_agents,
            latency_ms=latency_ms
        )
        self.session.add(log)
        self.session.flush()
        return log
    
    def get_session_logs(self, session_id: uuid.UUID) -> List[AgentRoutingLog]:
        """Get all routing logs for a session."""
        return self.session.query(AgentRoutingLog).filter(
            AgentRoutingLog.session_id == session_id
        ).order_by(AgentRoutingLog.created_at).all()


class AgentExecutionLogRepository:
    """Repository for AgentExecutionLog operations."""
    
    def __init__(self, session: Session):
        self.session = session
    
    def create(self, session_id: uuid.UUID, agent_id: AgentType,
               action_type: str, 
               user_input: Optional[str] = None,
               prompt_sent: Optional[str] = None,
               llm_response: Optional[str] = None,
               parsed_response: Optional[dict] = None,
               api_endpoint: Optional[str] = None,
               api_method: Optional[str] = None,
               request_payload: Optional[dict] = None,
               response_data: Optional[dict] = None,
               success: Optional[bool] = None,
               error_message: Optional[str] = None,
               conversation_id: Optional[uuid.UUID] = None,
               execution_time_ms: Optional[int] = None,
               llm_tokens_used: Optional[int] = None) -> AgentExecutionLog:
        """Log an agent execution with full LLM interaction details."""
        log = AgentExecutionLog(
            session_id=session_id,
            conversation_id=conversation_id,
            agent_id=agent_id,
            action_type=action_type,
            user_input=user_input,
            prompt_sent=prompt_sent,
            llm_response=llm_response,
            parsed_response=parsed_response,
            api_endpoint=api_endpoint,
            api_method=api_method,
            request_payload=request_payload,
            response_data=response_data,
            success=success,
            error_message=error_message,
            execution_time_ms=execution_time_ms,
            llm_tokens_used=llm_tokens_used
        )
        self.session.add(log)
        self.session.flush()
        return log
    
    def get_session_logs(self, session_id: uuid.UUID) -> List[AgentExecutionLog]:
        """Get all execution logs for a session."""
        return self.session.query(AgentExecutionLog).filter(
            AgentExecutionLog.session_id == session_id
        ).order_by(AgentExecutionLog.created_at).all()
    
    def get_agent_logs(self, session_id: uuid.UUID, 
                       agent_id: AgentType) -> List[AgentExecutionLog]:
        """Get execution logs for a specific agent in a session."""
        return self.session.query(AgentExecutionLog).filter(
            and_(
                AgentExecutionLog.session_id == session_id,
                AgentExecutionLog.agent_id == agent_id
            )
        ).order_by(AgentExecutionLog.created_at).all()
