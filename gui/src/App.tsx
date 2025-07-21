import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Sessions from './pages/Sessions';
import Agents from './pages/Agents';
import Commands from './pages/Commands';
import Workflow from './pages/Workflow';
import Settings from './pages/Settings';

function App() {
  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/commands" element={<Commands />} />
          <Route path="/workflow" element={<Workflow />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Box>
  );
}

export default App;