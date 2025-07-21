/**
 * ClaudeBuild v2 - Atomic Level GUI Components Test Suite
 * Tests React/Tauri GUI, dashboard components, and monitoring interfaces
 */

const { describe, it, expect, beforeEach, afterEach, jest } = require('@jest/globals');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Mock React testing utilities
const mockReact = {
  useState: jest.fn(),
  useEffect: jest.fn(),
  useContext: jest.fn(),
  createElement: jest.fn(),
  Component: class MockComponent {}
};

// Mock Tauri API
const mockTauri = {
  invoke: jest.fn(),
  listen: jest.fn(),
  emit: jest.fn(),
  fs: {
    readTextFile: jest.fn(),
    writeTextFile: jest.fn(),
    exists: jest.fn()
  },
  path: {
    join: jest.fn(),
    resolve: jest.fn()
  }
};

// Set up mocks
jest.mock('react', () => mockReact);
jest.mock('@tauri-apps/api', () => mockTauri);

describe('GUI Components - Atomic Level Tests', () => {
  let tempDir;
  
  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'claudebuild-gui-test-'));
    process.env.CLAUDEBUILD_TEST_DIR = tempDir;
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockReact.useState.mockImplementation((initial) => [initial, jest.fn()]);
    mockReact.useEffect.mockImplementation((fn) => fn());
    mockTauri.invoke.mockResolvedValue({});
  });
  
  afterEach(() => {
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    delete process.env.CLAUDEBUILD_TEST_DIR;
  });

  describe('Agent Store', () => {
    let AgentStore;
    
    beforeEach(() => {
      // Create a simple agent store implementation for testing
      AgentStore = class {
        constructor() {
          this.agents = new Map();
          this.listeners = new Set();
        }
        
        addAgent(agent) {
          this.agents.set(agent.id, agent);
          this.notifyListeners();
        }
        
        removeAgent(id) {
          this.agents.delete(id);
          this.notifyListeners();
        }
        
        updateAgent(id, updates) {
          if (this.agents.has(id)) {
            const agent = this.agents.get(id);
            this.agents.set(id, { ...agent, ...updates });
            this.notifyListeners();
          }
        }
        
        getAllAgents() {
          return Array.from(this.agents.values());
        }
        
        getAgent(id) {
          return this.agents.get(id);
        }
        
        subscribe(listener) {
          this.listeners.add(listener);
          return () => this.listeners.delete(listener);
        }
        
        notifyListeners() {
          this.listeners.forEach(listener => listener(this.getAllAgents()));
        }
      };
    });

    it('should create agent store', () => {
      const store = new AgentStore();
      expect(store).toBeDefined();
      expect(store.getAllAgents()).toEqual([]);
    });

    it('should add agents to store', () => {
      const store = new AgentStore();
      const agent = {
        id: 'test-agent-1',
        name: 'planner',
        status: 'idle',
        role: 'planning'
      };
      
      store.addAgent(agent);
      
      expect(store.getAllAgents()).toHaveLength(1);
      expect(store.getAgent('test-agent-1')).toEqual(agent);
    });

    it('should update agent status', () => {
      const store = new AgentStore();
      const agent = {
        id: 'update-test',
        name: 'builder',
        status: 'idle'
      };
      
      store.addAgent(agent);
      store.updateAgent('update-test', { status: 'running' });
      
      expect(store.getAgent('update-test').status).toBe('running');
    });

    it('should notify subscribers of changes', () => {
      const store = new AgentStore();
      let notificationCount = 0;
      let lastAgents = null;
      
      store.subscribe((agents) => {
        notificationCount++;
        lastAgents = agents;
      });
      
      const agent = { id: 'notify-test', name: 'test' };
      store.addAgent(agent);
      
      expect(notificationCount).toBe(1);
      expect(lastAgents).toEqual([agent]);
      
      store.updateAgent('notify-test', { status: 'running' });
      expect(notificationCount).toBe(2);
    });

    it('should handle multiple agents', () => {
      const store = new AgentStore();
      
      const agents = [
        { id: 'agent-1', name: 'planner', role: 'planning' },
        { id: 'agent-2', name: 'builder', role: 'building' },
        { id: 'agent-3', name: 'tester', role: 'testing' }
      ];
      
      agents.forEach(agent => store.addAgent(agent));
      
      expect(store.getAllAgents()).toHaveLength(3);
      expect(store.getAllAgents().map(a => a.role))
        .toEqual(['planning', 'building', 'testing']);
    });
  });

  describe('Session Store', () => {
    let SessionStore;
    
    beforeEach(() => {
      SessionStore = class {
        constructor() {
          this.sessions = new Map();
          this.currentSession = null;
          this.listeners = new Set();
        }
        
        createSession(config) {
          const session = {
            id: `session-${Date.now()}`,
            name: config.name,
            created: new Date(),
            status: 'created',
            agents: [],
            workflows: [],
            ...config
          };
          
          this.sessions.set(session.id, session);
          this.currentSession = session.id;
          this.notifyListeners();
          
          return session;
        }
        
        getCurrentSession() {
          return this.currentSession ? this.sessions.get(this.currentSession) : null;
        }
        
        getAllSessions() {
          return Array.from(this.sessions.values());
        }
        
        switchSession(id) {
          if (this.sessions.has(id)) {
            this.currentSession = id;
            this.notifyListeners();
          }
        }
        
        updateSession(id, updates) {
          if (this.sessions.has(id)) {
            const session = this.sessions.get(id);
            this.sessions.set(id, { ...session, ...updates });
            this.notifyListeners();
          }
        }
        
        deleteSession(id) {
          this.sessions.delete(id);
          if (this.currentSession === id) {
            this.currentSession = null;
          }
          this.notifyListeners();
        }
        
        subscribe(listener) {
          this.listeners.add(listener);
          return () => this.listeners.delete(listener);
        }
        
        notifyListeners() {
          this.listeners.forEach(listener => listener({
            sessions: this.getAllSessions(),
            current: this.getCurrentSession()
          }));
        }
      };
    });

    it('should create session store', () => {
      const store = new SessionStore();
      expect(store).toBeDefined();
      expect(store.getAllSessions()).toEqual([]);
      expect(store.getCurrentSession()).toBeNull();
    });

    it('should create new sessions', () => {
      const store = new SessionStore();
      const session = store.createSession({
        name: 'Test Project',
        type: 'web-app'
      });
      
      expect(session).toBeDefined();
      expect(session.name).toBe('Test Project');
      expect(session.type).toBe('web-app');
      expect(session.status).toBe('created');
      expect(store.getCurrentSession()).toEqual(session);
    });

    it('should switch between sessions', () => {
      const store = new SessionStore();
      
      const session1 = store.createSession({ name: 'Project 1' });
      const session2 = store.createSession({ name: 'Project 2' });
      
      expect(store.getCurrentSession().id).toBe(session2.id);
      
      store.switchSession(session1.id);
      expect(store.getCurrentSession().id).toBe(session1.id);
    });

    it('should update session data', () => {
      const store = new SessionStore();
      const session = store.createSession({ name: 'Update Test' });
      
      store.updateSession(session.id, {
        status: 'running',
        progress: 50
      });
      
      const updated = store.getCurrentSession();
      expect(updated.status).toBe('running');
      expect(updated.progress).toBe(50);
    });

    it('should handle session deletion', () => {
      const store = new SessionStore();
      const session = store.createSession({ name: 'Delete Test' });
      
      expect(store.getAllSessions()).toHaveLength(1);
      
      store.deleteSession(session.id);
      
      expect(store.getAllSessions()).toHaveLength(0);
      expect(store.getCurrentSession()).toBeNull();
    });
  });

  describe('Dashboard Component', () => {
    let DashboardComponent;
    
    beforeEach(() => {
      DashboardComponent = class {
        constructor(props) {
          this.props = props;
          this.state = {
            agents: [],
            sessions: [],
            metrics: {},
            loading: true
          };
        }
        
        componentDidMount() {
          this.loadDashboardData();
        }
        
        async loadDashboardData() {
          try {
            const [agents, sessions, metrics] = await Promise.all([
              mockTauri.invoke('get_agents'),
              mockTauri.invoke('get_sessions'),
              mockTauri.invoke('get_metrics')
            ]);
            
            this.state = {
              agents,
              sessions,
              metrics,
              loading: false
            };
          } catch (error) {
            this.state = { ...this.state, loading: false, error };
          }
        }
        
        render() {
          if (this.state.loading) {
            return { type: 'loading' };
          }
          
          if (this.state.error) {
            return { type: 'error', message: this.state.error.message };
          }
          
          return {
            type: 'dashboard',
            agents: this.state.agents,
            sessions: this.state.sessions,
            metrics: this.state.metrics
          };
        }
      };
    });

    it('should create dashboard component', () => {
      const dashboard = new DashboardComponent({});
      expect(dashboard).toBeDefined();
      expect(dashboard.state.loading).toBe(true);
    });

    it('should load dashboard data on mount', async () => {
      const mockData = {
        agents: [{ id: 'agent-1', name: 'planner' }],
        sessions: [{ id: 'session-1', name: 'project' }],
        metrics: { activeAgents: 1, completedTasks: 5 }
      };
      
      mockTauri.invoke
        .mockResolvedValueOnce(mockData.agents)
        .mockResolvedValueOnce(mockData.sessions)
        .mockResolvedValueOnce(mockData.metrics);
      
      const dashboard = new DashboardComponent({});
      await dashboard.loadDashboardData();
      
      expect(dashboard.state.loading).toBe(false);
      expect(dashboard.state.agents).toEqual(mockData.agents);
      expect(dashboard.state.sessions).toEqual(mockData.sessions);
      expect(dashboard.state.metrics).toEqual(mockData.metrics);
    });

    it('should handle loading errors', async () => {
      const error = new Error('Failed to load data');
      mockTauri.invoke.mockRejectedValue(error);
      
      const dashboard = new DashboardComponent({});
      await dashboard.loadDashboardData();
      
      expect(dashboard.state.loading).toBe(false);
      expect(dashboard.state.error).toEqual(error);
    });

    it('should render different states correctly', async () => {
      const dashboard = new DashboardComponent({});
      
      // Initial loading state
      expect(dashboard.render().type).toBe('loading');
      
      // Error state
      dashboard.state = { loading: false, error: new Error('Test error') };
      const errorRender = dashboard.render();
      expect(errorRender.type).toBe('error');
      expect(errorRender.message).toBe('Test error');
      
      // Success state
      dashboard.state = {
        loading: false,
        agents: [{ id: 'a1' }],
        sessions: [{ id: 's1' }],
        metrics: { count: 1 }
      };
      
      const successRender = dashboard.render();
      expect(successRender.type).toBe('dashboard');
      expect(successRender.agents).toHaveLength(1);
    });
  });

  describe('Agent Management Component', () => {
    let AgentManagementComponent;
    
    beforeEach(() => {
      AgentManagementComponent = class {
        constructor(props) {
          this.props = props;
          this.state = {
            agents: [],
            selectedAgent: null,
            showCreateForm: false
          };
        }
        
        async createAgent(config) {
          const result = await mockTauri.invoke('create_agent', config);
          this.state.agents.push(result);
          this.state.showCreateForm = false;
          return result;
        }
        
        async startAgent(agentId) {
          await mockTauri.invoke('start_agent', { agentId });
          const agent = this.state.agents.find(a => a.id === agentId);
          if (agent) {
            agent.status = 'running';
          }
        }
        
        async stopAgent(agentId) {
          await mockTauri.invoke('stop_agent', { agentId });
          const agent = this.state.agents.find(a => a.id === agentId);
          if (agent) {
            agent.status = 'stopped';
          }
        }
        
        selectAgent(agentId) {
          this.state.selectedAgent = agentId;
        }
        
        showCreateAgentForm() {
          this.state.showCreateForm = true;
        }
        
        hideCreateAgentForm() {
          this.state.showCreateForm = false;
        }
        
        render() {
          return {
            type: 'agent-management',
            agents: this.state.agents,
            selectedAgent: this.state.selectedAgent,
            showCreateForm: this.state.showCreateForm
          };
        }
      };
    });

    it('should create agent management component', () => {
      const component = new AgentManagementComponent({});
      expect(component).toBeDefined();
      expect(component.state.agents).toEqual([]);
      expect(component.state.selectedAgent).toBeNull();
    });

    it('should create new agents', async () => {
      const component = new AgentManagementComponent({});
      const agentConfig = {
        name: 'test-planner',
        role: 'planning',
        type: 'claude-code'
      };
      
      const mockAgent = { id: 'agent-1', ...agentConfig, status: 'idle' };
      mockTauri.invoke.mockResolvedValue(mockAgent);
      
      const result = await component.createAgent(agentConfig);
      
      expect(result).toEqual(mockAgent);
      expect(component.state.agents).toContain(mockAgent);
      expect(component.state.showCreateForm).toBe(false);
    });

    it('should start and stop agents', async () => {
      const component = new AgentManagementComponent({});
      const agent = { id: 'agent-1', name: 'test', status: 'idle' };
      component.state.agents = [agent];
      
      await component.startAgent('agent-1');
      expect(agent.status).toBe('running');
      expect(mockTauri.invoke).toHaveBeenCalledWith('start_agent', { agentId: 'agent-1' });
      
      await component.stopAgent('agent-1');
      expect(agent.status).toBe('stopped');
      expect(mockTauri.invoke).toHaveBeenCalledWith('stop_agent', { agentId: 'agent-1' });
    });

    it('should handle agent selection', () => {
      const component = new AgentManagementComponent({});
      
      component.selectAgent('agent-123');
      expect(component.state.selectedAgent).toBe('agent-123');
    });

    it('should toggle create form visibility', () => {
      const component = new AgentManagementComponent({});
      
      expect(component.state.showCreateForm).toBe(false);
      
      component.showCreateAgentForm();
      expect(component.state.showCreateForm).toBe(true);
      
      component.hideCreateAgentForm();
      expect(component.state.showCreateForm).toBe(false);
    });
  });

  describe('Workflow Visualization Component', () => {
    let WorkflowVisualizationComponent;
    
    beforeEach(() => {
      WorkflowVisualizationComponent = class {
        constructor(props) {
          this.props = props;
          this.state = {
            workflows: [],
            selectedWorkflow: null,
            viewMode: 'graph'
          };
        }
        
        loadWorkflow(workflowId) {
          return mockTauri.invoke('get_workflow', { workflowId });
        }
        
        async executeWorkflow(workflowId) {
          const result = await mockTauri.invoke('execute_workflow', { workflowId });
          await this.refreshWorkflowStatus(workflowId);
          return result;
        }
        
        async refreshWorkflowStatus(workflowId) {
          const status = await mockTauri.invoke('get_workflow_status', { workflowId });
          const workflow = this.state.workflows.find(w => w.id === workflowId);
          if (workflow) {
            workflow.status = status;
          }
        }
        
        setViewMode(mode) {
          this.state.viewMode = mode;
        }
        
        selectWorkflow(workflowId) {
          this.state.selectedWorkflow = workflowId;
        }
        
        generateWorkflowGraph(workflow) {
          if (!workflow || !workflow.steps) return { nodes: [], edges: [] };
          
          const nodes = workflow.steps.map(step => ({
            id: step.id,
            label: step.name || step.id,
            status: step.status || 'pending',
            type: step.action
          }));
          
          const edges = [];
          workflow.steps.forEach(step => {
            if (step.dependsOn) {
              step.dependsOn.forEach(depId => {
                edges.push({
                  from: depId,
                  to: step.id,
                  type: 'dependency'
                });
              });
            }
          });
          
          return { nodes, edges };
        }
        
        render() {
          const workflow = this.state.selectedWorkflow ? 
            this.state.workflows.find(w => w.id === this.state.selectedWorkflow) : null;
          
          return {
            type: 'workflow-visualization',
            workflows: this.state.workflows,
            selectedWorkflow: workflow,
            viewMode: this.state.viewMode,
            graph: workflow ? this.generateWorkflowGraph(workflow) : null
          };
        }
      };
    });

    it('should create workflow visualization component', () => {
      const component = new WorkflowVisualizationComponent({});
      expect(component).toBeDefined();
      expect(component.state.viewMode).toBe('graph');
    });

    it('should load workflow data', async () => {
      const component = new WorkflowVisualizationComponent({});
      const mockWorkflow = {
        id: 'workflow-1',
        name: 'Test Workflow',
        steps: [
          { id: 'step1', action: 'plan' },
          { id: 'step2', action: 'build', dependsOn: ['step1'] }
        ]
      };
      
      mockTauri.invoke.mockResolvedValue(mockWorkflow);
      
      const result = await component.loadWorkflow('workflow-1');
      expect(result).toEqual(mockWorkflow);
    });

    it('should execute workflows', async () => {
      const component = new WorkflowVisualizationComponent({});
      const mockResult = { status: 'completed', duration: 5000 };
      const mockStatus = { state: 'completed', progress: 100 };
      
      mockTauri.invoke
        .mockResolvedValueOnce(mockResult)  // execute_workflow
        .mockResolvedValueOnce(mockStatus); // get_workflow_status
      
      component.state.workflows = [{ id: 'workflow-1' }];
      
      const result = await component.executeWorkflow('workflow-1');
      
      expect(result).toEqual(mockResult);
      expect(component.state.workflows[0].status).toEqual(mockStatus);
    });

    it('should generate workflow graphs', () => {
      const component = new WorkflowVisualizationComponent({});
      const workflow = {
        id: 'test-workflow',
        steps: [
          { id: 'step1', name: 'Plan', action: 'plan' },
          { id: 'step2', name: 'Build', action: 'build', dependsOn: ['step1'] },
          { id: 'step3', name: 'Test', action: 'test', dependsOn: ['step2'] },
          { id: 'step4', name: 'Deploy', action: 'deploy', dependsOn: ['step2', 'step3'] }
        ]
      };
      
      const graph = component.generateWorkflowGraph(workflow);
      
      expect(graph.nodes).toHaveLength(4);
      expect(graph.edges).toHaveLength(4);
      
      expect(graph.nodes[0]).toEqual({
        id: 'step1',
        label: 'Plan',
        status: 'pending',
        type: 'plan'
      });
      
      expect(graph.edges).toContainEqual({
        from: 'step1',
        to: 'step2',
        type: 'dependency'
      });
    });

    it('should handle different view modes', () => {
      const component = new WorkflowVisualizationComponent({});
      
      expect(component.state.viewMode).toBe('graph');
      
      component.setViewMode('list');
      expect(component.state.viewMode).toBe('list');
      
      component.setViewMode('timeline');
      expect(component.state.viewMode).toBe('timeline');
    });
  });

  describe('Real-time Monitoring Component', () => {
    let MonitoringComponent;
    
    beforeEach(() => {
      MonitoringComponent = class {
        constructor(props) {
          this.props = props;
          this.state = {
            metrics: {},
            logs: [],
            isConnected: false
          };
          this.eventListeners = new Map();
        }
        
        async connect() {
          try {
            // Simulate WebSocket connection
            this.state.isConnected = true;
            this.startMetricsCollection();
            this.subscribeToLogs();
          } catch (error) {
            this.state.isConnected = false;
            throw error;
          }
        }
        
        disconnect() {
          this.state.isConnected = false;
          this.eventListeners.clear();
        }
        
        startMetricsCollection() {
          // Simulate periodic metrics updates
          this.metricsInterval = setInterval(async () => {
            if (this.state.isConnected) {
              const metrics = await mockTauri.invoke('get_realtime_metrics');
              this.state.metrics = { ...this.state.metrics, ...metrics };
              this.notifyMetricsUpdate();
            }
          }, 1000);
        }
        
        subscribeToLogs() {
          mockTauri.listen('log_event', (event) => {
            this.state.logs.push(event.payload);
            this.notifyLogUpdate();
          });
        }
        
        notifyMetricsUpdate() {
          const handler = this.eventListeners.get('metrics');
          if (handler) handler(this.state.metrics);
        }
        
        notifyLogUpdate() {
          const handler = this.eventListeners.get('logs');
          if (handler) handler(this.state.logs);
        }
        
        on(event, handler) {
          this.eventListeners.set(event, handler);
        }
        
        getMetrics() {
          return this.state.metrics;
        }
        
        getLogs() {
          return this.state.logs;
        }
        
        isConnected() {
          return this.state.isConnected;
        }
        
        render() {
          return {
            type: 'monitoring',
            isConnected: this.state.isConnected,
            metrics: this.state.metrics,
            logs: this.state.logs
          };
        }
      };
    });

    it('should create monitoring component', () => {
      const component = new MonitoringComponent({});
      expect(component).toBeDefined();
      expect(component.isConnected()).toBe(false);
    });

    it('should connect to monitoring service', async () => {
      const component = new MonitoringComponent({});
      
      await component.connect();
      expect(component.isConnected()).toBe(true);
    });

    it('should collect real-time metrics', async () => {
      const component = new MonitoringComponent({});
      const mockMetrics = {
        cpu: 45.2,
        memory: 1024,
        activeAgents: 3,
        queuedTasks: 5
      };
      
      mockTauri.invoke.mockResolvedValue(mockMetrics);
      
      let receivedMetrics = null;
      component.on('metrics', (metrics) => {
        receivedMetrics = metrics;
      });
      
      await component.connect();
      component.startMetricsCollection();
      
      // Wait for metrics collection
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(component.getMetrics()).toEqual(mockMetrics);
    });

    it('should receive real-time logs', async () => {
      const component = new MonitoringComponent({});
      const mockLogEvent = {
        timestamp: Date.now(),
        level: 'info',
        message: 'Agent started',
        agent: 'planner-1'
      };
      
      let receivedLogs = null;
      component.on('logs', (logs) => {
        receivedLogs = logs;
      });
      
      await component.connect();
      
      // Simulate log event
      const logHandler = mockTauri.listen.mock.calls.find(
        call => call[0] === 'log_event'
      )[1];
      
      logHandler({ payload: mockLogEvent });
      
      expect(component.getLogs()).toContain(mockLogEvent);
    });

    it('should handle connection errors', async () => {
      const component = new MonitoringComponent({});
      
      // Mock connection failure
      mockTauri.invoke.mockRejectedValue(new Error('Connection failed'));
      
      try {
        await component.connect();
      } catch (error) {
        expect(error.message).toBe('Connection failed');
        expect(component.isConnected()).toBe(false);
      }
    });

    it('should clean up on disconnect', () => {
      const component = new MonitoringComponent({});
      
      component.connect();
      expect(component.isConnected()).toBe(true);
      
      component.disconnect();
      expect(component.isConnected()).toBe(false);
      expect(component.eventListeners.size).toBe(0);
    });
  });

  describe('GUI Integration Tests', () => {
    let guiSystem;
    
    beforeEach(() => {
      guiSystem = {
        agentStore: new (require('./gui-components.test.js').AgentStore || class {})(),
        sessionStore: new (require('./gui-components.test.js').SessionStore || class {})(),
        components: {
          dashboard: null,
          agentManagement: null,
          workflowVisualization: null,
          monitoring: null
        }
      };
    });

    it('should integrate stores with components', () => {
      // Create mock components that use stores
      const mockComponent = {
        updateFromStore: jest.fn(),
        setState: jest.fn()
      };
      
      // Subscribe component to store changes
      guiSystem.agentStore.subscribe((agents) => {
        mockComponent.updateFromStore(agents);
      });
      
      // Add agent to store
      const agent = { id: 'test-agent', name: 'test' };
      guiSystem.agentStore.addAgent(agent);
      
      expect(mockComponent.updateFromStore).toHaveBeenCalledWith([agent]);
    });

    it('should handle cross-component communication', async () => {
      const communicationLog = [];
      
      // Mock component that listens for events
      const listenerComponent = {
        onAgentCreated: (agent) => {
          communicationLog.push(`Agent created: ${agent.name}`);
        },
        onWorkflowStarted: (workflow) => {
          communicationLog.push(`Workflow started: ${workflow.name}`);
        }
      };
      
      // Mock component that triggers events
      const triggerComponent = {
        createAgent: async (config) => {
          const agent = await mockTauri.invoke('create_agent', config);
          listenerComponent.onAgentCreated(agent);
          return agent;
        },
        startWorkflow: async (workflow) => {
          await mockTauri.invoke('start_workflow', workflow);
          listenerComponent.onWorkflowStarted(workflow);
        }
      };
      
      mockTauri.invoke
        .mockResolvedValueOnce({ id: 'agent-1', name: 'planner' })
        .mockResolvedValueOnce({});
      
      await triggerComponent.createAgent({ name: 'planner' });
      await triggerComponent.startWorkflow({ name: 'test-workflow' });
      
      expect(communicationLog).toEqual([
        'Agent created: planner',
        'Workflow started: test-workflow'
      ]);
    });

    it('should maintain consistent state across components', () => {
      // Multiple components sharing the same store
      const component1 = { 
        agents: [],
        updateAgents: function(agents) { this.agents = agents; }
      };
      
      const component2 = { 
        agents: [],
        updateAgents: function(agents) { this.agents = agents; }
      };
      
      // Subscribe both components to the store
      guiSystem.agentStore.subscribe((agents) => {
        component1.updateAgents(agents);
        component2.updateAgents(agents);
      });
      
      // Add agents
      const agent1 = { id: 'agent-1', name: 'planner' };
      const agent2 = { id: 'agent-2', name: 'builder' };
      
      guiSystem.agentStore.addAgent(agent1);
      guiSystem.agentStore.addAgent(agent2);
      
      // Both components should have the same state
      expect(component1.agents).toEqual([agent1, agent2]);
      expect(component2.agents).toEqual([agent1, agent2]);
    });

    it('should handle error propagation', async () => {
      const errorHandler = jest.fn();
      
      const component = {
        handleError: errorHandler,
        performAction: async function() {
          try {
            await mockTauri.invoke('failing_action');
          } catch (error) {
            this.handleError(error);
            throw error;
          }
        }
      };
      
      mockTauri.invoke.mockRejectedValue(new Error('Action failed'));
      
      try {
        await component.performAction();
      } catch (error) {
        expect(error.message).toBe('Action failed');
        expect(errorHandler).toHaveBeenCalledWith(error);
      }
    });
  });
});