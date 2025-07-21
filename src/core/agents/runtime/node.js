#!/usr/bin/env node

/**
 * Node.js runtime for ClaudeBuild agents
 * This is the process that runs inside each agent
 */

const fs = require('fs').promises;
const path = require('path');

// Agent context from environment
const AGENT_ID = process.env.CLAUDEBUILD_AGENT_ID;
const AGENT_TYPE = process.env.CLAUDEBUILD_AGENT_TYPE;
const WORK_DIR = process.env.CLAUDEBUILD_WORK_DIR;
const TASK_FILE = process.env.CLAUDEBUILD_TASK_FILE;
const CONFIG = JSON.parse(process.env.CLAUDEBUILD_CONFIG || '{}');

// Agent state
let task = null;
let running = true;

/**
 * Log with agent prefix
 */
function log(message) {
  console.log(`[${AGENT_TYPE}:${AGENT_ID}] ${message}`);
}

/**
 * Send status update
 */
function updateStatus(status) {
  console.log(`STATUS: ${status}`);
}

/**
 * Send progress update
 */
function updateProgress(progress) {
  console.log(`PROGRESS: ${progress}`);
}

/**
 * Send completion signal
 */
function complete(result) {
  console.log(`COMPLETE: ${JSON.stringify(result)}`);
  sendMessage({
    type: 'complete',
    result: result
  });
}

/**
 * Send IPC message to parent process
 */
function sendMessage(message) {
  if (process.send) {
    process.send(message);
  }
}

/**
 * Handle incoming IPC messages
 */
process.on('message', (msg) => {
  switch (msg.type) {
    case 'shutdown':
      log(`Received shutdown signal: ${msg.reason}`);
      shutdown();
      break;
      
    case 'ping':
      sendMessage({ type: 'pong', timestamp: Date.now() });
      break;
      
    case 'task':
      handleNewTask(msg.payload);
      break;
      
    default:
      log(`Unknown message type: ${msg.type}`);
  }
});

/**
 * Handle new task assignment
 */
async function handleNewTask(newTask) {
  task = newTask;
  log(`Received new task: ${task.id || 'unnamed'}`);
  await executeTask();
}

/**
 * Load task from file
 */
