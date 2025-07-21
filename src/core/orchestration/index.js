const EventEmitter = require('events');
const path = require('path');
const fs = require('fs').promises;
const Logger = require('../../cli/utils/logger');
const ConfigManager = require('../config');
const AgentManager = require('../agents/manager');
const MessageBus = require('../agents/message-bus');
const WorkflowEngine = require('./workflow-engine');
const StateManager = require('./state-manager');
const DependencyResolver = require('./dependency-resolver');

/**
 * Main Orchestration Engine
 * Coordinates all agents and manages workflows
 */
class OrchestrationEngine extends EventEmitter {
  constructor() {
    super();
    this.config = ConfigManager.getInstance ? ConfigManager.getInstance() : ConfigManager;
    this.agentManager = require('../agents/manager');
    this.messageBus = MessageBus;
    this.workflowEngine = new WorkflowEngine();
    this.stateManager = new StateManager();
    this.dependencyResolver = new DependencyResolver();
    
    this.activeWorkflows = new Map();
    this.isRunning = false;
    
    this.setupEventHandlers();
  }

  /**
   * Setup event handlers for agent communication
   */
  setupEventHandlers() {
    // Listen for agent events
    this.messageBus.on('agent:started', this.handleAgentStarted.bind(this));
    this.messageBus.on('agent:completed', this.handleAgentCompleted.bind(this));
    this.messageBus.on('agent:failed', this.handleAgentFailed.bind(this));
    this.messageBus.on('agent:progress', this.handleAgentProgress.bind(this));
    
    // Listen for workflow events
    this.workflowEngine.on('workflow:ready', this.handleWorkflowReady.bind(this));
    this.workflowEngine.on('task:ready', this.handleTaskReady.bind(this));
    this.workflowEngine.on('workflow:completed', this.handleWorkflowCompleted.bind(this));
    
    // Listen for tool requests
    this.messageBus.on('tool:request', this.handleToolRequest.bind(this));
  }

  /**
   * Start the orchestration engine
   */
  async start() {
    if (this.isRunning) {
      Logger.warn('Orchestration engine is already running');
      return;
    }

    try {
      Logger.info('🚀 Starting Orchestration Engine...');
      
      // Initialize components
      await this.agentManager.initialize();
      await this.stateManager.initialize();
      await this.workflowEngine.initialize();
      
      // Initialize monitoring integration
      try {
        const MonitoringIntegration = require('../../integrations/monitoring');
        this.monitoring = new MonitoringIntegration();
        this.monitoring.initialize(this, this.agentManager);
        Logger.info('Monitoring integration initialized');
      } catch (error) {
        Logger.warn('Monitoring integration not available:', error.message);
      }
      
      this.isRunning = true;
      this.emit('engine:started');
      
      Logger.success('✅ Orchestration Engine started successfully');
      
    } catch (error) {
      Logger.error('Failed to start orchestration engine:', error.message);
      throw error;
    }
  }

