"""
Database connection and session management.
"""

from contextlib import contextmanager
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool, StaticPool

from config.settings import get_settings
from database.models import Base, create_tables


class DatabaseManager:
    """
    Manages database connections and sessions.
    Implements singleton pattern for connection pooling.
    """
    
    _instance = None
    _engine = None
    _session_factory = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._engine is None:
            self._initialize()
    
    def _initialize(self):
        """Initialize database engine and session factory."""
        settings = get_settings()
        
        # Configure engine based on database type
        if settings.database_url.startswith("sqlite"):
            # SQLite configuration (for development)
            self._engine = create_engine(
                settings.database_url,
                echo=settings.db_echo,
                poolclass=StaticPool,
                connect_args={"check_same_thread": False}
            )
        else:
            # PostgreSQL/MySQL configuration (for production)
            self._engine = create_engine(
                settings.database_url,
                echo=settings.db_echo,
                poolclass=QueuePool,
                pool_size=settings.db_pool_size,
                max_overflow=settings.db_max_overflow,
                pool_pre_ping=True  # Verify connections before using
            )
        
        # Create session factory
        self._session_factory = sessionmaker(
            bind=self._engine,
            autocommit=False,
            autoflush=False,
            expire_on_commit=False
        )
    
    @property
    def engine(self):
        """Get the database engine."""
        return self._engine
    
    def create_all_tables(self):
        """Create all database tables."""
        create_tables(self._engine)
    
    def drop_all_tables(self):
        """Drop all database tables (use with caution!)."""
        Base.metadata.drop_all(self._engine)
    
    def get_session(self) -> Session:
        """
        Get a new database session.
        Remember to close the session when done.
        """
        return self._session_factory()
    
    @contextmanager
    def session_scope(self) -> Generator[Session, None, None]:
        """
        Context manager for database sessions.
        Automatically handles commit/rollback and closing.
        
        Usage:
            with db_manager.session_scope() as session:
                session.add(some_object)
                # Auto-commits on successful exit
        """
        session = self.get_session()
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()


# Global database manager instance
db_manager = DatabaseManager()


def get_db() -> Generator[Session, None, None]:
    """
    Dependency function for getting database sessions.
    Use with FastAPI dependency injection.
    
    Usage:
        @app.get("/items")
        def get_items(db: Session = Depends(get_db)):
            ...
    """
    with db_manager.session_scope() as session:
        yield session


def init_database():
    """
    Initialize the database - create all tables.
    Call this on application startup.
    """
    db_manager.create_all_tables()