async function loadTask() {
  try {
    const taskData = await fs.readFile(TASK_FILE, 'utf8');
    task = JSON.parse(taskData);
    log(`Loaded task: ${task.id || 'unnamed'}`);
  } catch (error) {
    log(`Error loading task: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Execute the task based on agent type
 */
async function executeTask() {
  if (!task) {
    log('No task to execute');
    return;
  }

  updateStatus('starting');
  updateProgress(0);

  try {
    // Load agent-specific handler
    const handlerPath = path.join(__dirname, '..', 'handlers', `${AGENT_TYPE}.js`);
    
    try {
      const handler = require(handlerPath);
      
      // Initialize MCP if available
      let mcpClient = null;
      let toolPolicy = null;
      
      try {
        const MCPClient = require('../mcp/client');
        const ToolAccessPolicy = require('../mcp/policy');
        
        mcpClient = new MCPClient();
        toolPolicy = new ToolAccessPolicy();
        await toolPolicy.load();
        
        log('MCP tools available');
      } catch (error) {
        log('MCP tools not available:', error.message);
      }
      
      // Create agent context
      const context = {
        agentId: AGENT_ID,
        agentType: AGENT_TYPE,
        workDir: WORK_DIR,
        config: CONFIG,
        task,
        
        // Utility functions
        log,
        updateStatus,
        updateProgress,
        sendMessage,
        
        // File operations
        readFile: (file) => {
          // If it's an absolute path or starts with .., use it as-is
          // Otherwise, treat it as relative to WORK_DIR
          const filePath = path.isAbsolute(file) || file.startsWith('..') 
            ? file 
            : path.join(WORK_DIR, file);
          return fs.readFile(filePath, 'utf8');
        },
        writeFile: (file, content) => {
          const filePath = path.isAbsolute(file) || file.startsWith('..')
            ? file
            : path.join(WORK_DIR, file);
          return fs.writeFile(filePath, content);
        },
        
        // Communication
        broadcast: (message) => sendMessage({ type: 'broadcast', payload: message }),
        request: (target, message) => sendMessage({ 
          type: 'request', 
          target, 
          payload: message 
        }),
        
        // MCP Tools (if available)
        tools: mcpClient ? {
          webSearch: async (query) => {
            if (await toolPolicy.checkAccess(AGENT_ID, 'web_search', { query })) {
              return mcpClient.callTool('web_search', { query });
            }
            throw new Error('Tool access denied');
          },
          githubSearch: async (query) => {
            if (await toolPolicy.checkAccess(AGENT_ID, 'github_search', { query })) {
              return mcpClient.callTool('github_search', { query });
            }
            throw new Error('Tool access denied');
          },
          readPdf: async (url) => {
            if (await toolPolicy.checkAccess(AGENT_ID, 'pdf_parser', { url })) {
              return mcpClient.callTool('pdf_parser', { url });
            }
            throw new Error('Tool access denied');
          }
        } : null
      };
      
      // Execute handler
      updateStatus('executing');
      const result = await handler.execute(context);
      
      updateStatus('completed');
      updateProgress(100);
      complete(result);
      
    } catch (error) {
      if (error.code === 'MODULE_NOT_FOUND') {
        // No specific handler, use generic handler
        log(`No specific handler for ${AGENT_TYPE}, using generic handler`);
        await executeGenericTask();
      } else {
        throw error;
      }
    }
    
  } catch (error) {
    log(`Error executing task: ${error.message}`);
    updateStatus('error');
    sendMessage({ 
      type: 'error', 
      error: {
        message: error.message,
        stack: error.stack
      }
    });
  }
}

/**
 * Generic task execution
 */
async function executeGenericTask() {
  log('Executing generic task handler');
  updateStatus('executing');
  
  // Simulate work
  for (let i = 0; i <= 100; i += 10) {
    updateProgress(i);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  const result = {
    success: true,
    message: `Task completed by ${AGENT_TYPE} agent`,
    taskId: task.id,
    timestamp: Date.now()
  };
  
  complete(result);
}

/**
 * Graceful shutdown
 */
async function shutdown() {
  running = false;
  updateStatus('shutting down');
  
  // Cleanup
  try {
    // Save any work in progress
    if (task) {
      await fs.writeFile(
        path.join(WORK_DIR, 'checkpoint.json'),
        JSON.stringify({ task, timestamp: Date.now() })
      );
    }
  } catch (error) {
    log(`Error during shutdown: ${error.message}`);
  }
  
  process.exit(0);
}

/**
 * Handle uncaught errors
 */
process.on('uncaughtException', (error) => {
  log(`Uncaught exception: ${error.message}`);
  sendMessage({ 
    type: 'error', 
    error: {
      message: error.message,
      stack: error.stack,
      fatal: true
    }
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled rejection at: ${promise}, reason: ${reason}`);
  sendMessage({ 
    type: 'error', 
    error: {
      message: `Unhandled rejection: ${reason}`,
      fatal: true
    }
  });
  process.exit(1);
});

/**
 * Main entry point
 */
async function main() {
  log('Agent runtime starting...');
  log(`Type: ${AGENT_TYPE}, ID: ${AGENT_ID}`);
  log(`Working directory: ${WORK_DIR}`);
  
  // Load and execute initial task
  await loadTask();
  await executeTask();
  
  // Wait a bit to ensure all file operations complete
  log('Task completed, waiting for file operations to complete...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Exit after task completion
  log('Shutting down agent');
  await shutdown();
}

// Start the agent
main().catch(error => {
  log(`Fatal error: ${error.message}`);
  process.exit(1);
});