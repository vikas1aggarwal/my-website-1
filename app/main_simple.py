"""
Real Estate Project Management System - Simplified FastAPI Backend
Phase 1: Foundation with SQLite for Local Development
"""

from contextlib import asynccontextmanager
from typing import List, Optional
import logging
import time
from datetime import datetime, timedelta

from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
import structlog

from .database_simple import get_db, init_db
from .config_simple import settings

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# Security middleware configuration
SECURITY_HEADERS = {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin"
}

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("Starting Real Estate Project Management System")
    await init_db()
    logger.info("Database initialized successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Real Estate Project Management System")

# Create FastAPI application
app = FastAPI(
    title="Real Estate Project Management System",
    description="A comprehensive, AI-powered project management system for builders and architects",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Security middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Add security headers to all responses"""
    response = await call_next(request)
    for header, value in SECURITY_HEADERS.items():
        response.headers[header] = value
    return response

# Performance monitoring middleware
@app.middleware("http")
async def performance_monitoring(request: Request, call_next):
    """Monitor request performance"""
    start_time = time.time()
    
    # Process request
    response = await call_next(request)
    
    # Calculate processing time
    process_time = time.time() - start_time
    
    # Add performance header
    response.headers["X-Process-Time"] = str(process_time)
    
    # Log slow requests
    if process_time > 1.0:  # Log requests taking more than 1 second
        logger.warning(
            "Slow request detected",
            path=request.url.path,
            method=request.method,
            process_time=process_time,
            client_ip=request.client.host
        )
    
    return response

# Rate limiting middleware
from collections import defaultdict

request_counts = defaultdict(lambda: {"count": 0, "reset_time": 0})
RATE_LIMIT = 100  # requests per minute
RATE_LIMIT_WINDOW = 60  # seconds

@app.middleware("http")
async def rate_limiting(request: Request, call_next):
    """Basic rate limiting middleware"""
    client_ip = request.client.host
    current_time = time.time()
    
    # Reset counter if window has passed
    if current_time - request_counts[client_ip]["reset_time"] > RATE_LIMIT_WINDOW:
        request_counts[client_ip] = {"count": 0, "reset_time": current_time}
    
    # Check rate limit
    if request_counts[client_ip]["count"] >= RATE_LIMIT:
        logger.warning("Rate limit exceeded", client_ip=client_ip)
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={"detail": "Rate limit exceeded. Please try again later."}
        )
    
    # Increment counter
    request_counts[client_ip]["count"] += 1
    
    # Process request
    response = await call_next(request)
    return response

# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "database": "SQLite"
    }

# Simple authentication endpoints
@app.post("/auth/register", tags=["Authentication"])
async def register_user(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Register a new user (simplified)"""
    try:
        data = await request.json()
        
        # Simple validation
        required_fields = ["username", "email", "password", "full_name"]
        for field in required_fields:
            if field not in data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Missing required field: {field}"
                )
        
        # Check if user already exists
        result = await db.execute(
            text("SELECT id FROM users WHERE email = :email"),
            {"email": data["email"]}
        )
        if result.fetchone():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create user (simplified - no password hashing for demo)
        await db.execute(
            text("""
                INSERT INTO users (username, email, full_name, hashed_password, role_id)
                VALUES (:username, :email, :full_name, :password, :role_id)
            """),
            {
                "username": data["username"],
                "email": data["email"],
                "full_name": data["full_name"],
                "password": data["password"],  # In production, hash this!
                "role_id": data.get("role_id", 2)
            }
        )
        
        logger.info("New user registered", email=data["email"])
        
        return {
            "message": "User registered successfully",
            "user": {
                "username": data["username"],
                "email": data["email"],
                "full_name": data["full_name"]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("User registration failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )

@app.post("/auth/login", tags=["Authentication"])
async def login_user(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Authenticate user and return access token (simplified)"""
    try:
        data = await request.json()
        
        # Find user by email
        result = await db.execute(
            text("SELECT id, username, email, hashed_password FROM users WHERE email = :email"),
            {"email": data["email"]}
        )
        user = result.fetchone()
        
        if not user or user.hashed_password != data["password"]:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        # Create simple access token (in production, use proper JWT)
        access_token = f"demo_token_{user.id}_{int(time.time())}"
        
        logger.info("User logged in successfully", user_id=user.id, email=user.email)
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": 3600,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Login failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )

# Project endpoints
@app.get("/projects", tags=["Projects"])
async def get_projects(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """Get all projects (with pagination)"""
    try:
        result = await db.execute(
            text("SELECT * FROM projects LIMIT :limit OFFSET :skip"),
            {"limit": limit, "skip": skip}
        )
        projects = result.fetchall()
        
        return [
            {
                "id": p.id,
                "name": p.name,
                "description": p.description,
                "budget": float(p.budget) if p.budget else None,
                "status": p.status,
                "created_at": p.created_at.isoformat() if p.created_at else None
            }
            for p in projects
        ]
        
    except Exception as e:
        logger.error("Failed to fetch projects", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch projects"
        )

@app.post("/projects", tags=["Projects"])
async def create_project(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Create a new project"""
    try:
        data = await request.json()
        
        # Insert project
        result = await db.execute(
            text("""
                INSERT INTO projects (name, description, property_type_id, budget, status)
                VALUES (:name, :description, :property_type_id, :budget, :status)
                RETURNING id
            """),
            {
                "name": data["name"],
                "description": data.get("description", ""),
                "property_type_id": data.get("property_type_id", 1),
                "budget": data.get("budget", 0.0),
                "status": "planning"
            }
        )
        
        project_id = result.fetchone()[0]
        
        logger.info("Project created", project_id=project_id)
        
        return {
            "id": project_id,
            "name": data["name"],
            "description": data.get("description", ""),
            "status": "planning",
            "message": "Project created successfully"
        }
        
    except Exception as e:
        logger.error("Project creation failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create project"
        )

# Material endpoints
@app.get("/materials", tags=["Materials"])
async def get_materials(
    category_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """Get all materials with optional category filtering"""
    try:
        if category_id:
            result = await db.execute(
                text("SELECT * FROM materials WHERE category_id = :category_id AND is_active = 1 LIMIT :limit OFFSET :skip"),
                {"category_id": category_id, "limit": limit, "skip": skip}
            )
        else:
            result = await db.execute(
                text("SELECT * FROM materials WHERE is_active = 1 LIMIT :limit OFFSET :skip"),
                {"limit": limit, "skip": skip}
            )
        
        materials = result.fetchall()
        
        return [
            {
                "id": m.id,
                "name": m.name,
                "category_id": m.category_id,
                "unit": m.unit,
                "base_cost_per_unit": float(m.base_cost_per_unit),
                "properties": m.properties_json
            }
            for m in materials
        ]
        
    except Exception as e:
        logger.error("Failed to fetch materials", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch materials"
        )

@app.get("/materials/categories", tags=["Materials"])
async def get_material_categories(
    db: AsyncSession = Depends(get_db)
):
    """Get all material categories"""
    try:
        result = await db.execute(text("SELECT * FROM material_categories"))
        categories = result.fetchall()
        
        return [
            {
                "id": c.id,
                "name": c.name,
                "description": c.description,
                "parent_id": c.parent_id,
                "level": c.level
            }
            for c in categories
        ]
        
    except Exception as e:
        logger.error("Failed to fetch material categories", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch material categories"
        )

# Demo data endpoint
@app.get("/demo/setup", tags=["Demo"])
async def setup_demo_data(db: AsyncSession = Depends(get_db)):
    """Setup demo data for testing"""
    try:
        # Create demo user if not exists
        await db.execute(
            text("""
                INSERT OR IGNORE INTO users (username, email, full_name, hashed_password, role_id)
                VALUES ('demo', 'demo@example.com', 'Demo User', 'demo123', 1)
            """)
        )
        
        # Create demo project if not exists
        await db.execute(
            text("""
                INSERT OR IGNORE INTO projects (name, description, property_type_id, budget, status)
                VALUES ('Demo Residential Project', 'A sample 3-bedroom house project', 1, 2500000.00, 'planning')
            """)
        )
        
        logger.info("Demo data setup completed")
        
        return {
            "message": "Demo data setup completed",
            "demo_user": {
                "email": "demo@example.com",
                "password": "demo123"
            }
        }
        
    except Exception as e:
        logger.error("Demo setup failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Demo setup failed"
        )

if __name__ == "__main__":
    uvicorn.run(
        "main_simple:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
