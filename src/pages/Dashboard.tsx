import React, { useEffect, useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  Divider,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Construction as ConstructionIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  Inventory as InventoryIcon,
  People as PeopleIcon,
  Compare as CompareIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import { Project, Material } from '../types';

const Dashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [phase2Stats, setPhase2Stats] = useState<any>(null);
  const [costAnalytics, setCostAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Phase 1 data from Phase 2 API (since we're using the same database)
        const [projectsResponse, materialsResponse, phase2Response, tasksResponse] = await Promise.all([
          fetch('http://localhost:5001/api/projects').catch(() => null),
          fetch('http://localhost:5001/api/materials').catch(() => null),
          fetch('http://localhost:5001/api/dashboard/material-intelligence').catch(() => null),
          fetch('http://localhost:8000/tasks').catch(() => null)
        ]);

        // Handle projects data
        if (projectsResponse && projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          setProjects(projectsData.data || []);
        } else {
          // Fallback: try Phase 1 API if Phase 2 doesn't have projects endpoint
          try {
            const fallbackProjects = await apiService.getProjects();
            setProjects(fallbackProjects);
          } catch (err) {
            console.log('Projects API not available');
            setProjects([]);
          }
        }

        // Handle materials data
        if (materialsResponse && materialsResponse.ok) {
          const materialsData = await materialsResponse.json();
          setMaterials(materialsData.data || []);
        } else {
          // Fallback: try Phase 1 API
          try {
            const fallbackMaterials = await apiService.getMaterials();
            setMaterials(fallbackMaterials);
          } catch (err) {
            console.log('Materials API not available');
            setMaterials([]);
          }
        }

        // Handle Phase 2 stats
        if (phase2Response && phase2Response.ok) {
          const phase2Data = await phase2Response.json();
          setPhase2Stats(phase2Data.data || {});
        }

        // Calculate cost analytics
        if (tasksResponse && tasksResponse.ok) {
          const tasksData = await tasksResponse.json();
          const tasks = tasksData || [];
          
          const totalProjectCost = tasks.reduce((sum: number, task: any) => sum + (task.total_cost || 0), 0);
          const totalMaterialCost = tasks.reduce((sum: number, task: any) => sum + (task.material_cost || 0), 0);
          const totalLaborCost = tasks.reduce((sum: number, task: any) => sum + (task.labor_cost || 0), 0);
          const tasksWithCosts = tasks.filter((task: any) => task.total_cost > 0).length;
          
          setCostAnalytics({
            totalProjectCost,
            totalMaterialCost,
            totalLaborCost,
            tasksWithCosts,
            totalTasks: tasks.length
          });
        }

      } catch (err: any) {
        setError(err.message || 'Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusCount = (status: string) => {
    return projects.filter(project => project.status === status).length;
  };

  const getTotalBudget = () => {
    return projects.reduce((total, project) => total + (project.budget || 0), 0);
  };

  const handlePhase2Navigation = (path: string) => {
    navigate(path);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      
      {/* Phase 1: Core ERP Stats */}
      <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 3, mb: 2 }}>
        Core ERP Overview
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                border: '1px solid #1976d2'
              }
            }}
            onClick={() => navigate('/projects')}
          >
            <CardContent>
              <Box display="flex" alignItems="center">
                <BusinessIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Projects
                  </Typography>
                  <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                    {projects.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                border: '1px solid #9c27b0'
              }
            }}
            onClick={() => navigate('/projects')}
          >
            <CardContent>
              <Box display="flex" alignItems="center">
                <AssignmentIcon color="secondary" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Active Projects
                  </Typography>
                  <Typography variant="h4" color="secondary" sx={{ fontWeight: 'bold' }}>
                    {getStatusCount('active')}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                border: '1px solid #ed6c02'
              }
            }}
            onClick={() => navigate('/projects')}
          >
            <CardContent>
              <Box display="flex" alignItems="center">
                <ConstructionIcon color="warning" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Planning
                  </Typography>
                  <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
                    {getStatusCount('planning')}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                border: '1px solid #2e7d32'
              }
            }}
            onClick={() => navigate('/projects')}
          >
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingUpIcon color="success" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Budget
                  </Typography>
                  <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                    ₹{(getTotalBudget() / 1000000).toFixed(1)}M
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Cost Analytics */}
      {costAnalytics && (
        <>
          <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2 }}>
            💰 Cost Analytics & Aggregation
          </Typography>
          
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} sm={6} md={3}>
              <Card 
                sx={{ 
                  borderLeft: '4px solid #4caf50',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                    borderLeft: '4px solid #2e7d32'
                  }
                }}
                onClick={() => navigate('/planning')}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="textSecondary" gutterBottom variant="body2">
                        Total Project Cost
                      </Typography>
                      <Typography variant="h4" component="div" color="success.main">
                        ₹{costAnalytics.totalProjectCost.toLocaleString()}
                      </Typography>
                    </Box>
                    <TrendingUpIcon sx={{ fontSize: 40, color: '#4caf50' }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card 
                sx={{ 
                  borderLeft: '4px solid #9c27b0',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                    borderLeft: '4px solid #7b1fa2'
                  }
                }}
                onClick={() => navigate('/materials')}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="textSecondary" gutterBottom variant="body2">
                        Material Costs
                      </Typography>
                      <Typography variant="h4" component="div" color="secondary.main">
                        ₹{costAnalytics.totalMaterialCost.toLocaleString()}
                      </Typography>
                    </Box>
                    <InventoryIcon sx={{ fontSize: 40, color: '#9c27b0' }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card 
                sx={{ 
                  borderLeft: '4px solid #ff9800',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                    borderLeft: '4px solid #f57c00'
                  }
                }}
                onClick={() => navigate('/planning')}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="textSecondary" gutterBottom variant="body2">
                        Labor Costs
                      </Typography>
                      <Typography variant="h4" component="div" color="warning.main">
                        ₹{costAnalytics.totalLaborCost.toLocaleString()}
                      </Typography>
                    </Box>
                    <PeopleIcon sx={{ fontSize: 40, color: '#ff9800' }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card 
                sx={{ 
                  borderLeft: '4px solid #2196f3',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                    borderLeft: '4px solid #1976d2'
                  }
                }}
                onClick={() => navigate('/planning')}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="textSecondary" gutterBottom variant="body2">
                        Tasks with Costs
                      </Typography>
                      <Typography variant="h4" component="div" color="primary.main">
                        {costAnalytics.tasksWithCosts}/{costAnalytics.totalTasks}
                      </Typography>
                    </Box>
                    <AssignmentIcon sx={{ fontSize: 40, color: '#2196f3' }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}

      {/* Phase 2: Material Intelligence Integration */}
      <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2 }}>
        🚀 Phase 2: Material Intelligence
      </Typography>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              borderLeft: '4px solid #1976d2',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                borderLeft: '6px solid #1976d2'
              }
            }}
            onClick={() => navigate('/suppliers')}
          >
            <CardContent>
              <Box display="flex" alignItems="center">
                <PeopleIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Suppliers
                  </Typography>
                  <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                    {phase2Stats?.total_suppliers || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              borderLeft: '4px solid #2e7d32',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                borderLeft: '6px solid #2e7d32'
              }
            }}
            onClick={() => navigate('/materials')}
          >
            <CardContent>
              <Box display="flex" alignItems="center">
                <InventoryIcon color="success" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Materials Tracked
                  </Typography>
                  <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                    {phase2Stats?.total_materials || materials.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              borderLeft: '4px solid #ed6c02',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                borderLeft: '6px solid #ed6c02'
              }
            }}
            onClick={() => navigate('/materials')}
          >
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingUpIcon color="warning" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Cost Records
                  </Typography>
                  <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
                    {phase2Stats?.total_cost_records || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              borderLeft: '4px solid #9c27b0',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                borderLeft: '6px solid #9c27b0'
              }
            }}
            onClick={() => navigate('/alternatives')}
          >
            <CardContent>
              <Box display="flex" alignItems="center">
                <CompareIcon color="secondary" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Alternatives
                  </Typography>
                  <Typography variant="h4" color="secondary" sx={{ fontWeight: 'bold' }}>
                    {phase2Stats?.total_alternatives || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Additional Phase 2 Stats */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              borderLeft: '4px solid #f57c00',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                borderLeft: '6px solid #f57c00'
              }
            }}
            onClick={() => navigate('/material-intelligence')}
          >
            <CardContent>
              <Box display="flex" alignItems="center">
                <ConstructionIcon color="warning" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Project Phases
                  </Typography>
                  <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
                    {phase2Stats?.total_phases || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              borderLeft: '4px solid #388e3c',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                borderLeft: '6px solid #388e3c'
              }
            }}
            onClick={() => navigate('/materials')}
          >
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingUpIcon color="success" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Cost Records
                  </Typography>
                  <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                    {phase2Stats?.total_cost_records || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              borderLeft: '4px solid #1976d2',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                borderLeft: '6px solid #1976d2'
              }
            }}
            onClick={() => navigate('/projects')}
          >
            <CardContent>
              <Box display="flex" alignItems="center">
                <AssignmentIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Active Projects
                  </Typography>
                  <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                    {getStatusCount('active')}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              borderLeft: '4px solid #7b1fa2',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                borderLeft: '6px solid #7b1fa2'
              }
            }}
            onClick={() => navigate('/projects')}
          >
            <CardContent>
              <Box display="flex" alignItems="center">
                <BusinessIcon color="secondary" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Budget
                  </Typography>
                  <Typography variant="h4" color="secondary" sx={{ fontWeight: 'bold' }}>
                    ₹{(getTotalBudget() / 1000000).toFixed(1)}M
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Phase 2 Quick Actions */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quick Actions - Material Intelligence
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                startIcon={<InventoryIcon />}
                endIcon={<ArrowForwardIcon />}
                fullWidth
                onClick={() => handlePhase2Navigation('/material-intelligence')}
                sx={{ justifyContent: 'space-between' }}
              >
                Material Intelligence Dashboard
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                startIcon={<PeopleIcon />}
                endIcon={<ArrowForwardIcon />}
                fullWidth
                onClick={() => handlePhase2Navigation('/suppliers')}
                sx={{ justifyContent: 'space-between' }}
              >
                Manage Suppliers
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                startIcon={<TrendingUpIcon />}
                endIcon={<ArrowForwardIcon />}
                fullWidth
                onClick={() => handlePhase2Navigation('/materials')}
                sx={{ justifyContent: 'space-between' }}
              >
                Track Costs
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                startIcon={<CompareIcon />}
                endIcon={<ArrowForwardIcon />}
                fullWidth
                onClick={() => handlePhase2Navigation('/alternatives')}
                sx={{ justifyContent: 'space-between' }}
              >
                Find Alternatives
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Divider sx={{ my: 3 }} />

      {/* Recent Projects */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Projects
            </Typography>
            {projects.length === 0 ? (
              <Typography color="textSecondary">
                No projects found. Create your first project to get started.
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {projects.slice(0, 6).map((project) => (
                  <Grid item xs={12} sm={6} md={4} key={project.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" noWrap>
                          {project.name}
                        </Typography>
                        <Typography color="textSecondary" noWrap>
                          {project.description}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          Budget: ₹{(project.budget || 0).toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="primary">
                          Status: {project.status}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Project Phases Overview */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Project Phases & Material Requirements
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Standard construction phases with material requirements and supplier recommendations
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6" color="primary">Foundation</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Phase 1: Site preparation, excavation, and foundation work
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6" color="primary">Structure</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Phase 2: Framing, roofing, and structural elements
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6" color="primary">MEP</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Phase 3: Mechanical, electrical, and plumbing systems
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6" color="primary">Finishing</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Phase 4: Interior finishes, fixtures, and final touches
                  </Typography>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Box>
  );
};

export default Dashboard;
