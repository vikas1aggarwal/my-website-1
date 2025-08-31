#!/usr/bin/env python3
"""
Real Estate Project Management System - Simplified FastAPI Backend
Phase 1: Foundation with SQLite for Local Development
"""

import asyncio
import logging
import time
from datetime import datetime
from typing import List, Optional
import json
import sqlite3
from pathlib import Path

from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Settings
SECRET_KEY = "your-super-secret-jwt-key-change-in-production"
ALLOWED_ORIGINS = ["http://localhost:3000", "http://localhost:8000"]
DATABASE_PATH = "./realestate.db"

# Security middleware configuration
SECURITY_HEADERS = {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin"
}

def get_db_connection():
    """Get SQLite database connection"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row  # This allows accessing columns by name
    return conn

def init_database():
    """Initialize database if it doesn't exist"""
    if not Path(DATABASE_PATH).exists():
        logger.info("Database not found, initializing...")
        # Run the initialization script
        import subprocess
        subprocess.run(["python", "init_sqlite.py"], check=True)
        logger.info("Database initialized successfully")

# Create FastAPI application
app = FastAPI(
    title="Real Estate Project Management System",
    description="A comprehensive, AI-powered project management system for builders and architects",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Security middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
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
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    
    if process_time > 1.0:
        logger.warning(f"Slow request detected: {request.url.path} took {process_time:.2f}s")
    
    return response

# Rate limiting middleware
from collections import defaultdict
request_counts = defaultdict(lambda: {"count": 0, "reset_time": 0})
RATE_LIMIT = 100
RATE_LIMIT_WINDOW = 60

@app.middleware("http")
async def rate_limiting(request: Request, call_next):
    """Basic rate limiting middleware"""
    client_ip = request.client.host
    current_time = time.time()
    
    if current_time - request_counts[client_ip]["reset_time"] > RATE_LIMIT_WINDOW:
        request_counts[client_ip] = {"count": 0, "reset_time": current_time}
    
    if request_counts[client_ip]["count"] >= RATE_LIMIT:
        logger.warning(f"Rate limit exceeded for {client_ip}")
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={"detail": "Rate limit exceeded. Please try again later."}
        )
    
    request_counts[client_ip]["count"] += 1
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
        "environment": "development",
        "database": "SQLite"
    }

# Authentication endpoints
@app.post("/auth/register", tags=["Authentication"])
async def register_user(request: Request):
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
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if user already exists
        cursor.execute("SELECT id FROM users WHERE email = ?", (data["email"],))
        if cursor.fetchone():
            conn.close()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create user (simplified - no password hashing for demo)
        cursor.execute(
            "INSERT INTO users (username, email, full_name, hashed_password, role_id) VALUES (?, ?, ?, ?, ?)",
            (data["username"], data["email"], data["full_name"], data["password"], data.get("role_id", 2))
        )
        conn.commit()
        conn.close()
        
        logger.info(f"New user registered: {data['email']}")
        
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
        logger.error(f"User registration failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )

@app.post("/auth/login", tags=["Authentication"])
async def login_user(request: Request):
    """Authenticate user and return access token (simplified)"""
    try:
        data = await request.json()
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Find user by email
        cursor.execute("SELECT id, username, email, hashed_password FROM users WHERE email = ?", (data["email"],))
        user = cursor.fetchone()
        conn.close()
        
        if not user or user["hashed_password"] != data["password"]:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        # Create simple access token (in production, use proper JWT)
        access_token = f"demo_token_{user['id']}_{int(time.time())}"
        
        logger.info(f"User logged in successfully: {user['email']}")
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": 3600,
            "user": {
                "id": user["id"],
                "username": user["username"],
                "email": user["email"]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )

# Project endpoints
@app.get("/projects", tags=["Projects"])
async def get_projects(skip: int = 0, limit: int = 100):
    """Get all projects (with pagination)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM projects LIMIT ? OFFSET ?", (limit, skip))
        projects = cursor.fetchall()
        conn.close()
        
        return [
            {
                "id": p["id"],
                "name": p["name"],
                "description": p["description"],
                "budget": float(p["budget"]) if p["budget"] else None,
                "status": p["status"],
                "created_at": p["created_at"]
            }
            for p in projects
        ]
        
    except Exception as e:
        logger.error(f"Failed to fetch projects: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch projects"
        )

@app.post("/projects", tags=["Projects"])
async def create_project(request: Request):
    """Create a new project"""
    try:
        data = await request.json()
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Insert project
        cursor.execute(
            "INSERT INTO projects (name, description, property_type_id, budget, status) VALUES (?, ?, ?, ?, ?)",
            (data["name"], data.get("description", ""), data.get("property_type_id", 1), data.get("budget", 0.0), "planning")
        )
        project_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        logger.info(f"Project created: {project_id}")
        
        return {
            "id": project_id,
            "name": data["name"],
            "description": data.get("description", ""),
            "status": "planning",
            "message": "Project created successfully"
        }
        
    except Exception as e:
        logger.error(f"Project creation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create project"
        )

# Material endpoints
@app.get("/materials", tags=["Materials"])
async def get_materials(category_id: Optional[int] = None, skip: int = 0, limit: int = 100):
    """Get all materials with optional category filtering"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if category_id:
            cursor.execute(
                "SELECT * FROM materials WHERE category_id = ? AND is_active = 1 LIMIT ? OFFSET ?",
                (category_id, limit, skip)
            )
        else:
            cursor.execute(
                "SELECT * FROM materials WHERE is_active = 1 LIMIT ? OFFSET ?",
                (limit, skip)
            )
        
        materials = cursor.fetchall()
        conn.close()
        
        return [
            {
                "id": m["id"],
                "name": m["name"],
                "category_id": m["category_id"],
                "unit": m["unit"],
                "base_cost_per_unit": float(m["base_cost_per_unit"]),
                "properties": json.loads(m["properties_json"]) if m["properties_json"] else {}
            }
            for m in materials
        ]
        
    except Exception as e:
        logger.error(f"Failed to fetch materials: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch materials"
        )

@app.get("/materials/categories", tags=["Materials"])
async def get_material_categories():
    """Get all material categories"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM material_categories")
        categories = cursor.fetchall()
        conn.close()
        
        return [
            {
                "id": c["id"],
                "name": c["name"],
                "description": c["description"],
                "parent_id": c["parent_id"],
                "level": c["level"]
            }
            for c in categories
        ]
        
    except Exception as e:
        logger.error(f"Failed to fetch material categories: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch material categories"
        )

# Demo data endpoint
@app.get("/demo/setup", tags=["Demo"])
async def setup_demo_data():
    """Setup demo data for testing"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Create demo user if not exists
        cursor.execute(
            "INSERT OR IGNORE INTO users (username, email, full_name, hashed_password, role_id) VALUES (?, ?, ?, ?, ?)",
            ("demo", "demo@example.com", "Demo User", "demo123", 1)
        )
        
        # Create demo project if not exists
        cursor.execute(
            "INSERT OR IGNORE INTO projects (name, description, property_type_id, budget, status) VALUES (?, ?, ?, ?, ?)",
            ("Demo Residential Project", "A sample 3-bedroom house project", 1, 2500000.00, "planning")
        )
        
        conn.commit()
        conn.close()
        
        logger.info("Demo data setup completed")
        
        return {
            "message": "Demo data setup completed",
            "demo_user": {
                "email": "demo@example.com",
                "password": "demo123"
            }
        }
        
    except Exception as e:
        logger.error(f"Demo setup failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Demo setup failed"
        )

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    init_database()

if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