  /**
   * Stop the orchestration engine
   */
  async stop() {
    if (!this.isRunning) {
      return;
    }

    Logger.info('Stopping Orchestration Engine...');
    
    // Stop all active workflows
    for (const [workflowId, workflow] of this.activeWorkflows) {
      await this.pauseWorkflow(workflowId);
    }
    
    // Shutdown components
    await this.agentManager.shutdown();
    
    this.isRunning = false;
    this.emit('engine:stopped');
    
    Logger.info('Orchestration Engine stopped');
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(workflowDefinition, context = {}) {
    if (!this.isRunning) {
      throw new Error('Orchestration engine is not running');
    }

    const workflowId = this.generateWorkflowId();
    
    Logger.info(`Starting workflow: ${workflowId}`);
    Logger.debug('Workflow definition:', workflowDefinition);
    
    try {
      // Create workflow instance
      const workflow = await this.workflowEngine.createWorkflow(
        workflowId,
        workflowDefinition,
        context
      );
      
      // Store active workflow
      this.activeWorkflows.set(workflowId, workflow);
      
      // Save initial state
      await this.stateManager.saveWorkflowState(workflowId, {
        status: 'running',
        definition: workflowDefinition,
        context: context,
        startedAt: new Date().toISOString()
      });
      
      // Start workflow execution
      await this.workflowEngine.startWorkflow(workflowId);
      
      this.emit('workflow:started', { workflowId, definition: workflowDefinition });
      
      return workflowId;
      
    } catch (error) {
      Logger.error(`Failed to execute workflow: ${error.message}`);
      await this.stateManager.saveWorkflowState(workflowId, {
        status: 'failed',
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Execute a task from a tasks.json file
   */
  async executeTasksFile(tasksFilePath) {
    try {
      const tasksContent = await fs.readFile(tasksFilePath, 'utf-8');
      const tasksData = JSON.parse(tasksContent);
      
      // Convert tasks.json to workflow definition
      const workflowDef = this.convertTasksToWorkflow(tasksData);
      
      // Execute workflow
      return await this.executeWorkflow(workflowDef, {
        source: 'tasks.json',
        tasksFile: tasksFilePath,
        project: tasksData.project
      });
      
    } catch (error) {
      Logger.error('Failed to execute tasks file:', error.message);
      throw error;
    }
  }

  /**
   * Convert tasks.json format to workflow definition
   */
  convertTasksToWorkflow(tasksData) {
    const workflow = {
      name: tasksData.project || 'unnamed-workflow',
      description: `Generated from tasks.json`,
      tasks: {},
      dependencies: {}
    };
    
    // Convert each task
    tasksData.tasks.forEach(task => {
      workflow.tasks[task.id] = {
        id: task.id,
        type: task.type || 'builder',
        agent: task.agent || task.type,
        description: task.description,
        input: task.input || {
          story: task.story,
          context: task.context || {}
        },
        metadata: {
          priority: task.priority,
          estimated_time: task.estimated_time
        }
      };
      
      // Add dependencies
      if (task.dependencies && task.dependencies.length > 0) {
        workflow.dependencies[task.id] = task.dependencies;
      }
    });
    
    // Add workflow settings
    workflow.settings = {
      parallelLimit: tasksData.workflow?.parallel_limit || 4,
      autoQA: tasksData.workflow?.auto_qa !== false,
      autoMerge: tasksData.workflow?.auto_merge || false
    };
    
    return workflow;
  }

  /**
   * Handle task ready event
   */
  async handleTaskReady(event) {
    const { workflowId, taskId, task } = event;
    
    Logger.info(`Task ready for execution: ${taskId}`);
    
    try {
      // Check if we have capacity to run this task
      const runningAgents = await this.agentManager.getRunningAgentsCount();
      const parallelLimit = this.getWorkflowSettings(workflowId).parallelLimit || 4;
      
      if (runningAgents >= parallelLimit) {
        Logger.info(`Reached parallel limit (${parallelLimit}), queuing task ${taskId}`);
        this.workflowEngine.queueTask(workflowId, taskId);
        return;
      }
      
      // Create and start agent for this task
      const agentId = `${task.agent}-${Date.now()}`;
      const agent = await this.agentManager.createAgent(agentId, {
        type: task.type,
        workflowId: workflowId,
        taskId: taskId
      });
      
      // Update task state
      await this.stateManager.updateTaskState(workflowId, taskId, {
        status: 'running',
        agentId: agentId,
        startedAt: new Date().toISOString()
      });
      
      // Start agent with task
      await agent.start(task);
      
      this.emit('task:started', { workflowId, taskId, agentId });
      
    } catch (error) {
      Logger.error(`Failed to start task ${taskId}:`, error.message);
      await this.handleTaskError(workflowId, taskId, error);
    }
  }

  /**
   * Handle agent completed event
   */
  async handleAgentCompleted(event) {
    const { agentId, result } = event;
    const agent = this.agentManager.getAgent(agentId);
    
    if (!agent) {
      Logger.warn(`Unknown agent completed: ${agentId}`);
      return;
    }
    
    const { workflowId, taskId } = agent.config;
    
    Logger.info(`Orchestrator: Agent ${agentId} completed task ${taskId}`);
    
    // Update task state
    await this.stateManager.updateTaskState(workflowId, taskId, {
      status: 'completed',
      result: result,
      completedAt: new Date().toISOString()
    });
    
    // Notify workflow engine
    Logger.debug(`Orchestrator: Notifying workflow engine about task ${taskId} completion`);
    await this.workflowEngine.completeTask(workflowId, taskId, result);
    
    // Check for queued tasks
    await this.processQueuedTasks(workflowId);
    
    // Clean up agent
    await this.agentManager.removeAgent(agentId);
    
    this.emit('task:completed', { workflowId, taskId, result });
  }

  /**
   * Handle agent failed event
   */
  async handleAgentFailed(event) {
    const { agentId, error } = event;
    const agent = this.agentManager.getAgent(agentId);
    
    if (!agent) {
      Logger.warn(`Unknown agent failed: ${agentId}`);
      return;
    }
    
    const { workflowId, taskId } = agent.config;
    
    Logger.error(`Agent ${agentId} failed on task ${taskId}:`, error.message);
    
    await this.handleTaskError(workflowId, taskId, error);
    
    // Clean up agent
    await this.agentManager.removeAgent(agentId);
  }

  /**
   * Handle task error
   */
  async handleTaskError(workflowId, taskId, error) {
    // Update task state
    await this.stateManager.updateTaskState(workflowId, taskId, {
      status: 'failed',
      error: error.message,
      failedAt: new Date().toISOString()
    });
    
    // Check retry policy
    const task = this.workflowEngine.getTask(workflowId, taskId);
    const retries = task.retries || 0;
    const maxRetries = task.maxRetries || 3;
    
    if (retries < maxRetries) {
      Logger.info(`Retrying task ${taskId} (attempt ${retries + 1}/${maxRetries})`);
      
      // Update retry count
      task.retries = retries + 1;
      
      // Re-queue task
      setTimeout(() => {
        this.workflowEngine.retryTask(workflowId, taskId);
      }, 5000 * (retries + 1)); // Exponential backoff
      
    } else {
      // Mark workflow as failed if critical task
      if (task.critical !== false) {
        await this.failWorkflow(workflowId, `Critical task ${taskId} failed`);
      } else {
        Logger.warn(`Non-critical task ${taskId} failed, continuing workflow`);
        await this.workflowEngine.skipTask(workflowId, taskId);
      }
    }
    
    this.emit('task:failed', { workflowId, taskId, error: error.message });
  }

  /**
   * Handle workflow completed
   */
  async handleWorkflowCompleted(event) {
    const { workflowId, results } = event;
    
    Logger.success(`Workflow ${workflowId} completed successfully`);
    
    // Update workflow state
    await this.stateManager.saveWorkflowState(workflowId, {
      status: 'completed',
      results: results,
      completedAt: new Date().toISOString()
    });
    
    // Remove from active workflows
    this.activeWorkflows.delete(workflowId);
    
    // Run post-workflow actions if defined
    const workflow = this.workflowEngine.getWorkflow(workflowId);
    if (workflow.postActions) {
      await this.runPostActions(workflowId, workflow.postActions, results);
    }
    
    this.emit('workflow:completed', { workflowId, results });
  }

  /**
   * Handle tool request from agent
   */
  async handleToolRequest(event) {
    const { agentId, tool, reason } = event;
    
    Logger.info(`Agent ${agentId} requesting tool: ${tool}`);
    Logger.debug(`Reason: ${reason}`);
    
    // Check tool access policy
    const policy = await this.checkToolAccessPolicy(agentId, tool);
    
    if (policy.allowed) {
      // Grant tool access
      this.messageBus.sendToAgent(agentId, {
        type: 'tool:granted',
        tool: tool,
        config: policy.config
      });
      
      // Log tool usage
      await this.logToolUsage(agentId, tool, 'granted', reason);
      
    } else {
      // Deny tool access
      this.messageBus.sendToAgent(agentId, {
        type: 'tool:denied',
        tool: tool,
        reason: policy.reason
      });
      
      // Log denial
      await this.logToolUsage(agentId, tool, 'denied', reason);
    }
  }

  /**
   * Check tool access policy
   */
  async checkToolAccessPolicy(agentId, tool) {
    // Load policy from config
    const policies = this.config.get('orchestration.toolAccessPolicies', {});
    const defaultPolicy = this.config.get('orchestration.defaultToolPolicy', 'allow');
    
    // Check specific tool policy
    if (policies[tool]) {
      return policies[tool];
    }
    
    // Check agent type policy
    const agent = this.agentManager.getAgent(agentId);
    if (agent && policies[agent.config.type]) {
      const typePolicy = policies[agent.config.type];
      if (typePolicy[tool] !== undefined) {
        return { allowed: typePolicy[tool] };
      }
    }
    
    // Apply default policy
    return { allowed: defaultPolicy === 'allow' };
  }

  /**
   * Process queued tasks when capacity is available
   */
  async processQueuedTasks(workflowId) {
    const queuedTasks = this.workflowEngine.getQueuedTasks(workflowId);
    
    if (queuedTasks.length === 0) {
      return;
    }
    
    const runningAgents = await this.agentManager.getRunningAgentsCount();
    const parallelLimit = this.getWorkflowSettings(workflowId).parallelLimit || 4;
    const capacity = parallelLimit - runningAgents;
    
    if (capacity > 0) {
      const tasksToStart = queuedTasks.slice(0, capacity);
      
      for (const taskId of tasksToStart) {
        const task = this.workflowEngine.dequeueTask(workflowId, taskId);
        if (task) {
          await this.handleTaskReady({ workflowId, taskId, task });
        }
      }
    }
  }

  /**
   * Get workflow settings
   */
  getWorkflowSettings(workflowId) {
    const workflow = this.workflowEngine.getWorkflow(workflowId);
    return workflow?.settings || {};
  }

  /**
   * Pause a workflow
   */
  async pauseWorkflow(workflowId) {
    Logger.info(`Pausing workflow: ${workflowId}`);
    
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }
    
    // Pause workflow engine
    await this.workflowEngine.pauseWorkflow(workflowId);
    
    // Stop all agents for this workflow
    const agents = this.agentManager.getAgentsByWorkflow(workflowId);
    for (const agent of agents) {
      await agent.stop();
    }
    
    // Update state
    await this.stateManager.updateWorkflowState(workflowId, {
      status: 'paused',
      pausedAt: new Date().toISOString()
    });
    
    this.emit('workflow:paused', { workflowId });
  }

  /**
   * Resume a workflow
   */
  async resumeWorkflow(workflowId) {
    Logger.info(`Resuming workflow: ${workflowId}`);
    
    // Load workflow state
    const state = await this.stateManager.getWorkflowState(workflowId);
    if (!state || state.status !== 'paused') {
      throw new Error(`Workflow ${workflowId} is not paused`);
    }
    
    // Resume workflow engine
    await this.workflowEngine.resumeWorkflow(workflowId);
    
    // Update state
    await this.stateManager.updateWorkflowState(workflowId, {
      status: 'running',
      resumedAt: new Date().toISOString()
    });
    
    this.emit('workflow:resumed', { workflowId });
  }

  /**
   * Fail a workflow
   */
  async failWorkflow(workflowId, reason) {
    Logger.error(`Failing workflow ${workflowId}: ${reason}`);
    
    // Stop all agents
    const agents = this.agentManager.getAgentsByWorkflow(workflowId);
    for (const agent of agents) {
      await agent.stop();
    }
    
    // Update state
    await this.stateManager.saveWorkflowState(workflowId, {
      status: 'failed',
      error: reason,
      failedAt: new Date().toISOString()
    });
    
    // Remove from active workflows
    this.activeWorkflows.delete(workflowId);
    
    this.emit('workflow:failed', { workflowId, reason });
  }

  /**
   * Get workflow status
   */
  async getWorkflowStatus(workflowId) {
    const state = await this.stateManager.getWorkflowState(workflowId);
    const workflow = this.workflowEngine.getWorkflow(workflowId);
    
    if (!state && !workflow) {
      return null;
    }
    
    const tasks = workflow ? this.workflowEngine.getWorkflowTasks(workflowId) : [];
    const taskStates = await Promise.all(
      tasks.map(taskId => this.stateManager.getTaskState(workflowId, taskId))
    );
    
    return {
      workflowId,
      status: state?.status || 'unknown',
      progress: this.calculateProgress(taskStates),
      tasks: taskStates,
      startedAt: state?.startedAt,
      completedAt: state?.completedAt,
      error: state?.error
    };
  }

  /**
   * Calculate workflow progress
   */
  calculateProgress(taskStates) {
    if (taskStates.length === 0) {
      return 0;
    }
    
    const completed = taskStates.filter(t => t?.status === 'completed').length;
    return Math.round((completed / taskStates.length) * 100);
  }

  /**
   * Log tool usage
   */
  async logToolUsage(agentId, tool, decision, reason) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      agentId,
      tool,
      decision,
      reason
    };
    
    // Append to tool usage log
    const logPath = path.join(
      process.cwd(),
      '.claudebuild/logs/tool-usage.json'
    );
    
    try {
      let logs = [];
      try {
        const existing = await fs.readFile(logPath, 'utf-8');
        logs = JSON.parse(existing);
      } catch (e) {
        // File doesn't exist yet
      }
      
      logs.push(logEntry);
      
      // Keep last 1000 entries
      if (logs.length > 1000) {
        logs = logs.slice(-1000);
      }
      
      await fs.mkdir(path.dirname(logPath), { recursive: true });
      await fs.writeFile(logPath, JSON.stringify(logs, null, 2));
      
    } catch (error) {
      Logger.warn('Failed to log tool usage:', error.message);
    }
  }

  /**
   * Generate unique workflow ID
   */
  generateWorkflowId() {
    return `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Handle agent started event
   */
  handleAgentStarted(event) {
    const { agentId } = event;
    Logger.debug(`Agent started: ${agentId}`);
    this.emit('agent:started', event);
  }

  /**
   * Handle agent progress event
   */
  handleAgentProgress(event) {
    const { agentId, progress } = event;
    Logger.debug(`Agent ${agentId} progress: ${progress}%`);
    this.emit('agent:progress', event);
  }

  /**
   * Handle workflow ready event
   */
  handleWorkflowReady(event) {
    Logger.debug('Workflow ready:', event.workflowId);
  }

  /**
   * Run post-workflow actions
   */
  async runPostActions(workflowId, actions, results) {
    for (const action of actions) {
      try {
        Logger.info(`Running post-action: ${action.type}`);
        
        switch (action.type) {
          case 'merge-pr':
            // Auto-merge PR if tests pass
            // Implementation would go here
            break;
            
          case 'deploy':
            // Trigger deployment
            // Implementation would go here
            break;
            
          case 'notify':
            // Send notifications
            Logger.info(`Notification: ${action.message}`);
            break;
            
          default:
            Logger.warn(`Unknown post-action type: ${action.type}`);
        }
        
      } catch (error) {
        Logger.error(`Post-action failed: ${error.message}`);
      }
    }
  }
}

// Export singleton instance
let instance = null;

module.exports = {
  getInstance: () => {
    if (!instance) {
      instance = new OrchestrationEngine();
    }
    return instance;
  },
  OrchestrationEngine
};