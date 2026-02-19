"""
FastAPI dependencies for authentication and session management.
"""

import logging
from typing import Optional, Dict
from fastapi import Header, HTTPException, Depends
from core.orchestrator import Orchestrator

logger = logging.getLogger(__name__)

# Store active sessions (in production, use Redis or database)
_sessions: Dict[str, Orchestrator] = {}


def get_session_orchestrator(session_id: Optional[str] = Header(None, alias="X-Session-ID")) -> Optional[Orchestrator]:
    """
    Get orchestrator for the given session ID.
    Returns None if no session exists.
    """
    if not session_id:
        return None
    return _sessions.get(session_id)


def require_session(session_id: str = Header(..., alias="X-Session-ID")) -> Orchestrator:
    """
    Require a valid session. Raises 401 if not authenticated.
    """
    orchestrator = _sessions.get(session_id)
    if not orchestrator:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired session. Please login again."
        )
    if not orchestrator.api_client.is_authenticated:
        raise HTTPException(
            status_code=401,
            detail="Session expired. Please login again."
        )
    return orchestrator


def create_session(orchestrator: Orchestrator) -> str:
    """
    Create a new session and return session ID.
    """
    import uuid
    session_id = str(uuid.uuid4())
    _sessions[session_id] = orchestrator
    logger.info(f"Created session: {session_id}")
    return session_id


def remove_session(session_id: str) -> bool:
    """
    Remove a session.
    """
    if session_id in _sessions:
        del _sessions[session_id]
        logger.info(f"Removed session: {session_id}")
        return True
    return False


def get_all_sessions() -> Dict[str, Orchestrator]:
    """
    Get all active sessions (for admin purposes).
    """
    return _sessions
