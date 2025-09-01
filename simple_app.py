#!/usr/bin/env python3
"""
Simple Real Estate Project Management System
Phase 1: Basic working version
"""

import json
import sqlite3
import time
import logging
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import FastAPI, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI application
app = FastAPI(
    title="Real Estate Project Management System",
    description="A simple project management system for builders and architects",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database path
DATABASE_PATH = "./realestate.db"

def get_db():
    """Get database connection"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        return conn
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        raise

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "message": "Real Estate Project Management System is running!"
    }

# Authentication endpoints
@app.post("/auth/register")
async def register_user(request: Request):
    """Register a new user"""
    try:
        # Log the request
        logger.info(f"Register request from {request.client.host}")
        
        # Get request body
        try:
            data = await request.json()
            logger.info(f"Request data: {data}")
        except Exception as e:
            logger.error(f"Failed to parse JSON: {e}")
            raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")
        
        # Validate required fields
        required_fields = ["username", "email", "password", "full_name"]
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            logger.error(f"Missing fields: {missing_fields}")
            raise HTTPException(status_code=400, detail=f"Missing required fields: {missing_fields}")
        
        # Validate field values
        for field in required_fields:
            if not data[field] or not str(data[field]).strip():
                logger.error(f"Empty field: {field}")
                raise HTTPException(status_code=400, detail=f"Field '{field}' cannot be empty")
        
        # Clean the data
        username = str(data["username"]).strip()
        email = str(data["email"]).strip()
        password = str(data["password"]).strip()
        full_name = str(data["full_name"]).strip()
        
        logger.info(f"Processing registration for: {email}")
        
        conn = get_db()
        cursor = conn.cursor()
        
        try:
            # Check if user exists
            cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
            if cursor.fetchone():
                logger.warning(f"Email already registered: {email}")
                conn.close()
                raise HTTPException(status_code=400, detail="Email already registered")
            
            # Check if username exists
            cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
            if cursor.fetchone():
                logger.warning(f"Username already taken: {username}")
                conn.close()
                raise HTTPException(status_code=400, detail="Username already taken")
            
            # Create user
            cursor.execute(
                "INSERT INTO users (username, email, full_name, hashed_password, role_id) VALUES (?, ?, ?, ?, ?)",
                (username, email, full_name, password, 2)
            )
            conn.commit()
            conn.close()
            
            logger.info(f"User registered successfully: {email}")
            
            return {
                "message": "User registered successfully",
                "user": {
                    "username": username,
                    "email": email,
                    "full_name": full_name
                }
            }
            
        except sqlite3.IntegrityError as e:
            conn.close()
            logger.error(f"Database integrity error: {e}")
            if "UNIQUE constraint failed" in str(e):
                if "email" in str(e):
                    raise HTTPException(status_code=400, detail="Email already registered")
                elif "username" in str(e):
                    raise HTTPException(status_code=400, detail="Username already taken")
                else:
                    raise HTTPException(status_code=400, detail="User already exists")
            else:
                raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        except sqlite3.Error as e:
            conn.close()
            logger.error(f"Database error: {e}")
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in registration: {e}")
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@app.post("/auth/login")
async def login_user(request: Request):
    """Login user"""
    try:
        logger.info(f"Login request from {request.client.host}")
        
        try:
            data = await request.json()
            logger.info(f"Login data: {data}")
        except Exception as e:
            logger.error(f"Failed to parse JSON: {e}")
            raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")
        
        if "email" not in data or "password" not in data:
            raise HTTPException(status_code=400, detail="Email and password are required")
        
        email = str(data["email"]).strip()
        password = str(data["password"]).strip()
        
        conn = get_db()
        cursor = conn.cursor()
        
        try:
            cursor.execute("SELECT id, username, email FROM users WHERE email = ? AND hashed_password = ?", 
                          (email, password))
            user = cursor.fetchone()
            conn.close()
            
            if not user:
                logger.warning(f"Invalid login attempt for: {email}")
                raise HTTPException(status_code=401, detail="Invalid credentials")
            
            logger.info(f"User logged in successfully: {email}")
            
            return {
                "message": "Login successful",
                "user": {
                    "id": user["id"],
                    "username": user["username"],
                    "email": user["email"]
                }
            }
            
        except sqlite3.Error as e:
            conn.close()
            logger.error(f"Database error during login: {e}")
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in login: {e}")
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

# Project endpoints
@app.get("/projects")
async def get_projects():
    """Get all projects"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM projects")
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
        raise HTTPException(status_code=500, detail=f"Failed to fetch projects: {str(e)}")

