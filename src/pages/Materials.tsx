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
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import apiService from '../services/api';
import { Material, MaterialCategory } from '../types';

const Materials: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
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
      const [materialsData, categoriesData] = await Promise.all([
        apiService.getMaterials(),
        apiService.getMaterialCategories()
      ]);
      setMaterials(materialsData);
      setCategories(categoriesData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (material?: Material) => {
    if (material) {
      setEditingMaterial(material);
      setFormData({
        name: material.name,
        category_id: material.category_id.toString(),
        unit: material.unit,
        base_cost_per_unit: material.base_cost_per_unit.toString(),
        properties: JSON.stringify(material.properties, null, 2),
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
      let properties = {};
      if (formData.properties) {
        try {
          properties = JSON.parse(formData.properties);
        } catch (e) {
          setError('Invalid JSON in properties field');
          return;
        }
      }

      const materialData = {
        name: formData.name,
        category_id: parseInt(formData.category_id),
        unit: formData.unit,
        base_cost_per_unit: parseFloat(formData.base_cost_per_unit),
        properties,
      };

      if (editingMaterial) {
        await apiService.updateMaterial(editingMaterial.id, materialData);
      } else {
        await apiService.createMaterial(materialData);
      }

      handleCloseDialog();
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to save material');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this material?')) {
      try {
        await apiService.deleteMaterial(id);
        fetchData();
      } catch (err: any) {
        setError(err.message || 'Failed to delete material');
      }
    }
  };

  const getCategoryName = (categoryId: number) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown';
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
      headerName: 'Cost/Unit',
      width: 120,
      valueFormatter: (params) => 
        params.value ? `₹${params.value.toLocaleString()}` : 'N/A',
    },
    {
      field: 'properties',
      headerName: 'Properties',
      width: 200,
      valueGetter: (params) => {
        const props = params.row.properties;
        if (typeof props === 'object' && props !== null) {
          return Object.keys(props).slice(0, 2).join(', ') + 
                 (Object.keys(props).length > 2 ? '...' : '');
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
