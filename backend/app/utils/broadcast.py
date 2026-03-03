import httpx
import logging
import time

logger = logging.getLogger(__name__)

async def trigger_broadcast(endpoint: str):
    """Trigger a real-time broadcast via the internal endpoint."""
    try:
        async with httpx.AsyncClient() as client:
            # We use the internal broadcast endpoint
            url = f"http://localhost:8000/api/v1/internal/broadcast"
            await client.post(url, json={
                "type": "refresh",
                "source": "backend_manual",
                "endpoint": endpoint,
                "timestamp": time.time()
            })
            logger.info(f"Broadcast triggered for {endpoint}")
    except Exception as e:
        logger.error(f"Failed to trigger broadcast: {e}")
