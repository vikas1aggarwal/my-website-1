import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Alert,
  Grid,
  Card,
  CardContent,
  InputAdornment,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Work as WorkIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon
} from '@mui/icons-material';

interface LaborType {
  id: number;
  name: string;
  category: string;
  skill_level: string;
  hourly_rate: number;
  daily_rate: number;
  job_rate?: number;
  unit: string;
  description?: string;
  applicable_phases?: string;
  created_at: string;
}

interface LaborFormData {
  name: string;
  category: string;
  skill_level: string;
  hourly_rate: number;
  daily_rate: number;
  job_rate?: number;
  unit: string;
  description: string;
  applicable_phases: string;
}

const LaborManagement: React.FC = () => {
  const [laborTypes, setLaborTypes] = useState<LaborType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [skillLevelFilter, setSkillLevelFilter] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingLabor, setEditingLabor] = useState<LaborType | null>(null);
  const [formData, setFormData] = useState<LaborFormData>({
    name: '',
    category: '',
    skill_level: '',
    hourly_rate: 0,
    daily_rate: 0,
    job_rate: 0,
    unit: 'Person',
    description: '',
    applicable_phases: ''
  });

  const [categories, setCategories] = useState<string[]>([]);
  const [skillLevels, setSkillLevels] = useState<string[]>([]);

  useEffect(() => {
    fetchLaborTypes();
    fetchCategories();
    fetchSkillLevels();
  }, []);

  const fetchLaborTypes = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5001/api/labor-types');
      if (response.ok) {
        const result = await response.json();
        setLaborTypes(result.data || []);
      } else {
        setError('Failed to fetch labor types');
      }
    } catch (error) {
      setError('Error fetching labor types');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/labor-categories');
      if (response.ok) {
        const result = await response.json();
        setCategories(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchSkillLevels = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/labor-skill-levels');
      if (response.ok) {
        const result = await response.json();
        setSkillLevels(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching skill levels:', error);
    }
  };

  const handleAddLabor = () => {
    setEditingLabor(null);
    setFormData({
      name: '',
      category: '',
      skill_level: '',
      hourly_rate: 0,
      daily_rate: 0,
      job_rate: 0,
      unit: 'Person',
      description: '',
      applicable_phases: ''
    });
    setOpenDialog(true);
  };

  const handleEditLabor = (labor: LaborType) => {
    setEditingLabor(labor);
    setFormData({
      name: labor.name,
      category: labor.category,
      skill_level: labor.skill_level,
      hourly_rate: labor.hourly_rate,
      daily_rate: labor.daily_rate,
      job_rate: labor.job_rate || 0,
      unit: labor.unit,
      description: labor.description || '',
      applicable_phases: labor.applicable_phases || ''
    });
    setOpenDialog(true);
  };

  const handleSaveLabor = async () => {
    try {
      const url = editingLabor 
        ? `http://localhost:5001/api/labor-types/${editingLabor.id}`
        : 'http://localhost:5001/api/labor-types';
      
      const method = editingLabor ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setOpenDialog(false);
        fetchLaborTypes();
      } else {
        setError('Failed to save labor type');
      }
    } catch (error) {
      setError('Error saving labor type');
      console.error('Error:', error);
    }
  };

  const handleDeleteLabor = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this labor type?')) {
      try {
        const response = await fetch(`http://localhost:5001/api/labor-types/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          fetchLaborTypes();
        } else {
          setError('Failed to delete labor type');
        }
      } catch (error) {
        setError('Error deleting labor type');
        console.error('Error:', error);
      }
    }
  };

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case 'Basic': return 'default';
      case 'Junior': return 'primary';
      case 'Senior': return 'secondary';
      case 'Skilled': return 'success';
      case 'Specialist': return 'warning';
      default: return 'default';
    }
  };

  const filteredLaborTypes = laborTypes.filter(labor => {
    const matchesSearch = labor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         labor.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || labor.category === categoryFilter;
    const matchesSkillLevel = !skillLevelFilter || labor.skill_level === skillLevelFilter;
    
    return matchesSearch && matchesCategory && matchesSkillLevel;
  });

  const totalLaborTypes = laborTypes.length;
  const totalCategories = categories.length;
  const averageHourlyRate = laborTypes.length > 0 
    ? laborTypes.reduce((sum, labor) => sum + labor.hourly_rate, 0) / laborTypes.length 
    : 0;

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading labor types...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WorkIcon color="primary" />
        Labor Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            cursor: 'pointer', 
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
              borderLeft: '4px solid #1976d2'
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon color="primary" />
                <Typography variant="h6">Total Labor Types</Typography>
              </Box>
              <Typography variant="h4" color="primary">{totalLaborTypes}</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            cursor: 'pointer', 
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
              borderLeft: '4px solid #2e7d32'
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WorkIcon color="success" />
                <Typography variant="h6">Categories</Typography>
              </Box>
              <Typography variant="h4" color="success.main">{totalCategories}</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            cursor: 'pointer', 
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
              borderLeft: '4px solid #ed6c02'
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MoneyIcon color="warning" />
                <Typography variant="h6">Avg Hourly Rate</Typography>
              </Box>
              <Typography variant="h4" color="warning.main">₹{averageHourlyRate.toFixed(0)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            cursor: 'pointer', 
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
              borderLeft: '4px solid #9c27b0'
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ScheduleIcon color="secondary" />
                <Typography variant="h6">Filtered Results</Typography>
              </Box>
              <Typography variant="h4" color="secondary.main">{filteredLaborTypes.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Actions */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="Search labor types..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 200 }}
        />
        
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            label="Category"
          >
            <MenuItem value="">All Categories</MenuItem>
            {categories.map((category) => (
              <MenuItem key={category} value={category}>{category}</MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Skill Level</InputLabel>
          <Select
            value={skillLevelFilter}
            onChange={(e) => setSkillLevelFilter(e.target.value)}
            label="Skill Level"
          >
            <MenuItem value="">All Levels</MenuItem>
            {skillLevels.map((level) => (
              <MenuItem key={level} value={level}>{level}</MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddLabor}
          sx={{ ml: 'auto' }}
        >
          Add Labor Type
        </Button>
      </Box>

      {/* Labor Types Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Skill Level</TableCell>
              <TableCell>Hourly Rate</TableCell>
              <TableCell>Daily Rate</TableCell>
              <TableCell>Unit</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLaborTypes.map((labor) => (
              <TableRow key={labor.id}>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {labor.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip label={labor.category} size="small" />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={labor.skill_level} 
                    size="small" 
                    color={getSkillLevelColor(labor.skill_level)}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="primary" fontWeight="bold">
                    ₹{labor.hourly_rate}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="secondary" fontWeight="bold">
                    ₹{labor.daily_rate}
                  </Typography>
                </TableCell>
                <TableCell>{labor.unit}</TableCell>
                <TableCell>
                  <Tooltip title={labor.description || ''}>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                      {labor.description || 'No description'}
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEditLabor(labor)} color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDeleteLabor(labor.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingLabor ? 'Edit Labor Type' : 'Add New Labor Type'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  label="Category"
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>{category}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Skill Level</InputLabel>
                <Select
                  value={formData.skill_level}
                  onChange={(e) => setFormData({ ...formData, skill_level: e.target.value })}
                  label="Skill Level"
                >
                  {skillLevels.map((level) => (
                    <MenuItem key={level} value={level}>{level}</MenuItem>
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
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Hourly Rate"
                type="number"
                value={formData.hourly_rate}
                onChange={(e) => setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) || 0 })}
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Daily Rate"
                type="number"
                value={formData.daily_rate}
                onChange={(e) => setFormData({ ...formData, daily_rate: parseFloat(e.target.value) || 0 })}
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Job Rate (Optional)"
                type="number"
                value={formData.job_rate || ''}
                onChange={(e) => setFormData({ ...formData, job_rate: parseFloat(e.target.value) || undefined })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
              />
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
                label="Applicable Phases"
                value={formData.applicable_phases}
                onChange={(e) => setFormData({ ...formData, applicable_phases: e.target.value })}
                placeholder="e.g., Site Preparation, Structure & Masonry, Roofing & Finishing"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveLabor} variant="contained">
            {editingLabor ? 'Update' : 'Add'} Labor Type
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LaborManagement;