@app.get("/projects/{project_id}")
async def get_project(project_id: int):
    """Get a specific project by ID"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
        project = cursor.fetchone()
        conn.close()
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        return {
            "id": project["id"],
            "name": project["name"],
            "description": project["description"],
            "budget": float(project["budget"]) if project["budget"] else None,
            "status": project["status"],
            "created_at": project["created_at"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch project {project_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch project: {str(e)}")

@app.post("/projects")
async def create_project(request: Request):
    """Create a new project"""
    try:
        logger.info(f"Create project request from {request.client.host}")
        
        try:
            data = await request.json()
            logger.info(f"Project data: {data}")
        except Exception as e:
            logger.error(f"Failed to parse JSON: {e}")
            raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")
        
        # Validation
        if not data:
            raise HTTPException(status_code=400, detail="Request body is required")
        
        if "name" not in data or not str(data["name"]).strip():
            raise HTTPException(status_code=400, detail="Project name is required")
        
        # Validate budget if provided
        budget = data.get("budget", 0.0)
        if budget and (not isinstance(budget, (int, float)) or budget < 0):
            raise HTTPException(status_code=400, detail="Budget must be a positive number")
        
        name = str(data["name"]).strip()
        description = str(data.get("description", "")).strip()
        
        logger.info(f"Creating project: {name}")
        
        conn = get_db()
        cursor = conn.cursor()
        
        try:
            cursor.execute(
                "INSERT INTO projects (name, description, property_type_id, budget, status) VALUES (?, ?, ?, ?, ?)",
                (name, description, 1, budget, "planning")
            )
            project_id = cursor.lastrowid
            conn.commit()
            conn.close()
            
            logger.info(f"Project created successfully: {name} (ID: {project_id})")
            
            return {
                "id": project_id,
                "name": name,
                "description": description,
                "budget": budget,
                "status": "planning",
                "message": "Project created successfully"
            }
            
        except sqlite3.Error as e:
            conn.close()
            logger.error(f"Database error creating project: {e}")
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error creating project: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create project: {str(e)}")

@app.put("/projects/{project_id}")
async def update_project(project_id: int, request: Request):
    """Update an existing project"""
    try:
        logger.info(f"Update project request for ID {project_id}")
        
        try:
            data = await request.json()
            logger.info(f"Update data: {data}")
        except Exception as e:
            logger.error(f"Failed to parse JSON: {e}")
            raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")
        
        # Validation
        if not data:
            raise HTTPException(status_code=400, detail="Request body is required")
        
        conn = get_db()
        cursor = conn.cursor()
        
        try:
            # Check if project exists
            cursor.execute("SELECT id FROM projects WHERE id = ?", (project_id,))
            if not cursor.fetchone():
                conn.close()
                raise HTTPException(status_code=404, detail="Project not found")
            
            # Build update query dynamically
            update_fields = []
            update_values = []
            
            if "name" in data:
                name = str(data["name"]).strip()
                if not name:
                    raise HTTPException(status_code=400, detail="Project name cannot be empty")
                update_fields.append("name = ?")
                update_values.append(name)
            
            if "description" in data:
                description = str(data["description"]).strip()
                update_fields.append("description = ?")
                update_values.append(description)
            
            if "budget" in data:
                budget = data["budget"]
                if not isinstance(budget, (int, float)) or budget < 0:
                    raise HTTPException(status_code=400, detail="Budget must be a positive number")
                update_fields.append("budget = ?")
                update_values.append(budget)
            
            if "status" in data:
                status = str(data["status"]).strip()
                valid_statuses = ["planning", "in_progress", "completed", "on_hold", "cancelled"]
                if status not in valid_statuses:
                    raise HTTPException(status_code=400, detail=f"Status must be one of: {valid_statuses}")
                update_fields.append("status = ?")
                update_values.append(status)
            
            if not update_fields:
                raise HTTPException(status_code=400, detail="No valid fields to update")
            
            # Add project_id to values
            update_values.append(project_id)
            
            # Execute update
            query = f"UPDATE projects SET {', '.join(update_fields)} WHERE id = ?"
            cursor.execute(query, update_values)
            conn.commit()
            conn.close()
            
            logger.info(f"Project {project_id} updated successfully")
            
            return {
                "id": project_id,
                "message": "Project updated successfully"
            }
            
        except sqlite3.Error as e:
            conn.close()
            logger.error(f"Database error updating project: {e}")
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error updating project: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update project: {str(e)}")

@app.delete("/projects/{project_id}")
async def delete_project(project_id: int):
    """Delete a project"""
    try:
        logger.info(f"Delete project request for ID {project_id}")
        
        conn = get_db()
        cursor = conn.cursor()
        
        try:
            # Check if project exists
            cursor.execute("SELECT id FROM projects WHERE id = ?", (project_id,))
            if not cursor.fetchone():
                conn.close()
                raise HTTPException(status_code=404, detail="Project not found")
            
            # Delete project
            cursor.execute("DELETE FROM projects WHERE id = ?", (project_id,))
            conn.commit()
            conn.close()
            
            logger.info(f"Project {project_id} deleted successfully")
            
            return {
                "message": "Project deleted successfully",
                "id": project_id
            }
            
        except sqlite3.Error as e:
            conn.close()
            logger.error(f"Database error deleting project: {e}")
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error deleting project: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete project: {str(e)}")

# Material endpoints
@app.get("/materials")
async def get_materials():
    """Get all materials"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM materials WHERE is_active = 1 LIMIT 20")
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
        raise HTTPException(status_code=500, detail=f"Failed to fetch materials: {str(e)}")

