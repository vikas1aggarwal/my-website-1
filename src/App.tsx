import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Materials from './pages/Materials';
import ProjectPlanning from './pages/ProjectPlanning';
import Login from './pages/Login';
import Register from './pages/Register';
import MaterialIntelligence from './pages/MaterialIntelligence';
import Suppliers from './pages/Suppliers';
import Alternatives from './pages/Alternatives';

function App() {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/*"
          element={
            <Layout>
              <Container maxWidth="xl" sx={{ py: 3 }}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/materials" element={<Materials />} />
                  <Route path="/planning" element={<ProjectPlanning />} />
                  {/* Phase 2: Material Intelligence Routes */}
                  <Route path="/material-intelligence" element={<MaterialIntelligence />} />
                  <Route path="/suppliers" element={<Suppliers />} />
                  <Route path="/alternatives" element={<Alternatives />} />
                </Routes>
              </Container>
            </Layout>
          }
        />
      </Routes>
    </Box>
  );
}

export default App;
