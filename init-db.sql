-- Initialize Real Estate Project Management Database
-- This script sets up the initial schema and master data

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create schema
CREATE SCHEMA IF NOT EXISTS realestate;

-- Set search path
SET search_path TO realestate, public;

-- Material Categories (Hierarchical)
CREATE TABLE material_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES material_categories(id),
    level INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Materials Master Data
CREATE TABLE materials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category_id INTEGER REFERENCES material_categories(id),
    unit VARCHAR(50) NOT NULL,
    base_cost_per_unit DECIMAL(10,2) NOT NULL,
    properties_json JSONB,
    alternatives_json JSONB,
    supplier_id INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Property Types
CREATE TABLE property_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    typical_size_range VARCHAR(100),
    complexity_level INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Construction Phases
CREATE TABLE construction_phases (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    sequence INTEGER NOT NULL,
    description TEXT,
    typical_duration_days INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Building Components
CREATE TABLE building_components (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(100),
    unit VARCHAR(50),
    typical_cost_per_unit DECIMAL(10,2),
    phase_id INTEGER REFERENCES construction_phases(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users and Roles
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    permissions_json JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(200) NOT NULL,
    role_id INTEGER REFERENCES roles(id),
    hashed_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Projects
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    property_type_id INTEGER REFERENCES property_types(id),
    location_address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    start_date DATE,
    target_completion DATE,
    budget DECIMAL(15,2),
    status VARCHAR(50) DEFAULT 'planning',
    builder_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    parent_task_id INTEGER REFERENCES tasks(id),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    phase_id INTEGER REFERENCES construction_phases(id),
    component_id INTEGER REFERENCES building_components(id),
    duration_days INTEGER DEFAULT 1,
    planned_start_date DATE,
    planned_finish_date DATE,
    actual_start_date DATE,
    actual_finish_date DATE,
    percent_complete DECIMAL(5,2) DEFAULT 0.0,
    status VARCHAR(50) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'medium',
    assigned_team_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Task Dependencies
CREATE TABLE task_dependencies (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    predecessor_task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    successor_task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    dependency_type VARCHAR(50) DEFAULT 'finish_to_start',
    lag_days INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cost Estimates
CREATE TABLE cost_estimates (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    material_id INTEGER REFERENCES materials(id),
    quantity DECIMAL(10,3) NOT NULL,
    unit_cost DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(12,2) NOT NULL,
    estimate_type VARCHAR(50) DEFAULT 'planned',
    confidence_level DECIMAL(5,2) DEFAULT 0.8,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teams
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    lead_user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Team Members
CREATE TABLE team_members (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role_in_team VARCHAR(100),
    join_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Progress Updates
CREATE TABLE progress_updates (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    progress_percentage DECIMAL(5,2) NOT NULL,
    description TEXT,
    update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending',
    admin_approval_status VARCHAR(50) DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Progress Media
CREATE TABLE progress_media (
    id SERIAL PRIMARY KEY,
    progress_update_id INTEGER REFERENCES progress_updates(id) ON DELETE CASCADE,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(100),
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    file_size BIGINT,
    thumbnail_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_materials_category ON materials(category_id);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_phase ON tasks(phase_id);
CREATE INDEX idx_cost_estimates_task ON cost_estimates(task_id);
CREATE INDEX idx_progress_updates_task ON progress_updates(task_id);
CREATE INDEX idx_projects_builder ON projects(builder_id);
CREATE INDEX idx_projects_status ON projects(status);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON materials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial master data

-- Material Categories
INSERT INTO material_categories (name, description, level) VALUES
('Construction Materials', 'Basic construction materials', 1),
('Finishing Materials', 'Materials for final touches', 1),
('Electrical', 'Electrical components and materials', 1),
('Plumbing', 'Plumbing materials and fixtures', 1),
('HVAC', 'Heating, ventilation, and air conditioning', 1);

INSERT INTO material_categories (name, description, parent_id, level) VALUES
('Concrete & Cement', 'Concrete, cement, and related materials', 1, 2),
('Bricks & Blocks', 'Bricks, blocks, and masonry materials', 1, 2),
('Steel & Metal', 'Steel, iron, and metal materials', 1, 2),
('Wood & Timber', 'Wood, timber, and plywood', 1, 2),
('Tiles & Flooring', 'Flooring tiles and materials', 2, 2),
('Paint & Coatings', 'Paints, varnishes, and protective coatings', 2, 2),
('Electrical Wires', 'Electrical wiring and cables', 3, 2),
('Switches & Outlets', 'Electrical switches and outlets', 3, 2),
('Pipes & Fittings', 'Water and drainage pipes', 4, 2),
('Fixtures', 'Bathroom and kitchen fixtures', 4, 2);

-- Materials with real construction data
INSERT INTO materials (name, category_id, unit, base_cost_per_unit, properties_json) VALUES
-- Concrete & Cement
('Portland Cement (OPC 53 Grade)', 6, 'Bag (50kg)', 350.00, '{"strength": "53 MPa", "setting_time": "45 min", "color": "Grey"}'),
('Ready Mix Concrete M25', 6, 'Cubic Meter', 4500.00, '{"strength": "25 MPa", "workability": "75-100mm", "aggregate_size": "20mm"}'),
('Ready Mix Concrete M30', 6, 'Cubic Meter', 5200.00, '{"strength": "30 MPa", "workability": "75-100mm", "aggregate_size": "20mm"}'),
('River Sand', 6, 'Cubic Meter', 2800.00, '{"fineness_modulus": "2.6-2.8", "moisture": "<3%", "impurities": "<5%"}'),
('Coarse Aggregate 20mm', 6, 'Cubic Meter', 1800.00, '{"size": "20mm", "shape": "Angular", "strength": "High"}'),

-- Bricks & Blocks
('Clay Bricks (Standard)', 7, 'Piece', 12.00, '{"size": "230x110x75mm", "strength": "3.5 MPa", "water_absorption": "<20%"}'),
('Fly Ash Bricks', 7, 'Piece', 10.50, '{"size": "230x110x75mm", "strength": "4.0 MPa", "weight": "2.5kg"}'),
('Concrete Blocks (Hollow)', 7, 'Piece', 45.00, '{"size": "400x200x200mm", "strength": "4.0 MPa", "weight": "18kg"}'),
('AAC Blocks', 7, 'Cubic Meter', 3200.00, '{"density": "600kg/m³", "strength": "3.5 MPa", "thermal_insulation": "High"}'),

-- Steel & Metal
('TMT Steel Bars (Fe 500D)', 8, 'Ton', 65000.00, '{"grade": "Fe 500D", "yield_strength": "500 MPa", "elongation": "16%"}'),
('TMT Steel Bars (Fe 550D)', 8, 'Ton', 72000.00, '{"grade": "Fe 550D", "yield_strength": "550 MPa", "elongation": "18%"}'),
('Structural Steel (IS 2062)', 8, 'Ton', 75000.00, '{"grade": "E250", "yield_strength": "250 MPa", "tensile_strength": "410 MPa"}'),
('Aluminum Windows', 8, 'Square Meter', 2800.00, '{"frame_material": "Aluminum", "glazing": "Single", "thermal_break": "Yes"}'),

-- Tiles & Flooring
('Vitrified Tiles (60x60cm)', 10, 'Square Meter', 1200.00, '{"size": "60x60cm", "thickness": "8mm", "water_absorption": "<0.5%"}'),
('Ceramic Tiles (30x60cm)', 10, 'Square Meter', 450.00, '{"size": "30x60cm", "thickness": "6mm", "water_absorption": "<3%"}'),
('Marble Tiles (60x60cm)', 10, 'Square Meter', 2800.00, '{"size": "60x60cm", "thickness": "18mm", "polish": "High"}'),
('Granite Tiles (60x60cm)', 10, 'Square Meter', 3200.00, '{"size": "60x60cm", "thickness": "20mm", "polish": "High"}'),
('Laminated Flooring', 10, 'Square Meter', 850.00, '{"thickness": "8mm", "wear_layer": "0.3mm", "installation": "Click"}'),

-- Paint & Coatings
('Interior Emulsion Paint', 11, 'Liter', 180.00, '{"type": "Water-based", "coverage": "12-14 sqm/liter", "drying_time": "2-4 hours"}'),
('Exterior Weatherproof Paint', 11, 'Liter', 280.00, '{"type": "Water-based", "coverage": "10-12 sqm/liter", "drying_time": "4-6 hours"}'),
('Primer Coat', 11, 'Liter', 120.00, '{"type": "Oil-based", "coverage": "15-18 sqm/liter", "drying_time": "6-8 hours"}'),

-- Electrical
('Copper Wire (2.5 sqmm)', 12, 'Meter', 45.00, '{"conductor": "Copper", "insulation": "PVC", "current_rating": "20A"}'),
('Copper Wire (4 sqmm)', 12, 'Meter', 65.00, '{"conductor": "Copper", "insulation": "PVC", "current_rating": "32A"}'),
('MCB 16A Single Pole', 13, 'Piece', 180.00, '{"rating": "16A", "type": "Type C", "breaking_capacity": "6kA"}'),
('Power Socket 16A', 13, 'Piece', 120.00, '{"rating": "16A", "type": "5-pin", "material": "Fire retardant"}'),

-- Plumbing
('PVC Pipes (110mm)', 14, 'Meter', 280.00, '{"diameter": "110mm", "pressure": "6kg/cm²", "material": "PVC"}'),
('CPVC Pipes (20mm)', 14, 'Meter', 45.00, '{"diameter": "20mm", "pressure": "10kg/cm²", "material": "CPVC"}'),
('Bathroom Basin', 15, 'Piece', 2800.00, '{"material": "Ceramic", "size": "Standard", "installation": "Wall mounted"}'),
('Kitchen Sink', 15, 'Piece', 3500.00, '{"material": "Stainless Steel", "size": "Double bowl", "installation": "Undermount"}');

-- Property Types
INSERT INTO property_types (name, description, category, typical_size_range, complexity_level) VALUES
('Residential House', 'Single family residential house', 'Residential', '1000-3000 sqft', 2),
('Apartment Unit', 'Individual apartment in multi-unit building', 'Residential', '500-2000 sqft', 1),
('Villa', 'Luxury residential property with amenities', 'Residential', '3000-8000 sqft', 3),
('Commercial Office', 'Office space for business use', 'Commercial', '1000-10000 sqft', 2),
('Retail Shop', 'Commercial space for retail business', 'Commercial', '500-5000 sqft', 2),
('Warehouse', 'Storage and distribution facility', 'Commercial', '5000-50000 sqft', 1),
('Industrial Building', 'Manufacturing or industrial facility', 'Industrial', '10000-100000 sqft', 3);

-- Construction Phases
INSERT INTO construction_phases (name, sequence, description, typical_duration_days) VALUES
('Site Preparation', 1, 'Clearing, leveling, and site setup', 7),
('Foundation', 2, 'Excavation, footing, and foundation work', 21),
('Structure', 3, 'Columns, beams, and structural elements', 45),
('Masonry', 4, 'Brickwork, blockwork, and wall construction', 30),
('Roofing', 5, 'Roof structure and covering', 15),
('Electrical', 6, 'Electrical wiring and installations', 20),
('Plumbing', 7, 'Plumbing pipes and fixtures', 18),
('Finishing', 8, 'Flooring, painting, and final touches', 25),
('Testing & Commissioning', 9, 'Final testing and handover', 7);

-- Building Components
INSERT INTO building_components (name, category, unit, typical_cost_per_unit, phase_id) VALUES
('Excavation', 'Earthwork', 'Cubic Meter', 450.00, 2),
('RCC Foundation', 'Concrete', 'Cubic Meter', 8500.00, 2),
('RCC Columns', 'Concrete', 'Cubic Meter', 9500.00, 3),
('RCC Beams', 'Concrete', 'Cubic Meter', 9200.00, 3),
('Brick Masonry', 'Masonry', 'Cubic Meter', 4500.00, 4),
('Roof Slab', 'Concrete', 'Cubic Meter', 9800.00, 5),
('Electrical Wiring', 'Electrical', 'Square Meter', 180.00, 6),
('Plumbing Pipes', 'Plumbing', 'Meter', 120.00, 7),
('Floor Tiles', 'Finishing', 'Square Meter', 1800.00, 8),
('Wall Paint', 'Finishing', 'Square Meter', 45.00, 8);

-- Roles
INSERT INTO roles (name, description, permissions_json) VALUES
('admin', 'System administrator with full access', '{"all": true}'),
('builder', 'Project builder/owner with project management access', '{"projects": ["create", "read", "update", "delete"], "tasks": ["create", "read", "update", "delete"], "reports": ["read"]}'),
('manager', 'Project manager with team and task management access', '{"projects": ["read", "update"], "tasks": ["create", "read", "update"], "teams": ["create", "read", "update"], "reports": ["read"]}'),
('worker', 'Field worker with task update and photo upload access', '{"tasks": ["read", "update"], "progress": ["create", "read"], "photos": ["upload"]}'),
('viewer', 'Read-only access for stakeholders', '{"projects": ["read"], "tasks": ["read"], "reports": ["read"]}');

-- Create admin user (password: admin123)
INSERT INTO users (username, email, full_name, role_id, hashed_password) VALUES
('admin', 'admin@realestate.com', 'System Administrator', 1, '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uOeG');

-- Create sample project
INSERT INTO projects (name, description, property_type_id, location_address, city, state, budget, status, builder_id) VALUES
('Sample Residential Project', 'A 3-bedroom residential house with modern amenities', 1, '123 Main Street, Downtown', 'Mumbai', 'Maharashtra', 2500000.00, 'planning', 1);

-- Create sample tasks
INSERT INTO tasks (project_id, name, description, phase_id, component_id, duration_days, status) VALUES
(1, 'Site Survey and Planning', 'Initial site survey and project planning', 1, NULL, 3, 'completed'),
(1, 'Foundation Excavation', 'Excavation for foundation', 2, 1, 5, 'in_progress'),
(1, 'Foundation Concrete', 'RCC foundation work', 2, 2, 7, 'pending'),
(1, 'Column Construction', 'RCC column construction', 3, 3, 10, 'pending'),
(1, 'Beam Construction', 'RCC beam construction', 3, 4, 8, 'pending'),
(1, 'Wall Construction', 'Brick masonry work', 4, 5, 15, 'pending'),
(1, 'Roof Construction', 'RCC roof slab', 5, 6, 12, 'pending'),
(1, 'Electrical Work', 'Electrical wiring and installations', 6, 7, 20, 'pending'),
(1, 'Plumbing Work', 'Plumbing pipes and fixtures', 7, 8, 18, 'pending'),
(1, 'Flooring', 'Floor tile installation', 8, 9, 10, 'pending'),
(1, 'Painting', 'Interior and exterior painting', 8, 10, 12, 'pending');

-- Create sample team
INSERT INTO teams (name, project_id, lead_user_id) VALUES
('Construction Team A', 1, 1);

-- Create sample cost estimates
INSERT INTO cost_estimates (task_id, material_id, quantity, unit_cost, total_cost, estimate_type, created_by) VALUES
(2, 1, 50.00, 350.00, 17500.00, 'planned', 1),
(2, 4, 20.00, 2800.00, 56000.00, 'planned', 1),
(2, 5, 15.00, 1800.00, 27000.00, 'planned', 1),
(3, 2, 25.00, 4500.00, 112500.00, 'planned', 1),
(6, 6, 1000.00, 12.00, 12000.00, 'planned', 1),
(6, 7, 1000.00, 10.50, 10500.00, 'planned', 1);

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA realestate TO realestate_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA realestate TO realestate_user;
GRANT USAGE ON SCHEMA realestate TO realestate_user;
