"""
Database configuration and connection management
"""

import asyncio
from contextlib import asynccontextmanager
from typing import AsyncGenerator
import logging

from sqlalchemy.ext.asyncio import (
    AsyncSession, create_async_engine, async_sessionmaker,
    AsyncEngine
)
from sqlalchemy.pool import QueuePool
from sqlalchemy import event
from sqlalchemy.engine import Engine
import asyncpg
import aioredis

from .config import settings

# Configure logging
logger = logging.getLogger(__name__)

# Global engine and session factory
_engine: AsyncEngine = None
_async_session_maker: async_sessionmaker = None


def get_database_url() -> str:
    """Convert PostgreSQL URL to async format"""
    if settings.DATABASE_URL.startswith("postgresql://"):
        return settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
    return settings.DATABASE_URL


async def create_engine() -> AsyncEngine:
    """Create async database engine with optimizations"""
    global _engine
    
    if _engine is not None:
        return _engine
    
    # Database connection URL
    database_url = get_database_url()
    
    # Engine configuration
    engine_config = {
        "echo": settings.DEBUG,  # SQL logging in debug mode
        "poolclass": QueuePool,
        "pool_size": settings.DATABASE_POOL_SIZE,
        "max_overflow": settings.DATABASE_MAX_OVERFLOW,
        "pool_timeout": settings.DATABASE_POOL_TIMEOUT,
        "pool_pre_ping": True,  # Verify connections before use
        "pool_recycle": 3600,   # Recycle connections every hour
        "connect_args": {
            "server_settings": {
                "application_name": "realestate_app",
                "jit": "off",  # Disable JIT for better performance
                "random_page_cost": "1.1",  # Optimize for SSD
                "effective_cache_size": "4GB",  # Adjust based on available RAM
                "work_mem": "4MB",  # Memory for sorting operations
                "maintenance_work_mem": "64MB",  # Memory for maintenance
            }
        }
    }
    
    try:
        _engine = create_async_engine(
            database_url,
            **engine_config
        )
        
        # Test connection
        async with _engine.begin() as conn:
            await conn.execute("SELECT 1")
        
        logger.info("Database engine created successfully")
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
            await db.execute("SELECT 1")
        return True
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False


# Connection pool monitoring
async def get_db_stats() -> dict:
    """Get database connection pool statistics"""
    if not _engine:
        return {"error": "Engine not initialized"}
    
    pool = _engine.pool
    
    return {
        "pool_size": pool.size(),
        "checked_in": pool.checkedin(),
        "checked_out": pool.checkedout(),
        "overflow": pool.overflow(),
        "invalid": pool.invalid()
    }


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


# Database migration helper
async def run_migrations() -> None:
    """Run database migrations"""
    try:
        # This would integrate with Alembic for migrations
        # For now, we'll just log that migrations would run
        logger.info("Database migrations would run here")
        
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        raise


# Async context manager for database operations
class DatabaseManager:
    """Database manager for handling connections and transactions"""
    
    def __init__(self):
        self.engine = None
        self.session_maker = None
    
    async def initialize(self):
        """Initialize database connections"""
        self.engine = await create_engine()
        self.session_maker = await create_session_maker()
    
    async def close(self):
        """Close database connections"""
        if self.session_maker:
            await self.session_maker.close()
        if self.engine:
            await self.engine.dispose()
    
    async def get_session(self) -> AsyncSession:
        """Get a new database session"""
        if not self.session_maker:
            await self.initialize()
        return self.session_maker()
    
    async def execute_in_transaction(self, operation):
        """Execute operation in a transaction"""
        async with self.get_session() as session:
            async with session.begin():
                try:
                    result = await operation(session)
                    return result
                except Exception:
                    await session.rollback()
                    raise


# Global database manager instance
db_manager = DatabaseManager()


# Import time for performance monitoring
import time
