"""
Redis connection and caching utilities.
Provides async Redis client and caching decorators for API responses.
"""
import json
import hashlib
import functools
import logging
from typing import Optional, Any, Callable, Union
from datetime import timedelta
import redis.asyncio as redis
from redis.asyncio import ConnectionPool, Redis

from .config import settings

logger = logging.getLogger(__name__)

# Global Redis connection pool
_redis_pool: Optional[ConnectionPool] = None
_redis_client: Optional[Redis] = None


async def get_redis_pool() -> ConnectionPool:
    """Get or create Redis connection pool."""
    global _redis_pool
    if _redis_pool is None:
        _redis_pool = ConnectionPool.from_url(
            settings.REDIS_URL,
            max_connections=settings.REDIS_MAX_CONNECTIONS,
            decode_responses=True,
            encoding="utf-8",
        )
    return _redis_pool


async def get_redis() -> Redis:
    """Get Redis client instance."""
    global _redis_client
    if _redis_client is None:
        pool = await get_redis_pool()
        _redis_client = Redis(connection_pool=pool)
    return _redis_client


async def close_redis():
    """Close Redis connection pool."""
    global _redis_pool, _redis_client
    if _redis_client:
        await _redis_client.close()
        _redis_client = None
    if _redis_pool:
        await _redis_pool.disconnect()
        _redis_pool = None


class CacheManager:
    """
    Cache manager for Redis operations.
    Provides methods for caching API responses and data.
    """

    def __init__(self, prefix: str = "cache"):
        self.prefix = prefix

    def _make_key(self, key: str) -> str:
        """Generate cache key with prefix."""
        return f"{self.prefix}:{key}"

    def _hash_key(self, data: Any) -> str:
        """Generate hash for complex keys."""
        serialized = json.dumps(data, sort_keys=True, default=str)
        return hashlib.md5(serialized.encode()).hexdigest()

    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        try:
            client = await get_redis()
            value = await client.get(self._make_key(key))
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.warning(f"Cache get error: {e}")
            return None

    async def set(
        self,
        key: str,
        value: Any,
        expire: Union[int, timedelta] = None
    ) -> bool:
        """Set value in cache with optional expiration."""
        try:
            client = await get_redis()
            serialized = json.dumps(value, default=str)
            expire_seconds = expire if isinstance(expire, int) else (
                int(expire.total_seconds()) if expire else settings.CACHE_DEFAULT_EXPIRE
            )
            await client.set(
                self._make_key(key),
                serialized,
                ex=expire_seconds
            )
            return True
        except Exception as e:
            logger.warning(f"Cache set error: {e}")
            return False

    async def delete(self, key: str) -> bool:
        """Delete value from cache."""
        try:
            client = await get_redis()
            await client.delete(self._make_key(key))
            return True
        except Exception as e:
            logger.warning(f"Cache delete error: {e}")
            return False

    async def delete_pattern(self, pattern: str) -> int:
        """Delete all keys matching pattern."""
        try:
            client = await get_redis()
            keys = []
            async for key in client.scan_iter(match=self._make_key(pattern)):
                keys.append(key)
            if keys:
                return await client.delete(*keys)
            return 0
        except Exception as e:
            logger.warning(f"Cache delete pattern error: {e}")
            return 0

    async def exists(self, key: str) -> bool:
        """Check if key exists in cache."""
        try:
            client = await get_redis()
            return await client.exists(self._make_key(key)) > 0
        except Exception as e:
            logger.warning(f"Cache exists error: {e}")
            return False

    async def increment(self, key: str, amount: int = 1) -> Optional[int]:
        """Increment a counter in cache."""
        try:
            client = await get_redis()
            return await client.incrby(self._make_key(key), amount)
        except Exception as e:
            logger.warning(f"Cache increment error: {e}")
            return None

    async def expire(self, key: str, seconds: int) -> bool:
        """Set expiration on existing key."""
        try:
            client = await get_redis()
            return await client.expire(self._make_key(key), seconds)
        except Exception as e:
            logger.warning(f"Cache expire error: {e}")
            return False


# Default cache manager instance
cache_manager = CacheManager()


def cached(
    expire: Union[int, timedelta] = 300,
    key_prefix: str = "",
    key_builder: Callable[..., str] = None,
    unless: Callable[..., bool] = None
):
    """
    Decorator to cache function results in Redis.
    
    Args:
        expire: Cache expiration in seconds or timedelta
        key_prefix: Prefix for cache key
        key_builder: Custom function to build cache key from args/kwargs
        unless: Function that returns True to skip caching
    
    Usage:
        @cached(expire=300, key_prefix="users")
        async def get_users():
            return await db.fetch_all_users()
        
        @cached(expire=60, key_builder=lambda user_id: f"user:{user_id}")
        async def get_user(user_id: int):
            return await db.fetch_user(user_id)
    """
    def decorator(func: Callable):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # Check if caching should be skipped
            if unless and unless(*args, **kwargs):
                return await func(*args, **kwargs)

            # Build cache key
            if key_builder:
                cache_key = key_builder(*args, **kwargs)
            else:
                # Auto-generate key from function name and arguments
                key_parts = [key_prefix or func.__name__]
                if args:
                    # Skip 'self' for methods
                    start_idx = 1 if args and hasattr(args[0], '__class__') else 0
                    for arg in args[start_idx:]:
                        key_parts.append(str(arg))
                if kwargs:
                    for k, v in sorted(kwargs.items()):
                        # Skip db sessions and request objects
                        if k not in ('db', 'session', 'request', 'current_user'):
                            key_parts.append(f"{k}={v}")
                cache_key = ":".join(key_parts)

            # Try to get from cache
            cached_value = await cache_manager.get(cache_key)
            if cached_value is not None:
                logger.debug(f"Cache hit: {cache_key}")
                return cached_value

            # Execute function and cache result
            logger.debug(f"Cache miss: {cache_key}")
            result = await func(*args, **kwargs)
            
            # Cache the result
            if result is not None:
                expire_seconds = expire if isinstance(expire, int) else int(expire.total_seconds())
                await cache_manager.set(cache_key, result, expire_seconds)

            return result
        return wrapper
    return decorator


def invalidate_cache(pattern: str):
    """
    Decorator to invalidate cache after function execution.
    
    Usage:
        @invalidate_cache("users:*")
        async def update_user(user_id: int, data: dict):
            return await db.update_user(user_id, data)
    """
    def decorator(func: Callable):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            result = await func(*args, **kwargs)
            await cache_manager.delete_pattern(pattern)
            return result
        return wrapper
    return decorator


# Specific cache managers for different data types
user_cache = CacheManager(prefix="user")
desk_cache = CacheManager(prefix="desk")
booking_cache = CacheManager(prefix="booking")
attendance_cache = CacheManager(prefix="attendance")
