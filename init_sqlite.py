#!/usr/bin/env python3
"""
SQLite Database Initialization Script
Creates the database schema and populates with master data
"""

import sqlite3
import json
import os
from datetime import datetime

def init_sqlite_db():
    """Initialize SQLite database with schema and master data"""
    
    # Database file path
    db_path = "realestate.db"
    
    # Remove existing database if it exists
    if os.path.exists(db_path):
        os.remove(db_path)
        print(f"Removed existing database: {db_path}")
    
    # Create connection
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("Creating database schema...")
    
    # Create tables
    cursor.executescript("""
        -- Material Categories
        CREATE TABLE material_categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            parent_id INTEGER,
            level INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Materials
        CREATE TABLE materials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category_id INTEGER,
            unit TEXT NOT NULL,
            base_cost_per_unit REAL NOT NULL,
            properties_json TEXT,
            alternatives_json TEXT,
            supplier_id INTEGER,
            is_active BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES material_categories (id)
        );
        
        -- Property Types
        CREATE TABLE property_types (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            category TEXT,
            typical_size_range TEXT,
            complexity_level INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Construction Phases
        CREATE TABLE construction_phases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            sequence INTEGER NOT NULL,
            description TEXT,
            typical_duration_days INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Building Components
        CREATE TABLE building_components (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT,
            unit TEXT,
            typical_cost_per_unit REAL,
            phase_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (phase_id) REFERENCES construction_phases (id)
        );
        
        -- Roles
        CREATE TABLE roles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            permissions_json TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Users
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            full_name TEXT NOT NULL,
            role_id INTEGER,
            hashed_password TEXT NOT NULL,
            is_active BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP,
            FOREIGN KEY (role_id) REFERENCES roles (id)
        );
        
        -- Projects
        CREATE TABLE projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            property_type_id INTEGER,
            location_address TEXT,
            city TEXT,
            state TEXT,
            country TEXT DEFAULT 'India',
            start_date DATE,
            target_completion DATE,
            budget REAL,
            status TEXT DEFAULT 'planning',
            builder_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (property_type_id) REFERENCES property_types (id),
            FOREIGN KEY (builder_id) REFERENCES users (id)
        );
        
        -- Tasks
        CREATE TABLE tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER,
            parent_task_id INTEGER,
            name TEXT NOT NULL,
            description TEXT,
            phase_id INTEGER,
            component_id INTEGER,
            duration_days INTEGER DEFAULT 1,
            planned_start_date DATE,
            planned_finish_date DATE,
            actual_start_date DATE,
            actual_finish_date DATE,
            percent_complete REAL DEFAULT 0.0,
            status TEXT DEFAULT 'pending',
            priority TEXT DEFAULT 'medium',
            assigned_team_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
            FOREIGN KEY (parent_task_id) REFERENCES tasks (id),
            FOREIGN KEY (phase_id) REFERENCES construction_phases (id),
            FOREIGN KEY (component_id) REFERENCES building_components (id)
        );
        
        -- Cost Estimates
        CREATE TABLE cost_estimates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id INTEGER,
            material_id INTEGER,
            quantity REAL NOT NULL,
            unit_cost REAL NOT NULL,
            total_cost REAL NOT NULL,
            estimate_type TEXT DEFAULT 'planned',
            confidence_level REAL DEFAULT 0.8,
            created_by INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE,
            FOREIGN KEY (material_id) REFERENCES materials (id),
            FOREIGN KEY (created_by) REFERENCES users (id)
        );
        
        -- Create indexes for performance
        CREATE INDEX idx_materials_category ON materials(category_id);
        CREATE INDEX idx_tasks_project ON tasks(project_id);
        CREATE INDEX idx_tasks_phase ON tasks(phase_id);
        CREATE INDEX idx_cost_estimates_task ON cost_estimates(task_id);
        CREATE INDEX idx_projects_builder ON projects(builder_id);
        CREATE INDEX idx_projects_status ON projects(status);
    """)
    
    print("Inserting master data...")
    
    # Insert material categories
    categories = [
        (1, 'Construction Materials', 'Basic construction materials', None, 1),
        (2, 'Finishing Materials', 'Materials for final touches', None, 1),
        (3, 'Electrical', 'Electrical components and materials', None, 1),
        (4, 'Plumbing', 'Plumbing materials and fixtures', None, 1),
        (5, 'HVAC', 'Heating, ventilation, and air conditioning', None, 1),
        (6, 'Concrete & Cement', 'Concrete, cement, and related materials', 1, 2),
        (7, 'Bricks & Blocks', 'Bricks, blocks, and masonry materials', 1, 2),
        (8, 'Steel & Metal', 'Steel, iron, and metal materials', 1, 2),
        (9, 'Wood & Timber', 'Wood, timber, and plywood', 1, 2),
        (10, 'Tiles & Flooring', 'Flooring tiles and materials', 2, 2),
        (11, 'Paint & Coatings', 'Paints, varnishes, and protective coatings', 2, 2),
        (12, 'Electrical Wires', 'Electrical wiring and cables', 3, 2),
        (13, 'Switches & Outlets', 'Electrical switches and outlets', 3, 2),
        (14, 'Pipes & Fittings', 'Water and drainage pipes', 4, 2),
        (15, 'Fixtures', 'Bathroom and kitchen fixtures', 4, 2)
    ]
    
    cursor.executemany(
        "INSERT INTO material_categories (id, name, description, parent_id, level) VALUES (?, ?, ?, ?, ?)",
        categories
    )
    
    # Insert materials with real construction data
    materials = [
        # Concrete & Cement
        ('Portland Cement (OPC 53 Grade)', 6, 'Bag (50kg)', 350.00, 
         json.dumps({"strength": "53 MPa", "setting_time": "45 min", "color": "Grey"})),
        ('Ready Mix Concrete M25', 6, 'Cubic Meter', 4500.00, 
         json.dumps({"strength": "25 MPa", "workability": "75-100mm", "aggregate_size": "20mm"})),
        ('Ready Mix Concrete M30', 6, 'Cubic Meter', 5200.00, 
         json.dumps({"strength": "30 MPa", "workability": "75-100mm", "aggregate_size": "20mm"})),
        ('River Sand', 6, 'Cubic Meter', 2800.00, 
         json.dumps({"fineness_modulus": "2.6-2.8", "moisture": "<3%", "impurities": "<5%"})),
        ('Coarse Aggregate 20mm', 6, 'Cubic Meter', 1800.00, 
         json.dumps({"size": "20mm", "shape": "Angular", "strength": "High"})),
        
        # Bricks & Blocks
        ('Clay Bricks (Standard)', 7, 'Piece', 12.00, 
         json.dumps({"size": "230x110x75mm", "strength": "3.5 MPa", "water_absorption": "<20%"})),
        ('Fly Ash Bricks', 7, 'Piece', 10.50, 
         json.dumps({"size": "230x110x75mm", "strength": "4.0 MPa", "weight": "2.5kg"})),
        ('Concrete Blocks (Hollow)', 7, 'Piece', 45.00, 
         json.dumps({"size": "400x200x200mm", "strength": "4.0 MPa", "weight": "18kg"})),
        ('AAC Blocks', 7, 'Cubic Meter', 3200.00, 
         json.dumps({"density": "600kg/m³", "strength": "3.5 MPa", "thermal_insulation": "High"})),
        
        # Steel & Metal
        ('TMT Steel Bars (Fe 500D)', 8, 'Ton', 65000.00, 
         json.dumps({"grade": "Fe 500D", "yield_strength": "500 MPa", "elongation": "16%"})),
        ('TMT Steel Bars (Fe 550D)', 8, 'Ton', 72000.00, 
         json.dumps({"grade": "Fe 550D", "yield_strength": "550 MPa", "elongation": "18%"})),
        ('Structural Steel (IS 2062)', 8, 'Ton', 75000.00, 
         json.dumps({"grade": "E250", "yield_strength": "250 MPa", "tensile_strength": "410 MPa"})),
        ('Aluminum Windows', 8, 'Square Meter', 2800.00, 
         json.dumps({"frame_material": "Aluminum", "glazing": "Single", "thermal_break": "Yes"})),
        
        # Tiles & Flooring
        ('Vitrified Tiles (60x60cm)', 10, 'Square Meter', 1200.00, 
         json.dumps({"size": "60x60cm", "thickness": "8mm", "water_absorption": "<0.5%"})),
        ('Ceramic Tiles (30x60cm)', 10, 'Square Meter', 450.00, 
         json.dumps({"size": "30x60cm", "thickness": "6mm", "water_absorption": "<3%"})),
        ('Marble Tiles (60x60cm)', 10, 'Square Meter', 2800.00, 
         json.dumps({"size": "60x60cm", "thickness": "18mm", "polish": "High"})),
        ('Granite Tiles (60x60cm)', 10, 'Square Meter', 3200.00, 
         json.dumps({"size": "60x60cm", "thickness": "20mm", "polish": "High"})),
        ('Laminated Flooring', 10, 'Square Meter', 850.00, 
         json.dumps({"thickness": "8mm", "wear_layer": "0.3mm", "installation": "Click"})),
        
        # Paint & Coatings
        ('Interior Emulsion Paint', 11, 'Liter', 180.00, 
         json.dumps({"type": "Water-based", "coverage": "12-14 sqm/liter", "drying_time": "2-4 hours"})),
        ('Exterior Weatherproof Paint', 11, 'Liter', 280.00, 
         json.dumps({"type": "Water-based", "coverage": "10-12 sqm/liter", "drying_time": "4-6 hours"})),
        ('Primer Coat', 11, 'Liter', 120.00, 
         json.dumps({"type": "Oil-based", "coverage": "15-18 sqm/liter", "drying_time": "6-8 hours"})),
        
        # Electrical
        ('Copper Wire (2.5 sqmm)', 12, 'Meter', 45.00, 
         json.dumps({"conductor": "Copper", "insulation": "PVC", "current_rating": "20A"})),
        ('Copper Wire (4 sqmm)', 12, 'Meter', 65.00, 
         json.dumps({"conductor": "Copper", "insulation": "PVC", "current_rating": "32A"})),
        ('MCB 16A Single Pole', 13, 'Piece', 180.00, 
         json.dumps({"rating": "16A", "type": "Type C", "breaking_capacity": "6kA"})),
        ('Power Socket 16A', 13, 'Piece', 120.00, 
         json.dumps({"rating": "16A", "type": "5-pin", "material": "Fire retardant"})),
        
        # Plumbing
        ('PVC Pipes (110mm)', 14, 'Meter', 280.00, 
         json.dumps({"diameter": "110mm", "pressure": "6kg/cm²", "material": "PVC"})),
        ('CPVC Pipes (20mm)', 14, 'Meter', 45.00, 
         json.dumps({"diameter": "20mm", "pressure": "10kg/cm²", "material": "CPVC"})),
        ('Bathroom Basin', 15, 'Piece', 2800.00, 
         json.dumps({"material": "Ceramic", "size": "Standard", "installation": "Wall mounted"})),
        ('Kitchen Sink', 15, 'Piece', 3500.00, 
         json.dumps({"material": "Stainless Steel", "size": "Double bowl", "installation": "Undermount"}))
    ]
    
    cursor.executemany(
        "INSERT INTO materials (name, category_id, unit, base_cost_per_unit, properties_json) VALUES (?, ?, ?, ?, ?)",
        materials
    )
    
    # Insert property types
    property_types = [
        ('Residential House', 'Single family residential house', 'Residential', '1000-3000 sqft', 2),
        ('Apartment Unit', 'Individual apartment in multi-unit building', 'Residential', '500-2000 sqft', 1),
        ('Villa', 'Luxury residential property with amenities', 'Residential', '3000-8000 sqft', 3),
        ('Commercial Office', 'Office space for business use', 'Commercial', '1000-10000 sqft', 2),
        ('Retail Shop', 'Commercial space for retail business', 'Commercial', '500-5000 sqft', 2),
        ('Warehouse', 'Storage and distribution facility', 'Commercial', '5000-50000 sqft', 1),
        ('Industrial Building', 'Manufacturing or industrial facility', 'Industrial', '10000-100000 sqft', 3)
    ]
    
    cursor.executemany(
        "INSERT INTO property_types (name, description, category, typical_size_range, complexity_level) VALUES (?, ?, ?, ?, ?)",
        property_types
    )
    
    # Insert construction phases
    phases = [
        ('Site Preparation', 1, 'Clearing, leveling, and site setup', 7),
        ('Foundation', 2, 'Excavation, footing, and foundation work', 21),
        ('Structure', 3, 'Columns, beams, and structural elements', 45),
        ('Masonry', 4, 'Brickwork, blockwork, and wall construction', 30),
        ('Roofing', 5, 'Roof structure and covering', 15),
        ('Electrical', 6, 'Electrical wiring and installations', 20),
        ('Plumbing', 7, 'Plumbing pipes and fixtures', 18),
        ('Finishing', 8, 'Flooring, painting, and final touches', 25),
        ('Testing & Commissioning', 9, 'Final testing and handover', 7)
    ]
    
    cursor.executemany(
        "INSERT INTO construction_phases (name, sequence, description, typical_duration_days) VALUES (?, ?, ?, ?)",
        phases
    )
    
    # Insert building components
    components = [
        ('Excavation', 'Earthwork', 'Cubic Meter', 450.00, 2),
        ('RCC Foundation', 'Concrete', 'Cubic Meter', 8500.00, 2),
        ('RCC Columns', 'Concrete', 'Cubic Meter', 9500.00, 3),
        ('RCC Beams', 'Concrete', 'Cubic Meter', 9200.00, 3),
        ('Brick Masonry', 'Masonry', 'Cubic Meter', 4500.00, 4),
        ('Roof Slab', 'Concrete', 'Cubic Meter', 9800.00, 5),
        ('Electrical Wiring', 'Electrical', 'Square Meter', 180.00, 6),
        ('Plumbing Pipes', 'Plumbing', 'Meter', 120.00, 7),
        ('Floor Tiles', 'Finishing', 'Square Meter', 1800.00, 8),
        ('Wall Paint', 'Finishing', 'Square Meter', 45.00, 8)
    ]
    
    cursor.executemany(
        "INSERT INTO building_components (name, category, unit, typical_cost_per_unit, phase_id) VALUES (?, ?, ?, ?, ?)",
        components
    )
    
    # Insert roles
    roles = [
        ('admin', 'System administrator with full access', json.dumps({"all": True})),
        ('builder', 'Project builder/owner with project management access', 
         json.dumps({"projects": ["create", "read", "update", "delete"], "tasks": ["create", "read", "update", "delete"], "reports": ["read"]})),
        ('manager', 'Project manager with team and task management access', 
         json.dumps({"projects": ["read", "update"], "tasks": ["create", "read", "update"], "teams": ["create", "read", "update"], "reports": ["read"]})),
        ('worker', 'Field worker with task update and photo upload access', 
         json.dumps({"tasks": ["read", "update"], "progress": ["create", "read"], "photos": ["upload"]})),
        ('viewer', 'Read-only access for stakeholders', 
         json.dumps({"projects": ["read"], "tasks": ["read"], "reports": ["read"]}))
    ]
    
    cursor.executemany(
        "INSERT INTO roles (name, description, permissions_json) VALUES (?, ?, ?)",
        roles
    )
    
    # Insert admin user
    cursor.execute(
        "INSERT INTO users (username, email, full_name, role_id, hashed_password) VALUES (?, ?, ?, ?, ?)",
        ('admin', 'admin@realestate.com', 'System Administrator', 1, 'admin123')
    )
    
    # Insert sample project
    cursor.execute(
        "INSERT INTO projects (name, description, property_type_id, location_address, city, state, budget, status, builder_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        ('Sample Residential Project', 'A 3-bedroom residential house with modern amenities', 1, '123 Main Street, Downtown', 'Mumbai', 'Maharashtra', 2500000.00, 'planning', 1)
    )
    
    # Insert sample tasks
    sample_tasks = [
        ('Site Survey and Planning', 'Initial site survey and project planning', 1, None, 3, 'completed'),
        ('Foundation Excavation', 'Excavation for foundation', 2, 1, 5, 'in_progress'),
        ('Foundation Concrete', 'RCC foundation work', 2, 2, 7, 'pending'),
        ('Column Construction', 'RCC column construction', 3, 3, 10, 'pending'),
        ('Beam Construction', 'RCC beam construction', 3, 4, 8, 'pending'),
        ('Wall Construction', 'Brick masonry work', 4, 5, 15, 'pending'),
        ('Roof Construction', 'RCC roof slab', 5, 6, 12, 'pending'),
        ('Electrical Work', 'Electrical wiring and installations', 6, 7, 20, 'pending'),
        ('Plumbing Work', 'Plumbing pipes and fixtures', 7, 8, 18, 'pending'),
        ('Flooring', 'Floor tile installation', 8, 9, 10, 'pending'),
        ('Painting', 'Interior and exterior painting', 8, 10, 12, 'pending')
    ]
    
    cursor.executemany(
        "INSERT INTO tasks (name, description, phase_id, component_id, duration_days, status) VALUES (?, ?, ?, ?, ?, ?)",
        sample_tasks
    )
    
    # Insert sample cost estimates
    cost_estimates = [
        (2, 1, 50.00, 350.00, 17500.00, 'planned', 0.8, 1),
        (2, 4, 20.00, 2800.00, 56000.00, 'planned', 0.8, 1),
        (2, 5, 15.00, 1800.00, 27000.00, 'planned', 0.8, 1),
        (3, 2, 25.00, 4500.00, 112500.00, 'planned', 0.8, 1),
        (6, 6, 1000.00, 12.00, 12000.00, 'planned', 0.8, 1),
        (6, 7, 1000.00, 10.50, 10500.00, 'planned', 0.8, 1)
    ]
    
    cursor.executemany(
        "INSERT INTO cost_estimates (task_id, material_id, quantity, unit_cost, total_cost, estimate_type, confidence_level, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        cost_estimates
    )
    
    # Commit changes
    conn.commit()
    conn.close()
    
    print(f"✅ Database initialized successfully: {db_path}")
    print(f"📊 Created {len(categories)} material categories")
    print(f"📊 Created {len(materials)} materials")
    print(f"📊 Created {len(property_types)} property types")
    print(f"📊 Created {len(phases)} construction phases")
    print(f"📊 Created {len(components)} building components")
    print(f"📊 Created {len(roles)} user roles")
    print(f"📊 Created 1 admin user")
    print(f"📊 Created 1 sample project")
    print(f"📊 Created {len(sample_tasks)} sample tasks")
    print(f"📊 Created {len(cost_estimates)} sample cost estimates")

if __name__ == "__main__":
    init_sqlite_db()
