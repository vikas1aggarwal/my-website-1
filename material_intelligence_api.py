#!/usr/bin/env python3
from fastapi import FastAPI, HTTPException, Depends, Query, Body
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
import json
from datetime import datetime, date
from typing import Dict, List, Optional, Tuple
from pydantic import BaseModel
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI application
app = FastAPI(
    title="Material Intelligence API - Phase 2",
    description="Enhanced API for supplier management, cost tracking, alternatives, and project phases",
    version="2.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class SupplierCreate(BaseModel):
    name: str
    contact_person: str
    email: str
    phone: str
    city: str
    state: str

class MaterialCostUpdate(BaseModel):
    material_id: int
    supplier_id: int
    unit_cost: float

class MaterialIntelligenceDB:
    """Database operations for Material Intelligence system"""
    
    def __init__(self, db_path: str = "realestate.db"):
        self.db_path = db_path

    def execute_query(self, query: str, params: tuple = ()) -> List[Dict]:
        """Execute query and return results as list of dictionaries"""
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute(query, params)

            if query.strip().upper().startswith("SELECT"):
                columns = [description[0] for description in cursor.description]
                results = []
                for row in cursor.fetchall():
                    results.append(dict(zip(columns, row)))
                return results
            else:
                conn.commit()
                return [{"affected_rows": cursor.rowcount}]
        except Exception as e:
            logger.error(f"Database error: {e}")
            raise
        finally:
            conn.close()

# Initialize database
db = MaterialIntelligenceDB()

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        db.execute_query("SELECT 1")
        return {
            "success": True,
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "success": False,
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

if __name__ == "__main__":
    print("🚀 Material Intelligence API - Phase 2")
    print("📊 Database: realestate.db")
    print("🚀 Starting server on port 5001...")
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)

# ============================================================================
# SUPPLIER MANAGEMENT APIs
# ============================================================================

@app.get("/api/suppliers")
async def get_suppliers(
    category: Optional[str] = Query(None, description="Filter by material category"),
    city: Optional[str] = Query(None, description="Filter by city"),
    state: Optional[str] = Query(None, description="Filter by state"),
    min_rating: Optional[float] = Query(None, description="Minimum supplier rating")
):
    """Get all suppliers with optional filtering"""
    try:
        query = """
            SELECT s.*, 
                   COUNT(DISTINCT mc.material_id) as materials_count,
                   AVG(mc.unit_cost) as avg_material_cost
            FROM suppliers s
            LEFT JOIN material_costs mc ON s.id = mc.supplier_id
            WHERE 1=1
        """
        params = []

        if city:
            query += " AND s.city LIKE ?"
            params.append(f"%{city}%")

        if state:
            query += " AND s.state LIKE ?"
            params.append(f"%{state}%")

        query += " GROUP BY s.id"

        if min_rating:
            query += " HAVING s.rating >= ?"
            params.append(min_rating)

        query += " ORDER BY s.rating DESC, s.name"

        suppliers = db.execute_query(query, tuple(params))

        return {
            "success": True,
            "data": suppliers,
            "count": len(suppliers)
        }

    except Exception as e:
        logger.error(f"Error getting suppliers: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/suppliers/{supplier_id}")
async def get_supplier(supplier_id: int):
    """Get specific supplier with materials and costs"""
    try:
        # Get supplier details
        supplier_query = "SELECT * FROM suppliers WHERE id = ?"
        suppliers = db.execute_query(supplier_query, (supplier_id,))

        if not suppliers:
            raise HTTPException(status_code=404, detail="Supplier not found")

        supplier = suppliers[0]

        return {
            "success": True,
            "data": supplier
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting supplier: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/material-costs")
async def get_all_material_costs():
    """Get all material costs"""
    try:
        query = """
            SELECT mc.*, s.name as supplier_name, s.city, s.state, m.name as material_name, m.unit
            FROM material_costs mc
            JOIN suppliers s ON mc.supplier_id = s.id
            JOIN materials m ON mc.material_id = m.id
            ORDER BY mc.cost_date DESC
        """

        costs = db.execute_query(query)

        return {
            "success": True,
            "data": costs,
            "count": len(costs)
        }

    except Exception as e:
        logger.error(f"Error getting material costs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/materials/{material_id}/costs")
async def get_material_costs(material_id: int):
    """Get cost history for a specific material"""
    try:
        query = """
            SELECT mc.*, s.name as supplier_name, s.city, s.state, m.name as material_name, m.unit
            FROM material_costs mc
            JOIN suppliers s ON mc.supplier_id = s.id
            JOIN materials m ON mc.material_id = m.id
            WHERE mc.material_id = ?
            ORDER BY mc.cost_date DESC
        """

        costs = db.execute_query(query, (material_id,))

        if not costs:
            raise HTTPException(status_code=404, detail="No cost data found for this material")

        return {
            "success": True,
            "data": costs,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting material costs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/projects")
async def get_projects():
    """Get all projects"""
    try:
        query = "SELECT * FROM projects ORDER BY created_at DESC"
        projects = db.execute_query(query)

        return {
            "success": True,
            "data": projects,
            "count": len(projects)
        }

    except Exception as e:
        logger.error(f"Error getting projects: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/materials")
async def get_materials():
    """Get all materials"""
    try:
        query = "SELECT * FROM materials ORDER BY name"
        materials = db.execute_query(query)

        return {
            "success": True,
            "data": materials,
            "count": len(materials)
        }

    except Exception as e:
        logger.error(f"Error getting materials: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/materials/{material_id}/alternatives")
async def get_material_alternatives(material_id: int):
    """Get alternatives for a specific material"""
    try:
        query = """
            SELECT ma.*, 
                   m1.name as original_material_name,
                   m2.name as alternative_material_name
            FROM material_alternatives ma
            JOIN materials m1 ON ma.original_material_id = m1.id
            JOIN materials m2 ON ma.alternative_material_id = m2.id
            WHERE ma.original_material_id = ?
            ORDER BY ma.compatibility_score DESC
        """
        alternatives = db.execute_query(query, (material_id,))

        return {
            "success": True,
            "data": alternatives,
            "count": len(alternatives)
        }

    except Exception as e:
        logger.error(f"Error getting material alternatives: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/project-phases")
async def get_project_phases():
    """Get all project phases"""
    try:
        query = "SELECT * FROM project_phases ORDER BY phase_order"
        phases = db.execute_query(query)

        return {
            "success": True,
            "data": phases,
            "count": len(phases)
        }

    except Exception as e:
        logger.error(f"Error getting project phases: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/project-phases/{phase_id}/materials")
async def get_phase_materials(phase_id: int):
    """Get materials required for a specific project phase"""
    try:
        query = """
            SELECT pmr.*, m.name as material_name, m.unit, m.base_cost_per_unit,
                   s.name as supplier_name, s.rating as supplier_rating
            FROM phase_material_requirements pmr
            JOIN materials m ON pmr.material_id = m.id
            LEFT JOIN suppliers s ON pmr.preferred_supplier_id = s.id
            WHERE pmr.phase_id = ?
            ORDER BY pmr.quantity DESC
        """
        materials = db.execute_query(query, (phase_id,))

        return {
            "success": True,
            "data": materials,
            "count": len(materials)
        }

    except Exception as e:
        logger.error(f"Error getting phase materials: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/dashboard/material-intelligence")
async def get_material_intelligence_dashboard():
    """Get comprehensive material intelligence dashboard data"""
    try:
        # Get summary statistics
        stats_query = """
            SELECT 
                COUNT(DISTINCT s.id) as total_suppliers, 
                COUNT(DISTINCT m.id) as total_materials,
                COUNT(DISTINCT mc.id) as total_cost_records,
                COUNT(DISTINCT ma.id) as total_alternatives,
                COUNT(DISTINCT pp.id) as total_phases
            FROM suppliers s, materials m
            LEFT JOIN material_costs mc ON 1=1
            LEFT JOIN material_alternatives ma ON 1=1
            LEFT JOIN project_phases pp ON 1=1
        """
        stats = db.execute_query(stats_query)

        return {
            "success": True,
            "data": stats[0] if stats else {}
        }

    except Exception as e:
        logger.error(f"Error getting dashboard data: {e}")
        raise HTTPException(status_code=500, detail=str(e))
