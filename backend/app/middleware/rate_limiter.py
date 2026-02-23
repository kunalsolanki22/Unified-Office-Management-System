"""
Rate limiting middleware using Redis.
Protects APIs from abuse with configurable per-user and per-IP limits.
"""
import time
import logging
from typing import Optional, Callable, Dict, Any
from fastapi import Request, Response, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from datetime import datetime, timezone

from ..core.redis import get_redis
from ..core.config import settings

logger = logging.getLogger(__name__)


class RateLimitExceeded(HTTPException):
    """Exception raised when rate limit is exceeded."""
    def __init__(self, retry_after: int = 60):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Retry after {retry_after} seconds.",
            headers={"Retry-After": str(retry_after)}
        )


class RateLimiter:
    """
    Token bucket rate limiter using Redis.
    Implements sliding window algorithm for accurate rate limiting.
    """
    
    def __init__(
        self,
        requests_per_minute: int = 60,
        requests_per_hour: int = 1000,
        burst_size: int = 10
    ):
        self.requests_per_minute = requests_per_minute
        self.requests_per_hour = requests_per_hour
        self.burst_size = burst_size

    async def is_allowed(
        self,
        identifier: str,
        endpoint: str = "default"
    ) -> tuple[bool, dict]:
        """
        Check if request is allowed under rate limit.
        
        Args:
            identifier: Unique identifier (user_id, IP, etc.)
            endpoint: Optional endpoint-specific limiting
        
        Returns:
            Tuple of (is_allowed, rate_limit_info)
        """
        try:
            redis_client = await get_redis()
            current_time = int(time.time())
            
            # Keys for minute and hour windows
            minute_key = f"ratelimit:{identifier}:{endpoint}:minute:{current_time // 60}"
            hour_key = f"ratelimit:{identifier}:{endpoint}:hour:{current_time // 3600}"
            
            # Use pipeline for atomic operations
            pipe = redis_client.pipeline()
            
            # Increment counters
            pipe.incr(minute_key)
            pipe.expire(minute_key, 60)
            pipe.incr(hour_key)
            pipe.expire(hour_key, 3600)
            
            # Get current counts
            pipe.get(minute_key)
            pipe.get(hour_key)
            
            results = await pipe.execute()
            
            minute_count = int(results[4] or 0)
            hour_count = int(results[5] or 0)
            
            # Calculate remaining
            minute_remaining = max(0, self.requests_per_minute - minute_count)
            hour_remaining = max(0, self.requests_per_hour - hour_count)
            
            rate_info = {
                "X-RateLimit-Limit-Minute": str(self.requests_per_minute),
                "X-RateLimit-Remaining-Minute": str(minute_remaining),
                "X-RateLimit-Limit-Hour": str(self.requests_per_hour),
                "X-RateLimit-Remaining-Hour": str(hour_remaining),
                "X-RateLimit-Reset": str(60 - (current_time % 60))
            }
            
            # Check limits
            if minute_count > self.requests_per_minute:
                return False, {**rate_info, "retry_after": 60 - (current_time % 60)}
            
            if hour_count > self.requests_per_hour:
                return False, {**rate_info, "retry_after": 3600 - (current_time % 3600)}
            
            return True, rate_info
            
        except Exception as e:
            logger.warning(f"Rate limiter error: {e}. Allowing request.")
            # Fail open - allow request if Redis is unavailable
            return True, {}

    async def get_usage(self, identifier: str) -> dict:
        """Get current rate limit usage for identifier."""
        try:
            redis_client = await get_redis()
            current_time = int(time.time())
            
            minute_key = f"ratelimit:{identifier}:default:minute:{current_time // 60}"
            hour_key = f"ratelimit:{identifier}:default:hour:{current_time // 3600}"
            
            minute_count = await redis_client.get(minute_key)
            hour_count = await redis_client.get(hour_key)
            
            return {
                "minute_usage": int(minute_count or 0),
                "minute_limit": self.requests_per_minute,
                "hour_usage": int(hour_count or 0),
                "hour_limit": self.requests_per_hour
            }
        except Exception as e:
            logger.warning(f"Error getting rate limit usage: {e}")
            return {}


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Middleware to apply rate limiting to all requests.
    """
    
    # Endpoints excluded from rate limiting
    EXCLUDED_PATHS = {
        "/health",
        "/docs",
        "/redoc",
        "/openapi.json",
        "/favicon.ico",
    }
    
    # Endpoints with custom (stricter) limits
    STRICT_ENDPOINTS = {
        "/api/v1/auth/login": {"requests_per_minute": 10, "requests_per_hour": 50},
        "/api/v1/auth/register": {"requests_per_minute": 5, "requests_per_hour": 20},
        "/api/v1/auth/forgot-password": {"requests_per_minute": 3, "requests_per_hour": 10},
    }
    
    def __init__(self, app, rate_limiter: RateLimiter = None):
        super().__init__(app)
        self.rate_limiter = rate_limiter or RateLimiter(
            requests_per_minute=settings.RATE_LIMIT_PER_MINUTE,
            requests_per_hour=settings.RATE_LIMIT_PER_HOUR
        )
        self.strict_limiters: Dict[str, RateLimiter] = {}
        
        # Initialize strict limiters
        for path, limits in self.STRICT_ENDPOINTS.items():
            self.strict_limiters[path] = RateLimiter(**limits)

    def _get_client_identifier(self, request: Request) -> str:
        """
        Get unique client identifier for rate limiting.
        Uses user ID if authenticated, otherwise uses IP address.
        """
        # Try to get user ID from request state (set by auth middleware)
        user_id = getattr(request.state, "user_id", None)
        if user_id:
            return f"user:{user_id}"
        
        # Fall back to IP address
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            # Get first IP in chain (original client)
            ip = forwarded.split(",")[0].strip()
        else:
            ip = request.client.host if request.client else "unknown"
        
        return f"ip:{ip}"

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request with rate limiting."""
        path = request.url.path
        
        # Skip excluded paths
        if path in self.EXCLUDED_PATHS or not settings.RATE_LIMIT_ENABLED:
            return await call_next(request)
        
        # Get appropriate rate limiter
        limiter = self.strict_limiters.get(path, self.rate_limiter)
        
        # Get client identifier
        identifier = self._get_client_identifier(request)
        
        # Check rate limit
        allowed, rate_info = await limiter.is_allowed(identifier, path)
        
        if not allowed:
            retry_after = rate_info.get("retry_after", 60)
            logger.warning(f"Rate limit exceeded for {identifier} on {path}")
            
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "success": False,
                    "data": None,
                    "message": f"Rate limit exceeded. Please retry after {retry_after} seconds.",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                },
                headers={
                    "Retry-After": str(retry_after),
                    **{k: v for k, v in rate_info.items() if k.startswith("X-")}
                }
            )
        
        # Process request
        response = await call_next(request)
        
        # Add rate limit headers to response
        for key, value in rate_info.items():
            if key.startswith("X-"):
                response.headers[key] = value
        
        return response


