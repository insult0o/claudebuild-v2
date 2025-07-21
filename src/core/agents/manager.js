const { EventEmitter } = require('events');
const AgentProcess = require('./process');
const AgentRegistry = require('./registry');
const MessageBus = require('./message-bus');
const Logger = require('../../cli/utils/logger');
const ConfigManager = require('../config');

/**
 * Manages all agent processes and their lifecycle
 */
class AgentManager extends EventEmitter {
  constructor() {
    super();
    this.agents = new Map();
    this.registry = new AgentRegistry();
    this.messageBus = MessageBus;
    this.initialized = false;
    this.stats = {
      agentsStarted: 0,
      agentsStopped: 0,
      tasksCompleted: 0,
      errors: 0
    };
  }

  /**
   * Initialize the agent manager
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    Logger.info('Initializing agent manager...');
    
    // Initialize registry
    await this.registry.initialize();
    
    // Setup message bus handlers
    this.setupMessageBus();
    
    this.initialized = true;
    Logger.success('Agent manager initialized');
  }

  /**
   * Setup message bus event handlers
   */
  setupMessageBus() {
    // System-wide events
    this.messageBus.on('message:published', (envelope) => {
      Logger.debug(`Message published to ${envelope.channel} from ${envelope.from}`);
    });
  }

  /**
   * Create a new agent instance
   */
  async createAgent(agentId, config) {
    if (this.agents.has(agentId)) {
      throw new Error(`Agent ${agentId} already exists`);
    }

    Logger.info(`Creating agent: ${agentId}`);
    
    const agent = new AgentProcess(agentId, config);
    
    // Set up event handlers
    this.setupAgentHandlers(agent);
    
    // Forward orchestration events
    agent.on('started', () => {
      Logger.debug(`Forwarding agent:started for ${agentId}`);
      this.messageBus.emit('agent:started', { agentId });
    });
    agent.on('complete', (data) => {
      Logger.debug(`Forwarding agent:completed for ${agentId} with data:`, data);
      this.messageBus.emit('agent:completed', { 
        agentId: data.agentId || agentId, 
        result: data.result || data 
      });
    });
    agent.on('failed', (error) => {
      Logger.debug(`Forwarding agent:failed for ${agentId}`);
      this.messageBus.emit('agent:failed', { agentId, error });
    });
    agent.on('progress', (progress) => {
      this.messageBus.emit('agent:progress', { agentId, progress });
    });
    
    this.agents.set(agentId, agent);
    this.stats.agentsStarted++;
    
    // Register with message bus
    this.messageBus.registerAgent(agentId, {
      onMessage: (msg) => agent.send(msg),
      onRequest: (req) => this.handleAgentRequest(agentId, req),
      onBroadcast: (msg) => this.handleAgentBroadcast(agentId, msg),
      onSystem: (msg) => this.handleSystemMessage(agentId, msg)
    });
    
    // Emit event
    this.emit('agent:created', { agentId, config });
    
    return agent;
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId) {
    return this.agents.get(agentId);
  }

  /**
   * Get running agents count
   */
  async getRunningAgentsCount() {
    let count = 0;
    for (const agent of this.agents.values()) {
      if (agent.state === 'running') {
        count++;
      }
    }
    return count;
  }

  /**
   * Get agents by workflow
   */
  getAgentsByWorkflow(workflowId) {
    const agents = [];
    for (const agent of this.agents.values()) {
      if (agent.config.workflowId === workflowId) {
        agents.push(agent);
      }
    }
    return agents;
  }

  /**
   * Remove an agent
   */
  async removeAgent(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return;
    }

    try {
      await agent.stop();
    } catch (error) {
      Logger.debug(`Error stopping agent ${agentId}:`, error.message);
    }

