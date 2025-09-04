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
  IconButton,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  Compare as CompareIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  totalSuppliers: number;
  totalMaterials: number;
  totalCosts: number;
  totalAlternatives: number;
}

interface RecentActivity {
  id: number;
  type: string;
  description: string;
  timestamp: string;
  status: string;
}

const MaterialIntelligence: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch dashboard stats
      const statsResponse = await fetch('http://localhost:5001/api/dashboard/material-intelligence');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats({
          totalSuppliers: statsData.data?.total_suppliers || 0,
          totalMaterials: statsData.data?.total_materials || 0,
          totalCosts: statsData.data?.total_cost_records || 0,
          totalAlternatives: statsData.data?.total_alternatives || 0,
        });
      }

      // Mock recent activity data for now
      setRecentActivity([
        {
          id: 1,
          type: 'Cost Update',
          description: 'Steel prices updated for Q4 2024',
          timestamp: '2024-01-15 10:30 AM',
          status: 'Completed'
        },
        {
          id: 2,
          type: 'Supplier Added',
          description: 'New supplier: ABC Steel Corporation',
          timestamp: '2024-01-14 02:15 PM',
          status: 'Pending Review'
        },
        {
          id: 3,
          type: 'Alternative Found',
          description: 'Alternative material found for concrete',
          timestamp: '2024-01-13 09:45 AM',
          status: 'Under Evaluation'
        }
      ]);

    } catch (err) {
      setError('Failed to fetch dashboard data. Please check if the API is running.');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const StatCard: React.FC<{ 
    title: string; 
    value: number; 
    icon: React.ReactNode; 
    color: string; 
    onClick: () => void;
  }> = ({
    title,
    value,
    icon,
    color,
    onClick
  }) => (
    <Card 
      sx={{ 
        height: '100%', 
        borderLeft: `4px solid ${color}`,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
          borderLeft: `6px solid ${color}`
        }
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="h6">
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: color }}>
              {value.toLocaleString()}
            </Typography>
          </Box>
          <Box sx={{ color: color, fontSize: 40 }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

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
          Material Intelligence Dashboard
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchDashboardData}
        >
          Refresh Data
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Suppliers"
            value={stats?.totalSuppliers || 0}
            icon={<PeopleIcon />}
            color="#1976d2"
            onClick={() => navigate('/suppliers')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Materials"
            value={stats?.totalMaterials || 0}
            icon={<InventoryIcon />}
            color="#2e7d32"
            onClick={() => navigate('/materials')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Cost Records"
            value={stats?.totalCosts || 0}
            icon={<TrendingUpIcon />}
            color="#ed6c02"
            onClick={() => navigate('/materials')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Alternatives"
            value={stats?.totalAlternatives || 0}
            icon={<CompareIcon />}
            color="#9c27b0"
            onClick={() => navigate('/alternatives')}
          />
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentActivity.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>
                        <Chip
                          label={activity.type}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{activity.description}</TableCell>
                      <TableCell>{activity.timestamp}</TableCell>
                      <TableCell>
                        <Chip
                          label={activity.status}
                          size="small"
                          color={
                            activity.status === 'Completed' ? 'success' :
                            activity.status === 'Pending Review' ? 'warning' : 'info'
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box display="flex" flexDirection="column" gap={2}>
              <Button
                variant="contained"
                startIcon={<PeopleIcon />}
                fullWidth
                href="/suppliers"
              >
                Manage Suppliers
              </Button>
              <Button
                variant="contained"
                startIcon={<TrendingUpIcon />}
                fullWidth
                href="/materials"
              >
                Track Costs
              </Button>
              <Button
                variant="contained"
                startIcon={<CompareIcon />}
                fullWidth
                href="/alternatives"
              >
                Find Alternatives
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MaterialIntelligence;
