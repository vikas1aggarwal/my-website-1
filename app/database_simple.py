"""
Simplified Database Configuration for Local Development
Uses SQLite instead of PostgreSQL for easier setup
"""

import asyncio
from contextlib import asynccontextmanager
from typing import AsyncGenerator
import logging
import time

from sqlalchemy.ext.asyncio import (
    AsyncSession, create_async_engine, async_sessionmaker,
    AsyncEngine
)
from sqlalchemy.pool import StaticPool
from sqlalchemy import event, text
from sqlalchemy.engine import Engine

from .config_simple import settings

# Configure logging
logger = logging.getLogger(__name__)

# Global engine and session factory
_engine: AsyncEngine = None
_async_session_maker: async_sessionmaker = None


def get_database_url() -> str:
    """Get SQLite database URL"""
    return settings.DATABASE_URL.replace("sqlite:///", "sqlite+aiosqlite:///")


async def create_engine() -> AsyncEngine:
    """Create async SQLite database engine"""
    global _engine
    
    if _engine is not None:
        return _engine
    
    # Database connection URL
    database_url = get_database_url()
    
    # Engine configuration for SQLite
    engine_config = {
        "echo": settings.DEBUG,  # SQL logging in debug mode
        "poolclass": StaticPool,  # Use static pool for SQLite
        "connect_args": {
            "check_same_thread": False,  # Allow async operations
        }
    }
    
    try:
        _engine = create_async_engine(
            database_url,
            **engine_config
        )
        
        # Test connection
        async with _engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        
        logger.info("SQLite database engine created successfully")
        return _engine
        
    except Exception as e:
        logger.error(f"Failed to create database engine: {e}")
        raise


async def create_session_maker() -> async_sessionmaker:
    """Create async session maker"""
    global _async_session_maker
    
    if _async_session_maker is not None:
        return _async_session_maker
    
    engine = await create_engine()
    
    _async_session_maker = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
        autocommit=False
    )
    
    logger.info("Database session maker created successfully")
    return _async_session_maker


async def init_db() -> None:
    """Initialize database connection and create tables"""
    try:
        # Create engine and session maker
        await create_engine()
        await create_session_maker()
        
        logger.info("Database initialized successfully")
        
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise


async def close_db() -> None:
    """Close database connections"""
    global _engine, _async_session_maker
    
    if _async_session_maker:
        await _async_session_maker.close()
        _async_session_maker = None
    
    if _engine:
        await _engine.dispose()
        _engine = None
    
    logger.info("Database connections closed")


@asynccontextmanager
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Get database session with automatic cleanup"""
    session_maker = await create_session_maker()
    
    async with session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# Database health check
async def check_db_health() -> bool:
    """Check database connectivity"""
    try:
        async with get_db() as db:
            await db.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False


# Performance monitoring
@event.listens_for(Engine, "before_cursor_execute")
def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    """Log slow SQL queries"""
    conn.info.setdefault('query_start_time', []).append(time.time())


@event.listens_for(Engine, "after_cursor_execute")
def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    """Log query execution time"""
    total = time.time() - conn.info['query_start_time'].pop()
    
    if total > 1.0:  # Log queries taking more than 1 second
        logger.warning(
            "Slow query detected",
            query=statement[:200],  # First 200 characters
            execution_time=total,
            parameters=str(parameters)[:200]
        )


# Import time for performance monitoring
import time
