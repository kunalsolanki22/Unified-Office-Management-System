from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from datetime import datetime, timezone
import logging

from .core.config import settings
from .api.v1.router import api_router
from .middleware.response_middleware import ResponseMiddleware
from .middleware.rate_limiter import RateLimitMiddleware
from .core.redis import get_redis, close_redis

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="Unified Office Management System API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Custom middleware (order matters - first added = last executed)
app.add_middleware(ResponseMiddleware)

# Rate limiting middleware (uses Redis)
if settings.RATE_LIMIT_ENABLED:
    app.add_middleware(RateLimitMiddleware)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors."""
    # Clean error messages to ensure JSON serializable
    errors = []
    for error in exc.errors():
        clean_error = {
            "loc": error.get("loc"),
            "msg": error.get("msg"),
            "type": error.get("type")
        }
        errors.append(clean_error)
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "data": None,
            "message": "Validation error",
            "errors": errors,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions."""
    logger.exception(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "data": None,
            "message": "Internal server error",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    )


# Include API router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


# Health check endpoint
@app.get("/health")
async def health_check():
    """
    Health check endpoint with service status.
    Checks database and Redis connectivity.
    """
    health_status = {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0",
        "services": {
            "api": "healthy",
            "redis": "unknown",
            "database": "unknown"
        }
    }
    
    # Check Redis
    try:
        redis_client = await get_redis()
        await redis_client.ping()
        health_status["services"]["redis"] = "healthy"
    except Exception as e:
        health_status["services"]["redis"] = f"unhealthy: {str(e)}"
        health_status["status"] = "degraded"
    
    # Check Database
    try:
        from sqlalchemy import text
        from .core.database import engine
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        health_status["services"]["database"] = "healthy"
    except Exception as e:
        health_status["services"]["database"] = f"unhealthy: {str(e)}"
        health_status["status"] = "degraded"
    
    return health_status


@app.get("/health/ready")
async def readiness_check():
    """Kubernetes readiness probe - checks if app can serve traffic."""
    try:
        redis_client = await get_redis()
        await redis_client.ping()
        return {"ready": True}
    except Exception:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"ready": False, "reason": "Redis not available"}
        )


@app.get("/health/live")
async def liveness_check():
    """Kubernetes liveness probe - checks if app is running."""
    return {"alive": True}


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Unified Office Management System API",
        "docs": "/docs",
        "health": "/health"
    }


# Startup event
@app.on_event("startup")
async def startup_event():
    """Application startup event."""
    import asyncio
    from .services.booking_cleanup_service import run_cleanup_scheduler
    
    logger.info(f"Starting {settings.APP_NAME}")
    logger.info(f"Debug mode: {settings.DEBUG}")
    
    # Initialize Redis connection
    try:
        redis_client = await get_redis()
        await redis_client.ping()
        logger.info("Redis connection established")
    except Exception as e:
        logger.warning(f"Redis connection failed: {e}. Caching and rate limiting will be disabled.")
    
    # Start background cleanup scheduler (runs every 5 minutes)
    asyncio.create_task(run_cleanup_scheduler(interval_minutes=5))
    logger.info("Booking cleanup scheduler initialized")


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown event."""
    # Close Redis connection pool
    await close_redis()
    logger.info("Redis connection closed")
    
    logger.info(f"Shutting down {settings.APP_NAME}")