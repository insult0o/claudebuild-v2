const Logger = require('../../../cli/utils/logger');

/**
 * MCP Keep-Alive Manager
 * Ensures MCP server connections remain stable
 */
class KeepAliveManager {
  constructor(mcpClient) {
    this.client = mcpClient;
    this.interval = null;
    this.pingInterval = 30000; // 30 seconds
    this.reconnectDelay = 5000; // 5 seconds
    this.maxReconnectAttempts = 5;
    this.reconnectAttempts = 0;
    this.isShuttingDown = false;
  }

  /**
   * Start keep-alive monitoring
   */
  start() {
    if (this.interval) {
      return; // Already running
    }

    Logger.debug('[MCP Keep-Alive] Starting monitor');

    // Send initial ping
    this.ping();

    // Setup periodic ping
    this.interval = setInterval(() => {
      if (!this.isShuttingDown) {
        this.ping();
      }
    }, this.pingInterval);

    // Handle process termination
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
  }

  /**
   * Stop keep-alive monitoring
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    Logger.debug('[MCP Keep-Alive] Stopped monitor');
  }

  /**
   * Send ping to MCP server
   */
  async ping() {
    try {
      // Check if client is connected
      if (!this.client.isConnected()) {
        Logger.warn('[MCP Keep-Alive] Client disconnected, attempting reconnect');
        await this.reconnect();
        return;
      }

      // Send ping request (list tools as a lightweight operation)
      const start = Date.now();
      await this.client.sendRequest('tools/list', {});
      const latency = Date.now() - start;

      Logger.debug(`[MCP Keep-Alive] Ping successful (${latency}ms)`);
      
      // Reset reconnect attempts on successful ping
      this.reconnectAttempts = 0;
    } catch (error) {
      Logger.warn(`[MCP Keep-Alive] Ping failed: ${error.message}`);
      await this.handlePingFailure();
    }
  }

  /**
   * Handle ping failure
   */
  async handlePingFailure() {
    if (this.isShuttingDown) return;

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      await this.reconnect();
    } else {
      Logger.error('[MCP Keep-Alive] Max reconnect attempts reached');
      this.stop();
      // Emit event for upstream handling
      this.client.emit('connection-lost', {
        attempts: this.reconnectAttempts,
        reason: 'Max reconnect attempts exceeded'
      });
    }
  }

  /**
   * Attempt to reconnect to MCP server
   */
  async reconnect() {
    if (this.isShuttingDown) return;

    this.reconnectAttempts++;
    Logger.info(`[MCP Keep-Alive] Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

    try {
      // Wait before reconnecting
      await this.delay(this.reconnectDelay);

      // Attempt reconnection
      await this.client.reconnect();
      
      Logger.success('[MCP Keep-Alive] Reconnected successfully');
      this.reconnectAttempts = 0;
    } catch (error) {
      Logger.error(`[MCP Keep-Alive] Reconnect failed: ${error.message}`);
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    if (this.isShuttingDown) return;
    
    this.isShuttingDown = true;
    Logger.info('[MCP Keep-Alive] Shutting down gracefully');
    
    this.stop();
    
    if (this.client.isConnected()) {
      try {
        await this.client.disconnect();
      } catch (error) {
        Logger.warn(`[MCP Keep-Alive] Error during disconnect: ${error.message}`);
      }
    }
  }

  /**
   * Helper to delay execution
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get keep-alive statistics
   */
  getStats() {
    return {
      isRunning: !!this.interval,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      pingInterval: this.pingInterval,
      isShuttingDown: this.isShuttingDown
    };
  }

  /**
   * Update configuration
   */
  configure(options = {}) {
    if (options.pingInterval) {
      this.pingInterval = options.pingInterval;
      // Restart if running
      if (this.interval) {
        this.stop();
        this.start();
      }
    }

    if (options.maxReconnectAttempts) {
      this.maxReconnectAttempts = options.maxReconnectAttempts;
    }

    if (options.reconnectDelay) {
      this.reconnectDelay = options.reconnectDelay;
    }
  }
}

module.exports = KeepAliveManager;