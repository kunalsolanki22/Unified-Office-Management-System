"""
Database connection and session management
"""
import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from .models import Base

load_dotenv()

BASE_DIR = Path(__file__).parent.parent
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite+aiosqlite:///{BASE_DIR}/chatbot.db")

# Create async engine
engine = create_async_engine(DATABASE_URL, echo=False, future=True)

# Create async session factory
async_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def init_db():
    """Initialize database and create tables"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_session() -> AsyncSession:
    """Get database session"""
    async with async_session_factory() as session:
        yield session


class DatabaseManager:
    """Database manager"""
    
    def __init__(self):
        self.engine = engine
        self.session_factory = async_session_factory
    
    async def initialize(self):
        await init_db()
    
    async def get_session(self) -> AsyncSession:
        return self.session_factory()
    
    async def close(self):
        await self.engine.dispose()


db_manager = DatabaseManager()
