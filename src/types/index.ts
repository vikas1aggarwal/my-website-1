export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role_id: number;
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  property_type_id?: number;
  location_address?: string;
  city?: string;
  state?: string;
  country: string;
  start_date?: string;
  target_completion?: string;
  budget?: number;
  status: string;
  builder_id?: number;
  created_at: string;
  updated_at: string;
}

export interface Material {
  id: number;
  name: string;
  category_id: number;
  unit: string;
  base_cost_per_unit: number;
  properties: Record<string, any>;
  alternatives?: Record<string, any>;
  supplier_id?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MaterialCategory {
  id: number;
  name: string;
  description?: string;
  parent_id?: number;
  level: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  project_id: number;
  parent_task_id?: number;
  name: string;
  description?: string;
  phase_id?: number;
  component_id?: number;
  duration_days: number;
  planned_start_date?: string;
  planned_finish_date?: string;
  actual_start_date?: string;
  actual_finish_date?: string;
  percent_complete: number;
  status: string;
  priority: string;
  assigned_team_id?: number;
  material_cost?: number;
  labor_cost?: number;
  total_cost?: number;
  materials_json?: string;
  labor_json?: string;
  dependency_type?: string;
  created_at: string;
  updated_at: string;
}

export interface CostEstimate {
  id: number;
  task_id: number;
  material_id: number;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  estimate_type: string;
  confidence_level: number;
  created_by: number;
  created_at: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  access_token?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}
