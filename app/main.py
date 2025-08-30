"""
Real Estate Project Management System - FastAPI Backend
Phase 1: Foundation with Security, Performance, and Best Practices
"""

from contextlib import asynccontextmanager
from typing import List, Optional
import logging
import time
from datetime import datetime, timedelta

from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
import uvicorn
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import structlog

from .database import get_db, init_db
from .models import (
    Project, Task, TaskDependency, Material, MaterialCategory,
    PropertyType, ConstructionPhase, BuildingComponent, User, Role,
    Team, TeamMember, CostEstimate, ProgressUpdate, ProgressMedia
)
from .schemas import (
    ProjectCreate, ProjectUpdate, ProjectResponse,
    TaskCreate, TaskUpdate, TaskResponse,
    MaterialResponse, MaterialCategoryResponse,
    UserCreate, UserLogin, UserResponse,
    TokenResponse, CostEstimateCreate, CostEstimateResponse
)
from .auth import (
    create_access_token, get_current_user, get_password_hash,
    verify_password, ACCESS_TOKEN_EXPIRE_MINUTES
)
from .config import settings

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
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
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
    docs_url="/docs" if settings.ENVIRONMENT == "development" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT == "development" else None,
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

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS
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
import asyncio

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
        "environment": settings.ENVIRONMENT
    }

# Authentication endpoints
@app.post("/auth/register", response_model=UserResponse, tags=["Authentication"])
async def register_user(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """Register a new user"""
    try:
        # Check if user already exists
        existing_user = await db.execute(
            select(User).where(User.email == user_data.email)
        )
        if existing_user.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create new user
        hashed_password = get_password_hash(user_data.password)
        db_user = User(
            username=user_data.username,
            email=user_data.email,
            full_name=user_data.full_name,
            role_id=user_data.role_id,
            hashed_password=hashed_password
        )
        
        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)
        
        logger.info("New user registered", user_id=db_user.id, email=user_data.email)
        
        return UserResponse(
            id=db_user.id,
            username=db_user.username,
            email=db_user.email,
            full_name=db_user.full_name,
            role_id=db_user.role_id,
            is_active=db_user.is_active
        )
        
    except Exception as e:
        logger.error("User registration failed", error=str(e))
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )

@app.post("/auth/login", response_model=TokenResponse, tags=["Authentication"])
async def login_user(
    user_credentials: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    """Authenticate user and return access token"""
    try:
        # Find user by email
        user = await db.execute(
            select(User).where(User.email == user_credentials.email)
        )
        user = user.scalar_one_or_none()
        
        if not user or not verify_password(user_credentials.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account is deactivated"
            )
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        
        # Update last login
        user.last_login = datetime.utcnow()
        await db.commit()
        
        logger.info("User logged in successfully", user_id=user.id, email=user.email)
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Login failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )

# Project endpoints
@app.get("/projects", response_model=List[ProjectResponse], tags=["Projects"])
async def get_projects(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all projects (with pagination)"""
    try:
        query = select(Project).offset(skip).limit(limit)
        result = await db.execute(query)
        projects = result.scalars().all()
        
        return [ProjectResponse.from_orm(project) for project in projects]
        
    except Exception as e:
        logger.error("Failed to fetch projects", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch projects"
        )

@app.post("/projects", response_model=ProjectResponse, tags=["Projects"])
async def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new project"""
    try:
        db_project = Project(
            **project_data.dict(),
            builder_id=current_user.id
        )
        
        db.add(db_project)
        await db.commit()
        await db.refresh(db_project)
        
        logger.info("Project created", project_id=db_project.id, created_by=current_user.id)
        
        return ProjectResponse.from_orm(db_project)
        
    except Exception as e:
        logger.error("Project creation failed", error=str(e))
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create project"
        )

@app.get("/projects/{project_id}", response_model=ProjectResponse, tags=["Projects"])
async def get_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific project by ID"""
    try:
        project = await db.execute(
            select(Project).where(Project.id == project_id)
        )
        project = project.scalar_one_or_none()
        
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        return ProjectResponse.from_orm(project)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to fetch project", project_id=project_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch project"
        )

# Material endpoints
@app.get("/materials", response_model=List[MaterialResponse], tags=["Materials"])
async def get_materials(
    category_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """Get all materials with optional category filtering"""
    try:
        query = select(Material).where(Material.is_active == True)
        
        if category_id:
            query = query.where(Material.category_id == category_id)
        
        query = query.offset(skip).limit(limit)
        result = await db.execute(query)
        materials = result.scalars().all()
        
        return [MaterialResponse.from_orm(material) for material in materials]
        
    except Exception as e:
        logger.error("Failed to fetch materials", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch materials"
        )

@app.get("/materials/categories", response_model=List[MaterialCategoryResponse], tags=["Materials"])
async def get_material_categories(
    db: AsyncSession = Depends(get_db)
):
    """Get all material categories"""
    try:
        result = await db.execute(select(MaterialCategory))
        categories = result.scalars().all()
        
        return [MaterialCategoryResponse.from_orm(category) for category in categories]
        
    except Exception as e:
        logger.error("Failed to fetch material categories", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch material categories"
        )

# Cost estimation endpoints
@app.post("/cost-estimates", response_model=CostEstimateResponse, tags=["Cost Estimation"])
async def create_cost_estimate(
    estimate_data: CostEstimateCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new cost estimate"""
    try:
        db_estimate = CostEstimate(
            **estimate_data.dict(),
            created_by=current_user.id
        )
        
        db.add(db_estimate)
        await db.commit()
        await db.refresh(db_estimate)
        
        logger.info("Cost estimate created", estimate_id=db_estimate.id, created_by=current_user.id)
        
        return CostEstimateResponse.from_orm(db_estimate)
        
    except Exception as e:
        logger.error("Cost estimate creation failed", error=str(e))
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create cost estimate"
        )

# Analytics endpoints
@app.get("/analytics/project-costs/{project_id}", tags=["Analytics"])
async def get_project_cost_analysis(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get cost analysis for a specific project"""
    try:
        # Get total planned cost
        planned_cost_result = await db.execute(
            select(func.sum(CostEstimate.total_cost))
            .where(CostEstimate.task_id.in_(
                select(Task.id).where(Task.project_id == project_id)
            ))
            .where(CostEstimate.estimate_type == "planned")
        )
        total_planned = planned_cost_result.scalar() or 0
        
        # Get cost by phase
        phase_costs_result = await db.execute(
            select(
                ConstructionPhase.name,
                func.sum(CostEstimate.total_cost).label("total_cost")
            )
            .join(Task, Task.phase_id == ConstructionPhase.id)
            .join(CostEstimate, CostEstimate.task_id == Task.id)
            .where(Task.project_id == project_id)
            .where(CostEstimate.estimate_type == "planned")
            .group_by(ConstructionPhase.id, ConstructionPhase.name)
        )
        phase_costs = phase_costs_result.all()
        
        return {
            "project_id": project_id,
            "total_planned_cost": float(total_planned),
            "cost_by_phase": [
                {"phase": phase, "cost": float(cost)} 
                for phase, cost in phase_costs
            ]
        }
        
    except Exception as e:
        logger.error("Failed to fetch project cost analysis", project_id=project_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch cost analysis"
        )

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )