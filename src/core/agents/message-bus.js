const { EventEmitter } = require('events');
const { v4: uuidv4 } = require('uuid');
const Logger = require('../../cli/utils/logger');

/**
 * Message bus for inter-agent communication
 */
class MessageBus extends EventEmitter {
  constructor() {
    super();
    this.channels = new Map();
    this.subscribers = new Map();
    this.pendingRequests = new Map();
    this.messageHistory = [];
    this.maxHistorySize = 1000;
  }

  /**
   * Subscribe an agent to a channel
   */
  subscribe(channel, agentId, handler) {
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set());
    }
    
    this.channels.get(channel).add(agentId);
    
    // Store subscriber handler
    const subscriberKey = `${channel}:${agentId}`;
    this.subscribers.set(subscriberKey, handler);
    
    Logger.debug(`Agent ${agentId} subscribed to channel: ${channel}`);
  }

  /**
   * Unsubscribe an agent from a channel
   */
  unsubscribe(channel, agentId) {
    if (this.channels.has(channel)) {
      this.channels.get(channel).delete(agentId);
      
      if (this.channels.get(channel).size === 0) {
        this.channels.delete(channel);
      }
    }
    
    const subscriberKey = `${channel}:${agentId}`;
    this.subscribers.delete(subscriberKey);
    
    Logger.debug(`Agent ${agentId} unsubscribed from channel: ${channel}`);
  }

  /**
   * Unsubscribe agent from all channels
   */
  unsubscribeAll(agentId) {
    for (const [channel, agents] of this.channels) {
      if (agents.has(agentId)) {
        this.unsubscribe(channel, agentId);
      }
    }
  }

  /**
   * Publish a message to a channel
   */
  publish(channel, message, fromAgent) {
    const subscribers = this.channels.get(channel);
    if (!subscribers || subscribers.size === 0) {
      Logger.debug(`No subscribers for channel: ${channel}`);
      return;
    }

    const envelope = {
      id: uuidv4(),
      channel,
      from: fromAgent,
      timestamp: Date.now(),
      payload: message
    };

    // Add to history
    this.addToHistory(envelope);

    // Deliver to subscribers
    let delivered = 0;
    subscribers.forEach(agentId => {
      if (agentId !== fromAgent) { // Don't send to self
        const subscriberKey = `${channel}:${agentId}`;
        const handler = this.subscribers.get(subscriberKey);
        
        if (handler) {
          try {
            handler(envelope);
            delivered++;
          } catch (error) {
            Logger.error(`Error delivering message to ${agentId}: ${error.message}`);
          }
        }
      }
    });

    Logger.debug(`Published to ${channel}: ${delivered} recipients`);
    this.emit('message:published', envelope);
  }

  /**
   * Broadcast a message to all agents
   */
  broadcast(message, fromAgent) {
    this.publish('broadcast', message, fromAgent);
  }

  /**
   * Send a request and wait for response
   */
  async request(targetAgent, message, fromAgent, timeout = 30000) {
    const requestId = uuidv4();
    
    return new Promise((resolve, reject) => {
      // Set timeout
      const timer = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Request to ${targetAgent} timed out`));
      }, timeout);
      
      // Store pending request
      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        timer,
        from: fromAgent,
        to: targetAgent,
        timestamp: Date.now()
      });
      
      // Send request
      const requestEnvelope = {
        type: 'request',
        id: requestId,
        target: targetAgent,
        from: fromAgent,
        payload: message,
        replyTo: `response:${requestId}`
      };
      
      this.publish(`agent:${targetAgent}`, requestEnvelope, fromAgent);
    });
  }

  /**
   * Send a response to a request
   */
  respond(requestId, response, fromAgent) {
    const pending = this.pendingRequests.get(requestId);
    
    if (pending) {
      clearTimeout(pending.timer);
      pending.resolve({
        from: fromAgent,
        payload: response,
        responseTime: Date.now() - pending.timestamp
      });
      this.pendingRequests.delete(requestId);
    } else {
      Logger.warn(`No pending request found for ID: ${requestId}`);
    }
  }

  /**
   * Register system channels for an agent
   */
  registerAgent(agentId, handlers = {}) {
    // Subscribe to personal channel
    this.subscribe(`agent:${agentId}`, agentId, (message) => {
      if (message.payload.type === 'request' && handlers.onRequest) {
        handlers.onRequest(message.payload);
      } else if (handlers.onMessage) {
        handlers.onMessage(message);
      }
    });
    
    // Subscribe to broadcast channel
    this.subscribe('broadcast', agentId, (message) => {
      if (handlers.onBroadcast) {
        handlers.onBroadcast(message);
      }
    });
    
    // Subscribe to system channel
    this.subscribe('system', agentId, (message) => {
      if (handlers.onSystem) {
        handlers.onSystem(message);
      }
    });
  }

  /**
   * Unregister an agent from all channels
   */
  unregisterAgent(agentId) {
    this.unsubscribeAll(agentId);
    
    // Clean up any pending requests
    for (const [requestId, pending] of this.pendingRequests) {
      if (pending.from === agentId || pending.to === agentId) {
        clearTimeout(pending.timer);
        pending.reject(new Error('Agent disconnected'));
        this.pendingRequests.delete(requestId);
      }
    }
  }

  /**
   * Add message to history
   */
  addToHistory(envelope) {
    this.messageHistory.push(envelope);
    
    // Trim history if too large
    if (this.messageHistory.length > this.maxHistorySize) {
      this.messageHistory = this.messageHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Get message history
   */
  getHistory(filter = {}) {
    let history = [...this.messageHistory];
    
    if (filter.channel) {
      history = history.filter(msg => msg.channel === filter.channel);
    }
    
    if (filter.from) {
      history = history.filter(msg => msg.from === filter.from);
    }
    
    if (filter.since) {
      history = history.filter(msg => msg.timestamp >= filter.since);
    }
    
    if (filter.limit) {
      history = history.slice(-filter.limit);
    }
    
    return history;
  }

  /**
   * Get bus statistics
   */
  getStats() {
    return {
      channels: this.channels.size,
      subscribers: this.subscribers.size,
      pendingRequests: this.pendingRequests.size,
      messageHistory: this.messageHistory.length,
      channelStats: this.getChannelStats()
    };
  }

  /**
   * Get per-channel statistics
   */
  getChannelStats() {
    const stats = {};
    
    for (const [channel, subscribers] of this.channels) {
      stats[channel] = {
        subscribers: subscribers.size,
        messageCount: this.messageHistory.filter(m => m.channel === channel).length
      };
    }
    
    return stats;
  }

  /**
   * Clear message history
   */
  clearHistory() {
    this.messageHistory = [];
  }
}

// Export singleton instance
module.exports = new MessageBus();