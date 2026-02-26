"""
API routes for the AI Employee Chatbot.
"""

import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException

from core.orchestrator import Orchestrator
from config.settings import get_settings
from database.connection import db_manager

from .schemas import (
    LoginRequest, LoginResponse, LogoutResponse,
    ChatRequest, ChatResponse,
    SessionResponse, SessionInfo,
    ConversationHistoryResponse, ConversationMessage,
    HealthResponse, ErrorResponse
)
from .dependencies import (
    require_session, get_session_orchestrator,
    create_session, remove_session
)

logger = logging.getLogger(__name__)
settings = get_settings()

# Create router
router = APIRouter()


# ==================== Health Check ====================

@router.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """
    Check API health status.
    """
    db_connected = False
    try:
        with db_manager.session_scope() as session:
            from sqlalchemy import text
            session.execute(text("SELECT 1"))
            db_connected = True
    except Exception:
        pass
    
    return HealthResponse(
        status="healthy" if db_connected else "degraded",
        version=settings.app_version,
        llm_provider=settings.llm_provider,
        database_connected=db_connected,
        timestamp=datetime.utcnow()
    )


# ==================== Authentication ====================

@router.post("/auth/login", response_model=LoginResponse, tags=["Authentication"])
async def login(request: LoginRequest):
    """
    Login to the chatbot and create a new session.
    
    Returns a session ID that must be passed in the `X-Session-ID` header
    for all subsequent requests.
    """
    try:
        orchestrator = Orchestrator()
        success, message = orchestrator.login(request.email, request.password)
        
        if not success:
            return LoginResponse(
                success=False,
                message=message
            )
        
        # Create session
        session_id = create_session(orchestrator)
        
        # Get user info
        user_info = orchestrator.state.user_info or {}
        
        return LoginResponse(
            success=True,
            message=message,
            session_id=session_id,
            user_name=user_info.get("first_name", "User"),
            user_email=request.email
        )
        
    except Exception as e:
        logger.error(f"Login error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/auth/logout", response_model=LogoutResponse, tags=["Authentication"])
async def logout(
    orchestrator: Orchestrator = Depends(require_session)
):
    """
    Logout from the chatbot and destroy the session.
    
    Requires `X-Session-ID` header.
    """
    try:
        message = orchestrator.logout()
        
        return LogoutResponse(
            success=True,
            message=message
        )
    except Exception as e:
        logger.error(f"Logout error: {e}", exc_info=True)
        return LogoutResponse(
            success=False,
            message=str(e)
        )


# ==================== Chat ====================

@router.post("/chat", response_model=ChatResponse, tags=["Chat"])
async def send_message(
    request: ChatRequest,
    orchestrator: Orchestrator = Depends(require_session)
):
    """
    Send a message to the chatbot and receive a response.
    
    Requires `X-Session-ID` header with a valid session ID from login.
    """
    try:
        response = orchestrator.process_message(request.message)
        
        return ChatResponse(
            success=response.success,
            message=response.message,
            agent_used=response.agent_used,
            action_type=response.action_type,
            needs_followup=response.needs_followup,
            session_ended=response.session_ended,
            metadata=response.metadata,
            tokens_used=response.tokens_used,
            timestamp=datetime.utcnow()
        )
        
    except Exception as e:
        logger.error(f"Chat error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Session ====================

@router.get("/session", response_model=SessionResponse, tags=["Session"])
async def get_session_info(
    orchestrator: Orchestrator = Depends(require_session)
):
    """
    Get current session information.
    """
    try:
        state = orchestrator.state
        user_info = state.user_info or {}
        
        return SessionResponse(
            success=True,
            session=SessionInfo(
                session_id=str(state.session_id) if state.session_id else "",
                user_email=user_info.get("email", ""),
                user_name=user_info.get("first_name", "User"),
                is_authenticated=orchestrator.api_client.is_authenticated,
                created_at=datetime.utcnow(),  # TODO: Track actual session creation time
                message_count=state.message_count
            )
        )
    except Exception as e:
        logger.error(f"Session info error: {e}", exc_info=True)
        return SessionResponse(
            success=False,
            message=str(e)
        )


# ==================== Conversation History ====================

@router.get("/history", response_model=ConversationHistoryResponse, tags=["Chat"])
async def get_conversation_history(
    orchestrator: Orchestrator = Depends(require_session),
    limit: int = 50
):
    """
    Get conversation history for the current session.
    """
    try:
        history = orchestrator.state.conversation_history[-limit:]
        
        messages = [
            ConversationMessage(
                role=msg.role,
                content=msg.content,
                timestamp=datetime.utcnow()  # TODO: Track actual message timestamps
            )
            for msg in history
        ]
        
        return ConversationHistoryResponse(
            success=True,
            messages=messages,
            total_messages=len(orchestrator.state.conversation_history)
        )
    except Exception as e:
        logger.error(f"History error: {e}", exc_info=True)
        return ConversationHistoryResponse(
            success=False,
            messages=[],
            total_messages=0
        )


@router.delete("/history", tags=["Chat"])
async def clear_conversation_history(
    orchestrator: Orchestrator = Depends(require_session)
):
    """
    Clear conversation history for the current session.
    """
    try:
        orchestrator.state.conversation_history.clear()
        orchestrator.state.pending_action = None
        orchestrator.state.current_agent = None
        
        return {"success": True, "message": "Conversation history cleared"}
    except Exception as e:
        logger.error(f"Clear history error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
