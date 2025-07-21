/**
 * Enhanced MCP Client - 2024/2025 Standard Implementation
 * Based on Anthropic MCP specification and latest multi-agent patterns
 */

import { McpClient } from '@modelcontextprotocol/sdk/client/mcp.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';
import winston from 'winston';
import CircuitBreaker from 'opossum';
import EventEmitter from 'events';

/**
 * Dynamic Discovery Service for MCP agents and capabilities
 */
class DynamicDiscoveryService extends EventEmitter {
  constructor() {
    super();
    this.discoveredAgents = new Map();
    this.capabilities = new Map();
    this.scanInterval = null;
  }

  async startDiscovery(intervalMs = 30000) {
    this.scanInterval = setInterval(() => {
      this.scanForAgents();
    }, intervalMs);
    
    // Initial scan
    await this.scanForAgents();
  }

  async scanForAgents() {
    try {
      // Discover available MCP servers/agents
      const agents = await this.discoverMCPServers();
      
      for (const agent of agents) {
        if (!this.discoveredAgents.has(agent.id)) {
          this.discoveredAgents.set(agent.id, agent);
          this.emit('agentDiscovered', agent);
          
          // Discover agent capabilities
          const capabilities = await this.discoverAgentCapabilities(agent);
          this.capabilities.set(agent.id, capabilities);
          this.emit('capabilitiesDiscovered', { agentId: agent.id, capabilities });
        }
      }
    } catch (error) {
      winston.error('Agent discovery failed', { error: error.message });
    }
  }

  async discoverMCPServers() {
    // In a real implementation, this would scan for available MCP servers
    // For now, return known servers
    return [
      {
        id: 'claudebuild-primary',
        name: 'ClaudeBuild Primary MCP Server',
        endpoint: 'stdio',
        command: 'node',
        args: ['mcp-server/index.js']
      }
    ];
  }

  async discoverAgentCapabilities(agent) {
    try {
      const client = new McpClient({
        name: 'capability-discovery',
        version: '1.0.0'
      });

      const transport = new StdioClientTransport({
        command: agent.command,
        args: agent.args
      });

      await client.connect(transport);
      
      // List available tools
      const tools = await client.listTools();
      
      // List available resources
      const resources = await client.listResources();
      
      await client.close();
      
      return {
        tools: tools.tools || [],
        resources: resources.resources || [],
        discoveredAt: new Date().toISOString()
      };
    } catch (error) {
      winston.warn('Failed to discover capabilities', { 
        agentId: agent.id, 
        error: error.message 
      });
      return { tools: [], resources: [], discoveredAt: new Date().toISOString() };
    }
  }

  stopDiscovery() {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
  }

  getDiscoveredAgents() {
    return Array.from(this.discoveredAgents.values());
  }

  getAgentCapabilities(agentId) {
    return this.capabilities.get(agentId);
  }
}

/**
 * Shared Context Manager for agent coordination
 */
class SharedContextManager {
  constructor() {
    this.contexts = new Map();
    this.subscribers = new Map();
  }

  async storeContext(contextId, context, metadata = {}) {
    const contextEntry = {
      id: contextId,
      context,
      metadata: {
        ...metadata,
        storedAt: new Date().toISOString(),
        version: this.getNextVersion(contextId)
      }
    };

    this.contexts.set(contextId, contextEntry);
    
    // Notify subscribers
    const subscribers = this.subscribers.get(contextId) || [];
    subscribers.forEach(callback => {
      try {
        callback(contextEntry);
      } catch (error) {
        winston.error('Context notification failed', { error: error.message });
      }
    });

    return contextEntry;
  }

  async getContext(contextId) {
    return this.contexts.get(contextId);
  }

  subscribeToContext(contextId, callback) {
    if (!this.subscribers.has(contextId)) {
      this.subscribers.set(contextId, []);
    }
    this.subscribers.get(contextId).push(callback);
  }

  getNextVersion(contextId) {
    const existing = this.contexts.get(contextId);
    return existing ? existing.metadata.version + 1 : 1;
  }
}

