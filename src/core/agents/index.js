/**
 * ClaudeBuild Agent System
 * Central export for all agent-related functionality
 */

const AgentManager = require('./manager');
const AgentRegistry = require('./registry');
const MessageBus = require('./message-bus');
const AgentProcess = require('./process');

// Re-export main components
module.exports = {
  // Main manager (singleton)
  AgentManager,
  
  // Direct access to components
  AgentRegistry,
  MessageBus,
  AgentProcess,
  
  // Convenience methods
  async initialize() {
    return AgentManager.initialize();
  },
  
  async startAgent(agentType, task, options) {
    return AgentManager.startAgent(agentType, task, options);
  },
  
  async stopAgent(agentId, reason) {
    return AgentManager.stopAgent(agentId, reason);
  },
  
  async stopAll(reason) {
    return AgentManager.stopAll(reason);
  },
  
  getActiveAgents() {
    return AgentManager.getActiveAgents();
  },
  
  getStats() {
    return AgentManager.getStats();
  },
  
  sendMessage(agentId, message) {
    return AgentManager.sendToAgent(agentId, message);
  }
};