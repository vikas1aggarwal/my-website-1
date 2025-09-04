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
  Rating,
  IconButton,
  Alert,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
} from '@mui/icons-material';

interface Supplier {
  id: number;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  rating: number;
  category: string;
  created_at: string;
}

interface SupplierFormData {
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  category: string;
}

const Suppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<SupplierFormData>({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    category: '',
  });

  const categories = [
    'Steel & Metals',
    'Cement & Concrete',
    'Bricks & Blocks',
    'Electrical',
    'Plumbing',
    'Finishing Materials',
    'Tools & Equipment',
    'Other'
  ];

  const states = [
    'Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Telangana',
    'Gujarat', 'West Bengal', 'Uttar Pradesh', 'Andhra Pradesh', 'Rajasthan'
  ];

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:5001/api/suppliers');
      if (response.ok) {
        const result = await response.json();
        setSuppliers(result.data || []);
      } else {
        throw new Error('Failed to fetch suppliers');
      }
    } catch (err) {
      setError('Failed to fetch suppliers. Please check if the API is running.');
      console.error('Suppliers fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSupplier = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      city: '',
      state: '',
      category: '',
    });
    setOpenDialog(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contact_person: supplier.contact_person,
      email: supplier.email,
      phone: supplier.phone,
      city: supplier.city,
      state: supplier.state,
      category: supplier.category,
    });
    setOpenDialog(true);
  };

  const handleSaveSupplier = async () => {
    try {
      const url = editingSupplier 
        ? `http://localhost:5001/api/suppliers/${editingSupplier.id}`
        : 'http://localhost:5001/api/suppliers';
      
      const method = editingSupplier ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setOpenDialog(false);
        fetchSuppliers();
        setFormData({
          name: '',
          contact_person: '',
          email: '',
          phone: '',
          city: '',
          state: '',
          category: '',
        });
      } else {
        throw new Error('Failed to save supplier');
      }
    } catch (err) {
      setError('Failed to save supplier');
      console.error('Save supplier error:', err);
    }
  };

  const handleDeleteSupplier = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        const response = await fetch(`http://localhost:5001/api/suppliers/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          fetchSuppliers();
        } else {
          throw new Error('Failed to delete supplier');
        }
      } catch (err) {
        setError('Failed to delete supplier');
        console.error('Delete supplier error:', err);
      }
    }
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || supplier.category === categoryFilter;
    const matchesRating = !ratingFilter || supplier.rating >= parseInt(ratingFilter);
    
    return matchesSearch && matchesCategory && matchesRating;
  });

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
          Supplier Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddSupplier}
        >
          Add Supplier
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search Suppliers"
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
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Minimum Rating</InputLabel>
              <Select
                value={ratingFilter}
                label="Minimum Rating"
                onChange={(e) => setRatingFilter(e.target.value)}
              >
                <MenuItem value="">All Ratings</MenuItem>
                <MenuItem value="1">1+ Stars</MenuItem>
                <MenuItem value="2">2+ Stars</MenuItem>
                <MenuItem value="3">3+ Stars</MenuItem>
                <MenuItem value="4">4+ Stars</MenuItem>
                <MenuItem value="5">5 Stars</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Suppliers Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Contact Person</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Rating</TableCell>
                <TableCell>Contact Info</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {supplier.name}
                    </Typography>
                  </TableCell>
                  <TableCell>{supplier.contact_person}</TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <LocationIcon fontSize="small" color="action" />
                      {supplier.city}, {supplier.state}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={supplier.category} size="small" color="primary" />
                  </TableCell>
                  <TableCell>
                    <Rating value={supplier.rating} readOnly size="small" />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" flexDirection="column" gap={0.5}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <EmailIcon fontSize="small" color="action" />
                        <Typography variant="body2">{supplier.email}</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="body2">{supplier.phone}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <IconButton
                        size="small"
                        onClick={() => handleEditSupplier(supplier)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteSupplier(supplier.id)}
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

      {/* Add/Edit Supplier Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Supplier Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Contact Person"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="City"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>State</InputLabel>
                <Select
                  value={formData.state}
                  label="State"
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                >
                  {states.map((state) => (
                    <MenuItem key={state} value={state}>
                      {state}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  label="Category"
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveSupplier} variant="contained">
            {editingSupplier ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Suppliers;
