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
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Fab,
  Link,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Assignment as TaskIcon,
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import { Project } from '../types';
import ProjectPlanningModal from '../components/ProjectPlanning/ProjectPlanningModal';

const Projects: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [openPlanningModal, setOpenPlanningModal] = useState(false);
  const [selectedProjectForPlanning, setSelectedProjectForPlanning] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location_address: '',
    city: '',
    state: '',
    country: 'India',
    budget: '',
    status: 'planning',
  });

  const statusOptions = [
    { value: 'planning', label: 'Planning', color: 'warning' },
    { value: 'active', label: 'Active', color: 'success' },
    { value: 'on_hold', label: 'On Hold', color: 'info' },
    { value: 'completed', label: 'Completed', color: 'default' },
    { value: 'cancelled', label: 'Cancelled', color: 'error' },
  ];

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await apiService.getProjects();
      setProjects(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      setFormData({
        name: project.name,
        description: project.description || '',
        location_address: project.location_address || '',
        city: project.city || '',
        state: project.state || '',
        country: project.country,
        budget: project.budget?.toString() || '',
        status: project.status,
      });
    } else {
      setEditingProject(null);
      setFormData({
        name: '',
        description: '',
        location_address: '',
        city: '',
        state: '',
        country: 'India',
        budget: '',
        status: 'planning',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProject(null);
  };

  const handleOpenPlanning = (project: Project) => {
    setSelectedProjectForPlanning(project);
    setOpenPlanningModal(true);
  };

  const handleClosePlanning = () => {
    setOpenPlanningModal(false);
    setSelectedProjectForPlanning(null);
  };

  const handleProjectClick = (project: Project) => {
    // Navigate to planning page with the selected project
    navigate('/planning', { 
      state: { selectedProject: project } 
    });
  };

  const handleSubmit = async () => {
    try {
      const projectData = {
        ...formData,
        budget: formData.budget ? parseInt(formData.budget) : undefined,
      };

      if (editingProject) {
        await apiService.updateProject(editingProject.id, projectData);
      } else {
        await apiService.createProject(projectData);
      }

      handleCloseDialog();
      fetchProjects();
    } catch (err: any) {
      setError(err.message || 'Failed to save project');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await apiService.deleteProject(id);
        fetchProjects();
      } catch (err: any) {
        setError(err.message || 'Failed to delete project');
      }
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { 
      field: 'name', 
      headerName: 'Project Name', 
      width: 200,
      renderCell: (params) => (
        <Link
          component="button"
          variant="body2"
          onClick={() => handleProjectClick(params.row)}
          sx={{
            textDecoration: 'none',
            color: 'primary.main',
            fontWeight: 'medium',
            '&:hover': {
              textDecoration: 'underline',
              color: 'primary.dark',
            },
            cursor: 'pointer',
            textAlign: 'left',
            border: 'none',
            background: 'none',
            padding: 0,
          }}
        >
          {params.value}
        </Link>
      ),
    },
    { field: 'description', headerName: 'Description', width: 300 },
    { field: 'city', headerName: 'City', width: 120 },
    { field: 'state', headerName: 'State', width: 120 },
    { field: 'country', headerName: 'Country', width: 100 },
    {
      field: 'budget',
      headerName: 'Budget',
      width: 120,
      valueFormatter: (params) => 
        params.value ? `₹${params.value.toLocaleString()}` : 'N/A',
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => {
        const status = statusOptions.find(s => s.value === params.value);
        return status ? (
          <Chip 
            label={status.label} 
            color={status.color as any} 
            size="small" 
          />
        ) : params.value;
      },

    },
    {
      field: 'created_at',
      headerName: 'Created',
      width: 120,
      valueFormatter: (params) => 
        new Date(params.value).toLocaleDateString(),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 120,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<TaskIcon />}
          label="Planning"
          onClick={() => handleOpenPlanning(params.row)}
        />,
        <GridActionsCellItem
          icon={<ViewIcon />}
          label="View"
          onClick={() => handleOpenDialog(params.row)}
        />,
        <GridActionsCellItem
          icon={<EditIcon />}
          label="Edit"
          onClick={() => handleOpenDialog(params.row)}
        />,
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Delete"
          onClick={() => handleDelete(params.row.id)}
        />,
      ],
    },
  ];

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
          Projects
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Project
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <DataGrid
            rows={projects}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 10 },
              },
            }}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            autoHeight
            sx={{ minHeight: 400 }}
          />
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingProject ? 'Edit Project' : 'Add New Project'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Project Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Status"
                select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                required
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={formData.location_address}
                onChange={(e) => setFormData({ ...formData, location_address: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="City"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="State"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Budget (₹)"
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                InputProps={{
                  startAdornment: '₹',
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingProject ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Project Planning Modal */}
      <ProjectPlanningModal
        open={openPlanningModal}
        onClose={handleClosePlanning}
        project={selectedProjectForPlanning}
      />
    </Box>
  );
};

export default Projects;

