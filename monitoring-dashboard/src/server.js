const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Store active connections and agent data
const connections = new Map();
const agentData = new Map();
const workflowData = new Map();

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

app.get('/api/agents', (req, res) => {
  const agents = Array.from(agentData.values());
  res.json({ agents, count: agents.length });
});

app.get('/api/agents/:id', (req, res) => {
  const agent = agentData.get(req.params.id);
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  res.json(agent);
});

app.get('/api/workflows', (req, res) => {
  const workflows = Array.from(workflowData.values());
  res.json({ workflows, count: workflows.length });
});

app.get('/api/workflows/:id', (req, res) => {
  const workflow = workflowData.get(req.params.id);
  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found' });
  }
  res.json(workflow);
});

// WebSocket handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  connections.set(socket.id, { connectedAt: new Date() });
  
  // Send current state to new client
  socket.emit('initial-state', {
    agents: Array.from(agentData.values()),
    workflows: Array.from(workflowData.values())
  });
  
  // Handle client messages
  socket.on('subscribe', (data) => {
    socket.join(data.channel);
    console.log(`Client ${socket.id} subscribed to ${data.channel}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    connections.delete(socket.id);
  });
});

// ClaudeBuild integration endpoints
app.post('/api/claudebuild/agent-update', (req, res) => {
  const { agentId, status, data } = req.body;
  
  // Update agent data
  const agent = agentData.get(agentId) || { id: agentId };
  agent.status = status;
  agent.lastUpdate = new Date();
  agent.data = { ...agent.data, ...data };
  agentData.set(agentId, agent);
  
  // Broadcast update to all connected clients
  io.emit('agent-update', agent);
  
  res.json({ success: true });
});

app.post('/api/claudebuild/workflow-update', (req, res) => {
  const { workflowId, status, progress, tasks } = req.body;
  
  // Update workflow data
  const workflow = workflowData.get(workflowId) || { id: workflowId };
  workflow.status = status;
  workflow.progress = progress;
  workflow.tasks = tasks;
  workflow.lastUpdate = new Date();
  workflowData.set(workflowId, workflow);
  
  // Broadcast update to all connected clients
  io.emit('workflow-update', workflow);
  
  res.json({ success: true });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Monitoring dashboard server running on port ${PORT}`);
});

module.exports = { app, io };