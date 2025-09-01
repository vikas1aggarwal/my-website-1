import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { User, Project, Material, MaterialCategory, Task, CostEstimate, AuthResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Health check
  async getHealth(): Promise<any> {
    const response: AxiosResponse = await this.api.get('/health');
    return response.data;
  }

  // Authentication
  async login(email: string, password: string): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  }

  async register(userData: {
    username: string;
    email: string;
    full_name: string;
    password: string;
    role_id: number;
  }): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/register', userData);
    return response.data;
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    const response: AxiosResponse<Project[]> = await this.api.get('/projects');
    return response.data;
  }

  async getProject(id: number): Promise<Project> {
    const response: AxiosResponse<Project> = await this.api.get(`/projects/${id}`);
    return response.data;
  }

  async createProject(projectData: Partial<Project>): Promise<Project> {
    const response: AxiosResponse<Project> = await this.api.post('/projects', projectData);
    return response.data;
  }

  async updateProject(id: number, projectData: Partial<Project>): Promise<Project> {
    const response: AxiosResponse<Project> = await this.api.put(`/projects/${id}`, projectData);
    return response.data;
  }

  async deleteProject(id: number): Promise<void> {
    await this.api.delete(`/projects/${id}`);
  }

  // Materials
  async getMaterial(id: number): Promise<Material> {
    const response: AxiosResponse<Material> = await this.api.get(`/materials/${id}`);
    return response.data;
  }

  async createMaterial(materialData: Partial<Material>): Promise<Material> {
    const response: AxiosResponse<Material> = await this.api.post('/materials', materialData);
    return response.data;
  }

  async updateMaterial(id: number, materialData: Partial<Material>): Promise<Material> {
    const response: AxiosResponse<Material> = await this.api.put(`/materials/${id}`, materialData);
    return response.data;
  }

  async deleteMaterial(id: number): Promise<void> {
    await this.api.delete(`/materials/${id}`);
  }

  // Materials
  async getMaterials(categoryId?: number): Promise<Material[]> {
    const params = categoryId ? { category_id: categoryId } : {};
    const response: AxiosResponse<Material[]> = await this.api.get('/materials', { params });
    return response.data;
  }

  async getMaterialCategories(): Promise<MaterialCategory[]> {
    const response: AxiosResponse<MaterialCategory[]> = await this.api.get('/materials/categories');
    return response.data;
  }

  // Tasks
  async getTasks(projectId?: number): Promise<Task[]> {
    const params = projectId ? { project_id: projectId } : {};
    const response: AxiosResponse<Task[]> = await this.api.get('/tasks', { params });
    return response.data;
  }

  async createTask(taskData: Partial<Task>): Promise<Task> {
    const response: AxiosResponse<Task> = await this.api.post('/tasks', taskData);
    return response.data;
  }

  async updateTask(id: number, taskData: Partial<Task>): Promise<Task> {
    const response: AxiosResponse<Task> = await this.api.put(`/tasks/${id}`, taskData);
    return response.data;
  }

  async deleteTask(id: number): Promise<void> {
    await this.api.delete(`/tasks/${id}`);
  }

  // Project Planning
  async getProjectPlanning(projectId: number): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get(`/projects/${projectId}/planning`);
    return response.data;
  }

  // Cost Estimates
  async getCostEstimates(taskId?: number): Promise<CostEstimate[]> {
    const params = taskId ? { task_id: taskId } : {};
    const response: AxiosResponse<CostEstimate[]> = await this.api.get('/cost-estimates', { params });
    return response.data;
  }

  async createCostEstimate(estimateData: Partial<CostEstimate>): Promise<CostEstimate> {
    const response: AxiosResponse<CostEstimate> = await this.api.post('/cost-estimates', estimateData);
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;
