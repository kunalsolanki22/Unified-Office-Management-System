"""
Database package initialization.
"""

from database.models import (
    Base, User, Session, Conversation, Message,
    AgentRoutingLog, AgentExecutionLog,
    MessageRole, SessionStatus, AgentType,
    create_tables, drop_tables
)
from database.connection import (
    DatabaseManager, db_manager, get_db, init_database
)
from database.repository import (
    UserRepository, SessionRepository, ConversationRepository,
    MessageRepository, AgentRoutingLogRepository, AgentExecutionLogRepository
)

__all__ = [
    # Models
    "Base", "User", "Session", "Conversation", "Message",
    "AgentRoutingLog", "AgentExecutionLog",
    # Enums
    "MessageRole", "SessionStatus", "AgentType",
    # Functions
    "create_tables", "drop_tables",
    # Connection
    "DatabaseManager", "db_manager", "get_db", "init_database",
    # Repositories
    "UserRepository", "SessionRepository", "ConversationRepository",
    "MessageRepository", "AgentRoutingLogRepository", "AgentExecutionLogRepository"
]
