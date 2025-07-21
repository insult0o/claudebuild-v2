const { spawn } = require('child_process');
const path = require('path');
const Logger = require('../../../cli/utils/logger');

/**
 * MCP Client for ClaudeBuild agents
 * Provides access to MCP server tools
 */
class MCPClient {
  constructor(config = {}) {
    this.serverPath = config.serverPath || path.join(__dirname, '../../../../mcp-server/index.js');
    this.transport = config.transport || 'stdio';
    this.process = null;
    this.connected = false;
    this.messageId = 0;
    this.pendingRequests = new Map();
  }

  /**
   * Connect to MCP server
   */
  async connect() {
    if (this.connected) return;

    try {
      // Spawn MCP server process
      this.process = spawn('node', [this.serverPath], {
        stdio: ['pipe', 'pipe', 'pipe', 'ipc']
      });

      // Handle stdout (responses)
      this.process.stdout.on('data', (data) => {
        this.handleResponse(data.toString());
      });

      // Handle stderr (errors)
      this.process.stderr.on('data', (data) => {
        Logger.error('MCP Server error:', data.toString());
      });

      // Handle process exit
      this.process.on('exit', (code) => {
        this.connected = false;
        Logger.warn(`MCP Server exited with code ${code}`);
      });

      // Send initialization
      await this.sendRequest('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'claudebuild-agent',
          version: '1.0.0'
        }
      });

      this.connected = true;
      Logger.info('Connected to MCP server');
      
    } catch (error) {
      Logger.error('Failed to connect to MCP server:', error.message);
      throw error;
    }
  }

  /**
   * Call an MCP tool
   */
  async callTool(toolName, parameters) {
    if (!this.connected) {
      await this.connect();
    }

    return this.sendRequest('tools/call', {
      name: toolName,
      arguments: parameters
    });
  }

  /**
   * Send request to MCP server
   */
  sendRequest(method, params) {
    return new Promise((resolve, reject) => {
      const id = ++this.messageId;
      
      const message = {
        jsonrpc: '2.0',
        id: id,
        method: method,
        params: params
      };

      // Store pending request
      this.pendingRequests.set(id, { resolve, reject });

      // Send to server
      this.process.stdin.write(JSON.stringify(message) + '\n');

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  /**
   * Handle response from MCP server
   */
  handleResponse(data) {
    try {
      const lines = data.trim().split('\n');
      
      for (const line of lines) {
        if (!line) continue;
        
        const response = JSON.parse(line);
        
        if (response.id && this.pendingRequests.has(response.id)) {
          const { resolve, reject } = this.pendingRequests.get(response.id);
          this.pendingRequests.delete(response.id);
          
          if (response.error) {
            reject(new Error(response.error.message));
          } else {
            resolve(response.result);
          }
        }
      }
    } catch (error) {
      Logger.error('Error parsing MCP response:', error.message);
    }
  }

  /**
   * Disconnect from MCP server
   */
  async disconnect() {
    if (this.process) {
      this.process.kill();
      this.process = null;
      this.connected = false;
    }
  }
}

module.exports = MCPClient;