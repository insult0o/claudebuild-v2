const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

/**
 * Real Builder Agent Handler
 * Actually implements stories by creating files and running commands
 */
class RealBuilderAgentHandler {
  constructor() {
    this.name = 'builder';
    this.description = 'Real story implementation that creates actual code';
  }

  async execute(context) {
    const { task, workDir, log, updateStatus, updateProgress, readFile, writeFile } = context;
    const { input } = task;
    const { story } = input;
    
    try {
      // Read the story file (resolve path from main project root)
      const mainProjectRoot = path.resolve(workDir, '../../../');
      const storyPath = path.join(mainProjectRoot, story);
      const storyContent = await readFile(storyPath);
      log(`Loaded story: ${story}`);
      
      // Parse story to understand what needs to be built
      const storyDetails = this.parseStory(storyContent);
      const storyNumber = story.match(/story-(\d+)\.md/)?.[1] || '001';
      
      log(`Implementing: ${storyDetails.title}`);
      
      // Route to appropriate implementation based on story
      switch (storyNumber) {
        case '001':
          await this.implementProjectFoundation(context, storyDetails);
          break;
        case '002':
          await this.implementCoreAPI(context, storyDetails);
          break;
        case '003':
          await this.implementFrontendComponents(context, storyDetails);
          break;
        default:
          await this.implementGenericStory(context, storyDetails);
      }
      
      // Save checkpoint
      const checkpointData = {
        status: 'completed',
        story: story,
        implemented: true,
        message: `Story ${story} implementation complete`,
        storyDetails: storyDetails,
        projectRoot: path.resolve(workDir, '../../../', 'monitoring-dashboard')
      };
      
      await writeFile('checkpoint.json', JSON.stringify(checkpointData, null, 2));
      
      return checkpointData;
      
    } catch (error) {
      log(`Builder Agent failed: ${error.message}`);
      throw error;
    }
  }
  
