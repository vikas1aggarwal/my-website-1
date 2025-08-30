# Real Estate Project Management System - Architecture Blueprint

## System Overview
A comprehensive real estate project management system designed to help builders and architects manage projects from planning to completion, with AI-powered cost estimation and material recommendations.

## Technology Stack (All Open Source)

### Frontend
- **React.js 18** + TypeScript + Material-UI
- **React Query** for server state management
- **React Router** for navigation
- **WebSocket** for real-time updates

### Backend
- **FastAPI** (Python) + SQLAlchemy ORM
- **PostgreSQL** database
- **JWT + OAuth2** authentication
- **Celery** for background tasks
- **Redis** for caching and sessions

### Infrastructure
- **MinIO** (S3-compatible) for file storage
- **Docker + Docker Compose** for deployment
- **GitHub Actions** for CI/CD
- **Nginx** as reverse proxy

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│    │   FastAPI       │    │   PostgreSQL    │
│   (Material-UI) │◄──►│   Backend       │◄──►│   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   WebSocket     │    │   ML Services   │    │   MinIO Storage │
│   (Real-time)   │    │   (Cost AI)     │    │   (Images/Docs) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Data Model

### Master Data Schema

#### 1. Material Intelligence System
```sql
-- Material categories and alternatives
material_categories (id, name, description, parent_id)
materials (id, name, category_id, unit, base_cost_per_unit, 
          properties_json, alternatives_json, supplier_id)

-- Material properties for AI recommendations
material_properties (id, material_id, property_name, property_value, 
                    unit, importance_weight)

-- Material alternatives and comparisons
material_alternatives (id, primary_material_id, alternative_material_id, 
                      comparison_score, cost_difference, pros_cons_json)

-- Task-material relationships
task_material_options (id, task_type_id, material_id, 
                      suitability_score, typical_quantity, 
                      installation_notes, cost_implications)
```

#### 2. Role-Based Access Control
```sql
-- User management
users (id, username, email, full_name, role_id, is_active, 
       created_at, last_login)

-- Roles and permissions
roles (id, name, description, permissions_json)
permissions (id, name, description, resource, action)

-- Team structure
teams (id, name, project_id, lead_user_id, created_at)
team_members (id, team_id, user_id, role_in_team, join_date)
```

#### 3. Progress Tracking System
```sql
-- Progress updates with media
progress_updates (id, task_id, user_id, progress_percentage, 
                 description, update_date, status, 
                 admin_approval_status, admin_notes)

-- Media attachments
progress_media (id, progress_update_id, file_path, file_type, 
               upload_date, file_size, thumbnail_path)

-- Approval workflow
progress_approvals (id, progress_update_id, admin_user_id, 
                   approval_status, approval_date, comments)
```

### Transaction Data Schema

#### 1. Enhanced Project Management
```sql
-- Projects with builder/admin assignment
projects (id, name, description, builder_id, location_id, 
          start_date, target_completion, budget, status, 
          created_at, updated_at)

-- Tasks with material options
tasks (id, project_id, parent_task_id, name, description, 
       task_type_id, duration_days, planned_start, planned_finish,
       actual_start, actual_finish, percent_complete, status, 
       assigned_team_id, material_selection_id)

-- Material selections for tasks
task_material_selections (id, task_id, material_id, quantity, 
                         unit_cost, total_cost, selection_reason, 
                         ai_recommendation_score, approved_by)
```

#### 2. Cost Intelligence
```sql
-- AI-powered cost estimates
ai_cost_estimates (id, task_id, material_id, estimated_quantity, 
                  estimated_cost, confidence_score, 
                  recommendation_reason, created_at)

-- Cost comparisons
cost_comparisons (id, task_id, material_option_1, material_option_2, 
                 cost_difference, pros_cons_analysis, 
                 recommendation, created_at)
```

## UI/UX Design

### React Component Structure
```
src/
├── components/
│   ├── common/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Navigation.tsx
│   ├── projects/
│   │   ├── ProjectList.tsx
│   │   ├── ProjectDetail.tsx
│   │   └── TaskManager.tsx
│   ├── materials/
│   │   ├── MaterialSelector.tsx
│   │   ├── CostComparison.tsx
│   │   └── AIRecommendations.tsx
│   ├── progress/
│   │   ├── ProgressTracker.tsx
│   │   ├── PhotoUpload.tsx
│   │   └── ApprovalWorkflow.tsx
│   └── admin/
│       ├── UserManagement.tsx
│       ├── TeamManagement.tsx
│       └── Dashboard.tsx
├── pages/
├── services/
├── hooks/
└── utils/
```

### Key UI Features
- **Material Intelligence Dashboard**: Side-by-side material comparisons
- **Progress Photo Gallery**: Grid view with approval status
- **Real-time Collaboration**: Live updates for team members
- **Mobile-Responsive**: Works on tablets/phones for site updates
- **Drag-and-Drop**: Task management and photo uploads

## Security & Performance

### Authentication & Authorization
- JWT token-based authentication
- Role-based access control (RBAC)
- Session management with Redis
- API rate limiting

### Data Security
- Encrypted data transmission (HTTPS)
- SQL injection prevention
- XSS protection
- File upload validation

### Performance Optimization
- Database query optimization
- Redis caching layer
- CDN for static assets
- Lazy loading of components
