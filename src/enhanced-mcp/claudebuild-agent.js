/**
 * Enhanced ClaudeBuild Agent - KaibanJS + MCP + Node.js 2024 Best Practices
 * Implements research findings from Architect Agent STUDY PHASE
 */

import winston from 'winston';
import CircuitBreaker from 'opossum';
import EventEmitter from 'events';
import { ClaudeBuildStateManager } from './state-manager.js';
import { EnhancedMCPClient } from './enhanced-mcp-client.js';

/**
 * Agent Context Manager for state and coordination
 */
class AgentContextManager {
  constructor(agentId) {
    this.agentId = agentId;
    this.context = new Map();
    this.history = [];
    this.sharedContext = new Map();
  }

  setContext(key, value, metadata = {}) {
    this.context.set(key, {
      value,
      metadata: {
        ...metadata,
        setAt: new Date().toISOString(),
        setBy: this.agentId
      }
    });
  }

  getContext(key) {
    return this.context.get(key);
  }

  addToHistory(entry) {
    this.history.push({
      ...entry,
      timestamp: new Date().toISOString(),
      agentId: this.agentId
    });
  }

  getHistory() {
    return [...this.history];
  }

  shareContext(targetAgent, contextKey, value) {
    const sharedKey = `${targetAgent}:${contextKey}`;
    this.sharedContext.set(sharedKey, {
      targetAgent,
      contextKey,
      value,
      sharedAt: new Date().toISOString()
    });
  }

  getSharedContext() {
    return Array.from(this.sharedContext.values());
  }
}

/**
 * Priority Task Queue for agent work management
 */
class PriorityTaskQueue {
  constructor() {
    this.queue = [];
  }

  enqueue(task, priority = 'normal') {
    const priorities = { critical: 0, high: 1, normal: 2, low: 3 };
    const priorityValue = priorities[priority] || 2;
    
    const queueItem = {
      task,
      priority: priorityValue,
      priorityName: priority,
      enqueuedAt: new Date().toISOString()
    };

    // Insert in priority order
    let inserted = false;
    for (let i = 0; i < this.queue.length; i++) {
      if (queueItem.priority < this.queue[i].priority) {
        this.queue.splice(i, 0, queueItem);
        inserted = true;
        break;
      }
    }

    if (!inserted) {
      this.queue.push(queueItem);
    }

    return queueItem;
  }

  dequeue() {
    return this.queue.shift();
  }

  peek() {
    return this.queue[0];
  }

  size() {
    return this.queue.length;
  }

  clear() {
    this.queue = [];
  }
}

/**
 * Enhanced ClaudeBuild Agent
 * Combines KaibanJS patterns, MCP 2024/2025 capabilities, and Node.js best practices
 */
