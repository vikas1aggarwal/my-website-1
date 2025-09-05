import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  Assignment as TaskIcon,
  Timeline as TimelineIcon,
  ViewTimeline as ViewTimelineIcon,
} from '@mui/icons-material';
import apiService from '../services/api';
import { Project, Task, Material, MaterialCategory } from '../types';

interface ConstructionPhase {
  id: number;
  name: string;
  sequence: number;
  description: string;
  typical_duration_days: number;
}

interface BuildingComponent {
  id: number;
  name: string;
  category: string;
  unit: string;
  typical_cost_per_unit: number;
  phase_id: number;
}

const ProjectPlanning: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [phases, setPhases] = useState<ConstructionPhase[]>([]);
  const [components, setBuildingComponents] = useState<BuildingComponent[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Dialog states
  const [openProjectDialog, setOpenProjectDialog] = useState(false);
  const [openTaskDialog, setOpenTaskDialog] = useState(false);
  const [openPlanningDialog, setOpenPlanningDialog] = useState(false);
  const [openEditTaskDialog, setOpenEditTaskDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // Form states
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    property_type_id: '',
    location_address: '',
    city: '',
    state: '',
    country: 'India',
    budget: '',
    start_date: '',
    target_completion: '',
  });
  
  const [taskForm, setTaskForm] = useState({
    name: '',
    description: '',
    phase_id: '',
    component_id: '',
    duration_days: '',
    planned_start_date: '',
    planned_finish_date: '',
    priority: 'medium',
    parent_task_id: '',
    dependency_type: 'finish-to-start',
    // New fields for cost calculation
    materials: [],
    labor: [],
    material_cost: 0,
    labor_cost: 0,
    total_cost: 0,
  });

  const [editTaskForm, setEditTaskForm] = useState({
    name: '',
    description: '',
    phase_id: '',
    component_id: '',
    duration_days: '',
    planned_start_date: '',
    planned_finish_date: '',
    actual_start_date: '',
    actual_finish_date: '',
    percent_complete: '',
    status: '',
    priority: '',
    assigned_team_id: '',
  });

  const [planningForm, setPlanningForm] = useState({
    property_type_id: '',
    auto_generate: true,
  });

  // New state for material and labor management
  const [selectedMaterials, setSelectedMaterials] = useState<any[]>([]);
  const [selectedLabor, setSelectedLabor] = useState<any[]>([]);
  const [materialOptions, setMaterialOptions] = useState<any[]>([]);
  
  // Gantt chart state
  const [showGanttChart, setShowGanttChart] = useState(false);
  const [timelineData, setTimelineData] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectsData, tasksData, materialsData] = await Promise.all([
        apiService.getProjects(),
        apiService.getTasks(),
        apiService.getMaterials()
      ]);
      setProjects(projectsData);
      setTasks(tasksData);
      setMaterials(materialsData);
      
      // Fetch materials from Material Intelligence system
      try {
        const response = await fetch('http://localhost:5001/api/materials');
        if (response.ok) {
          const materialIntelligenceData = await response.json();
          setMaterialOptions(materialIntelligenceData.data || []);
        }
      } catch (error) {
        console.log('Material Intelligence API not available, using Phase 1 materials');
        setMaterialOptions(materialsData);
      }
      
      // Fetch phases and components (these would be added to the API)
      // For now, using mock data based on the database schema
      setPhases([
        { id: 1, name: 'Site Preparation', sequence: 1, description: 'Clearing, leveling, and site setup', typical_duration_days: 7 },
        { id: 2, name: 'Foundation', sequence: 2, description: 'Excavation, footing, and foundation work', typical_duration_days: 21 },
        { id: 3, name: 'Structure', sequence: 3, description: 'Columns, beams, and structural elements', typical_duration_days: 45 },
        { id: 4, name: 'Masonry', sequence: 4, description: 'Brickwork, blockwork, and wall construction', typical_duration_days: 30 },
        { id: 5, name: 'Roofing', sequence: 5, description: 'Roof structure and covering', typical_duration_days: 15 },
        { id: 6, name: 'Electrical', sequence: 6, description: 'Electrical wiring and installations', typical_duration_days: 20 },
        { id: 7, name: 'Plumbing', sequence: 7, description: 'Plumbing pipes and fixtures', typical_duration_days: 18 },
        { id: 8, name: 'Finishing', sequence: 8, description: 'Flooring, painting, and final touches', typical_duration_days: 25 },
        { id: 9, name: 'Testing & Commissioning', sequence: 9, description: 'Final testing and handover', typical_duration_days: 7 }
      ]);
      
      setBuildingComponents([
        { id: 1, name: 'Excavation', category: 'Earthwork', unit: 'Cubic Meter', typical_cost_per_unit: 450.00, phase_id: 2 },
        { id: 2, name: 'RCC Foundation', category: 'Concrete', unit: 'Cubic Meter', typical_cost_per_unit: 8500.00, phase_id: 2 },
        { id: 3, name: 'RCC Columns', category: 'Concrete', unit: 'Cubic Meter', typical_cost_per_unit: 9500.00, phase_id: 3 },
        { id: 4, name: 'RCC Beams', category: 'Concrete', unit: 'Cubic Meter', typical_cost_per_unit: 9200.00, phase_id: 3 },
        { id: 5, name: 'Brick Masonry', category: 'Masonry', unit: 'Cubic Meter', typical_cost_per_unit: 4500.00, phase_id: 4 },
        { id: 6, name: 'Roof Slab', category: 'Concrete', unit: 'Cubic Meter', typical_cost_per_unit: 9800.00, phase_id: 5 },
        { id: 7, name: 'Electrical Wiring', category: 'Electrical', unit: 'Square Meter', typical_cost_per_unit: 180.00, phase_id: 6 },
        { id: 8, name: 'Plumbing Pipes', category: 'Plumbing', unit: 'Meter', typical_cost_per_unit: 120.00, phase_id: 7 },
        { id: 9, name: 'Floor Tiles', category: 'Finishing', unit: 'Square Meter', typical_cost_per_unit: 1800.00, phase_id: 8 },
        { id: 10, name: 'Wall Paint', category: 'Finishing', unit: 'Square Meter', typical_cost_per_unit: 45.00, phase_id: 8 }
      ]);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    try {
      const projectData = {
        ...projectForm,
        budget: projectForm.budget ? parseFloat(projectForm.budget) : undefined,
        property_type_id: projectForm.property_type_id ? parseInt(projectForm.property_type_id) : undefined,
      };
      
      const newProject = await apiService.createProject(projectData);
      setProjects([...projects, newProject]);
      setSelectedProject(newProject);
      setOpenProjectDialog(false);
      
      // Auto-generate tasks if enabled
      if (planningForm.auto_generate) {
        await generateProjectPlan(newProject.id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
    }
  };

  const generateProjectPlan = async (projectId: number) => {
    try {
      // Generate tasks for each phase
      const generatedTasks = [];
      for (const phase of phases) {
        const phaseComponents = components.filter(c => c.phase_id === phase.id);
        
        for (const component of phaseComponents) {
          const task = {
            project_id: projectId,
            name: `${phase.name} - ${component.name}`,
            description: `${phase.description}: ${component.name} work`,
            phase_id: phase.id,
            component_id: component.id,
            duration_days: phase.typical_duration_days,
            priority: phase.sequence <= 3 ? 'high' : 'medium',
            status: 'pending',
          };
          
          // Create task via API
          const newTask = await apiService.createTask(task);
          generatedTasks.push(newTask);
        }
      }
      
      setTasks([...tasks, ...generatedTasks]);
      setError('');
    } catch (err: any) {
      setError('Failed to generate project plan: ' + err.message);
    }
  };

  const handleCreateTask = async () => {
    try {
      const taskData = {
        ...taskForm,
        project_id: selectedProject?.id,
        phase_id: taskForm.phase_id ? parseInt(taskForm.phase_id) : undefined,
        component_id: taskForm.component_id ? parseInt(taskForm.component_id) : undefined,
        duration_days: taskForm.duration_days ? parseInt(taskForm.duration_days) : undefined,
        parent_task_id: taskForm.parent_task_id ? parseInt(taskForm.parent_task_id) : undefined,
        // Include cost data
        materials_json: JSON.stringify(taskForm.materials),
        labor_json: JSON.stringify(taskForm.labor),
        material_cost: taskForm.material_cost,
        labor_cost: taskForm.labor_cost,
        total_cost: taskForm.total_cost,
      };
      
      const newTask = await apiService.createTask(taskData);
      setTasks([...tasks, newTask]);
      setOpenTaskDialog(false);
      
      // Reset form and selections
      setTaskForm({
        name: '',
        description: '',
        phase_id: '',
        component_id: '',
        duration_days: '',
        planned_start_date: '',
        planned_finish_date: '',
        priority: 'medium',
        parent_task_id: '',
        materials: [],
        labor: [],
        material_cost: 0,
        labor_cost: 0,
        total_cost: 0,
      });
      setSelectedMaterials([]);
      setSelectedLabor([]);
    } catch (err: any) {
      setError(err.message || 'Failed to create task');
    }
  };

  const updateTaskStatus = async (taskId: number, status: string) => {
    try {
      const updatedTask = await apiService.updateTask(taskId, { status });
      setTasks(tasks.map(t => t.id === taskId ? updatedTask : t));
    } catch (err: any) {
      setError(err.message || 'Failed to update task');
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setEditTaskForm({
      name: task.name,
      description: task.description || '',
      phase_id: task.phase_id?.toString() || '',
      component_id: task.component_id?.toString() || '',
      duration_days: task.duration_days?.toString() || '',
      planned_start_date: task.planned_start_date || '',
      planned_finish_date: task.planned_finish_date || '',
      actual_start_date: task.actual_start_date || '',
      actual_finish_date: task.actual_finish_date || '',
      percent_complete: task.percent_complete?.toString() || '',
      status: task.status || '',
      priority: task.priority || '',
      assigned_team_id: task.assigned_team_id?.toString() || '',
    });
    setOpenEditTaskDialog(true);
  };

  const handleUpdateTask = async () => {
    if (!editingTask) return;
    
    try {
      const taskData = {
        name: editTaskForm.name,
        description: editTaskForm.description,
        phase_id: editTaskForm.phase_id ? parseInt(editTaskForm.phase_id) : undefined,
        component_id: editTaskForm.component_id ? parseInt(editTaskForm.component_id) : undefined,
        duration_days: editTaskForm.duration_days ? parseInt(editTaskForm.duration_days) : undefined,
        planned_start_date: editTaskForm.planned_start_date || undefined,
        planned_finish_date: editTaskForm.planned_finish_date || undefined,
        actual_start_date: editTaskForm.actual_start_date || undefined,
        actual_finish_date: editTaskForm.actual_finish_date || undefined,
        percent_complete: editTaskForm.percent_complete ? parseFloat(editTaskForm.percent_complete) : undefined,
        status: editTaskForm.status,
        priority: editTaskForm.priority,
        assigned_team_id: editTaskForm.assigned_team_id ? parseInt(editTaskForm.assigned_team_id) : undefined,
      };
      
      const updatedTask = await apiService.updateTask(editingTask.id, taskData);
      setTasks(tasks.map(t => t.id === editingTask.id ? updatedTask : t));
      setOpenEditTaskDialog(false);
      setEditingTask(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await apiService.deleteTask(taskId);
        setTasks(tasks.filter(t => t.id !== taskId));
      } catch (err: any) {
        setError(err.message || 'Failed to delete task');
      }
    }
  };

  const getProjectTasks = (projectId: number) => {
    return tasks.filter(t => t.project_id === projectId);
  };

  const getPhaseTasks = (projectId: number, phaseId: number) => {
    return tasks.filter(t => t.project_id === projectId && t.phase_id === phaseId);
  };

  const getTaskProgress = (projectId: number) => {
    const projectTasks = getProjectTasks(projectId);
    if (projectTasks.length === 0) return 0;
    
    const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
    return Math.round((completedTasks / projectTasks.length) * 100);
  };

  const getPhaseTotalDuration = (projectId: number, phaseId: number) => {
    const phaseTasks = getPhaseTasks(projectId, phaseId);
    return phaseTasks.reduce((total, task) => total + (task.duration_days || 0), 0);
  };

  // Cost calculation helper functions
  const calculateMaterialCost = (materials: any[]) => {
    return materials.reduce((total: number, material: any) => {
      return total + (material.quantity * material.unit_cost);
    }, 0);
  };

  const calculateLaborCost = (labor: any[]) => {
    return labor.reduce((total: number, laborItem: any) => {
      if (laborItem.type === 'daily') {
        return total + (laborItem.workers * laborItem.days * laborItem.rate);
      } else if (laborItem.type === 'hourly') {
        return total + (laborItem.workers * laborItem.hours * laborItem.rate);
      } else if (laborItem.type === 'skill-based') {
        return total + (laborItem.workers * laborItem.hours * laborItem.skill_rate);
      }
      return total;
    }, 0);
  };

  const calculateTotalCost = (materials: any[], labor: any[]) => {
    const materialCost = calculateMaterialCost(materials);
    const laborCost = calculateLaborCost(labor);
    return materialCost + laborCost;
  };

  // Gantt chart helper functions
  const generateTimelineData = (projectId: number) => {
    const projectTasks = getProjectTasks(projectId);
    const timeline = projectTasks.map((task, index) => {
      const startDate = task.planned_start_date ? new Date(task.planned_start_date) : new Date();
      const endDate = task.planned_finish_date ? new Date(task.planned_finish_date) : new Date(startDate.getTime() + (task.duration_days || 1) * 24 * 60 * 60 * 1000);
      
      // Find dependencies
      const dependencies = projectTasks
        .filter(t => t.parent_task_id === task.id)
        .map(t => ({
          id: t.id,
          name: t.name,
          type: 'finish-to-start' // Default dependency type
        }));
      
      return {
        id: task.id,
        name: task.name,
        start: startDate,
        end: endDate,
        duration: task.duration_days || 1,
        phase: phases.find(p => p.id === task.phase_id)?.name || 'Unknown',
        status: task.status,
        priority: task.priority,
        cost: task.total_cost || 0,
        color: getTaskColor(task.status, task.priority),
        dependencies: dependencies,
        parent_task_id: task.parent_task_id,
        dependency_type: task.dependency_type || 'finish-to-start',
      };
    });
    
    setTimelineData(timeline);
    return timeline;
  };

  const getTaskColor = (status: string, priority: string) => {
    if (status === 'completed') return '#4caf50';
    if (status === 'in_progress') return '#ff9800';
    if (priority === 'high') return '#f44336';
    if (priority === 'medium') return '#2196f3';
    return '#9e9e9e';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Project Planning
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<TaskIcon />}
            onClick={() => setOpenPlanningDialog(true)}
            sx={{ mr: 2 }}
          >
            Plan Project
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenProjectDialog(true)}
          >
            New Project
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Project Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Select Project
          </Typography>
          <Grid container spacing={2}>
            {projects.map((project) => (
              <Grid item xs={12} sm={6} md={4} key={project.id}>
                <Card 
                  variant={selectedProject?.id === project.id ? "elevation" : "outlined"}
                  sx={{ 
                    cursor: 'pointer',
                    border: selectedProject?.id === project.id ? '2px solid #2563EB' : '1px solid #e0e0e0'
                  }}
                  onClick={() => setSelectedProject(project)}
                >
                  <CardContent>
                    <Typography variant="h6" noWrap>
                      {project.name}
                    </Typography>
                    <Typography color="textSecondary" variant="body2" noWrap>
                      {project.description}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Chip 
                        label={project.status} 
                        color={project.status === 'active' ? 'success' : 'warning'} 
                        size="small" 
                      />
                    </Box>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Progress: {getTaskProgress(project.id)}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Project Planning View */}
      {selectedProject && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5">
                {selectedProject.name} - Project Plan
              </Typography>
              <Box>
                <Button
                  variant={showGanttChart ? "contained" : "outlined"}
                  startIcon={<ViewTimelineIcon />}
                  onClick={() => {
                    setShowGanttChart(!showGanttChart);
                    if (!showGanttChart) {
                      generateTimelineData(selectedProject.id);
                    }
                  }}
                  sx={{ mr: 1 }}
                >
                  {showGanttChart ? 'Hide Timeline' : 'Show Timeline'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenTaskDialog(true)}
                  sx={{ mr: 1 }}
                >
                  Add Custom Task
                </Button>
                <Button
                  variant="text"
                  startIcon={<TaskIcon />}
                  onClick={() => setOpenPlanningDialog(true)}
                >
                  Planning Help
                </Button>
              </Box>
            </Box>

            {/* Project Progress */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Overall Progress: {getTaskProgress(selectedProject.id)}%
              </Typography>
              <Stepper activeStep={Math.floor(getTaskProgress(selectedProject.id) / 10)} alternativeLabel>
                {phases.map((phase) => (
                  <Step key={phase.id}>
                    <StepLabel>{phase.name}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>

            {/* Gantt Chart Timeline */}
            {showGanttChart && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Project Timeline (Gantt Chart)
                </Typography>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ overflowX: 'auto' }}>
                      <Box sx={{ minWidth: 800, height: 300, position: 'relative' }}>
                        {/* Timeline Header */}
                        <Box sx={{ display: 'flex', borderBottom: '2px solid #e0e0e0', mb: 1 }}>
                          <Box sx={{ width: 200, p: 1, fontWeight: 'bold', borderRight: '1px solid #e0e0e0' }}>
                            Task Name
                          </Box>
                          <Box sx={{ flexGrow: 1, p: 1, fontWeight: 'bold', textAlign: 'center' }}>
                            Timeline (Days)
                          </Box>
                        </Box>
                        
                        {/* Timeline Rows */}
                        {timelineData.map((task, index) => (
                          <Box key={task.id} sx={{ display: 'flex', alignItems: 'center', mb: 1, minHeight: 40, position: 'relative' }}>
                            {/* Task Name */}
                            <Box sx={{ 
                              width: 200, 
                              p: 1, 
                              borderRight: '1px solid #e0e0e0',
                              display: 'flex',
                              alignItems: 'center',
                              fontSize: '0.875rem'
                            }}>
                              <Box sx={{ 
                                width: 12, 
                                height: 12, 
                                backgroundColor: task.color, 
                                borderRadius: '50%', 
                                mr: 1 
                              }} />
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                  {task.name}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {task.phase}
                                </Typography>
                              </Box>
                            </Box>
                            
                            {/* Timeline Bar */}
                            <Box sx={{ 
                              flexGrow: 1, 
                              height: 30, 
                              position: 'relative',
                              backgroundColor: '#f5f5f5',
                              border: '1px solid #e0e0e0',
                              borderRadius: 1
                            }}>
                              {/* Task Bar */}
                              <Box sx={{
                                position: 'absolute',
                                left: `${Math.max(0, (task.start.getDate() - 1) * 2)}%`,
                                width: `${Math.max(5, task.duration * 2)}%`,
                                height: '100%',
                                backgroundColor: task.color,
                                borderRadius: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                '&:hover': {
                                  opacity: 0.8,
                                  transform: 'scale(1.02)'
                                }
                              }}>
                                {task.duration}d
                              </Box>
                              
                              {/* Cost Label */}
                              {task.cost > 0 && (
                                <Box sx={{
                                  position: 'absolute',
                                  top: -20,
                                  left: `${Math.max(0, (task.start.getDate() - 1) * 2)}%`,
                                  fontSize: '0.7rem',
                                  color: '#666',
                                  whiteSpace: 'nowrap'
                                }}>
                                  ₹{task.cost.toLocaleString()}
                                </Box>
                              )}
                              
                              {/* Dependency Indicator */}
                              {task.parent_task_id && (
                                <Box sx={{
                                  position: 'absolute',
                                  left: -10,
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  width: 8,
                                  height: 8,
                                  backgroundColor: '#ff5722',
                                  borderRadius: '50%',
                                  border: '2px solid white',
                                  boxShadow: '0 0 0 1px #ff5722'
                                }} />
                              )}
                            </Box>
                          </Box>
                        ))}
                        
                        {/* Dependency Arrows */}
                        {timelineData.map((task, index) => {
                          if (!task.parent_task_id) return null;
                          
                          const parentTask = timelineData.find(t => t.id === task.parent_task_id);
                          if (!parentTask) return null;
                          
                          const parentIndex = timelineData.findIndex(t => t.id === task.parent_task_id);
                          const currentIndex = index;
                          
                          return (
                            <Box
                              key={`dep-${task.id}`}
                              sx={{
                                position: 'absolute',
                                left: 200,
                                top: parentIndex * 40 + 15,
                                width: 'calc(100% - 200px)',
                                height: 2,
                                backgroundColor: '#ff5722',
                                opacity: 0.6,
                                '&::after': {
                                  content: '""',
                                  position: 'absolute',
                                  right: 0,
                                  top: -3,
                                  width: 0,
                                  height: 0,
                                  borderLeft: '6px solid #ff5722',
                                  borderTop: '4px solid transparent',
                                  borderBottom: '4px solid transparent'
                                }
                              }}
                            />
                          );
                        })}
                        
                        {/* Timeline Legend */}
                        <Box sx={{ mt: 2, p: 2, backgroundColor: '#f9f9f9', borderRadius: 1 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Legend:
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Box sx={{ width: 12, height: 12, backgroundColor: '#4caf50', borderRadius: '50%', mr: 1 }} />
                              <Typography variant="body2">Completed</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Box sx={{ width: 12, height: 12, backgroundColor: '#ff9800', borderRadius: '50%', mr: 1 }} />
                              <Typography variant="body2">In Progress</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Box sx={{ width: 12, height: 12, backgroundColor: '#f44336', borderRadius: '50%', mr: 1 }} />
                              <Typography variant="body2">High Priority</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Box sx={{ width: 12, height: 12, backgroundColor: '#2196f3', borderRadius: '50%', mr: 1 }} />
                              <Typography variant="body2">Medium Priority</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Box sx={{ width: 12, height: 12, backgroundColor: '#9e9e9e', borderRadius: '50%', mr: 1 }} />
                              <Typography variant="body2">Pending</Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Box sx={{ width: 8, height: 8, backgroundColor: '#ff5722', borderRadius: '50%', mr: 1 }} />
                              <Typography variant="body2">Has Dependencies</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Box sx={{ width: 20, height: 2, backgroundColor: '#ff5722', mr: 1 }} />
                              <Typography variant="body2">Dependency Arrow</Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            )}

            {/* Auto-Generated Plan Info */}
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Auto-Generated Building Plan:</strong> This is a starting template based on industry best practices. 
                You can fully customize every aspect:
              </Typography>
              <Grid container spacing={1} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" component="div">
                    <strong>Task Attributes:</strong>
                    <br />• Name, description, duration
                    <br />• Phase assignment, priority, status
                    <br />• Planned vs actual dates
                    <br />• Progress percentage, team assignment
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" component="div">
                    <strong>Plan Customization:</strong>
                    <br />• Edit any auto-generated task
                    <br />• Add completely new custom tasks
                    <br />• Delete unnecessary tasks
                    <br />• Reorganize phases and sequences
                  </Typography>
                </Grid>
              </Grid>
            </Alert>

            {/* Phase-wise Tasks */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Project Tasks (Click Edit to customize auto-generated plan)
              </Typography>
              <Typography variant="body2" color="textSecondary">
                The system auto-generated these tasks based on standard construction phases. 
                You can edit any task attribute, add new tasks, or delete unnecessary ones.
              </Typography>
            </Box>
            {phases.map((phase) => {
              const phaseTasks = getPhaseTasks(selectedProject.id, phase.id);
              if (phaseTasks.length === 0) return null;

              const totalDuration = getPhaseTotalDuration(selectedProject.id, phase.id);

              return (
                <Accordion key={phase.id} defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box display="flex" alignItems="center" sx={{ width: '100%' }}>
                      <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        {phase.name} ({phaseTasks.length} tasks)
                      </Typography>
                      <Chip 
                        label={`${totalDuration} days total`} 
                        color="info" 
                        size="small" 
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List>
                      {phaseTasks.map((task) => (
                        <ListItem key={task.id} divider>
                          <ListItemText
                            primary={task.name}
                            secondary={
                              <Box>
                                <Typography variant="body2" color="textSecondary">
                                  {task.description}
                                </Typography>
                                <Box sx={{ mt: 1 }}>
                                  <Chip 
                                    label={task.status} 
                                    color={
                                      task.status === 'completed' ? 'success' : 
                                      task.status === 'in_progress' ? 'warning' : 'default'
                                    } 
                                    size="small" 
                                    sx={{ mr: 1 }}
                                  />
                                  <Chip 
                                    label={`${task.duration_days} days`} 
                                    color="info" 
                                    size="small" 
                                    sx={{ mr: 1 }}
                                  />
                                  <Chip 
                                    label={task.priority} 
                                    color={
                                      task.priority === 'high' ? 'error' : 
                                      task.priority === 'medium' ? 'warning' : 'info'
                                    } 
                                    size="small" 
                                  />
                                </Box>
                              </Box>
                            }
                          />
                                                     <ListItemSecondaryAction>
                             <Box>
                               {task.status === 'pending' && (
                                 <IconButton 
                                   onClick={() => updateTaskStatus(task.id, 'in_progress')}
                                   color="warning"
                                   title="Start Task"
                                 >
                                   <PlayIcon />
                                 </IconButton>
                               )}
                               {task.status === 'in_progress' && (
                                 <IconButton 
                                   onClick={() => updateTaskStatus(task.id, 'completed')}
                                   color="success"
                                   title="Complete Task"
                                 >
                                   <CheckIcon />
                                 </IconButton>
                               )}
                               <IconButton 
                                 onClick={() => handleEditTask(task)} 
                                 color="primary"
                                 title="Edit Task"
                               >
                                 <EditIcon />
                               </IconButton>
                               <IconButton 
                                 onClick={() => handleDeleteTask(task.id)} 
                                 color="error"
                                 title="Delete Task"
                               >
                                 <DeleteIcon />
                               </IconButton>
                             </Box>
                           </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Create Project Dialog */}
      <Dialog open={openProjectDialog} onClose={() => setOpenProjectDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Project</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Project Name"
                value={projectForm.name}
                onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Property Type"
                select
                value={projectForm.property_type_id}
                onChange={(e) => setProjectForm({ ...projectForm, property_type_id: e.target.value })}
              >
                <MenuItem value={1}>Residential House</MenuItem>
                <MenuItem value={2}>Apartment Unit</MenuItem>
                <MenuItem value={3}>Villa</MenuItem>
                <MenuItem value={4}>Commercial Office</MenuItem>
                <MenuItem value={5}>Retail Shop</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={projectForm.description}
                onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={projectForm.location_address}
                onChange={(e) => setProjectForm({ ...projectForm, location_address: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="City"
                value={projectForm.city}
                onChange={(e) => setProjectForm({ ...projectForm, city: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="State"
                value={projectForm.state}
                onChange={(e) => setProjectForm({ ...projectForm, state: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Country"
                value={projectForm.country}
                onChange={(e) => setProjectForm({ ...projectForm, country: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Budget (₹)"
                type="number"
                value={projectForm.budget}
                onChange={(e) => setProjectForm({ ...projectForm, budget: e.target.value })}
                InputProps={{ startAdornment: '₹' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={projectForm.start_date}
                onChange={(e) => setProjectForm({ ...projectForm, start_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenProjectDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateProject} variant="contained">
            Create Project
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Task Dialog */}
      <Dialog open={openTaskDialog} onClose={() => setOpenTaskDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Task</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Task Name"
                value={taskForm.name}
                onChange={(e) => setTaskForm({ ...taskForm, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Phase</InputLabel>
                <Select
                  value={taskForm.phase_id}
                  label="Phase"
                  onChange={(e) => setTaskForm({ ...taskForm, phase_id: e.target.value })}
                >
                  {phases.map((phase) => (
                    <MenuItem key={phase.id} value={phase.id}>
                      {phase.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Duration (days)"
                type="number"
                value={taskForm.duration_days}
                onChange={(e) => setTaskForm({ ...taskForm, duration_days: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Priority"
                select
                value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </TextField>
            </Grid>
            
            {/* Task Dependencies */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Depends On (Finish-to-Start)</InputLabel>
                <Select
                  value={taskForm.parent_task_id}
                  label="Depends On (Finish-to-Start)"
                  onChange={(e) => setTaskForm({ ...taskForm, parent_task_id: e.target.value })}
                >
                  <MenuItem value="">No Dependencies (Can Start Immediately)</MenuItem>
                  {selectedProject && getProjectTasks(selectedProject.id)
                    .filter(task => task.id !== parseInt(taskForm.parent_task_id || '0'))
                    .map((task) => (
                      <MenuItem key={task.id} value={task.id}>
                        {task.name} ({phases.find(p => p.id === task.phase_id)?.name || 'Unknown Phase'})
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Dependency Type</InputLabel>
                <Select
                  value={taskForm.dependency_type || 'finish-to-start'}
                  label="Dependency Type"
                  onChange={(e) => setTaskForm({ ...taskForm, dependency_type: e.target.value })}
                >
                  <MenuItem value="finish-to-start">Finish-to-Start (Default)</MenuItem>
                  <MenuItem value="start-to-start">Start-to-Start (Parallel)</MenuItem>
                  <MenuItem value="finish-to-finish">Finish-to-Finish</MenuItem>
                  <MenuItem value="start-to-finish">Start-to-Finish</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Material Selection Section */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                Materials & Cost Planning
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Select Material</InputLabel>
                <Select
                  value=""
                  label="Select Material"
                  onChange={(e) => {
                    const selectedMaterial = materialOptions.find(m => m.id === e.target.value);
                    if (selectedMaterial) {
                      const newMaterial = {
                        id: selectedMaterial.id,
                        name: selectedMaterial.name,
                        unit: selectedMaterial.unit,
                        unit_cost: selectedMaterial.unit_cost || 0,
                        quantity: 1
                      };
                      const updatedMaterials = [...selectedMaterials, newMaterial];
                      setSelectedMaterials(updatedMaterials);
                      
                      // Update task form with calculated costs
                      const materialCost = calculateMaterialCost(updatedMaterials);
                      const laborCost = calculateLaborCost(selectedLabor);
                      const totalCost = materialCost + laborCost;
                      
                      setTaskForm({
                        ...taskForm,
                        materials: updatedMaterials,
                        material_cost: materialCost,
                        total_cost: totalCost
                      });
                    }
                  }}
                >
                  {materialOptions.map((material) => (
                    <MenuItem key={material.id} value={material.id}>
                      {material.name} - ₹{material.unit_cost || 0}/{material.unit}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Labor Type"
                select
                value=""
                onChange={(e) => {
                  const newLabor = {
                    id: Date.now(),
                    type: e.target.value,
                    workers: 1,
                    rate: 0,
                    days: 0,
                    hours: 0,
                    skill_rate: 0
                  };
                  const updatedLabor = [...selectedLabor, newLabor];
                  setSelectedLabor(updatedLabor);
                  
                  // Update task form with calculated costs
                  const materialCost = calculateMaterialCost(selectedMaterials);
                  const laborCost = calculateLaborCost(updatedLabor);
                  const totalCost = materialCost + laborCost;
                  
                  setTaskForm({
                    ...taskForm,
                    labor: updatedLabor,
                    labor_cost: laborCost,
                    total_cost: totalCost
                  });
                }}
              >
                <MenuItem value="daily">Daily Rate</MenuItem>
                <MenuItem value="hourly">Hourly Rate</MenuItem>
                <MenuItem value="skill-based">Skill-Based Rate</MenuItem>
              </TextField>
            </Grid>
            
            {/* Selected Materials Display */}
            {selectedMaterials.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mt: 1, mb: 1 }}>
                  Selected Materials:
                </Typography>
                {selectedMaterials.map((material, index) => (
                  <Box key={material.id} sx={{ display: 'flex', alignItems: 'center', mb: 1, p: 1, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2">
                        {material.name} - ₹{material.unit_cost}/{material.unit}
                      </Typography>
                    </Box>
                    <TextField
                      size="small"
                      label="Quantity"
                      type="number"
                      value={material.quantity}
                      onChange={(e) => {
                        const updatedMaterials = [...selectedMaterials];
                        updatedMaterials[index].quantity = parseFloat(e.target.value) || 0;
                        setSelectedMaterials(updatedMaterials);
                        
                        // Recalculate costs
                        const materialCost = calculateMaterialCost(updatedMaterials);
                        const laborCost = calculateLaborCost(selectedLabor);
                        const totalCost = materialCost + laborCost;
                        
                        setTaskForm({
                          ...taskForm,
                          materials: updatedMaterials,
                          material_cost: materialCost,
                          total_cost: totalCost
                        });
                      }}
                      sx={{ width: 100, mr: 1 }}
                    />
                    <Typography variant="body2" sx={{ mr: 1 }}>
                      = ₹{(material.quantity * material.unit_cost).toLocaleString()}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => {
                        const updatedMaterials = selectedMaterials.filter((_, i) => i !== index);
                        setSelectedMaterials(updatedMaterials);
                        
                        // Recalculate costs
                        const materialCost = calculateMaterialCost(updatedMaterials);
                        const laborCost = calculateLaborCost(selectedLabor);
                        const totalCost = materialCost + laborCost;
                        
                        setTaskForm({
                          ...taskForm,
                          materials: updatedMaterials,
                          material_cost: materialCost,
                          total_cost: totalCost
                        });
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
              </Grid>
            )}
            
            {/* Cost Summary */}
            <Grid item xs={12}>
              <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1, mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Cost Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="textSecondary">
                      Material Cost:
                    </Typography>
                    <Typography variant="h6" color="primary">
                      ₹{taskForm.material_cost.toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="textSecondary">
                      Labor Cost:
                    </Typography>
                    <Typography variant="h6" color="primary">
                      ₹{taskForm.labor_cost.toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="textSecondary">
                      Total Cost:
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      ₹{taskForm.total_cost.toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTaskDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateTask} variant="contained">
            Add Task
          </Button>
        </DialogActions>
      </Dialog>

      {/* Project Planning Dialog */}
      <Dialog open={openPlanningDialog} onClose={() => setOpenPlanningDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Project Planning Assistant</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            This tool will help you create a comprehensive project plan with:
          </Typography>
          <List>
            <ListItem>
              <ListItemText 
                primary="• Construction phases and sequences"
                secondary="Based on industry best practices"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="• Task breakdown and dependencies"
                secondary="Automatic task generation and scheduling"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="• Material and cost estimates"
                secondary="Integrated with your material database"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="• Progress tracking framework"
                secondary="Real-time status updates and reporting"
              />
            </ListItem>
          </List>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
            Select a project and enable auto-generation to get started!
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Note:</strong> The auto-generated plan is a starting template. You can fully customize:
              <br />• Task names, descriptions, and durations
              <br />• Planned and actual dates
              <br />• Priorities, statuses, and assignments
              <br />• Add/remove tasks and phases as needed
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPlanningDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={openEditTaskDialog} onClose={() => setOpenEditTaskDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Task: {editingTask?.name}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Task Name"
                value={editTaskForm.name}
                onChange={(e) => setEditTaskForm({ ...editTaskForm, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Phase</InputLabel>
                <Select
                  value={editTaskForm.phase_id}
                  label="Phase"
                  onChange={(e) => setEditTaskForm({ ...editTaskForm, phase_id: e.target.value })}
                >
                  {phases.map((phase) => (
                    <MenuItem key={phase.id} value={phase.id}>
                      {phase.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={editTaskForm.description}
                onChange={(e) => setEditTaskForm({ ...editTaskForm, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Duration (days)"
                type="number"
                value={editTaskForm.duration_days}
                onChange={(e) => setEditTaskForm({ ...editTaskForm, duration_days: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Priority"
                select
                value={editTaskForm.priority}
                onChange={(e) => setEditTaskForm({ ...editTaskForm, priority: e.target.value })}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Status"
                select
                value={editTaskForm.status}
                onChange={(e) => setEditTaskForm({ ...editTaskForm, status: e.target.value })}
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="on_hold">On Hold</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Planned Start Date"
                type="date"
                value={editTaskForm.planned_start_date}
                onChange={(e) => setEditTaskForm({ ...editTaskForm, planned_start_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Planned Finish Date"
                type="date"
                value={editTaskForm.planned_finish_date}
                onChange={(e) => setEditTaskForm({ ...editTaskForm, planned_finish_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Actual Start Date"
                type="date"
                value={editTaskForm.actual_start_date}
                onChange={(e) => setEditTaskForm({ ...editTaskForm, actual_start_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Actual Finish Date"
                type="date"
                value={editTaskForm.actual_finish_date}
                onChange={(e) => setEditTaskForm({ ...editTaskForm, actual_finish_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Percent Complete"
                type="number"
                value={editTaskForm.percent_complete}
                onChange={(e) => setEditTaskForm({ ...editTaskForm, percent_complete: e.target.value })}
                InputProps={{
                  endAdornment: '%',
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Assigned Team ID"
                type="number"
                value={editTaskForm.assigned_team_id}
                onChange={(e) => setEditTaskForm({ ...editTaskForm, assigned_team_id: e.target.value })}
                placeholder="Team ID (optional)"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditTaskDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateTask} variant="contained">
            Update Task
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectPlanning;