    this.agents.delete(agentId);
    this.messageBus.unregisterAgent(agentId);
    this.emit('agent:removed', { agentId });
  }

  /**
   * Start an agent with a task
   */
  async startAgent(agentType, task, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    // Get agent definition from registry
    const agentDef = this.registry.get(agentType);
    if (!agentDef) {
      throw new Error(`Unknown agent type: ${agentType}`);
    }

    // Generate agent ID
    const agentId = options.agentId || `${agentType}-${Date.now()}`;
    
    // Check if agent already exists
    if (this.agents.has(agentId)) {
      throw new Error(`Agent ${agentId} already exists`);
    }

    // Create agent configuration
    const config = {
      ...agentDef.config,
      ...options.config,
      type: agentType,
      definition: agentDef
    };

    // Apply global configuration
    const globalConfig = ConfigManager.get('agents');
    if (globalConfig) {
      config.timeout = config.timeout || globalConfig.timeout;
      config.maxMemory = config.maxMemory || globalConfig.maxMemory;
      config.autoRestart = config.autoRestart !== undefined 
        ? config.autoRestart 
        : globalConfig.autoRestart;
    }

    // Create agent process
    const agent = new AgentProcess(agentId, config);
    
    // Setup event handlers
    this.setupAgentHandlers(agent);
    
    // Store agent
    this.agents.set(agentId, agent);
    
    // Register with message bus
    this.messageBus.registerAgent(agentId, {
      onMessage: (msg) => agent.send(msg),
      onRequest: (req) => this.handleAgentRequest(agentId, req),
      onBroadcast: (msg) => this.handleAgentBroadcast(agentId, msg),
      onSystem: (msg) => this.handleSystemMessage(agentId, msg)
    });
    
    // Start the agent
    try {
      await agent.start(task);
      this.stats.agentsStarted++;
      this.emit('agent:started', { agentId, agentType, task });
      return agentId;
    } catch (error) {
      // Cleanup on failure
      this.agents.delete(agentId);
      this.messageBus.unregisterAgent(agentId);
      throw error;
    }
  }

  /**
   * Setup event handlers for an agent
   */
  setupAgentHandlers(agent) {
    agent.on('output', (data) => {
      this.emit('agent:output', data);
    });
    
    agent.on('error', (data) => {
      this.stats.errors++;
      this.emit('agent:error', data);
      Logger.error(`Agent ${data.agentId}: ${data.data || data.error}`);
    });
    
    agent.on('status', (data) => {
      this.emit('agent:status', data);
    });
    
    agent.on('progress', (data) => {
      this.emit('agent:progress', data);
    });
    
    agent.on('complete', (data) => {
      this.stats.tasksCompleted++;
      this.emit('agent:complete', data);
      Logger.success(`Agent ${data.agentId} completed task`);
    });
    
    agent.on('exit', (data) => {
      this.stats.agentsStopped++;
      this.handleAgentExit(data.agentId, data);
    });
    
    agent.on('message', (data) => {
      this.handleAgentMessage(data.agentId, data);
    });
    
    agent.on('broadcast', (data) => {
      this.messageBus.broadcast(data.payload, data.agentId);
    });
    
    agent.on('request', (data) => {
      this.messageBus.publish(`agent:${data.target}`, data, data.agentId);
    });
  }

  /**
   * Handle agent exit
   */
  handleAgentExit(agentId, exitData) {
    Logger.info(`Agent ${agentId} exited (code: ${exitData.code})`);
    
    // Unregister from message bus
    this.messageBus.unregisterAgent(agentId);
    
    // Remove from active agents
    this.agents.delete(agentId);
    
    this.emit('agent:exit', { agentId, ...exitData });
  }

  /**
   * Handle agent message
   */
  handleAgentMessage(agentId, message) {
    switch (message.type) {
      case 'broadcast':
        this.messageBus.broadcast(message.payload, agentId);
        break;
        
      case 'request':
        this.messageBus.publish(`agent:${message.target}`, message, agentId);
        break;
        
      case 'response':
        this.messageBus.respond(message.requestId, message.payload, agentId);
        break;
        
      default:
        this.emit('agent:message', { agentId, ...message });
    }
  }

  /**
   * Handle agent request
   */
  handleAgentRequest(agentId, request) {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.send({
        type: 'request',
        from: request.from,
        payload: request.payload,
        requestId: request.id
      });
    }
  }

  /**
   * Handle agent broadcast
   */
  handleAgentBroadcast(agentId, message) {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.send({
        type: 'broadcast',
        from: message.from,
        payload: message.payload
      });
    }
  }

  /**
   * Handle system message
   */
  handleSystemMessage(agentId, message) {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.send({
        type: 'system',
        payload: message.payload
      });
    }
  }

  /**
   * Stop an agent
   */
  async stopAgent(agentId, reason = 'user_requested') {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }
    
    await agent.stop(reason);
  }

  /**
   * Stop all agents
   */
  async stopAll(reason = 'shutdown') {
    Logger.info('Stopping all agents...');
    
    const stopPromises = [];
    for (const [agentId, agent] of this.agents) {
      stopPromises.push(agent.stop(reason));
    }
    
    await Promise.all(stopPromises);
    
    this.agents.clear();
    Logger.info('All agents stopped');
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId) {
    return this.agents.get(agentId);
  }

  /**
   * Get all active agents
   */
  getActiveAgents() {
    return Array.from(this.agents.values()).map(agent => ({
      id: agent.id,
      type: agent.config.type,
      state: agent.state,
      health: agent.getHealth()
    }));
  }

  /**
   * Get agent health
   */
  getAgentHealth(agentId) {
    const agent = this.agents.get(agentId);
    return agent ? agent.getHealth() : null;
  }

  /**
   * Get agent logs
   */
  getAgentLogs(agentId, limit = 100) {
    const agent = this.agents.get(agentId);
    return agent ? agent.getLogs(limit) : [];
  }

  /**
   * Send message to agent
   */
  sendToAgent(agentId, message) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }
    
    agent.send(message);
  }

  /**
   * Get manager statistics
   */
  getStats() {
    return {
      ...this.stats,
      activeAgents: this.agents.size,
      registeredAgents: this.registry.getStats(),
      messageBus: this.messageBus.getStats()
    };
  }

  /**
   * Get resource usage for all agents
   */
  async getResourceUsage() {
    const usage = {};
    
    for (const [agentId, agent] of this.agents) {
      if (agent.state === 'running' && agent.process) {
        // In a real implementation, would use proper process monitoring
        usage[agentId] = {
          cpu: 0, // Would calculate actual CPU usage
          memory: process.memoryUsage().heapUsed,
          uptime: Date.now() - agent.startTime
        };
      }
    }
    
    return usage;
  }

  /**
   * Find available agent for a task
   */
  findAgentForTask(task) {
    return this.registry.findAgentForTask(task);
  }

  /**
   * Check if agent type is available
   */
  hasAgentType(agentType) {
    return this.registry.get(agentType) !== null;
  }

  /**
   * List available agent types
   */
  listAgentTypes() {
    return this.registry.list();
  }

  /**
   * Shutdown all agents
   */
  async shutdown() {
    Logger.info('Shutting down agent manager...');
    
    // Stop all agents
    const stopPromises = [];
    for (const [agentId, agent] of this.agents) {
      stopPromises.push(
        agent.stop().catch(error => {
          Logger.warn(`Failed to stop agent ${agentId}:`, error.message);
        })
      );
    }
    
    await Promise.all(stopPromises);
    
    // Clear all agents
    this.agents.clear();
    
    Logger.info('Agent manager shutdown complete');
  }
}

// Export singleton instance
module.exports = new AgentManager();