export class ClaudeBuildAgent extends EventEmitter {
  constructor(config) {
    super();
    
    this.id = config.id;
    this.role = config.role;
    this.capabilities = config.capabilities || [];
    this.credentials = config.credentials;

    // KaibanJS-inspired components
    this.stateManager = new ClaudeBuildStateManager();
    this.taskQueue = new PriorityTaskQueue();

    // Enhanced MCP integration
    this.mcpClient = new EnhancedMCPClient(config.mcp);
    this.contextManager = new AgentContextManager(this.id);

    // Node.js 2024 best practices - Winston logging
    this.logger = winston.createLogger({
      level: config.logLevel || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${this.id}] ${level}: ${message} ${
            Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
          }`;
        })
      ),
      defaultMeta: { agentId: this.id, role: this.role },
      transports: [
        new winston.transports.File({ 
          filename: `logs/${this.id}-error.log`, 
          level: 'error' 
        }),
        new winston.transports.File({ 
          filename: `logs/${this.id}-combined.log` 
        }),
        new winston.transports.Console({
          format: winston.format.simple(),
          level: 'info'
        })
      ]
    });

    // Circuit breaker for task execution
    this.circuitBreaker = new CircuitBreaker(this.executeTaskInternal.bind(this), {
      timeout: config.taskTimeout || 30000,
      errorThresholdPercentage: 50,
      resetTimeout: 60000,
      name: `${this.id}-task-execution`
    });

    // Circuit breaker event handlers
    this.circuitBreaker.on('open', () => {
      this.logger.warn('Task execution circuit breaker opened');
      this.emit('circuitBreakerOpen');
    });

    this.circuitBreaker.on('halfOpen', () => {
      this.logger.info('Task execution circuit breaker half-open');
      this.emit('circuitBreakerHalfOpen');
    });

    this.circuitBreaker.on('close', () => {
      this.logger.info('Task execution circuit breaker closed');
      this.emit('circuitBreakerClose');
    });

    // State and metrics
    this.state = 'idle';
    this.metrics = {
      tasksCompleted: 0,
      tasksSkipped: 0,
      tasksFailed: 0,
      averageTaskTime: 0,
      uptime: Date.now()
    };

    this.initialized = false;
  }

  /**
   * Initialize agent with MCP authentication and capability registration
   */
  async initialize() {
    try {
      this.logger.info('Initializing agent', { 
        role: this.role, 
        capabilities: this.capabilities 
      });

      // Initialize MCP client
      await this.mcpClient.initialize();

      // Authenticate with MCP if credentials provided
      if (this.credentials) {
        await this.mcpClient.authenticateAgent(this.id, this.credentials);
      }

      // Register agent capabilities
      await this.registerCapabilities();

      // Subscribe to coordination events
      this.stateManager.subscribe(this.handleStateChange.bind(this));

      // Subscribe to MCP events
      this.mcpClient.on('contextShared', this.handleSharedContext.bind(this));
      this.mcpClient.on('agentDiscovered', this.handleAgentDiscovered.bind(this));
      this.mcpClient.on('toolUsed', this.handleToolUsed.bind(this));

      // Register with state manager
      this.stateManager.dispatch(this.stateManager.actions.agents.agentStarted({
        agentId: this.id,
        config: {
          role: this.role,
          capabilities: this.capabilities,
          state: 'idle'
        }
      }));

      this.state = 'ready';
      this.initialized = true;

      this.logger.info('Agent initialized successfully');
      this.emit('initialized');

    } catch (error) {
      this.logger.error('Agent initialization failed', { error: error.message });
      this.state = 'error';
      this.emit('initializationFailed', error);
      throw error;
    }
  }

  /**
   * Register agent capabilities with discovery service
   */
  async registerCapabilities() {
    const capabilities = {
      id: this.id,
      role: this.role,
      capabilities: this.capabilities,
      tools: this.getAvailableTools(),
      registeredAt: new Date().toISOString()
    };

    this.stateManager.dispatch(
      this.stateManager.actions.mcp.capabilityDiscovered({
        agentId: this.id,
        capabilities
      })
    );

    this.logger.info('Capabilities registered', { capabilities });
  }

  /**
   * Get available tools for this agent
   */
  getAvailableTools() {
    const baseTool = [`${this.role}_task_execution`];
    
    const roleSpecificTools = {
      'planner': ['issue_creation', 'task_breakdown'],
      'architect': ['specification_creation', 'design_documentation'],
      'builder': ['code_implementation', 'test_creation', 'research'],
      'reviewer': ['code_review', 'quality_assurance'],
      'manager': ['pr_management', 'integration'],
      'deploy': ['release_management', 'deployment']
    };

    return [...baseTool, ...(roleSpecificTools[this.role] || [])];
  }

  /**
   * Execute task with KaibanJS-style result passing and MCP context sharing
   */
  async executeTask(task) {
    if (!this.initialized) {
      throw new Error('Agent not initialized');
    }

    this.logger.info('Executing task', { taskId: task.id, type: task.type });

    try {
      // Inject previous task results (KaibanJS pattern)
      const enrichedTask = this.stateManager.injectTaskResults(
        task, 
        this.getTaskHistory()
      );

      // Execute with circuit breaker protection
      const result = await this.circuitBreaker.fire(enrichedTask);

      // Share context with next agent if specified
      if (enrichedTask.nextAgent) {
        await this.shareContextWithNext(enrichedTask, result);
      }

      // Update metrics
      this.updateMetrics(task, result, 'completed');

      // Update shared state
      this.stateManager.dispatch(
        this.stateManager.actions.tasks.taskCompleted({
          taskId: task.id,
          result
        })
      );

      this.logger.info('Task completed successfully', { 
        taskId: task.id,
        duration: result.duration 
      });

      this.emit('taskCompleted', { task, result });

      return result;

    } catch (error) {
      this.logger.error('Task execution failed', { 
        taskId: task.id, 
        error: error.message 
      });

      // Update metrics
      this.updateMetrics(task, null, 'failed');

      // Handle task failure
      await this.handleTaskFailure(task, error);

      this.emit('taskFailed', { task, error });
      throw error;
    }
  }

  /**
   * Internal task execution with role-specific logic
   */
  async executeTaskInternal(task) {
    const startTime = Date.now();
    this.state = 'executing';

    this.stateManager.dispatch(
      this.stateManager.actions.agents.agentProgress({
        agentId: this.id,
        progress: 0,
        milestone: 'Task started'
      })
    );

    try {
      let result;

      // Role-specific task execution
      switch (this.role) {
        case 'planner':
          result = await this.executePlannerTask(task);
          break;
        case 'architect':
          result = await this.executeArchitectTask(task);
          break;
        case 'builder':
          result = await this.executeBuilderTask(task);
          break;
        case 'reviewer':
          result = await this.executeReviewerTask(task);
          break;
        case 'manager':
          result = await this.executeManagerTask(task);
          break;
        case 'deploy':
          result = await this.executeDeployTask(task);
          break;
        default:
          result = await this.executeGenericTask(task);
      }

      const duration = Date.now() - startTime;
      this.state = 'ready';

      return {
        ...result,
        duration,
        agentId: this.id,
        completedAt: new Date().toISOString()
      };

    } finally {
      this.state = 'ready';
    }
  }

  /**
   * Planner agent task execution
   */
  async executePlannerTask(task) {
    this.logger.info('Executing planner task', { task: task.type });

    // Update progress
    this.updateProgress(25, 'Analyzing requirements');

    // Use MCP tools for research if needed
    let research = null;
    if (task.requiresResearch) {
      research = await this.conductResearch(task.domain);
    }

    this.updateProgress(50, 'Creating task breakdown');

    // Create task breakdown
    const breakdown = await this.createTaskBreakdown(task, research);

    this.updateProgress(75, 'Generating issues');

    // Generate GitHub issues
    const issues = await this.generateIssues(breakdown);

    this.updateProgress(100, 'Planning completed');

    return {
      success: true,
      breakdown,
      issues,
      research: research ? research.summary : null,
      artifacts: ['tasks.json', 'issues.md']
    };
  }

  /**
   * Architect agent task execution with research enhancement
   */
  async executeArchitectTask(task) {
    this.logger.info('Executing architect task', { task: task.type });

    this.updateProgress(20, 'Conducting research');

    // Enhanced research using MCP tools
    const research = await this.conductComprehensiveResearch(task);

    this.updateProgress(40, 'Creating specifications');

    // Create technical specifications
    const specifications = await this.createSpecifications(task, research);

    this.updateProgress(60, 'Designing architecture');

    // Design system architecture
    const architecture = await this.designArchitecture(task, specifications);

    this.updateProgress(80, 'Creating documentation');

    // Create documentation
    const documentation = await this.createDocumentation(architecture);

    this.updateProgress(100, 'Architecture completed');

    return {
      success: true,
      specifications,
      architecture,
      documentation,
      research: research.summary,
      artifacts: ['SPEC/*.md', 'architecture.md']
    };
  }

  /**
   * Builder agent task execution with MCP research integration
   */
  async executeBuilderTask(task) {
    this.logger.info('Executing builder task', { task: task.type });

    this.updateProgress(15, 'Researching best practices');

    // Research-driven development
    const research = await this.conductImplementationResearch(task);

    this.updateProgress(30, 'Implementing features');

    // Implement based on research
    const implementation = await this.implementWithResearch(task, research);

    this.updateProgress(60, 'Creating tests');

    // Create tests
    const tests = await this.createTests(task, implementation);

    this.updateProgress(80, 'Creating documentation');

    // Create documentation
    const documentation = await this.createImplementationDocs(implementation);

    this.updateProgress(100, 'Implementation completed');

    return {
      success: true,
      implementation,
      tests,
      documentation,
      research: research.summary,
      artifacts: ['src/**/*.js', 'tests/**/*.js', 'README.md']
    };
  }

  /**
   * Conduct comprehensive research using MCP tools
   */
  async conductComprehensiveResearch(task) {
    const research = {
      sources: [],
      patterns: [],
      bestPractices: [],
      examples: [],
      summary: ''
    };

    try {
      // Search for best practices
      const bestPracticesResults = await this.mcpClient.callTool('web_search', {
        query: `${task.technology} ${task.domain} best practices 2024`
      });

      if (bestPracticesResults.success) {
        research.bestPractices = this.extractBestPractices(bestPracticesResults.results);
        research.sources.push(...bestPracticesResults.results);
      }

      // Search for code examples
      const examplesResults = await this.mcpClient.callTool('github_search', {
        query: `${task.feature} ${task.technology}`,
        type: 'repositories'
      });

      if (examplesResults.success) {
        research.examples = this.analyzeCodeExamples(examplesResults.results);
        research.sources.push(...examplesResults.results);
      }

      // Generate research summary
      research.summary = this.synthesizeResearch(research);

      this.logger.info('Research completed', { 
        sourceCount: research.sources.length,
        patternsFound: research.patterns.length 
      });

      return research;

    } catch (error) {
      this.logger.warn('Research failed, using fallback knowledge', { error: error.message });
      return this.getFallbackResearch(task);
    }
  }

  /**
   * Share context with next agent using MCP
   */
  async shareContextWithNext(task, result) {
    if (!task.nextAgent) return;

    const context = {
      previousTask: {
        id: task.id,
        type: task.type,
        result: result.success
      },
      artifacts: result.artifacts || [],
      decisions: result.decisions || [],
      learnings: result.learnings || [],
      research: result.research || null,
      timestamp: new Date().toISOString()
    };

    try {
      await this.mcpClient.shareAgentContext(this.id, task.nextAgent, context);
      
      this.logger.info('Context shared with next agent', { 
        nextAgent: task.nextAgent,
        contextSize: JSON.stringify(context).length 
      });

    } catch (error) {
      this.logger.error('Failed to share context', { 
        nextAgent: task.nextAgent,
        error: error.message 
      });
    }
  }

  /**
   * Handle shared context from other agents
   */
  async handleSharedContext({ contextId, sourceAgent, targetAgent, resource }) {
    if (targetAgent !== this.id) return;

    try {
      const context = await this.mcpClient.getAgentContext(contextId);
      if (context) {
        this.contextManager.setContext(`shared-${sourceAgent}`, context.context, {
          sourceAgent,
          resourceUri: resource.uri
        });

        this.logger.info('Received shared context', { 
          sourceAgent,
          contextId 
        });

        this.emit('contextReceived', { sourceAgent, context: context.context });
      }
    } catch (error) {
      this.logger.error('Failed to handle shared context', { 
        contextId,
        error: error.message 
      });
    }
  }

  /**
   * Update task execution progress
   */
  updateProgress(percentage, milestone) {
    this.stateManager.dispatch(
      this.stateManager.actions.agents.agentProgress({
        agentId: this.id,
        progress: percentage,
        milestone
      })
    );

    this.emit('progress', { percentage, milestone });
  }

  /**
   * Update agent metrics
   */
  updateMetrics(task, result, outcome) {
    switch (outcome) {
      case 'completed':
        this.metrics.tasksCompleted++;
        if (result && result.duration) {
          this.metrics.averageTaskTime = 
            (this.metrics.averageTaskTime + result.duration) / 2;
        }
        break;
      case 'failed':
        this.metrics.tasksFailed++;
        break;
      case 'skipped':
        this.metrics.tasksSkipped++;
        break;
    }

    this.emit('metricsUpdated', this.metrics);
  }

  /**
   * Handle task failure with recovery options
   */
  async handleTaskFailure(task, error) {
    this.contextManager.addToHistory({
      type: 'task_failure',
      taskId: task.id,
      error: error.message,
      recoveryAttempted: false
    });

    // Attempt recovery based on error type
    if (error.message.includes('timeout')) {
      this.logger.info('Attempting task retry after timeout');
      // Could implement retry logic here
    }

    this.emit('taskFailure', { task, error });
  }

  /**
   * Handle state changes from global state manager
   */
  handleStateChange() {
    const state = this.stateManager.getState();
    
    // Check for relevant state changes
    const agentState = state.agents.active.get(this.id);
    if (agentState) {
      this.emit('stateChanged', agentState);
    }
  }

  /**
   * Handle new agent discoveries
   */
  handleAgentDiscovered(agent) {
    this.logger.info('New agent discovered', { discoveredAgent: agent.id });
    this.emit('agentDiscovered', agent);
  }

  /**
   * Handle tool usage tracking
   */
  handleToolUsed(usage) {
    this.contextManager.addToHistory({
      type: 'tool_usage',
      tool: usage.toolName,
      parameters: usage.parameters,
      success: !usage.error,
      duration: usage.duration
    });
  }

  /**
   * Get task execution history
   */
  getTaskHistory() {
    const state = this.stateManager.getState();
    return state.tasks.results;
  }

  /**
   * Get agent metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      uptime: Date.now() - this.metrics.uptime,
      state: this.state,
      initialized: this.initialized
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    try {
      this.logger.info('Shutting down agent');

      this.state = 'shutting_down';

      // Clear task queue
      this.taskQueue.clear();

      // Close circuit breaker
      this.circuitBreaker.shutdown();

      // Shutdown MCP client
      await this.mcpClient.shutdown();

      this.state = 'shutdown';
      this.emit('shutdown');

      this.logger.info('Agent shutdown completed');

    } catch (error) {
      this.logger.error('Error during agent shutdown', { error: error.message });
      throw error;
    }
  }

  // Placeholder methods for role-specific implementations
  async executeReviewerTask(task) {
    // Reviewer-specific logic
    return { success: true, artifacts: ['review-report.md'] };
  }

  async executeManagerTask(task) {
    // Manager-specific logic  
    return { success: true, artifacts: ['integration-report.md'] };
  }

  async executeDeployTask(task) {
    // Deploy-specific logic
    return { success: true, artifacts: ['deployment-log.md'] };
  }

  async executeGenericTask(task) {
    // Generic task logic
    return { success: true, artifacts: [] };
  }

  async createTaskBreakdown(task, research) {
    // Create task breakdown logic
    return { tasks: [], dependencies: [] };
  }

  async generateIssues(breakdown) {
    // Generate GitHub issues logic
    return [];
  }

  async createSpecifications(task, research) {
    // Create specifications logic
    return {};
  }

  async designArchitecture(task, specifications) {
    // Design architecture logic
    return {};
  }

  async createDocumentation(architecture) {
    // Create documentation logic
    return {};
  }

  async implementWithResearch(task, research) {
    // Implementation logic with research
    return {};
  }

  async createTests(task, implementation) {
    // Create tests logic
    return {};
  }

  async createImplementationDocs(implementation) {
    // Create implementation docs logic
    return {};
  }

  async conductImplementationResearch(task) {
    // Implementation-specific research
    return { summary: 'Research completed' };
  }

  async conductResearch(domain) {
    // General research logic
    return { summary: 'Research completed' };
  }

  extractBestPractices(results) {
    // Extract best practices from search results
    return [];
  }

  analyzeCodeExamples(results) {
    // Analyze code examples
    return [];
  }

  synthesizeResearch(research) {
    // Synthesize research findings
    return 'Research synthesis completed';
  }

  getFallbackResearch(task) {
    // Fallback research when MCP tools fail
    return { 
      summary: 'Fallback research used',
      sources: [],
      patterns: [],
      bestPractices: [],
      examples: []
    };
  }
}

export default ClaudeBuildAgent;