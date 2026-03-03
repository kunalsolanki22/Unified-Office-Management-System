# Redis Caching & Rate Limiter — Implementation Guide

This document explains all Redis caching and rate limiting changes made to the **Unified Office Management System** backend.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Configuration](#configuration)
4. [Redis Client & Connection Management](#redis-client--connection-management)
5. [CacheManager](#cachemanager)
6. [Caching Decorators](#caching-decorators)
7. [Service-Level Caching](#service-level-caching)
8. [Rate Limiter](#rate-limiter)
9. [Application Lifecycle](#application-lifecycle)
10. [Health Checks](#health-checks)
11. [Booking Cleanup Service](#booking-cleanup-service)
12. [Docker Setup](#docker-setup)
13. [Files Changed Summary](#files-changed-summary)

---

## Overview

Two major features were added to the backend:

| Feature | Purpose |
|---------|---------|
| **Redis Caching** | Cache frequently accessed data (users, desks, holidays, food items) to reduce database load and improve response times |
| **Rate Limiting** | Protect APIs from abuse using sliding-window counters stored in Redis, with per-minute and per-hour limits |

Both features are designed to **fail open** — if Redis is unavailable, caching is silently skipped and all requests are allowed through. This ensures the application never becomes unresponsive due to Redis downtime.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      FastAPI Application                     │
│                                                              │
│  ┌──────────────────┐    ┌─────────────────────────────────┐ │
│  │  RateLimitMiddle  │───▶│  Redis (Sliding Window Counters)│ │
│  │  ware             │    │  Keys: ratelimit:{id}:{ep}:... │ │
│  └──────────────────┘    └─────────────────────────────────┘ │
│           │                                                  │
│           ▼                                                  │
│  ┌──────────────────┐    ┌─────────────────────────────────┐ │
│  │  Service Layer    │───▶│  Redis (Cached Data)            │ │
│  │  (DeskService,    │    │  Keys: user:*, desk:*, food:*  │ │
│  │   UserService,    │    │  holiday:*, booking:*           │ │
│  │   FoodService,    │    └─────────────────────────────────┘ │
│  │   HolidayService) │                                       │
│  └──────────────────┘                                        │
│           │                                                  │
│           ▼                                                  │
│  ┌──────────────────┐                                        │
│  │  PostgreSQL DB    │                                        │
│  └──────────────────┘                                        │
└──────────────────────────────────────────────────────────────┘
```

---

## Configuration

All Redis and rate limiting settings are defined in `app/core/config.py` and can be overridden via environment variables or `.env`:

```python
# Redis Configuration
REDIS_URL: str = "redis://localhost:6379/0"
REDIS_MAX_CONNECTIONS: int = 50
CACHE_DEFAULT_EXPIRE: int = 300  # 5 minutes

# Rate Limiting
RATE_LIMIT_ENABLED: bool = True
RATE_LIMIT_PER_MINUTE: int = 60
RATE_LIMIT_PER_HOUR: int = 1000
```

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_URL` | `redis://localhost:6379/0` | Redis connection URL (supports `redis://` and `rediss://` for TLS) |
| `REDIS_MAX_CONNECTIONS` | `50` | Maximum connections in the async connection pool |
| `CACHE_DEFAULT_EXPIRE` | `300` | Default TTL in seconds when no explicit expiry is set |
| `RATE_LIMIT_ENABLED` | `true` | Master toggle -- set `false` to disable rate limiting entirely |
| `RATE_LIMIT_PER_MINUTE` | `60` | Requests allowed per user/IP per minute (global) |
| `RATE_LIMIT_PER_HOUR` | `1000` | Requests allowed per user/IP per hour (global) |

---

## Redis Client & Connection Management

**File:** `app/core/redis.py`

### Connection Pool

A single global `ConnectionPool` is lazily created on first use and shared across all async tasks:

```python
_redis_pool: Optional[ConnectionPool] = None
_redis_client: Optional[Redis] = None

async def get_redis_pool() -> ConnectionPool:
    """Creates pool from REDIS_URL with max_connections limit."""

async def get_redis() -> Redis:
    """Returns a Redis client backed by the shared pool."""

async def close_redis():
    """Closes the client and disconnects the pool (called on shutdown)."""
```

- **`get_redis()`** — Used everywhere to obtain a Redis client. Safe to call repeatedly (returns cached instance).
- **`close_redis()`** — Called once in the FastAPI shutdown event to cleanly release connections.

---

## CacheManager

**File:** `app/core/redis.py`

The `CacheManager` class provides a domain-scoped interface for Redis operations. Each instance has a `prefix` that namespaces all its keys.

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `get` | `get(key) → Optional[Any]` | Deserialize and return cached JSON value |
| `set` | `set(key, value, expire)` | Serialize value to JSON and store with TTL |
| `delete` | `delete(key)` | Delete a single key |
| `delete_pattern` | `delete_pattern(pattern) → int` | Delete all keys matching a glob pattern (uses `SCAN`) |
| `exists` | `exists(key) → bool` | Check if key exists |
| `increment` | `increment(key, amount) → int` | Atomic counter increment |
| `expire` | `expire(key, seconds)` | Set/reset TTL on an existing key |

### Domain-Specific Instances

Pre-configured instances are created at module level for each data domain:

```python
cache_manager = CacheManager()                   # prefix: "cache"
user_cache    = CacheManager(prefix="user")       # prefix: "user"
desk_cache    = CacheManager(prefix="desk")       # prefix: "desk"
booking_cache = CacheManager(prefix="booking")    # prefix: "booking"
attendance_cache = CacheManager(prefix="attendance")  # prefix: "attendance"
```

Each service imports the appropriate instance (e.g., `DeskService` uses `desk_cache`, `UserService` uses `user_cache`).

### Key Naming Convention

All keys follow the pattern: `{prefix}:{key}` — e.g., `user:id:550e8400-...`, `desk:list:None:True:1:20`.

---

## Caching Decorators

**File:** `app/core/redis.py`

Two decorators are provided for declarative caching:

### `@cached` — Cache function results

```python
@cached(expire=300, key_prefix="users")
async def get_users():
    return await db.fetch_all_users()

@cached(expire=60, key_builder=lambda user_id: f"user:{user_id}")
async def get_user(user_id: int):
    return await db.fetch_user(user_id)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `expire` | `int \| timedelta` | Cache TTL (default: 300s) |
| `key_prefix` | `str` | Prefix for auto-generated keys |
| `key_builder` | `Callable` | Custom function to build key from args |
| `unless` | `Callable` | Returns `True` to skip caching |

**Behavior:**
1. Builds a cache key from function name + arguments (or custom builder)
2. Checks Redis for cached value → returns immediately on hit
3. On miss: executes function, caches result, then returns

### `@invalidate_cache` — Invalidate on mutation

```python
@invalidate_cache("users:*")
async def update_user(user_id: int, data: dict):
    return await db.update_user(user_id, data)
```

Deletes all keys matching the given pattern after the function executes.

---

## Service-Level Caching

Each service was updated with **cache helpers** and **invalidation calls**. No existing business logic was changed.

### Pattern Used in All Services

```python
# 1. Import domain cache manager
from ..core.redis import desk_cache  # or user_cache, cache_manager

# 2. Define TTL constants
CACHE_TTL_DESK = 300

# 3. Add invalidation helpers
async def _invalidate_desk_cache(self, desk_id=None):
    if desk_id:
        await desk_cache.delete(f"id:{str(desk_id)}")
    await desk_cache.delete_pattern("list:*")

# 4. Add serializer for caching
def _serialize_desk(self, desk) -> dict:
    return {"id": str(desk.id), "desk_code": desk.desk_code, ...}

# 5. Cache reads (in list/get methods)
cached_data = {"desks": [...], "total": total}
await desk_cache.set(cache_key, cached_data, self.CACHE_TTL_DESK_LIST)

# 6. Invalidate on writes (after commit in create/update/delete)
await self._invalidate_desk_cache(desk_id)
```

### Per-Service Details

#### UserService (`user_service.py`)

| Cache Instance | `user_cache` (prefix: `user`) |
|---|---|
| **TTLs** | User profiles: 300s, User lists: 60s |
| **Cached Methods** | `get_user_by_id`, `get_user_by_email`, `get_user_by_code` |
| **Invalidated On** | `update_user` |
| **Key Examples** | `user:id:{uuid}`, `user:email:john@co.com`, `user:code:AB1234` |

#### DeskService (`desk_service.py`)

| Cache Instance | `desk_cache` (prefix: `desk`) |
|---|---|
| **TTLs** | Desk info: 300s, Desk lists: 300s, Rooms: 300s |
| **Cached Methods** | `list_desks` (non-time-filtered only) |
| **Invalidated On** | `create_desk`, `update_desk`, `create_room`, `update_room` |
| **Key Examples** | `desk:list:None:True:1:20`, `desk:id:{uuid}`, `desk:room:{uuid}` |

#### HolidayService (`holiday_service.py`)

| Cache Instance | `cache_manager` (prefix: `cache`) |
|---|---|
| **TTLs** | Holiday info: 600s, Holiday lists: 600s, Upcoming: 300s |
| **Cached Methods** | `list_holidays`, `get_upcoming_holidays` |
| **Invalidated On** | `create_holiday`, `update_holiday`, `delete_holiday` |
| **Key Examples** | `cache:holiday:list:True:False:None:1:50`, `cache:holiday:upcoming:30` |

#### FoodService (`food_service.py`)

| Cache Instance | `cache_manager` (prefix: `cache`) |
|---|---|
| **TTLs** | Categories: 600s, Food items: 300s, Food lists: 300s |
| **Cached Methods** | `list_categories`, `list_food_items` |
| **Invalidated On** | `create_category`, `update_category`, `delete_category`, `update_food_item` |
| **Key Examples** | `cache:food:categories:True`, `cache:food:items:None:None:1:20` |

---

## Rate Limiter

**File:** `app/middleware/rate_limiter.py`

### Algorithm: Sliding Window Counters

Uses Redis `INCR` + `EXPIRE` with time-bucketed keys for both minute and hour windows:

```
Key format: ratelimit:{identifier}:{endpoint}:{window}:{bucket}

Examples:
  ratelimit:user:abc123:/api/v1/desks:minute:45678901
  ratelimit:ip:192.168.1.1:default:hour:12345
```

Each request atomically increments both the minute and hour counters in a Redis pipeline, then checks both limits.

### RateLimiter Class

```python
class RateLimiter:
    def __init__(self, requests_per_minute=60, requests_per_hour=1000, burst_size=10)
    async def is_allowed(identifier, endpoint) -> (bool, rate_info_dict)
    async def get_usage(identifier) -> dict
```

### RateLimitMiddleware

Applied conditionally based on `RATE_LIMIT_ENABLED`:

```python
# In main.py
if settings.RATE_LIMIT_ENABLED:
    app.add_middleware(RateLimitMiddleware)
```

**Excluded paths** (never rate limited):
- `/health`, `/docs`, `/redoc`, `/openapi.json`, `/favicon.ico`

**Strict endpoints** (tighter limits):

| Endpoint | Per Minute | Per Hour |
|----------|-----------|----------|
| `/api/v1/auth/login` | 10 | 50 |
| `/api/v1/auth/register` | 5 | 20 |
| `/api/v1/auth/forgot-password` | 3 | 10 |

### Client Identification

1. **Authenticated users** → `user:{user_id}` (from `request.state.user_id`)
2. **Anonymous requests** → `ip:{client_ip}` (respects `X-Forwarded-For`)

### Response Headers

Every response includes rate limit headers:

```
X-RateLimit-Limit-Minute: 60
X-RateLimit-Remaining-Minute: 55
X-RateLimit-Limit-Hour: 1000
X-RateLimit-Remaining-Hour: 980
X-RateLimit-Reset: 45
```

### 429 Response Format

```json
{
  "success": false,
  "data": null,
  "message": "Rate limit exceeded. Please retry after 45 seconds.",
  "timestamp": "2026-02-27T06:30:00+00:00"
}
```

### Endpoint-Specific Decorator

For fine-grained control on individual endpoints:

```python
@router.get("/expensive-operation")
@rate_limit(requests_per_minute=10)
async def expensive_operation(request: Request):
    ...
```

---

## Application Lifecycle

**File:** `app/main.py`

### Startup

```python
@app.on_event("startup")
async def startup_event():
    # 1. Initialize Redis connection and verify with PING
    # 2. Start background booking cleanup scheduler (every 5 min)
```

If Redis connection fails on startup, a warning is logged and the app continues without caching/rate limiting.

### Shutdown

```python
@app.on_event("shutdown")
async def shutdown_event():
    # Close Redis connection pool gracefully
    await close_redis()
```

### Middleware Order

```python
app.add_middleware(ResponseMiddleware)      # Response formatting (runs last)
app.add_middleware(RateLimitMiddleware)     # Rate limiting (runs before response formatting)
app.add_middleware(CORSMiddleware, ...)     # CORS (runs first)
```

---

## Health Checks

Three health check endpoints were added/enhanced:

| Endpoint | Purpose | Checks |
|----------|---------|--------|
| `GET /health` | Full health check | API + Redis PING + Database `SELECT 1` |
| `GET /health/ready` | Kubernetes readiness probe | Redis PING only |
| `GET /health/live` | Kubernetes liveness probe | Always returns `{alive: true}` |

### `/health` Response

```json
{
  "status": "healthy",
  "timestamp": "2026-02-27T06:30:00+00:00",
  "version": "1.0.0",
  "services": {
    "api": "healthy",
    "redis": "healthy",
    "database": "healthy"
  }
}
```

If Redis or DB is down, `status` becomes `"degraded"` and the failing service shows the error string.

---

## Booking Cleanup Service

**File:** `app/services/booking_cleanup_service.py`

A background async task that runs every 5 minutes to clean up stale bookings:

| Action | Target | Condition |
|--------|--------|-----------|
| Cancel | PENDING desk bookings | `end_date < today` |
| Complete | CONFIRMED desk bookings | `end_date < today` |
| Cancel | PENDING conference room bookings | `booking_date < today` |
| Complete | CONFIRMED conference room bookings | `booking_date < today` |

Started automatically on app startup via `asyncio.create_task()`.

---

## Docker Setup

### docker-compose.yml

Added **Redis service** alongside the existing PostgreSQL:

```yaml
redis:
  image: redis:7-alpine
  container_name: office_redis
  ports:
    - "6379:6379"
  volumes:
    - redis_data:/data
  command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
  healthcheck:
    test: ["CMD", "redis-cli", "ping"]
    interval: 5s
    timeout: 5s
    retries: 5
```

The backend service now `depends_on` Redis with `service_healthy` and runs via Gunicorn in production.

### Environment Variables in Docker

```yaml
# Redis configuration
- REDIS_URL=redis://redis:6379/0
- REDIS_MAX_CONNECTIONS=50
- CACHE_DEFAULT_EXPIRE=300
# Rate limiting
- RATE_LIMIT_ENABLED=true
- RATE_LIMIT_PER_MINUTE=60
- RATE_LIMIT_PER_HOUR=1000
```

---

## Files Changed Summary

| File | Type | Changes |
|------|------|---------|
| `app/core/config.py` | Modified | Added 6 new settings for Redis and rate limiting |
| `app/core/redis.py` | New | Redis client, `CacheManager`, `@cached`/`@invalidate_cache` decorators, domain cache instances |
| `app/middleware/rate_limiter.py` | New | `RateLimiter`, `RateLimitMiddleware`, `@rate_limit` decorator |
| `app/main.py` | Modified | Imports, middleware registration, health checks, startup/shutdown lifecycle |
| `app/services/user_service.py` | Modified | `user_cache` + caching on get/update methods |
| `app/services/desk_service.py` | Modified | `desk_cache` + caching on list/create/update for desks and rooms |
| `app/services/holiday_service.py` | Modified | `cache_manager` + caching on CRUD and list methods |
| `app/services/food_service.py` | Modified | `cache_manager` + caching on category/food item CRUD and lists |
| `app/services/booking_cleanup_service.py` | New | Background task for expired booking cleanup |
| `requirements.txt` | Modified | Added `redis[hiredis]>=5.0.0`, `gunicorn>=21.2.0` |
| `docker-compose.yml` | Modified | Added Redis service, env vars, health check dependency |
| `docker-compose.dev.yml` | New | Development override (uvicorn with reload, rate limiting off) |
| `docker-compose.prod.yml` | New | Production override (resource limits, Redis password) |
| `gunicorn.conf.py` | New | Production Gunicorn config with worker management |