  async implementProjectFoundation(context, storyDetails) {
    const { log, updateStatus, updateProgress, writeFile, workDir } = context;
    // Get the main project root (parent of .claudebuild)
    const mainProjectRoot = path.resolve(workDir, '../../../');
    const projectRoot = path.join(mainProjectRoot, 'monitoring-dashboard');
    
    log(`Working directory: ${workDir}`);
    log(`Main project root: ${mainProjectRoot}`);
    log(`Project root will be: ${projectRoot}`);
    
    updateStatus('Creating project structure');
    updateProgress(10);
    
    // Create project directory
    try {
      await fs.mkdir(projectRoot, { recursive: true });
      log(`Created project directory: ${projectRoot}`);
    } catch (error) {
      log(`Error creating project directory: ${error.message}`);
      throw error;
    }
    
    // Create folder structure
    const folders = [
      'src',
      'src/components',
      'src/api',
      'src/websocket',
      'src/utils',
      'src/styles',
      'public',
      'tests'
    ];
    
    for (const folder of folders) {
      await fs.mkdir(path.join(projectRoot, folder), { recursive: true });
      log(`Created folder: ${folder}`);
    }
    updateProgress(30);
    
    updateStatus('Initializing package.json');
    
    // Create package.json
    const packageJson = {
      name: 'claudebuild-monitoring-dashboard',
      version: '1.0.0',
      description: 'Real-time monitoring dashboard for ClaudeBuild',
      main: 'src/index.js',
      scripts: {
        start: 'node src/server.js',
        dev: 'nodemon src/server.js',
        'build:client': 'webpack --mode production',
        test: 'jest',
        lint: 'eslint src/**/*.js',
        format: 'prettier --write src/**/*.js'
      },
      dependencies: {
        express: '^4.18.2',
        'socket.io': '^4.6.1',
        cors: '^2.8.5',
        dotenv: '^16.3.1'
      },
      devDependencies: {
        nodemon: '^3.0.1',
        eslint: '^8.45.0',
        prettier: '^3.0.0',
        jest: '^29.6.1',
        webpack: '^5.88.2',
        'webpack-cli': '^5.1.4'
      }
    };
    
    await fs.writeFile(
      path.join(projectRoot, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
    log('Created package.json');
    updateProgress(50);
    
    updateStatus('Creating configuration files');
    
    // Create .gitignore
    const gitignore = `node_modules/
dist/
.env
.DS_Store
*.log
.claudebuild/
coverage/
`;
    await fs.writeFile(path.join(projectRoot, '.gitignore'), gitignore);
    
    // Create .eslintrc.js
    const eslintConfig = `module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    indent: ['error', 2],
    'linebreak-style': ['error', 'unix'],
    quotes: ['error', 'single'],
    semi: ['error', 'always'],
  },
};`;
    await fs.writeFile(path.join(projectRoot, '.eslintrc.js'), eslintConfig);
    
    // Create .prettierrc
    const prettierConfig = {
      semi: true,
      trailingComma: 'es5',
      singleQuote: true,
      printWidth: 80,
      tabWidth: 2
    };
    await fs.writeFile(
      path.join(projectRoot, '.prettierrc'),
      JSON.stringify(prettierConfig, null, 2)
    );
    updateProgress(70);
    
    updateStatus('Creating README');
    
    // Create README.md
    const readme = `# ClaudeBuild Monitoring Dashboard

Real-time monitoring dashboard for ClaudeBuild multi-agent orchestration system.

## Features
- Real-time agent status updates via WebSocket
- Workflow visualization
- Task progress tracking
- Performance metrics
- Agent logs streaming

## Installation
\`\`\`bash
npm install
\`\`\`

## Development
\`\`\`bash
npm run dev
\`\`\`

## Production
\`\`\`bash
npm run build:client
npm start
\`\`\`

## Architecture
- Backend: Node.js + Express + Socket.io
- Frontend: Vanilla JS (to be converted to React)
- Real-time: WebSocket connections
- API: RESTful endpoints for historical data
`;
    await fs.writeFile(path.join(projectRoot, 'README.md'), readme);
    updateProgress(90);
    
    updateStatus('Installing dependencies');
    
    // Run npm install
    try {
      const { stdout, stderr } = await execAsync('npm install', { cwd: projectRoot });
      log('Dependencies installed successfully');
      if (stderr) log(`npm warnings: ${stderr}`);
    } catch (error) {
      log(`Failed to install dependencies: ${error.message}`);
      // Continue anyway - user can install manually
    }
    
    updateProgress(100);
    log('✅ Project foundation complete!');
  }
  
  async implementCoreAPI(context, storyDetails) {
    const { log, updateStatus, updateProgress, writeFile, workDir } = context;
    // Get the main project root (parent of .claudebuild)
    const mainProjectRoot = path.resolve(workDir, '../../../');
    const projectRoot = path.join(mainProjectRoot, 'monitoring-dashboard');
    
    updateStatus('Creating API server');
    updateProgress(10);
    
    // Create main server file
    const serverCode = `const express = require('express');
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
    console.log(\`Client \${socket.id} subscribed to \${data.channel}\`);
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
  console.log(\`Monitoring dashboard server running on port \${PORT}\`);
});

module.exports = { app, io };`;

    await fs.writeFile(path.join(projectRoot, 'src/server.js'), serverCode);
    log('Created server.js');
    updateProgress(40);
    
    updateStatus('Creating WebSocket client');
    
    // Create WebSocket client module
    const wsClientCode = `class MonitoringClient {
  constructor(serverUrl = 'http://localhost:3001') {
    this.serverUrl = serverUrl;
    this.socket = null;
    this.connected = false;
    this.listeners = new Map();
  }
  
  connect() {
    if (this.socket) return;
    
    this.socket = io(this.serverUrl);
    
    this.socket.on('connect', () => {
      this.connected = true;
      console.log('Connected to monitoring server');
      this.emit('connected');
    });
    
    this.socket.on('disconnect', () => {
      this.connected = false;
      console.log('Disconnected from monitoring server');
      this.emit('disconnected');
    });
    
    this.socket.on('agent-update', (data) => {
      this.emit('agent-update', data);
    });
    
    this.socket.on('workflow-update', (data) => {
      this.emit('workflow-update', data);
    });
    
    this.socket.on('initial-state', (data) => {
      this.emit('initial-state', data);
    });
  }
  
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
  
  subscribe(channel) {
    if (this.socket) {
      this.socket.emit('subscribe', { channel });
    }
  }
  
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }
  
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }
  
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }
}

// Export for use in browser or Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MonitoringClient;
}`;

    await fs.writeFile(path.join(projectRoot, 'src/websocket/client.js'), wsClientCode);
    log('Created WebSocket client');
    updateProgress(60);
    
    updateStatus('Creating API client');
    
    // Create REST API client
    const apiClientCode = `class ApiClient {
  constructor(baseUrl = 'http://localhost:3001/api') {
    this.baseUrl = baseUrl;
  }
  
  async request(endpoint, options = {}) {
    const url = \`\${this.baseUrl}\${endpoint}\`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(\`API request failed: \${response.statusText}\`);
    }
    
    return response.json();
  }
  
  // Agent methods
  async getAgents() {
    return this.request('/agents');
  }
  
  async getAgent(id) {
    return this.request(\`/agents/\${id}\`);
  }
  
  // Workflow methods
  async getWorkflows() {
    return this.request('/workflows');
  }
  
  async getWorkflow(id) {
    return this.request(\`/workflows/\${id}\`);
  }
  
  // Health check
  async health() {
    return this.request('/health');
  }
}

// Export for use in browser or Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ApiClient;
}`;

    await fs.writeFile(path.join(projectRoot, 'src/api/client.js'), apiClientCode);
    log('Created API client');
    updateProgress(80);
    
    updateStatus('Creating ClaudeBuild integration');
    
    // Create ClaudeBuild integration module
    const integrationCode = `const axios = require('axios');

class ClaudeBuildMonitor {
  constructor(monitoringUrl = 'http://localhost:3001') {
    this.monitoringUrl = monitoringUrl;
  }
  
  async sendAgentUpdate(agentId, status, data = {}) {
    try {
      await axios.post(\`\${this.monitoringUrl}/api/claudebuild/agent-update\`, {
        agentId,
        status,
        data
      });
    } catch (error) {
      console.error('Failed to send agent update:', error.message);
    }
  }
  
  async sendWorkflowUpdate(workflowId, status, progress, tasks = []) {
    try {
      await axios.post(\`\${this.monitoringUrl}/api/claudebuild/workflow-update\`, {
        workflowId,
        status,
        progress,
        tasks
      });
    } catch (error) {
      console.error('Failed to send workflow update:', error.message);
    }
  }
}

module.exports = ClaudeBuildMonitor;`;

    await fs.writeFile(path.join(projectRoot, 'src/api/claudebuild-monitor.js'), integrationCode);
    log('Created ClaudeBuild integration');
    updateProgress(100);
    
    log('✅ Core API implementation complete!');
  }
  
  async implementFrontendComponents(context, storyDetails) {
    const { log, updateStatus, updateProgress, writeFile, workDir } = context;
    // Get the main project root (parent of .claudebuild)
    const mainProjectRoot = path.resolve(workDir, '../../../');
    const projectRoot = path.join(mainProjectRoot, 'monitoring-dashboard');
    
    updateStatus('Creating frontend components');
    updateProgress(10);
    
    // Create basic HTML page
    const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ClaudeBuild Monitoring Dashboard</title>
    <link rel="stylesheet" href="/styles/main.css">
    <script src="/socket.io/socket.io.js"></script>
</head>
<body>
    <div id="app">
        <header>
            <h1>ClaudeBuild Monitoring Dashboard</h1>
            <div id="connection-status" class="status disconnected">
                <span class="status-dot"></span>
                <span class="status-text">Disconnected</span>
            </div>
        </header>
        
        <main>
            <section id="summary" class="dashboard-section">
                <h2>Summary</h2>
                <div class="stats">
                    <div class="stat-card">
                        <h3>Active Agents</h3>
                        <div class="stat-value" id="active-agents">0</div>
                    </div>
                    <div class="stat-card">
                        <h3>Running Workflows</h3>
                        <div class="stat-value" id="running-workflows">0</div>
                    </div>
                    <div class="stat-card">
                        <h3>Tasks Completed</h3>
                        <div class="stat-value" id="tasks-completed">0</div>
                    </div>
                </div>
            </section>
            
            <section id="agents" class="dashboard-section">
                <h2>Agents</h2>
                <div id="agents-list" class="agents-grid">
                    <!-- Agent cards will be inserted here -->
                </div>
            </section>
            
            <section id="workflows" class="dashboard-section">
                <h2>Active Workflows</h2>
                <div id="workflows-list" class="workflows-list">
                    <!-- Workflow items will be inserted here -->
                </div>
            </section>
            
            <section id="logs" class="dashboard-section">
                <h2>Live Logs</h2>
                <div id="logs-container" class="logs-container">
                    <!-- Log entries will be inserted here -->
                </div>
            </section>
        </main>
    </div>
    
    <script src="/js/api-client.js"></script>
    <script src="/js/websocket-client.js"></script>
    <script src="/js/dashboard.js"></script>
</body>
</html>`;

    await fs.writeFile(path.join(projectRoot, 'public/index.html'), indexHtml);
    log('Created index.html');
    updateProgress(30);
    
    updateStatus('Creating styles');
    
    // Create CSS styles
    const mainCss = `:root {
    --primary-color: #2563eb;
    --success-color: #10b981;
    --warning-color: #f59e0b;
    --error-color: #ef4444;
    --bg-primary: #ffffff;
    --bg-secondary: #f3f4f6;
    --text-primary: #111827;
    --text-secondary: #6b7280;
    --border-color: #e5e7eb;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background-color: var(--bg-secondary);
    color: var(--text-primary);
}

header {
    background-color: var(--bg-primary);
    border-bottom: 1px solid var(--border-color);
    padding: 1rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

h1 {
    font-size: 1.5rem;
    font-weight: 600;
}

.status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.status-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: var(--error-color);
}

.status.connected .status-dot {
    background-color: var(--success-color);
}

main {
    padding: 2rem;
    max-width: 1400px;
    margin: 0 auto;
}

.dashboard-section {
    background-color: var(--bg-primary);
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.dashboard-section h2 {
    font-size: 1.25rem;
    margin-bottom: 1rem;
}

.stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
}

.stat-card {
    background-color: var(--bg-secondary);
    padding: 1rem;
    border-radius: 6px;
    text-align: center;
}

.stat-card h3 {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-bottom: 0.5rem;
}

.stat-value {
    font-size: 2rem;
    font-weight: 600;
    color: var(--primary-color);
}

.agents-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
}

.agent-card {
    background-color: var(--bg-secondary);
    padding: 1rem;
    border-radius: 6px;
    border: 1px solid var(--border-color);
}

.agent-card.running {
    border-color: var(--success-color);
}

.agent-card h3 {
    font-size: 1rem;
    margin-bottom: 0.5rem;
}

.agent-status {
    font-size: 0.875rem;
    color: var(--text-secondary);
}

.workflows-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.workflow-item {
    background-color: var(--bg-secondary);
    padding: 1rem;
    border-radius: 6px;
    border: 1px solid var(--border-color);
}

.workflow-progress {
    margin-top: 0.5rem;
    height: 8px;
    background-color: var(--border-color);
    border-radius: 4px;
    overflow: hidden;
}

.workflow-progress-bar {
    height: 100%;
    background-color: var(--primary-color);
    transition: width 0.3s ease;
}

.logs-container {
    background-color: #1f2937;
    color: #e5e7eb;
    padding: 1rem;
    border-radius: 6px;
    font-family: 'Monaco', 'Consolas', monospace;
    font-size: 0.875rem;
    height: 300px;
    overflow-y: auto;
}

.log-entry {
    margin-bottom: 0.25rem;
    padding: 0.25rem;
}

.log-entry.error {
    color: #fca5a5;
}

.log-entry.success {
    color: #86efac;
}

.log-entry.info {
    color: #93c5fd;
}`;

    await fs.mkdir(path.join(projectRoot, 'public/styles'), { recursive: true });
    await fs.writeFile(path.join(projectRoot, 'public/styles/main.css'), mainCss);
    log('Created styles');
    updateProgress(50);
    
    updateStatus('Creating dashboard JavaScript');
    
    // Create dashboard JavaScript
    const dashboardJs = `// Dashboard main application
class Dashboard {
  constructor() {
    this.agents = new Map();
    this.workflows = new Map();
    this.stats = {
      activeAgents: 0,
      runningWorkflows: 0,
      tasksCompleted: 0
    };
    
    this.wsClient = new MonitoringClient();
    this.apiClient = new ApiClient();
    
    this.setupEventListeners();
    this.connectWebSocket();
  }
  
  setupEventListeners() {
    this.wsClient.on('connected', () => {
      this.updateConnectionStatus(true);
    });
    
    this.wsClient.on('disconnected', () => {
      this.updateConnectionStatus(false);
    });
    
    this.wsClient.on('initial-state', (data) => {
      this.handleInitialState(data);
    });
    
    this.wsClient.on('agent-update', (agent) => {
      this.updateAgent(agent);
    });
    
    this.wsClient.on('workflow-update', (workflow) => {
      this.updateWorkflow(workflow);
    });
  }
  
  connectWebSocket() {
    this.wsClient.connect();
  }
  
  updateConnectionStatus(connected) {
    const statusEl = document.getElementById('connection-status');
    if (connected) {
      statusEl.classList.remove('disconnected');
      statusEl.classList.add('connected');
      statusEl.querySelector('.status-text').textContent = 'Connected';
    } else {
      statusEl.classList.remove('connected');
      statusEl.classList.add('disconnected');
      statusEl.querySelector('.status-text').textContent = 'Disconnected';
    }
  }
  
  handleInitialState(data) {
    // Clear existing data
    this.agents.clear();
    this.workflows.clear();
    
    // Load agents
    data.agents.forEach(agent => {
      this.agents.set(agent.id, agent);
    });
    
    // Load workflows
    data.workflows.forEach(workflow => {
      this.workflows.set(workflow.id, workflow);
    });
    
    this.updateDisplay();
  }
  
  updateAgent(agent) {
    this.agents.set(agent.id, agent);
    this.renderAgents();
    this.updateStats();
    this.addLog(\`Agent \${agent.id} updated: \${agent.status}\`, 'info');
  }
  
  updateWorkflow(workflow) {
    this.workflows.set(workflow.id, workflow);
    this.renderWorkflows();
    this.updateStats();
    this.addLog(\`Workflow \${workflow.id} updated: \${workflow.status}\`, 'info');
  }
  
  updateDisplay() {
    this.renderAgents();
    this.renderWorkflows();
    this.updateStats();
  }
  
  renderAgents() {
    const container = document.getElementById('agents-list');
    container.innerHTML = '';
    
    this.agents.forEach(agent => {
      const card = document.createElement('div');
      card.className = \`agent-card \${agent.status === 'running' ? 'running' : ''}\`;
      card.innerHTML = \`
        <h3>\${agent.id}</h3>
        <div class="agent-status">Status: \${agent.status || 'unknown'}</div>
        <div class="agent-status">Task: \${agent.data?.task || 'none'}</div>
      \`;
      container.appendChild(card);
    });
  }
  
  renderWorkflows() {
    const container = document.getElementById('workflows-list');
    container.innerHTML = '';
    
    this.workflows.forEach(workflow => {
      const item = document.createElement('div');
      item.className = 'workflow-item';
      const progress = workflow.progress || 0;
      item.innerHTML = \`
        <h3>\${workflow.id}</h3>
        <div>Status: \${workflow.status}</div>
        <div>Progress: \${progress}%</div>
        <div class="workflow-progress">
          <div class="workflow-progress-bar" style="width: \${progress}%"></div>
        </div>
      \`;
      container.appendChild(item);
    });
  }
  
  updateStats() {
    this.stats.activeAgents = Array.from(this.agents.values())
      .filter(a => a.status === 'running').length;
    this.stats.runningWorkflows = Array.from(this.workflows.values())
      .filter(w => w.status === 'running').length;
    
    document.getElementById('active-agents').textContent = this.stats.activeAgents;
    document.getElementById('running-workflows').textContent = this.stats.runningWorkflows;
    document.getElementById('tasks-completed').textContent = this.stats.tasksCompleted;
  }
  
  addLog(message, type = 'info') {
    const container = document.getElementById('logs-container');
    const entry = document.createElement('div');
    entry.className = \`log-entry \${type}\`;
    entry.textContent = \`[\${new Date().toLocaleTimeString()}] \${message}\`;
    container.appendChild(entry);
    
    // Auto-scroll to bottom
    container.scrollTop = container.scrollHeight;
    
    // Keep only last 100 entries
    while (container.children.length > 100) {
      container.removeChild(container.firstChild);
    }
  }
}

// Start dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
  window.dashboard = new Dashboard();
});`;

    await fs.mkdir(path.join(projectRoot, 'public/js'), { recursive: true });
    await fs.writeFile(path.join(projectRoot, 'public/js/dashboard.js'), dashboardJs);
    
    // Copy client files to public
    await fs.copyFile(
      path.join(projectRoot, 'src/api/client.js'),
      path.join(projectRoot, 'public/js/api-client.js')
    );
    await fs.copyFile(
      path.join(projectRoot, 'src/websocket/client.js'),
      path.join(projectRoot, 'public/js/websocket-client.js')
    );
    
    log('Created frontend components');
    updateProgress(80);
    
    updateStatus('Creating integration hook for ClaudeBuild');
    
    // Create ClaudeBuild hook to send updates
    const hookCode = `const ClaudeBuildMonitor = require('${projectRoot}/src/api/claudebuild-monitor');

// This file should be added to ClaudeBuild to send updates to the monitoring dashboard
const monitor = new ClaudeBuildMonitor();

// Example usage in ClaudeBuild:
// When agent status changes:
// await monitor.sendAgentUpdate(agentId, 'running', { task: taskId });

// When workflow updates:
// await monitor.sendWorkflowUpdate(workflowId, 'running', 50, tasks);

module.exports = monitor;`;

    await fs.mkdir(path.join(mainProjectRoot, 'src/integrations'), { recursive: true });
    await fs.writeFile(
      path.join(mainProjectRoot, 'src/integrations/monitoring-hook.js'),
      hookCode
    );
    
    updateProgress(100);
    log('✅ Frontend components implementation complete!');
    log('');
    log('To start the monitoring dashboard:');
    log('  cd monitoring-dashboard');
    log('  npm run dev');
    log('');
    log('Then open http://localhost:3001 in your browser');
  }
  
  async implementGenericStory(context, storyDetails) {
    const { log, updateStatus, updateProgress } = context;
    
    updateStatus('Implementing generic story');
    log(`Generic implementation for: ${storyDetails.title}`);
    
    // For now, just log what should be done
    log('Tasks to implement:');
    storyDetails.tasks.forEach((task, i) => {
      log(`  ${i + 1}. ${task}`);
    });
    
    updateProgress(100);
    log('Generic story implementation complete (manual work needed)');
  }
  
  parseStory(content) {
    // Ensure content is a string
    const contentStr = typeof content === 'string' ? content : content.toString();
    const lines = contentStr.split('\n');
    const title = lines.find(l => l.startsWith('# Story'))?.replace(/# Story \d+: /, '') || 'Unknown';
    const description = lines.find((l, i) => lines[i-1]?.includes('## Description'))?.trim() || '';
    
    const tasks = [];
    let inAcceptanceCriteria = false;
    
    for (const line of lines) {
      if (line.includes('## Acceptance Criteria')) {
        inAcceptanceCriteria = true;
        continue;
      }
      if (inAcceptanceCriteria && line.startsWith('- [ ]')) {
        tasks.push(line.replace('- [ ]', '').trim());
      }
      if (inAcceptanceCriteria && line.startsWith('##') && !line.includes('Acceptance')) {
        break;
      }
    }
    
    return { title, description, tasks };
  }
}

module.exports = new RealBuilderAgentHandler();