import os
import json
import redis.asyncio as redis
from typing import Optional, Any

REDIS_HOST = 'run-turboquiet-receipt-25334.db.redis.io'
REDIS_PORT = 11268
REDIS_USERNAME = "default"
REDIS_PASSWORD = "rEs5VgCPPIhQ31Xk9r7KQ2N3bqBb0VUY"

# Create Global Async Redis Client
redis_client = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    decode_responses=True,
    username=REDIS_USERNAME,
    password=REDIS_PASSWORD
)

async def get_cache(key: str) -> Optional[Any]:
    try:
        val = await redis_client.get(key)
        if val:
            return json.loads(val)
        return None
    except Exception as e:
        print(f"Redis read error: {e}")
        return None

async def set_cache(key: str, value: Any, ttl_seconds: int = 600) -> bool:
    try:
        if value is None:
            return False
        # Set 10-minute TTL to keep cache relatively fresh automatically
        await redis_client.setex(key, ttl_seconds, json.dumps(value))
        return True
    except Exception as e:
        print(f"Redis write error: {e}")
        return False

async def delete_cache(prefix: str):
    """Delete all keys matching a given prefix to immediately invalidate modified domains."""
    try:
        cursor = '0'
        while cursor != 0:
            cursor, keys = await redis_client.scan(cursor=cursor, match=f"{prefix}*", count=100)
            if keys:
                await redis_client.delete(*keys)
    except Exception as e:
        print(f"Redis invalidate error: {e}")

def generate_cache_key(prefix: str, **kwargs):
    # Consolidate all non-null params into a strict string block
    sorted_args = "__".join([f"{k}={v}" for k, v in sorted(kwargs.items()) if v is not None])
    return f"{prefix}::{sorted_args}"
