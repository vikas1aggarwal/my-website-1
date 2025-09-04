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
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Category as CategoryIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Inventory as InventoryIcon,
  AttachMoney as AttachMoneyIcon,
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import apiService from '../services/api';
import { Material, MaterialCategory } from '../types';

const Materials: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [costs, setCosts] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    unit: '',
    base_cost_per_unit: '',
    properties: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch materials, costs, and dashboard stats from Phase 2 API
      const [materialsResponse, costsResponse, dashboardResponse] = await Promise.all([
        fetch('http://localhost:5001/api/materials'),
        fetch('http://localhost:5001/api/material-costs'),
        fetch('http://localhost:5001/api/dashboard/material-intelligence')
      ]);

      // Handle materials data
      if (materialsResponse.ok) {
        const materialsResult = await materialsResponse.json();
        setMaterials(materialsResult.data || []);
      } else {
        throw new Error('Failed to fetch materials from API');
      }

      // Handle costs data
      if (costsResponse.ok) {
        const costsResult = await costsResponse.json();
        setCosts(costsResult.data || []);
      }

      // Handle dashboard stats
      if (dashboardResponse.ok) {
        const dashboardResult = await dashboardResponse.json();
        setDashboardStats(dashboardResult.data || {});
      }

      // Fetch categories from Phase 1 API as fallback
      try {
        const categoriesData = await apiService.getMaterialCategories();
        setCategories(categoriesData);
      } catch (err) {
        console.log('Categories API not available, using default categories');
        // Set default categories if API is not available
        setCategories([
          { id: 6, name: 'Concrete & Aggregates', level: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 7, name: 'Masonry', level: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 8, name: 'Structural Steel', level: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 10, name: 'Flooring', level: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 11, name: 'Paints & Coatings', level: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 12, name: 'Electrical', level: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 13, name: 'Electrical Components', level: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 14, name: 'Plumbing', level: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 15, name: 'Sanitaryware', level: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
        ]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (material?: any) => {
    if (material) {
      setEditingMaterial(material);
      setFormData({
        name: material.name,
        category_id: material.category_id.toString(),
        unit: material.unit,
        base_cost_per_unit: material.base_cost_per_unit.toString(),
        properties: material.properties_json || '{}',
      });
    } else {
      setEditingMaterial(null);
      setFormData({
        name: '',
        category_id: '',
        unit: '',
        base_cost_per_unit: '',
        properties: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingMaterial(null);
  };

  const handleSubmit = async () => {
    try {
      // Validate JSON properties
      if (formData.properties) {
        try {
          JSON.parse(formData.properties);
        } catch (e) {
          setError('Invalid JSON in properties field');
          return;
        }
      }

      // For now, just show a message that create/update is not available in Phase 2
      setError('Create/Update functionality will be available in the next phase. Currently showing read-only data from Phase 2 API.');
      handleCloseDialog();
    } catch (err: any) {
      setError(err.message || 'Failed to save material');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this material?')) {
      setError('Delete functionality will be available in the next phase. Currently showing read-only data from Phase 2 API.');
    }
  };

  const getCategoryName = (categoryId: number) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  const getCostTrend = (materialId: number) => {
    const materialCosts = costs.filter(cost => cost.material_id === materialId && cost.unit_cost);
    if (materialCosts.length < 2) return { trend: 'stable', percentage: 0, icon: <TrendingFlatIcon /> };
    
    const sortedCosts = materialCosts.sort((a, b) => new Date(a.cost_date).getTime() - new Date(b.cost_date).getTime());
    const latest = sortedCosts[sortedCosts.length - 1];
    const previous = sortedCosts[sortedCosts.length - 2];
    
    if (!latest.unit_cost || !previous.unit_cost) {
      return { trend: 'stable', percentage: 0, icon: <TrendingFlatIcon /> };
    }
    
    const percentage = ((latest.unit_cost - previous.unit_cost) / previous.unit_cost) * 100;
    
    if (percentage > 5) return { trend: 'up', percentage: Math.round(percentage), icon: <TrendingUpIcon color="error" /> };
    if (percentage < -5) return { trend: 'down', percentage: Math.round(Math.abs(percentage)), icon: <TrendingDownIcon color="success" /> };
    return { trend: 'stable', percentage: Math.round(Math.abs(percentage)), icon: <TrendingFlatIcon color="info" /> };
  };

  const getLatestCost = (materialId: number) => {
    const materialCosts = costs.filter(cost => cost.material_id === materialId && cost.unit_cost);
    if (materialCosts.length === 0) return null;
    
    const sortedCosts = materialCosts.sort((a, b) => new Date(b.cost_date).getTime() - new Date(a.cost_date).getTime());
    return sortedCosts[0];
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Material Name', width: 200 },
    { 
      field: 'category_id', 
      headerName: 'Category', 
      width: 150,
      valueGetter: (params) => getCategoryName(params.row.category_id),
    },
    { field: 'unit', headerName: 'Unit', width: 100 },
    {
      field: 'base_cost_per_unit',
      headerName: 'Base Cost/Unit',
      width: 120,
      valueFormatter: (params) => 
        params.value ? `₹${params.value.toLocaleString()}` : 'N/A',
    },
    {
      field: 'latest_cost',
      headerName: 'Latest Cost',
      width: 120,
      valueGetter: (params) => {
        const latestCost = getLatestCost(params.row.id);
        return latestCost && latestCost.unit_cost ? `₹${latestCost.unit_cost.toLocaleString()}` : 'N/A';
      },
    },
    {
      field: 'price_trend',
      headerName: 'Price Trend',
      width: 120,
      renderCell: (params) => {
        const trend = getCostTrend(params.row.id);
        return (
          <Box display="flex" alignItems="center" gap={1}>
            {trend.icon}
            <Typography variant="body2" color={trend.trend === 'up' ? 'error' : trend.trend === 'down' ? 'success' : 'info'}>
              {trend.percentage}%
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'properties_json',
      headerName: 'Properties',
      width: 200,
      valueGetter: (params) => {
        const propsJson = params.row.properties_json;
        if (propsJson) {
          try {
            const props = JSON.parse(propsJson);
            if (typeof props === 'object' && props !== null) {
              return Object.keys(props).slice(0, 2).join(', ') + 
                     (Object.keys(props).length > 2 ? '...' : '');
            }
          } catch (e) {
            return 'Invalid JSON';
          }
        }
        return 'N/A';
      },
    },
    {
      field: 'is_active',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Chip 
          label={params.value ? 'Active' : 'Inactive'} 
          color={params.value ? 'success' : 'default'} 
          size="small" 
        />
      ),
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
          Materials
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Material
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Dashboard Cards */}
      <Grid container spacing={3} mb={3}>
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
          >
            <CardContent>
              <Box display="flex" alignItems="center">
                <InventoryIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Materials
                  </Typography>
                  <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                    {materials.length}
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
          >
            <CardContent>
              <Box display="flex" alignItems="center">
                <AttachMoneyIcon color="success" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Cost Records
                  </Typography>
                  <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                    {costs.length}
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
          >
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingUpIcon color="warning" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Price Trends
                  </Typography>
                  <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
                    {costs.filter(cost => {
                      const materialCosts = costs.filter(c => c.material_id === cost.material_id);
                      return materialCosts.length >= 2;
                    }).length}
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
          >
            <CardContent>
              <Box display="flex" alignItems="center">
                <CategoryIcon color="secondary" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Categories
                  </Typography>
                  <Typography variant="h4" color="secondary" sx={{ fontWeight: 'bold' }}>
                    {categories.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Summary Card */}
      <Card sx={{ mb: 3, bgcolor: 'primary.main', color: 'white' }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h6" gutterBottom>
                Materials Intelligence
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {materials.length} Materials • {costs.length} Cost Records
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Complete material information with price trends
              </Typography>
            </Box>
            <Box display="flex" gap={2}>
              <CategoryIcon sx={{ fontSize: 60, opacity: 0.8 }} />
              <TrendingUpIcon sx={{ fontSize: 60, opacity: 0.8 }} />
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <DataGrid
            rows={materials}
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
          {editingMaterial ? 'Edit Material' : 'Add New Material'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Material Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category_id}
                  label="Category"
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                >
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Unit"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                required
                placeholder="e.g., kg, m², piece"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Base Cost per Unit (₹)"
                type="number"
                value={formData.base_cost_per_unit}
                onChange={(e) => setFormData({ ...formData, base_cost_per_unit: e.target.value })}
                required
                InputProps={{
                  startAdornment: '₹',
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Properties (JSON)"
                multiline
                rows={4}
                value={formData.properties}
                onChange={(e) => setFormData({ ...formData, properties: e.target.value })}
                placeholder='{"strength": "High", "color": "Gray", "size": "Standard"}'
                helperText="Enter material properties as JSON object"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingMaterial ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Materials;