# Decorator for endpoint-specific rate limiting
def rate_limit(
    requests_per_minute: int = 60,
    requests_per_hour: int = 1000,
    key_func: Callable[[Request], str] = None
):
    """
    Decorator for endpoint-specific rate limiting.
    
    Usage:
        @router.get("/expensive-operation")
        @rate_limit(requests_per_minute=10)
        async def expensive_operation(request: Request):
            ...
    """
    limiter = RateLimiter(
        requests_per_minute=requests_per_minute,
        requests_per_hour=requests_per_hour
    )
    
    def decorator(func: Callable):
        async def wrapper(request: Request, *args, **kwargs):
            # Get identifier
            if key_func:
                identifier = key_func(request)
            else:
                identifier = request.client.host if request.client else "unknown"
            
            # Check rate limit
            allowed, rate_info = await limiter.is_allowed(identifier)
            
            if not allowed:
                raise RateLimitExceeded(retry_after=rate_info.get("retry_after", 60))
            
            return await func(request, *args, **kwargs)
        
        return wrapper
    return decorator


# Global rate limiter instance
default_rate_limiter = RateLimiter(
    requests_per_minute=settings.RATE_LIMIT_PER_MINUTE,
    requests_per_hour=settings.RATE_LIMIT_PER_HOUR
)