@app.get("/materials/{material_id}")
async def get_material(material_id: int):
    """Get a specific material by ID"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM materials WHERE id = ? AND is_active = 1", (material_id,))
        material = cursor.fetchone()
        conn.close()
        
        if not material:
            raise HTTPException(status_code=404, detail="Material not found")
        
        return {
            "id": material["id"],
            "name": material["name"],
            "category_id": material["category_id"],
            "unit": material["unit"],
            "base_cost_per_unit": float(material["base_cost_per_unit"]),
            "properties": json.loads(material["properties_json"]) if material["properties_json"] else {}
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch material {material_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch material: {str(e)}")

@app.post("/materials")
async def create_material(request: Request):
    """Create a new material"""
    try:
        logger.info(f"Create material request from {request.client.host}")
        
        try:
            data = await request.json()
            logger.info(f"Material data: {data}")
        except Exception as e:
            logger.error(f"Failed to parse JSON: {e}")
            raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")
        
        # Validation
        if not data:
            raise HTTPException(status_code=400, detail="Request body is required")
        
        required_fields = ["name", "category_id", "unit", "base_cost_per_unit"]
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            raise HTTPException(status_code=400, detail=f"Missing required fields: {missing_fields}")
        
        name = str(data["name"]).strip()
        if not name:
            raise HTTPException(status_code=400, detail="Material name cannot be empty")
        
        category_id = data["category_id"]
        if not isinstance(category_id, int) or category_id <= 0:
            raise HTTPException(status_code=400, detail="Category ID must be a positive integer")
        
        unit = str(data["unit"]).strip()
        if not unit:
            raise HTTPException(status_code=400, detail="Unit cannot be empty")
        
        base_cost = data["base_cost_per_unit"]
        if not isinstance(base_cost, (int, float)) or base_cost < 0:
            raise HTTPException(status_code=400, detail="Base cost must be a positive number")
        
        properties = data.get("properties", {})
        if not isinstance(properties, dict):
            raise HTTPException(status_code=400, detail="Properties must be a JSON object")
        
        logger.info(f"Creating material: {name}")
        
        conn = get_db()
        cursor = conn.cursor()
        
        try:
            # Check if category exists
            cursor.execute("SELECT id FROM material_categories WHERE id = ?", (category_id,))
            if not cursor.fetchone():
                conn.close()
                raise HTTPException(status_code=400, detail="Category not found")
            
            # Create material
            cursor.execute(
                "INSERT INTO materials (name, category_id, unit, base_cost_per_unit, properties_json, is_active) VALUES (?, ?, ?, ?, ?, ?)",
                (name, category_id, unit, base_cost, json.dumps(properties), 1)
            )
            material_id = cursor.lastrowid
            conn.commit()
            conn.close()
            
            logger.info(f"Material created successfully: {name} (ID: {material_id})")
            
            return {
                "id": material_id,
                "name": name,
                "category_id": category_id,
                "unit": unit,
                "base_cost_per_unit": base_cost,
                "properties": properties,
                "message": "Material created successfully"
            }
            
        except sqlite3.Error as e:
            conn.close()
            logger.error(f"Database error creating material: {e}")
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error creating material: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create material: {str(e)}")

@app.put("/materials/{material_id}")
async def update_material(material_id: int, request: Request):
    """Update an existing material"""
    try:
        logger.info(f"Update material request for ID {material_id}")
        
        try:
            data = await request.json()
            logger.info(f"Update data: {data}")
        except Exception as e:
            logger.error(f"Failed to parse JSON: {e}")
            raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")
        
        # Validation
        if not data:
            raise HTTPException(status_code=400, detail="Request body is required")
        
        conn = get_db()
        cursor = conn.cursor()
        
        try:
            # Check if material exists
            cursor.execute("SELECT id FROM materials WHERE id = ? AND is_active = 1", (material_id,))
            if not cursor.fetchone():
                conn.close()
                raise HTTPException(status_code=404, detail="Material not found")
            
            # Build update query dynamically
            update_fields = []
            update_values = []
            
            if "name" in data:
                name = str(data["name"]).strip()
                if not name:
                    raise HTTPException(status_code=400, detail="Material name cannot be empty")
                update_fields.append("name = ?")
                update_values.append(name)
            
            if "category_id" in data:
                category_id = data["category_id"]
                if not isinstance(category_id, int) or category_id <= 0:
                    raise HTTPException(status_code=400, detail="Category ID must be a positive integer")
                
                # Check if category exists
                cursor.execute("SELECT id FROM material_categories WHERE id = ?", (category_id,))
                if not cursor.fetchone():
                    conn.close()
                    raise HTTPException(status_code=400, detail="Category not found")
                
                update_fields.append("category_id = ?")
                update_values.append(category_id)
            
            if "unit" in data:
                unit = str(data["unit"]).strip()
                if not unit:
                    raise HTTPException(status_code=400, detail="Unit cannot be empty")
                update_fields.append("unit = ?")
                update_values.append(unit)
            
            if "base_cost_per_unit" in data:
                base_cost = data["base_cost_per_unit"]
                if not isinstance(base_cost, (int, float)) or base_cost < 0:
                    raise HTTPException(status_code=400, detail="Base cost must be a positive number")
                update_fields.append("base_cost_per_unit = ?")
                update_values.append(base_cost)
            
            if "properties" in data:
                properties = data["properties"]
                if not isinstance(properties, dict):
                    raise HTTPException(status_code=400, detail="Properties must be a JSON object")
                update_fields.append("properties_json = ?")
                update_values.append(json.dumps(properties))
            
            if not update_fields:
                raise HTTPException(status_code=400, detail="No valid fields to update")
            
            # Add material_id to values
            update_values.append(material_id)
            
            # Execute update
            query = f"UPDATE materials SET {', '.join(update_fields)} WHERE id = ?"
            cursor.execute(query, update_values)
            conn.commit()
            conn.close()
            
            logger.info(f"Material {material_id} updated successfully")
            
            return {
                "id": material_id,
                "message": "Material updated successfully"
            }
            
        except sqlite3.Error as e:
            conn.close()
            logger.error(f"Database error updating material: {e}")
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error updating material: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update material: {str(e)}")

@app.delete("/materials/{material_id}")
async def delete_material(material_id: int):
    """Delete a material (soft delete by setting is_active = 0)"""
    try:
        logger.info(f"Delete material request for ID {material_id}")
        
        conn = get_db()
        cursor = conn.cursor()
        
        try:
            # Check if material exists
            cursor.execute("SELECT id FROM materials WHERE id = ? AND is_active = 1", (material_id,))
            if not cursor.fetchone():
                conn.close()
                raise HTTPException(status_code=404, detail="Material not found")
            
            # Soft delete material
            cursor.execute("UPDATE materials SET is_active = 0 WHERE id = ?", (material_id,))
            conn.commit()
            conn.close()
            
            logger.info(f"Material {material_id} deleted successfully")
            
            return {
                "message": "Material deleted successfully",
                "id": material_id
            }
            
        except sqlite3.Error as e:
            conn.close()
            logger.error(f"Database error deleting material: {e}")
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error deleting material: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete material: {str(e)}")

# Material endpoints
@app.get("/materials/categories")
async def get_material_categories():
    """Get material categories"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM material_categories LIMIT 10")
        categories = cursor.fetchall()
        conn.close()
        
        return [
            {
                "id": c["id"],
                "name": c["name"],
                "description": c["description"]
            }
            for c in categories
        ]
        
    except Exception as e:
        logger.error(f"Failed to fetch material categories: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch material categories: {str(e)}")

