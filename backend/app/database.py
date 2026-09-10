import asyncio
import asyncpg
from typing import Optional
from app.config import get_settings

_pool: Optional[asyncpg.Pool] = None


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        settings = get_settings()
        _pool = await asyncpg.create_pool(
            dsn=settings.database_url,
            min_size=1,
            max_size=5,
            command_timeout=15.0,
            max_inactive_connection_lifetime=60.0,
        )
    return _pool


async def close_pool() -> None:
    global _pool
    if _pool is not None:
        try:
            await asyncio.wait_for(_pool.close(), timeout=2.0)
        except Exception:
            _pool.terminate()
        _pool = None


async def get_db() -> asyncpg.Connection:
    """FastAPI dependency — yields a connection from the pool."""
    pool = await get_pool()
    async with pool.acquire(timeout=10.0) as conn:
        yield conn
