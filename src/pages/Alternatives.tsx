import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Alert,
  CircularProgress,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Rating,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Compare as CompareIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

interface MaterialAlternative {
  id: number;
  original_material_id: number;
  original_material_name: string;
  alternative_material_id: number;
  alternative_material_name: string;
  compatibility_score: number;
  cost_difference: number;
  strength_comparison: string;
  durability_comparison: string;
  notes: string;
  created_at: string;
}

interface Material {
  id: number;
  name: string;
  category: string;
  strength: string;
  durability: string;
  cost_per_unit: number;
}

interface AlternativeFormData {
  original_material_id: number;
  alternative_material_id: number;
  compatibility_score: number;
  cost_difference: number;
  strength_comparison: string;
  durability_comparison: string;
  notes: string;
}

const Alternatives: React.FC = () => {
  const [alternatives, setAlternatives] = useState<MaterialAlternative[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [materialFilter, setMaterialFilter] = useState('');
  const [compatibilityFilter, setCompatibilityFilter] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAlternative, setEditingAlternative] = useState<MaterialAlternative | null>(null);
  const [formData, setFormData] = useState<AlternativeFormData>({
    original_material_id: 0,
    alternative_material_id: 0,
    compatibility_score: 5,
    cost_difference: 0,
    strength_comparison: '',
    durability_comparison: '',
    notes: '',
  });

  const compatibilityLevels = [
    { value: 1, label: 'Low (1-2)', color: 'error' },
    { value: 3, label: 'Medium (3-4)', color: 'warning' },
    { value: 5, label: 'High (5)', color: 'success' },
  ];

  const strengthComparisons = [
    'Much Lower',
    'Lower',
    'Similar',
    'Higher',
    'Much Higher'
  ];

  const durabilityComparisons = [
    'Much Lower',
    'Lower',
    'Similar',
    'Higher',
    'Much Higher'
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch alternatives and materials
      const [alternativesResponse, materialsResponse] = await Promise.all([
        fetch('http://localhost:5001/api/materials/1/alternatives'), // Using material ID 1 for demo
        fetch('http://localhost:5001/api/materials')
      ]);

      if (alternativesResponse.ok) {
        const alternativesResult = await alternativesResponse.json();
        setAlternatives(alternativesResult.data || []);
      }

      if (materialsResponse.ok) {
        const materialsResult = await materialsResponse.json();
        setMaterials(materialsResult.data || []);
      }

    } catch (err) {
      setError('Failed to fetch data. Please check if the API is running.');
      console.error('Data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAlternative = () => {
    setEditingAlternative(null);
    setFormData({
      original_material_id: 0,
      alternative_material_id: 0,
      compatibility_score: 5,
      cost_difference: 0,
      strength_comparison: '',
      durability_comparison: '',
      notes: '',
    });
    setOpenDialog(true);
  };

  const handleEditAlternative = (alternative: MaterialAlternative) => {
    setEditingAlternative(alternative);
    setFormData({
      original_material_id: alternative.original_material_id,
      alternative_material_id: alternative.alternative_material_id,
      compatibility_score: alternative.compatibility_score,
      cost_difference: alternative.cost_difference,
      strength_comparison: alternative.strength_comparison,
      durability_comparison: alternative.durability_comparison,
      notes: alternative.notes,
    });
    setOpenDialog(true);
  };

  const handleSaveAlternative = async () => {
    try {
      const url = editingAlternative 
        ? `http://localhost:5001/api/materials/alternatives/${editingAlternative.id}`
        : 'http://localhost:5001/api/materials/alternatives/recommend';
      
      const method = editingAlternative ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setOpenDialog(false);
        fetchData();
        setFormData({
          original_material_id: 0,
          alternative_material_id: 0,
          compatibility_score: 5,
          cost_difference: 0,
          strength_comparison: '',
          durability_comparison: '',
          notes: '',
        });
      } else {
        throw new Error('Failed to save alternative');
      }
    } catch (err) {
      setError('Failed to save alternative');
      console.error('Save alternative error:', err);
    }
  };

  const handleDeleteAlternative = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this alternative?')) {
      try {
        const response = await fetch(`http://localhost:5001/api/materials/alternatives/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          fetchData();
        } else {
          throw new Error('Failed to delete alternative');
        }
      } catch (err) {
        setError('Failed to delete alternative');
        console.error('Delete alternative error:', err);
      }
    }
  };

  const filteredAlternatives = alternatives.filter(alternative => {
    const matchesSearch = alternative.original_material_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alternative.alternative_material_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMaterial = !materialFilter || alternative.original_material_id === parseInt(materialFilter);
    const matchesCompatibility = !compatibilityFilter || alternative.compatibility_score >= parseInt(compatibilityFilter);
    
    return matchesSearch && matchesMaterial && matchesCompatibility;
  });

  const getCompatibilityColor = (score: number) => {
    if (score >= 4) return 'success';
    if (score >= 3) return 'warning';
    return 'error';
  };

  const getCompatibilityLabel = (score: number) => {
    if (score >= 4) return 'High Compatibility';
    if (score >= 3) return 'Medium Compatibility';
    return 'Low Compatibility';
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
        <Typography variant="h4" component="h1" gutterBottom>
          Material Alternatives
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddAlternative}
        >
          Add Alternative
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', borderLeft: '4px solid #1976d2' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="h6">
                    Total Alternatives
                  </Typography>
                  <Typography variant="h4" component="div">
                    {alternatives.length}
                  </Typography>
                </Box>
                <Box sx={{ color: '#1976d2', fontSize: 40 }}>
                  <CompareIcon />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', borderLeft: '4px solid #2e7d32' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="h6">
                    High Compatibility
                  </Typography>
                  <Typography variant="h4" component="div">
                    {alternatives.filter(a => a.compatibility_score >= 4).length}
                  </Typography>
                </Box>
                <Box sx={{ color: '#2e7d32', fontSize: 40 }}>
                  <CheckCircleIcon />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', borderLeft: '4px solid #ed6c02' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="h6">
                    Materials Available
                  </Typography>
                  <Typography variant="h4" component="div">
                    {materials.length}
                  </Typography>
                </Box>
                <Box sx={{ color: '#ed6c02', fontSize: 40 }}>
                  <InfoIcon />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', borderLeft: '4px solid #9c27b0' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="h6">
                    Cost Savings
                  </Typography>
                  <Typography variant="h6" component="div">
                    ₹{alternatives.reduce((sum, a) => sum + Math.max(0, -a.cost_difference), 0).toFixed(2)}
                  </Typography>
                </Box>
                <Box sx={{ color: '#9c27b0', fontSize: 40 }}>
                  <CompareIcon />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search Alternatives"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Material</InputLabel>
              <Select
                value={materialFilter}
                label="Material"
                onChange={(e) => setMaterialFilter(e.target.value)}
              >
                <MenuItem value="">All Materials</MenuItem>
                {materials.map((material) => (
                  <MenuItem key={material.id} value={material.id}>
                    {material.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Min Compatibility</InputLabel>
              <Select
                value={compatibilityFilter}
                label="Min Compatibility"
                onChange={(e) => setCompatibilityFilter(e.target.value)}
              >
                <MenuItem value="">All Levels</MenuItem>
                {compatibilityLevels.map((level) => (
                  <MenuItem key={level.value} value={level.value}>
                    {level.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Alternatives Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Original Material</TableCell>
                <TableCell>Alternative Material</TableCell>
                <TableCell>Compatibility</TableCell>
                <TableCell>Cost Difference</TableCell>
                <TableCell>Comparison</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAlternatives.map((alternative) => (
                <TableRow key={alternative.id}>
                  <TableCell>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {alternative.original_material_name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      ID: {alternative.original_material_id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2">
                      {alternative.alternative_material_name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      ID: {alternative.alternative_material_id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Rating value={alternative.compatibility_score} readOnly size="small" />
                      <Chip
                        label={getCompatibilityLabel(alternative.compatibility_score)}
                        size="small"
                        color={getCompatibilityColor(alternative.compatibility_score) as any}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body1"
                      color={alternative.cost_difference > 0 ? 'error' : 'success'}
                    >
                      {alternative.cost_difference > 0 ? '+' : ''}₹{alternative.cost_difference.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {alternative.cost_difference > 0 ? 'More Expensive' : 'Cost Effective'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" flexDirection="column" gap={0.5}>
                      <Chip
                        label={`Strength: ${alternative.strength_comparison}`}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={`Durability: ${alternative.durability_comparison}`}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <IconButton
                        size="small"
                        onClick={() => handleEditAlternative(alternative)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteAlternative(alternative.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add/Edit Alternative Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingAlternative ? 'Edit Alternative' : 'Add New Alternative'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Original Material</InputLabel>
                <Select
                  value={formData.original_material_id}
                  label="Original Material"
                  onChange={(e) => setFormData({ ...formData, original_material_id: e.target.value as number })}
                >
                  {materials.map((material) => (
                    <MenuItem key={material.id} value={material.id}>
                      {material.name} - {material.category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Alternative Material</InputLabel>
                <Select
                  value={formData.alternative_material_id}
                  label="Alternative Material"
                  onChange={(e) => setFormData({ ...formData, alternative_material_id: e.target.value as number })}
                >
                  {materials.map((material) => (
                    <MenuItem key={material.id} value={material.id}>
                      {material.name} - {material.category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Compatibility Score</InputLabel>
                <Select
                  value={formData.compatibility_score}
                  label="Compatibility Score"
                  onChange={(e) => setFormData({ ...formData, compatibility_score: e.target.value as number })}
                >
                  {[1, 2, 3, 4, 5].map((score) => (
                    <MenuItem key={score} value={score}>
                      {score} - {score >= 4 ? 'High' : score >= 3 ? 'Medium' : 'Low'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Cost Difference (₹)"
                type="number"
                value={formData.cost_difference}
                onChange={(e) => setFormData({ ...formData, cost_difference: parseFloat(e.target.value) || 0 })}
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
                helperText="Positive = more expensive, Negative = cost effective"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Strength Comparison</InputLabel>
                <Select
                  value={formData.strength_comparison}
                  label="Strength Comparison"
                  onChange={(e) => setFormData({ ...formData, strength_comparison: e.target.value })}
                >
                  {strengthComparisons.map((comparison) => (
                    <MenuItem key={comparison} value={comparison}>
                      {comparison}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Durability Comparison</InputLabel>
                <Select
                  value={formData.durability_comparison}
                  label="Durability Comparison"
                  onChange={(e) => setFormData({ ...formData, durability_comparison: e.target.value })}
                >
                  {durabilityComparisons.map((comparison) => (
                    <MenuItem key={comparison} value={comparison}>
                      {comparison}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this alternative..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveAlternative} variant="contained">
            {editingAlternative ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Alternatives;
