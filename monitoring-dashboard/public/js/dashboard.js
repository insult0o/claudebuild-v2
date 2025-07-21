// Dashboard main application
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
    this.addLog(`Agent ${agent.id} updated: ${agent.status}`, 'info');
  }
  
  updateWorkflow(workflow) {
    this.workflows.set(workflow.id, workflow);
    this.renderWorkflows();
    this.updateStats();
    this.addLog(`Workflow ${workflow.id} updated: ${workflow.status}`, 'info');
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
      card.className = `agent-card ${agent.status === 'running' ? 'running' : ''}`;
      card.innerHTML = `
        <h3>${agent.id}</h3>
        <div class="agent-status">Status: ${agent.status || 'unknown'}</div>
        <div class="agent-status">Task: ${agent.data?.task || 'none'}</div>
      `;
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
      item.innerHTML = `
        <h3>${workflow.id}</h3>
        <div>Status: ${workflow.status}</div>
        <div>Progress: ${progress}%</div>
        <div class="workflow-progress">
          <div class="workflow-progress-bar" style="width: ${progress}%"></div>
        </div>
      `;
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
    entry.className = `log-entry ${type}`;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
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
});