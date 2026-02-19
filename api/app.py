"""
FastAPI application for the AI Employee Chatbot API.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config.settings import get_settings
from database.connection import db_manager
from services.kb_loader import get_kb_loader

from .routes import router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    logger.info("Starting AI Employee Chatbot API...")
    
    # Initialize database
    logger.info("Initializing database...")
    db_manager.create_all_tables()
    
    # Load knowledge base
    logger.info("Loading knowledge base...")
    kb_loader = get_kb_loader()
    logger.info(f"Loaded knowledge base v{kb_loader.kb.version} with {len(kb_loader.kb.domains)} domains")
    
    logger.info("API startup complete!")
    
    yield
    
    # Shutdown
    logger.info("Shutting down AI Employee Chatbot API...")


# Create FastAPI app
app = FastAPI(
    title="AI Employee Chatbot API",
    description="""
    REST API for the AI Employee Services Chatbot.
    
    ## Features
    - 🔐 Authentication with session management
    - 💬 Multi-turn conversation support
    - 🤖 Multi-agent routing (Attendance, Leave, Desk/Conference, Cafeteria, IT)
    - 📝 Conversation history
    
    ## Authentication Flow
    1. Call `/api/auth/login` with email and password
    2. Save the `session_id` from the response
    3. Pass `X-Session-ID: {session_id}` header in all subsequent requests
    4. Call `/api/auth/logout` when done
    
    ## Chat Flow
    1. Send message to `/api/chat` with your message
    2. Check `needs_followup` in response - if true, chatbot needs more info
    3. Continue conversation until task is complete
    """,
    version=settings.app_version,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "detail": str(exc) if settings.debug else None
        }
    )


# Include API routes
app.include_router(router, prefix="/api")


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information."""
    return {
        "name": "AI Employee Chatbot API",
        "version": settings.app_version,
        "docs": "/docs",
        "health": "/api/health"
    }


def run_server(host: str = "0.0.0.0", port: int = 8080, reload: bool = False):
    """Run the API server."""
    import uvicorn
    uvicorn.run(
        "api.app:app",
        host=host,
        port=port,
        reload=reload,
        log_level="info"
    )


if __name__ == "__main__":
    run_server(reload=True)
