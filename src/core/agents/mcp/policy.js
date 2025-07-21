const fs = require('fs').promises;
const path = require('path');
const Logger = require('../../../cli/utils/logger');
const ConfigManager = require('../../config');

/**
 * Tool Access Policy Manager
 * Controls which MCP tools agents can use
 */
class ToolAccessPolicy {
  constructor(options = {}) {
    this.policies = new Map();
    this.sessionPolicies = new Map();
    this.policyFile = path.join(process.cwd(), '.claudebuild/config/tool-policy.json');
    this.defaultPolicy = options.defaultPolicy || 'ask';
  }

  /**
   * Load policies from file
   */
  async load() {
    try {
      const data = await fs.readFile(this.policyFile, 'utf-8');
      const config = JSON.parse(data);
      
      this.defaultPolicy = config.defaultPolicy || 'ask';
      
      // Load tool policies
      if (config.tools) {
        Object.entries(config.tools).forEach(([tool, policy]) => {
          this.policies.set(tool, policy);
        });
      }
      
      // Load session policies
      if (config.session) {
        Object.entries(config.session).forEach(([tool, policy]) => {
          this.sessionPolicies.set(tool, policy);
        });
      }
      
    } catch (error) {
      // Use defaults if file doesn't exist
      Logger.debug('No tool policy file found, using defaults');
    }
  }

  /**
   * Save policies to file
   */
  async save() {
    const config = {
      default: this.defaultPolicy,
      tools: Object.fromEntries(this.policies),
      session: Object.fromEntries(this.sessionPolicies)
    };
    
    await fs.mkdir(path.dirname(this.policyFile), { recursive: true });
    await fs.writeFile(this.policyFile, JSON.stringify(config, null, 2));
  }

  /**
   * Check if tool access is allowed
   */
  async checkAccess(agentId, toolName, parameters) {
    // Check session policy first
    if (this.sessionPolicies.has(toolName)) {
      const sessionPolicy = this.sessionPolicies.get(toolName);
      if (sessionPolicy === 'allow_session') {
        this.logAccess(agentId, toolName, parameters, 'allowed_session');
        return true;
      }
    }
    
    // Check tool policy
    const policy = this.policies.get(toolName) || this.defaultPolicy;
    
    switch (policy) {
      case 'allow':
        this.logAccess(agentId, toolName, parameters, 'allowed');
        return true;
        
      case 'deny':
        this.logAccess(agentId, toolName, parameters, 'denied');
        return false;
        
      case 'ask':
        return this.askUser(agentId, toolName, parameters);
        
      default:
        Logger.warn(`Unknown policy: ${policy}, defaulting to ask`);
        return this.askUser(agentId, toolName, parameters);
    }
  }

  /**
   * Ask user for permission
   */
  async askUser(agentId, toolName, parameters) {
    Logger.info(`\n🔒 Tool Access Request`);
    Logger.info(`Agent: ${agentId}`);
    Logger.info(`Tool: ${toolName}`);
    Logger.info(`Parameters: ${JSON.stringify(parameters, null, 2)}`);
    
    // In a real implementation, this would prompt the user
    // For now, we'll use environment variable for testing
    const decision = process.env.CLAUDEBUILD_TOOL_PERMISSION || 'deny';
    
    if (decision === 'allow') {
      Logger.success('✅ Access granted');
      this.logAccess(agentId, toolName, parameters, 'allowed_manual');
      return true;
    } else if (decision === 'allow_session') {
      Logger.success('✅ Access granted for session');
      this.sessionPolicies.set(toolName, 'allow_session');
      this.logAccess(agentId, toolName, parameters, 'allowed_session');
      return true;
    } else {
      Logger.error('❌ Access denied');
      this.logAccess(agentId, toolName, parameters, 'denied_manual');
      return false;
    }
  }

  /**
   * Log tool access attempt
   */
  async logAccess(agentId, toolName, parameters, decision) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      agentId,
      tool: toolName,
      parameters,
      decision
    };
    
    // Append to log file
    const logFile = path.join(process.cwd(), '.claudebuild/logs/tool-access.log');
    await fs.mkdir(path.dirname(logFile), { recursive: true });
    await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n');
    
    // Also emit event for monitoring
    if (global.orchestrator) {
      global.orchestrator.emit('tool:access', logEntry);
    }
  }

  /**
   * Set policy for a tool
   */
  setPolicy(toolName, policy) {
    if (!['ask', 'allow', 'deny'].includes(policy)) {
      throw new Error(`Invalid policy: ${policy}`);
    }
    this.policies.set(toolName, policy);
  }

  /**
   * Get policy for a tool
   */
  getPolicy(toolName) {
    return this.policies.get(toolName) || this.defaultPolicy;
  }
}

module.exports = ToolAccessPolicy;