# Task endpoints
@app.get("/tasks")
async def get_tasks(project_id: Optional[int] = None):
    """Get tasks, optionally filtered by project"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        if project_id:
            cursor.execute("SELECT * FROM tasks WHERE project_id = ?", (project_id,))
        else:
            cursor.execute("SELECT * FROM tasks LIMIT 50")
        
        tasks = cursor.fetchall()
        conn.close()
        
        return [
            {
                "id": t["id"],
                "project_id": t["project_id"],
                "parent_task_id": t["parent_task_id"],
                "name": t["name"],
                "description": t["description"],
                "phase_id": t["phase_id"],
                "component_id": t["component_id"],
                "duration_days": t["duration_days"],
                "planned_start_date": t["planned_start_date"],
                "planned_finish_date": t["planned_finish_date"],
                "actual_start_date": t["actual_start_date"],
                "actual_finish_date": t["actual_finish_date"],
                "percent_complete": t["percent_complete"],
                "status": t["status"],
                "priority": t["priority"],
                "assigned_team_id": t["assigned_team_id"],
                "created_at": t["created_at"]
            }
            for t in tasks
        ]
        
    except Exception as e:
        logger.error(f"Failed to fetch tasks: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch tasks: {str(e)}")

@app.post("/tasks")
async def create_task(task: dict):
    """Create a new task with proper project planning logic"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Extract task data
        project_id = task.get("project_id")
        name = task.get("name")
        description = task.get("description", "")
        phase_id = task.get("phase_id")
        component_id = task.get("component_id")
        duration_days = task.get("duration_days", 1)
        priority = task.get("priority", "medium")
        status = task.get("status", "pending")
        planned_start_date = task.get("planned_start_date")
        planned_finish_date = task.get("planned_finish_date")
        parent_task_id = task.get("parent_task_id")
        
        if not project_id or not name:
            raise HTTPException(status_code=400, detail="Project ID and name are required")
        
        # Calculate start and finish dates if not provided
        if not planned_start_date or not planned_finish_date:
            # Get project start date
            cursor.execute("SELECT start_date FROM projects WHERE id = ?", (project_id,))
            project = cursor.fetchone()
            project_start = project["start_date"] if project and project["start_date"] else datetime.now().date()
            
            # Calculate task dates based on dependencies
            if parent_task_id:
                # Get parent task finish date
                cursor.execute("SELECT planned_finish_date FROM tasks WHERE id = ?", (parent_task_id,))
                parent_task = cursor.fetchone()
                if parent_task and parent_task["planned_finish_date"]:
                    planned_start_date = parent_task["planned_finish_date"]
                else:
                    planned_start_date = project_start
            else:
                planned_start_date = project_start
            
            # Calculate finish date
            if planned_start_date:
                start_date = datetime.strptime(planned_start_date, "%Y-%m-%d").date()
                finish_date = start_date + timedelta(days=duration_days)
                planned_finish_date = finish_date.strftime("%Y-%m-%d")
        
        cursor.execute("""
            INSERT INTO tasks (project_id, parent_task_id, name, description, phase_id, 
                             component_id, duration_days, planned_start_date, planned_finish_date, 
                             priority, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (project_id, parent_task_id, name, description, phase_id, 
              component_id, duration_days, planned_start_date, planned_finish_date, 
              priority, status))
        
        task_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        logger.info(f"Task created: {task_id}")
        return {
            "id": task_id,
            "project_id": project_id,
            "parent_task_id": parent_task_id,
            "name": name,
            "description": description,
            "phase_id": phase_id,
            "component_id": component_id,
            "duration_days": duration_days,
            "planned_start_date": planned_start_date,
            "planned_finish_date": planned_finish_date,
            "priority": priority,
            "status": status,
            "created_at": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create task: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create task: {str(e)}")

@app.put("/tasks/{task_id}")
async def update_task(task_id: int, task_update: dict):
    """Update a task"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if task exists
        cursor.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
        existing_task = cursor.fetchone()
        
        if not existing_task:
            conn.close()
            raise HTTPException(status_code=404, detail="Task not found")
        
        # Build update query dynamically
        update_fields = []
        update_values = []
        
        allowed_fields = [
            "name", "description", "status", "priority", "duration_days",
            "planned_start_date", "planned_finish_date", "actual_start_date", 
            "actual_finish_date", "percent_complete", "phase_id", "component_id",
            "parent_task_id", "assigned_team_id"
        ]
        
        for field, value in task_update.items():
            if field in allowed_fields:
                update_fields.append(f"{field} = ?")
                update_values.append(value)
        
        if not update_fields:
            conn.close()
            raise HTTPException(status_code=400, detail="No valid fields to update")
        
        update_values.append(task_id)
        query = f"UPDATE tasks SET {', '.join(update_fields)} WHERE id = ?"
        
        cursor.execute(query, update_values)
        conn.commit()
        conn.close()
        
        logger.info(f"Task updated: {task_id}")
        return {"message": "Task updated successfully", "id": task_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update task: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update task: {str(e)}")

@app.delete("/tasks/{task_id}")
async def delete_task(task_id: int):
    """Delete a task"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if task exists
        cursor.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
        existing_task = cursor.fetchone()
        
        if not existing_task:
            conn.close()
            raise HTTPException(status_code=404, detail="Task not found")
        
        cursor.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
        conn.commit()
        conn.close()
        
        logger.info(f"Task deleted: {task_id}")
        return {"message": "Task deleted successfully", "id": task_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete task: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete task: {str(e)}")

@app.get("/projects/{project_id}/planning")
async def get_project_planning(project_id: int):
    """Get project planning with effort calculation and timeline"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Get project details
        cursor.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
        project = cursor.fetchone()
        
        if not project:
            conn.close()
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Get all tasks for the project
        cursor.execute("""
            SELECT * FROM tasks 
            WHERE project_id = ? 
            ORDER BY planned_start_date, phase_id, id
        """, (project_id,))
        tasks = cursor.fetchall()
        
        # Calculate project timeline and effort
        total_effort_days = 0
        sequential_effort_days = 0
        earliest_start = None
        latest_finish = None
        
        if tasks:
            # Calculate sequential effort (critical path)
            task_dates = []
            for task in tasks:
                if task["planned_start_date"] and task["planned_finish_date"]:
                    start_date = datetime.strptime(task["planned_start_date"], "%Y-%m-%d").date()
                    finish_date = datetime.strptime(task["planned_finish_date"], "%Y-%m-%d").date()
                    task_dates.append((start_date, finish_date, task["duration_days"]))
                    
                    if not earliest_start or start_date < earliest_start:
                        earliest_start = start_date
                    if not latest_finish or finish_date > latest_finish:
                        latest_finish = finish_date
                
                total_effort_days += task["duration_days"] or 0
            
            # Calculate sequential effort (simplified critical path)
            if earliest_start and latest_finish:
                sequential_effort_days = (latest_finish - earliest_start).days
        
        conn.close()
        
        return {
            "project": {
                "id": project["id"],
                "name": project["name"],
                "description": project["description"],
                "start_date": project["start_date"],
                "target_completion": project["target_completion"],
                "status": project["status"]
            },
            "planning": {
                "total_tasks": len(tasks),
                "total_effort_days": total_effort_days,
                "sequential_effort_days": sequential_effort_days,
                "earliest_start": earliest_start.isoformat() if earliest_start else None,
                "latest_finish": latest_finish.isoformat() if latest_finish else None,
                "parallelism_factor": total_effort_days / sequential_effort_days if sequential_effort_days > 0 else 1
            },
            "tasks": [
                {
                    "id": t["id"],
                    "name": t["name"],
                    "description": t["description"],
                    "phase_id": t["phase_id"],
                    "component_id": t["component_id"],
                    "duration_days": t["duration_days"],
                    "planned_start_date": t["planned_start_date"],
                    "planned_finish_date": t["planned_finish_date"],
                    "actual_start_date": t["actual_start_date"],
                    "actual_finish_date": t["actual_finish_date"],
                    "percent_complete": t["percent_complete"],
                    "status": t["status"],
                    "priority": t["priority"],
                    "parent_task_id": t["parent_task_id"]
                }
                for t in tasks
            ]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get project planning: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get project planning: {str(e)}")

# Demo data endpoint
@app.get("/demo/setup")
async def setup_demo_data():
    """Setup demo data"""
    try:
        conn = get_db()
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
        raise HTTPException(status_code=500, detail=f"Demo setup failed: {str(e)}")

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Real Estate Project Management System",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "docs": "/docs",
            "projects": "/projects",
            "materials": "/materials",
            "auth": {
                "register": "/auth/register",
                "login": "/auth/login"
            }
        }
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
