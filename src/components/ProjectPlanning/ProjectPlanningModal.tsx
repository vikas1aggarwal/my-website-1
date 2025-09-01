import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  Timeline as TimelineIcon,
  Assignment as TaskIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import apiService from '../../services/api';
import { Project, Task } from '../../types';

interface ProjectPlanningModalProps {
  open: boolean;
  onClose: () => void;
  project: Project | null;
}

interface PlanningData {
  project: Project;
  planning: {
    total_tasks: number;
    total_effort_days: number;
    sequential_effort_days: number;
    earliest_start: string | null;
    latest_finish: string | null;
    parallelism_factor: number;
  };
  tasks: Task[];
}

const ProjectPlanningModal: React.FC<ProjectPlanningModalProps> = ({
  open,
  onClose,
  project,
}) => {
  const [planningData, setPlanningData] = useState<PlanningData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Task creation dialog
  const [openTaskDialog, setOpenTaskDialog] = useState(false);
  const [openEditTaskDialog, setOpenEditTaskDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  const [taskForm, setTaskForm] = useState({
    name: '',
    description: '',
    duration_days: '',
    planned_start_date: '',
    planned_finish_date: '',
    priority: 'medium',
    status: 'pending',
  });

  const [editTaskForm, setEditTaskForm] = useState({
    name: '',
    description: '',
    duration_days: '',
    planned_start_date: '',
    planned_finish_date: '',
    priority: 'medium',
    status: 'pending',
  });

  useEffect(() => {
    if (open && project) {
      loadProjectPlanning();
    }
  }, [open, project]);

  const loadProjectPlanning = async () => {
    if (!project) return;
    
    setLoading(true);
    setError('');
    
    try {
      const data = await apiService.getProjectPlanning(project.id);
      setPlanningData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load project planning');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!project) return;
    
    try {
      const taskData = {
        ...taskForm,
        project_id: project.id,
        duration_days: taskForm.duration_days ? parseInt(taskForm.duration_days) : 1,
      };
      
      await apiService.createTask(taskData);
      await loadProjectPlanning(); // Reload to get updated data
      setOpenTaskDialog(false);
      setTaskForm({
        name: '',
        description: '',
        duration_days: '',
        planned_start_date: '',
        planned_finish_date: '',
        priority: 'medium',
        status: 'pending',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create task');
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setEditTaskForm({
      name: task.name,
      description: task.description || '',
      duration_days: task.duration_days?.toString() || '',
      planned_start_date: task.planned_start_date || '',
      planned_finish_date: task.planned_finish_date || '',
      priority: task.priority || 'medium',
      status: task.status || 'pending',
    });
    setOpenEditTaskDialog(true);
  };

  const handleUpdateTask = async () => {
    if (!editingTask) return;
    
    try {
      const taskData = {
        ...editTaskForm,
        duration_days: editTaskForm.duration_days ? parseInt(editTaskForm.duration_days) : 1,
      };
      
      await apiService.updateTask(editingTask.id, taskData);
      await loadProjectPlanning(); // Reload to get updated data
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
        await loadProjectPlanning(); // Reload to get updated data
      } catch (err: any) {
        setError(err.message || 'Failed to delete task');
      }
    }
  };

  const updateTaskStatus = async (taskId: number, status: string) => {
    try {
      await apiService.updateTask(taskId, { status });
      await loadProjectPlanning(); // Reload to get updated data
    } catch (err: any) {
      setError(err.message || 'Failed to update task status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'warning';
      case 'pending': return 'default';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  if (!project) return null;

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h5">
              Project Planning: {project.name}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenTaskDialog(true)}
            >
              Add Task
            </Button>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : planningData ? (
            <Box>
              {/* Project Planning Summary */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Planning Summary
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="primary">
                          {planningData.planning.total_tasks}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Total Tasks
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="secondary">
                          {planningData.planning.total_effort_days}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Total Effort (Days)
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="info.main">
                          {planningData.planning.sequential_effort_days}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Sequential Effort (Days)
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="success.main">
                          {planningData.planning.parallelism_factor.toFixed(1)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Parallelism Factor
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  
                  {planningData.planning.earliest_start && planningData.planning.latest_finish && (
                    <Box mt={2}>
                      <Typography variant="body2" color="textSecondary">
                        Timeline: {new Date(planningData.planning.earliest_start).toLocaleDateString()} - {new Date(planningData.planning.latest_finish).toLocaleDateString()}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Tasks List */}
              <Typography variant="h6" gutterBottom>
                Tasks ({planningData.tasks.length})
              </Typography>
              
              {planningData.tasks.length === 0 ? (
                <Alert severity="info">
                  No tasks found. Click "Add Task" to create the first task.
                </Alert>
              ) : (
                <List>
                  {planningData.tasks.map((task) => (
                    <ListItem
                      key={task.id}
                      sx={{
                        border: '1px solid #e0e0e0',
                        borderRadius: 1,
                        mb: 1,
                        backgroundColor: '#fafafa',
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {task.name}
                            </Typography>
                            <Chip
                              label={task.status}
                              size="small"
                              color={getStatusColor(task.status) as any}
                            />
                            <Chip
                              label={task.priority}
                              size="small"
                              color={getPriorityColor(task.priority) as any}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="textSecondary">
                              {task.description}
                            </Typography>
                            <Box display="flex" gap={2} mt={1}>
                              <Typography variant="body2">
                                Duration: {task.duration_days} days
                              </Typography>
                              {task.planned_start_date && (
                                <Typography variant="body2">
                                  Start: {new Date(task.planned_start_date).toLocaleDateString()}
                                </Typography>
                              )}
                              {task.planned_finish_date && (
                                <Typography variant="body2">
                                  Finish: {new Date(task.planned_finish_date).toLocaleDateString()}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Box display="flex" gap={1}>
                          <IconButton
                            size="small"
                            onClick={() => updateTaskStatus(task.id, 'in_progress')}
                            disabled={task.status === 'completed'}
                          >
                            <PlayIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => updateTaskStatus(task.id, 'completed')}
                            disabled={task.status === 'completed'}
                          >
                            <CheckIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleEditTask(task)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteTask(task.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          ) : (
            <Alert severity="warning">
              No planning data available for this project.
            </Alert>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Create Task Dialog */}
      <Dialog open={openTaskDialog} onClose={() => setOpenTaskDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Task</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Task Name"
              value={taskForm.name}
              onChange={(e) => setTaskForm({ ...taskForm, name: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              margin="normal"
              multiline
              rows={3}
            />
            <TextField
              fullWidth
              label="Duration (Days)"
              type="number"
              value={taskForm.duration_days}
              onChange={(e) => setTaskForm({ ...taskForm, duration_days: e.target.value })}
              margin="normal"
              required
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Priority</InputLabel>
              <Select
                value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                label="Priority"
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTaskDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateTask} variant="contained">Create Task</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={openEditTaskDialog} onClose={() => setOpenEditTaskDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Task</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Task Name"
              value={editTaskForm.name}
              onChange={(e) => setEditTaskForm({ ...editTaskForm, name: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={editTaskForm.description}
              onChange={(e) => setEditTaskForm({ ...editTaskForm, description: e.target.value })}
              margin="normal"
              multiline
              rows={3}
            />
            <TextField
              fullWidth
              label="Duration (Days)"
              type="number"
              value={editTaskForm.duration_days}
              onChange={(e) => setEditTaskForm({ ...editTaskForm, duration_days: e.target.value })}
              margin="normal"
              required
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Status</InputLabel>
              <Select
                value={editTaskForm.status}
                onChange={(e) => setEditTaskForm({ ...editTaskForm, status: e.target.value })}
                label="Status"
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Priority</InputLabel>
              <Select
                value={editTaskForm.priority}
                onChange={(e) => setEditTaskForm({ ...editTaskForm, priority: e.target.value })}
                label="Priority"
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditTaskDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateTask} variant="contained">Update Task</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProjectPlanningModal;
