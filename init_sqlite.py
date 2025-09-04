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
        
        -- Suppliers
        CREATE TABLE suppliers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            contact_person TEXT,
            email TEXT,
            phone TEXT,
            address TEXT,
            city TEXT,
            state TEXT,
            country TEXT DEFAULT 'India',
            rating REAL DEFAULT 0.0,
            is_verified BOOLEAN DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Material Costs (Historical Pricing)
        CREATE TABLE material_costs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            material_id INTEGER,
            supplier_id INTEGER,
            unit_cost REAL NOT NULL,
            currency TEXT DEFAULT 'INR',
            cost_date DATE NOT NULL,
            is_current BOOLEAN DEFAULT 1,
            source TEXT DEFAULT 'manual',
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (material_id) REFERENCES materials (id),
            FOREIGN KEY (supplier_id) REFERENCES suppliers (id)
        );
        
        -- Project Phases (Custom phases per project)
        CREATE TABLE project_phases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER,
            name TEXT NOT NULL,
            sequence INTEGER NOT NULL,
            description TEXT,
            planned_start_date DATE,
            planned_end_date DATE,
            actual_start_date DATE,
            actual_end_date DATE,
            status TEXT DEFAULT 'pending',
            phase_type TEXT DEFAULT 'standard', -- 'standard' or 'custom'
            base_phase_id INTEGER, -- Reference to standard construction_phases
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
            FOREIGN KEY (base_phase_id) REFERENCES construction_phases (id)
        );
        
        -- Phase Material Requirements
        CREATE TABLE phase_material_requirements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phase_id INTEGER,
            material_id INTEGER,
            estimated_quantity REAL NOT NULL,
            unit TEXT NOT NULL,
            priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (phase_id) REFERENCES project_phases (id) ON DELETE CASCADE,
            FOREIGN KEY (material_id) REFERENCES materials (id)
        );
        
        -- Material Alternatives
        CREATE TABLE material_alternatives (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            primary_material_id INTEGER,
            alternative_material_id INTEGER,
            compatibility_score REAL DEFAULT 0.0, -- 0.0 to 1.0
            cost_difference_percent REAL DEFAULT 0.0, -- Positive = more expensive
            quality_difference TEXT, -- 'better', 'similar', 'worse'
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (primary_material_id) REFERENCES materials (id),
            FOREIGN KEY (alternative_material_id) REFERENCES materials (id)
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
        
        -- Phase 2: Material Intelligence Indexes
        CREATE INDEX idx_suppliers_location ON suppliers(city, state);
        CREATE INDEX idx_material_costs_material ON material_costs(material_id);
        CREATE INDEX idx_material_costs_supplier ON material_costs(supplier_id);
        CREATE INDEX idx_material_costs_date ON material_costs(cost_date);
        CREATE INDEX idx_project_phases_project ON project_phases(project_id);
        CREATE INDEX idx_phase_material_requirements_phase ON phase_material_requirements(phase_id);
        CREATE INDEX idx_phase_material_requirements_material ON phase_material_requirements(material_id);
        CREATE INDEX idx_material_alternatives_primary ON material_alternatives(primary_material_id);
        CREATE INDEX idx_material_alternatives_alternative ON material_alternatives(alternative_material_id);
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
    
    # Phase 2: Insert top Indian suppliers for each material category
    print("Inserting Phase 2: Material Intelligence Data...")
    
    suppliers = [
        # Cement & Concrete
        ('UltraTech Cement Ltd', 'Rajesh Kumar', 'info@ultratechcement.com', '+91-22-6691-8000', 
         'Ahmedabad House, 23 Kasturba Gandhi Marg, New Delhi', 'New Delhi', 'Delhi', 4.8, 1),
        ('ACC Limited', 'Priya Sharma', 'corporate@acclimited.com', '+91-22-6692-1000', 
         'Cement House, 121 Maharshi Karve Road, Mumbai', 'Mumbai', 'Maharashtra', 4.7, 1),
        ('Shree Cement Ltd', 'Amit Patel', 'info@shreecement.com', '+91-141-272-1000', 
         'Bangur Nagar, Beawar, Rajasthan', 'Beawar', 'Rajasthan', 4.6, 1),
        
        # Steel & Metal
        ('Tata Steel Ltd', 'Vikram Singh', 'info@tatasteel.com', '+91-657-243-1000', 
         'Jamshedpur, Jharkhand', 'Jamshedpur', 'Jharkhand', 4.9, 1),
        ('JSW Steel Ltd', 'Meera Reddy', 'info@jsw.in', '+91-22-4286-1000', 
         'JSW Centre, Bandra Kurla Complex, Mumbai', 'Mumbai', 'Maharashtra', 4.8, 1),
        ('SAIL (Steel Authority of India)', 'Arjun Verma', 'info@sail.co.in', '+91-11-2436-1000', 
         'Ispat Bhawan, Lodhi Road, New Delhi', 'New Delhi', 'Delhi', 4.7, 1),
        
        # Tiles & Flooring
        ('Kajaria Ceramics Ltd', 'Sunita Kapoor', 'info@kajaria.com', '+91-11-4666-6000', 
         'Kajaria House, Mathura Road, New Delhi', 'New Delhi', 'Delhi', 4.8, 1),
        ('Somany Ceramics Ltd', 'Rahul Mehta', 'info@somany.com', '+91-11-4666-7000', 
         'Somany House, Mathura Road, New Delhi', 'New Delhi', 'Delhi', 4.7, 1),
        ('Asian Granito India Ltd', 'Deepak Agarwal', 'info@asiangranito.com', '+91-79-4020-1000', 
         'Ahmedabad, Gujarat', 'Ahmedabad', 'Gujarat', 4.6, 1),
        
        # Paint & Coatings
        ('Asian Paints Ltd', 'Neha Gupta', 'info@asianpaints.com', '+91-22-6211-8000', 
         'Asian Paints House, Worli, Mumbai', 'Mumbai', 'Maharashtra', 4.9, 1),
        ('Berger Paints India Ltd', 'Rajiv Malhotra', 'info@bergerpaints.com', '+91-33-2482-1000', 
         'Kolkata, West Bengal', 'Kolkata', 'West Bengal', 4.8, 1),
        ('Kansai Nerolac Paints Ltd', 'Anita Desai', 'info@kansainerolac.com', '+91-22-2490-1000', 
         'Mumbai, Maharashtra', 'Mumbai', 'Maharashtra', 4.7, 1),
        
        # Electrical
        ('Havells India Ltd', 'Suresh Kumar', 'info@havells.com', '+91-11-4666-1000', 
         'Havells House, New Delhi', 'New Delhi', 'Delhi', 4.8, 1),
        ('Crompton Greaves Consumer Electricals', 'Priyanka Singh', 'info@crompton.co.in', '+91-22-2423-1000', 
         'Mumbai, Maharashtra', 'Mumbai', 'Maharashtra', 4.7, 1),
        ('Polycab India Ltd', 'Vikram Malhotra', 'info@polycab.com', '+91-22-2490-2000', 
         'Mumbai, Maharashtra', 'Mumbai', 'Maharashtra', 4.6, 1),
        
        # Plumbing
        ('Finolex Industries Ltd', 'Rajesh Agarwal', 'info@finolex.com', '+91-22-2490-3000', 
         'Mumbai, Maharashtra', 'Mumbai', 'Maharashtra', 4.8, 1),
        ('Astral Poly Technik Ltd', 'Meera Patel', 'info@astralcpvc.com', '+91-79-4020-2000', 
         'Ahmedabad, Gujarat', 'Ahmedabad', 'Gujarat', 4.7, 1),
        ('Supreme Industries Ltd', 'Amit Kumar', 'info@supreme.co.in', '+91-22-2490-4000', 
         'Mumbai, Maharashtra', 'Mumbai', 'Maharashtra', 4.6, 1)
    ]
    
    cursor.executemany(
        "INSERT INTO suppliers (name, contact_person, email, phone, address, city, state, rating, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        suppliers
    )
    
    # Insert material costs with supplier information
    material_costs = [
        # Cement costs from different suppliers
        (1, 1, 350.00, 'INR', '2024-01-01', 1, 'manual', 'Base price from UltraTech'),
        (1, 2, 345.00, 'INR', '2024-01-01', 1, 'manual', 'Base price from ACC'),
        (1, 3, 348.00, 'INR', '2024-01-01', 1, 'manual', 'Base price from Shree Cement'),
        
        # Steel costs from different suppliers
        (9, 4, 65000.00, 'INR', '2024-01-01', 1, 'manual', 'Base price from Tata Steel'),
        (9, 5, 64800.00, 'INR', '2024-01-01', 1, 'manual', 'Base price from JSW Steel'),
        (9, 6, 65200.00, 'INR', '2024-01-01', 1, 'manual', 'Base price from SAIL'),
        
        # Tile costs from different suppliers
        (22, 7, 1200.00, 'INR', '2024-01-01', 1, 'manual', 'Base price from Kajaria'),
        (22, 8, 1180.00, 'INR', '2024-01-01', 1, 'manual', 'Base price from Somany'),
        (22, 9, 1220.00, 'INR', '2024-01-01', 1, 'manual', 'Base price from Asian Granito'),
        
        # Paint costs from different suppliers
        (25, 10, 180.00, 'INR', '2024-01-01', 1, 'manual', 'Base price from Asian Paints'),
        (25, 11, 175.00, 'INR', '2024-01-01', 1, 'manual', 'Base price from Berger'),
        (25, 12, 178.00, 'INR', '2024-01-01', 1, 'manual', 'Base price from Kansai Nerolac')
    ]
    
    cursor.executemany(
        "INSERT INTO material_costs (material_id, supplier_id, unit_cost, currency, cost_date, is_current, source, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        material_costs
    )
    
    # Insert material alternatives
    material_alternatives = [
        # Cement alternatives
        (1, 2, 0.95, -1.4, 'similar', 'ACC cement as alternative to UltraTech'),
        (1, 3, 0.92, -0.6, 'similar', 'Shree Cement as alternative to UltraTech'),
        
        # Steel alternatives
        (9, 10, 0.98, -0.3, 'similar', 'Fe 550D as alternative to Fe 500D'),
        (9, 11, 0.96, -0.6, 'similar', 'Structural steel as alternative to TMT bars'),
        
        # Tile alternatives
        (22, 23, 0.85, -37.5, 'similar', 'Ceramic tiles as alternative to vitrified'),
        (22, 24, 0.90, -57.1, 'better', 'Marble tiles as premium alternative'),
        
        # Paint alternatives
        (25, 26, 0.97, -2.8, 'similar', 'Berger paint as alternative to Asian Paints'),
        (25, 27, 0.99, -1.1, 'similar', 'Kansai Nerolac as alternative to Asian Paints')
    ]
    
    cursor.executemany(
        "INSERT INTO material_alternatives (primary_material_id, alternative_material_id, compatibility_score, cost_difference_percent, quality_difference, notes) VALUES (?, ?, ?, ?, ?, ?)",
        material_alternatives
    )
    
    # Insert sample project phases for the sample project
    project_phases = [
        (1, 'Site Preparation & Foundation', 1, 'Site clearing and foundation work', '2024-02-01', '2024-02-28', None, None, 'pending', 'standard', 1),
        (1, 'Structure & Masonry', 2, 'Column, beam, and wall construction', '2024-03-01', '2024-04-15', None, None, 'pending', 'standard', 3),
        (1, 'Roofing & Finishing', 3, 'Roof construction and final touches', '2024-04-16', '2024-06-30', None, None, 'pending', 'standard', 5),
        (1, 'Custom Phase: Interior Design', 4, 'Custom interior design and decoration', '2024-07-01', '2024-07-31', None, None, 'pending', 'custom', None)
    ]
    
    cursor.executemany(
        "INSERT INTO project_phases (project_id, name, sequence, description, planned_start_date, planned_end_date, actual_start_date, actual_end_date, status, phase_type, base_phase_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        project_phases
    )
    
    # Insert phase material requirements
    phase_material_requirements = [
        (1, 1, 100.0, 'Bag (50kg)', 'critical', 'Cement for foundation'),
        (1, 4, 50.0, 'Cubic Meter', 'critical', 'River sand for foundation'),
        (1, 5, 30.0, 'Cubic Meter', 'critical', 'Coarse aggregate for foundation'),
        (2, 9, 5.0, 'Ton', 'critical', 'TMT steel for structure'),
        (2, 6, 5000.0, 'Piece', 'high', 'Bricks for masonry'),
        (3, 22, 200.0, 'Square Meter', 'high', 'Floor tiles for finishing'),
        (3, 25, 50.0, 'Liter', 'medium', 'Paint for walls'),
        (4, 22, 100.0, 'Square Meter', 'medium', 'Premium tiles for interior design')
    ]
    
    cursor.executemany(
        "INSERT INTO phase_material_requirements (phase_id, material_id, estimated_quantity, unit, priority, notes) VALUES (?, ?, ?, ?, ?, ?)",
        phase_material_requirements
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
    
    # Phase 2: Material Intelligence Summary
    print(f"🚀 Phase 2: Material Intelligence System")
    print(f"📊 Created {len(suppliers)} top Indian suppliers")
    print(f"📊 Created {len(material_costs)} material cost records")
    print(f"📊 Created {len(material_alternatives)} material alternatives")
    print(f"📊 Created {len(project_phases)} project phases (including custom)")
    print(f"📊 Created {len(phase_material_requirements)} phase material requirements")
    print(f"💡 Features: Supplier management, cost tracking, alternatives, custom phases")

if __name__ == "__main__":
    init_sqlite_db()