/**
 * Enhanced MCP Client with 2024/2025 capabilities
 */
export class EnhancedMCPClient extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      protocolVersion: '2024-11-05',
      capabilities: {
        contextSharing: true,
        dynamicDiscovery: true,
        resourceStreaming: true,
        oauthAuth: true,
        ...config.capabilities
      },
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3,
      ...config
    };

    this.clients = new Map(); // Multiple MCP connections
    this.discoveryService = new DynamicDiscoveryService();
    this.contextManager = new SharedContextManager();
    this.authenticated = new Map(); // Track authentication per client

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'enhanced-mcp-client' },
      transports: [
        new winston.transports.File({ filename: 'logs/mcp-error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/mcp-combined.log' })
      ]
    });

    // Circuit breaker for tool calls
    this.circuitBreaker = new CircuitBreaker(this.executeToolCall.bind(this), {
      timeout: this.config.timeout,
      errorThresholdPercentage: 50,
      resetTimeout: 60000
    });

    this.circuitBreaker.on('open', () => {
      this.logger.warn('MCP Circuit breaker opened - tool calls failing');
    });

    this.circuitBreaker.on('halfOpen', () => {
      this.logger.info('MCP Circuit breaker half-open - testing recovery');
    });
  }

  async initialize() {
    try {
      // Start discovery service
      await this.discoveryService.startDiscovery();
      
      // Listen for discovered agents
      this.discoveryService.on('agentDiscovered', this.handleAgentDiscovered.bind(this));
      this.discoveryService.on('capabilitiesDiscovered', this.handleCapabilitiesDiscovered.bind(this));

      // Connect to primary MCP server
      await this.connectToPrimaryServer();

      this.logger.info('Enhanced MCP Client initialized successfully');
      this.emit('initialized');

    } catch (error) {
      this.logger.error('MCP Client initialization failed', { error: error.message });
      throw error;
    }
  }

  async connectToPrimaryServer() {
    const client = new McpClient({
      name: 'claudebuild-enhanced-client',
      version: '1.0.0'
    });

    const transport = new StdioClientTransport({
      command: 'node',
      args: ['mcp-server/index.js']
    });

    await client.connect(transport);
    
    this.clients.set('primary', client);
    this.logger.info('Connected to primary MCP server');
  }

  async handleAgentDiscovered(agent) {
    this.logger.info('New agent discovered', { agentId: agent.id, name: agent.name });
    this.emit('agentDiscovered', agent);
  }

  async handleCapabilitiesDiscovered({ agentId, capabilities }) {
    this.logger.info('Agent capabilities discovered', { agentId, toolCount: capabilities.tools.length });
    this.emit('capabilitiesDiscovered', { agentId, capabilities });
  }

  /**
   * Share context between agents using MCP resource system
   */
  async shareAgentContext(sourceAgent, targetAgent, context) {
    try {
      const contextId = `context-${sourceAgent}-${targetAgent}-${Date.now()}`;
      
      // Store context in shared manager
      const contextEntry = await this.contextManager.storeContext(contextId, context, {
        sourceAgent,
        targetAgent,
        shared: true
      });

      // Create MCP resource for the context
      const client = this.clients.get('primary');
      if (client) {
        const resource = await client.createResource({
          uri: `claudebuild://agent-context/${contextId}`,
          name: `${sourceAgent} → ${targetAgent} Context`,
          description: `Shared context from ${sourceAgent} to ${targetAgent}`,
          mimeType: 'application/json'
        }, context);

        // Notify target agent
        this.emit('contextShared', {
          contextId,
          sourceAgent,
          targetAgent,
          resource
        });

        this.logger.info('Context shared successfully', {
          contextId,
          sourceAgent,
          targetAgent
        });

        return contextEntry;
      }

      throw new Error('Primary MCP client not available');

    } catch (error) {
      this.logger.error('Context sharing failed', {
        sourceAgent,
        targetAgent,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Discover available agent capabilities dynamically
   */
  async discoverAgentCapabilities() {
    const discoveredAgents = this.discoveryService.getDiscoveredAgents();
    const capabilities = new Map();

    for (const agent of discoveredAgents) {
      const agentCapabilities = this.discoveryService.getAgentCapabilities(agent.id);
      if (agentCapabilities) {
        capabilities.set(agent.id, {
          agent,
          tools: agentCapabilities.tools,
          resources: agentCapabilities.resources,
          lastUpdated: agentCapabilities.discoveredAt
        });
      }
    }

    return capabilities;
  }

  /**
   * Authenticate agent with OAuth 2.1
   */
  async authenticateAgent(agentId, credentials) {
    try {
      // OAuth 2.1 client credentials flow
      const authRequest = {
        grant_type: 'client_credentials',
        client_id: agentId,
        client_secret: credentials.secret,
        scope: this.calculateAgentScope(agentId)
      };

      // In a real implementation, this would make an OAuth request
      // For now, simulate successful authentication
      const authResult = {
        access_token: `mcp_token_${agentId}_${Date.now()}`,
        token_type: 'Bearer',
        expires_in: 3600,
        scope: authRequest.scope
      };

      this.authenticated.set(agentId, {
        ...authResult,
        authenticated_at: new Date().toISOString()
      });

      this.logger.info('Agent authenticated successfully', { agentId });
      return authResult;

    } catch (error) {
      this.logger.error('Agent authentication failed', {
        agentId,
        error: error.message
      });
      throw error;
    }
  }

  calculateAgentScope(agentId) {
    // Calculate appropriate OAuth scope based on agent role
    const roleScopes = {
      'orchestrator': 'read write admin',
      'planner': 'read write issues',
      'architect': 'read write specs',
      'builder': 'read write code',
      'reviewer': 'read write review',
      'manager': 'read write merge',
      'deploy': 'read write deploy'
    };

    const role = agentId.split('-')[0]; // Extract role from agent ID
    return roleScopes[role] || 'read';
  }

  /**
   * Execute tool call with circuit breaker protection
   */
  async callTool(toolName, parameters, clientId = 'primary') {
    return this.circuitBreaker.fire(toolName, parameters, clientId);
  }

  async executeToolCall(toolName, parameters, clientId) {
    const client = this.clients.get(clientId);
    if (!client) {
      throw new Error(`MCP client '${clientId}' not found`);
    }

    const startTime = Date.now();
    
    try {
      this.logger.info('Executing tool call', { toolName, clientId });
      
      const result = await client.callTool({
        name: toolName,
        arguments: parameters
      });

      const duration = Date.now() - startTime;
      
      this.logger.info('Tool call completed', {
        toolName,
        clientId,
        duration,
        success: true
      });

      // Emit for tracking
      this.emit('toolUsed', {
        toolName,
        parameters,
        result,
        duration,
        clientId,
        timestamp: new Date().toISOString()
      });

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.logger.error('Tool call failed', {
        toolName,
        clientId,
        duration,
        error: error.message
      });

      // Emit for tracking
      this.emit('toolError', {
        toolName,
        parameters,
        error: error.message,
        duration,
        clientId,
        timestamp: new Date().toISOString()
      });

      throw error;
    }
  }

  /**
   * Get context for an agent
   */
  async getAgentContext(contextId) {
    return this.contextManager.getContext(contextId);
  }

  /**
   * Subscribe to context updates
   */
  subscribeToContext(contextId, callback) {
    this.contextManager.subscribeToContext(contextId, callback);
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    try {
      // Stop discovery service
      this.discoveryService.stopDiscovery();

      // Close all MCP connections
      const closePromises = Array.from(this.clients.values()).map(client => 
        client.close().catch(error => 
          this.logger.warn('Error closing MCP client', { error: error.message })
        )
      );

      await Promise.all(closePromises);
      
      this.logger.info('Enhanced MCP Client shutdown completed');
      this.emit('shutdown');

    } catch (error) {
      this.logger.error('Error during MCP client shutdown', { error: error.message });
      throw error;
    }
  }
}

export default EnhancedMCPClient;