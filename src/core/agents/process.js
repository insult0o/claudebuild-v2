const { EventEmitter } = require('events');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const Logger = require('../../cli/utils/logger');

/**
 * Manages a single agent process
 */
class AgentProcess extends EventEmitter {
  constructor(agentId, config) {
    super();
    this.id = agentId;
    this.config = config;
    this.process = null;
    this.state = 'idle';
    this.startTime = null;
    this.workDir = path.join(process.cwd(), '.claudebuild/agents', agentId);
    this.logs = [];
    this.metrics = {
      messagesProcessed: 0,
      errorsCount: 0,
      restarts: 0
    };
  }

  /**
   * Start the agent process
   */
  async start(task) {
    if (this.state === 'running') {
      throw new Error(`Agent ${this.id} is already running`);
    }

    try {
      // Ensure working directory exists
      await fs.mkdir(this.workDir, { recursive: true });
      
      // Write task file for agent
      const taskFile = path.join(this.workDir, 'task.json');
      await fs.writeFile(taskFile, JSON.stringify(task, null, 2));
      
      // Prepare agent environment
      const env = {
        ...process.env,
        CLAUDEBUILD_AGENT_ID: this.id,
        CLAUDEBUILD_AGENT_TYPE: this.config.type,
        CLAUDEBUILD_WORK_DIR: this.workDir,
        CLAUDEBUILD_TASK_FILE: taskFile,
        CLAUDEBUILD_CONFIG: JSON.stringify(this.config),
        // Ensure GitHub token is passed through for automatic auth
        GITHUB_TOKEN: process.env.GITHUB_TOKEN
      };
      
      // Determine runtime based on agent type
      const runtime = this.getRuntime();
      
      // Spawn process
      this.process = spawn(runtime.command, runtime.args, {
        cwd: this.workDir,
        env,
        stdio: ['pipe', 'pipe', 'pipe', 'ipc']
      });
      
      this.state = 'running';
      this.startTime = Date.now();
      
      // Setup process handlers
      this.setupProcessHandlers();
      
      this.emit('started', { agentId: this.id, task });
      Logger.agent(this.config.type, `Agent ${this.id} started`);
      
    } catch (error) {
      this.state = 'error';
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Get runtime configuration based on agent type
   */
  getRuntime() {
    // For now, all agents use Node.js runtime
    // In future, could support Python, Go, etc.
    const runtimePath = path.join(__dirname, 'runtime', 'node.js');
    
    return {
      command: 'node',
      args: [runtimePath]
    };
  }

  /**
   * Setup process event handlers
   */
  setupProcessHandlers() {
    // Handle stdout
    this.process.stdout.on('data', (data) => {
      const output = data.toString();
      this.logs.push({ type: 'stdout', data: output, timestamp: Date.now() });
      this.emit('output', { agentId: this.id, data: output });
      
      // Parse and handle special commands
      this.parseAgentOutput(output);
    });
    
    // Handle stderr
    this.process.stderr.on('data', (data) => {
      const error = data.toString();
      this.logs.push({ type: 'stderr', data: error, timestamp: Date.now() });
      this.metrics.errorsCount++;
      this.emit('error', { agentId: this.id, data: error });
    });
    
    // Handle IPC messages
    this.process.on('message', (msg) => {
      this.handleMessage(msg);
    });
    
    // Handle process exit
    this.process.on('exit', (code, signal) => {
      this.state = 'stopped';
      const runtime = Date.now() - this.startTime;
      
      this.emit('exit', { 
        agentId: this.id, 
        code, 
        signal, 
        runtime,
        metrics: this.metrics 
      });
      
      Logger.agent(this.config.type, `Agent ${this.id} exited (code: ${code})`);
      
      // Auto-restart on unexpected exit
      if (code !== 0 && this.config.autoRestart && this.metrics.restarts < 3) {
        this.restart();
      }
    });
    
    // Handle process errors
    this.process.on('error', (error) => {
      this.state = 'error';
      this.emit('error', { agentId: this.id, error });
    });
  }

  /**
   * Parse agent output for special commands
   */
  parseAgentOutput(output) {
    const lines = output.split('\n');
    
    // Log all output for debugging
    lines.forEach(line => {
      if (line.trim()) {
        console.log(`[${this.id}] ${line}`);
      }
    });
    
    lines.forEach(line => {
      // Check for status updates
      if (line.startsWith('STATUS:')) {
        const status = line.substring(7).trim();
        this.emit('status', { agentId: this.id, status });
      }
      
      // Check for progress updates
      if (line.startsWith('PROGRESS:')) {
        const progress = parseInt(line.substring(9).trim());
        this.emit('progress', { agentId: this.id, progress });
      }
      
      // Check for completion
      if (line.startsWith('COMPLETE:')) {
        const result = line.substring(9).trim();
        this.emit('complete', { agentId: this.id, result });
      }
    });
  }

  /**
   * Handle IPC messages from agent
   */
  handleMessage(msg) {
    this.metrics.messagesProcessed++;
    
    switch (msg.type) {
      case 'request':
        this.emit('request', { agentId: this.id, ...msg });
        break;
        
      case 'broadcast':
        this.emit('broadcast', { agentId: this.id, ...msg });
        break;
        
      case 'status':
        this.emit('status', { agentId: this.id, ...msg });
        break;
        
      case 'complete':
        this.emit('complete', { agentId: this.id, ...msg });
        break;
        
      default:
        this.emit('message', { agentId: this.id, ...msg });
    }
  }

  /**
   * Send message to agent
   */
  send(message) {
    if (this.state !== 'running' || !this.process) {
      throw new Error(`Cannot send message to agent ${this.id} - not running`);
    }
    
    try {
      this.process.send(message);
    } catch (error) {
      this.emit('error', { agentId: this.id, error });
      throw error;
    }
  }

  /**
   * Stop the agent process
   */
  async stop(reason = 'user_requested') {
    if (this.state !== 'running' || !this.process) {
      return;
    }
    
    Logger.agent(this.config.type, `Stopping agent ${this.id} (${reason})`);
    
    // Try graceful shutdown first
    this.process.send({ type: 'shutdown', reason });
    
    // Give it time to shutdown gracefully
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Force kill if still running
    if (this.process && !this.process.killed) {
      this.process.kill('SIGTERM');
      
      // Wait a bit more
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Force kill if still not dead
      if (this.process && !this.process.killed) {
        this.process.kill('SIGKILL');
      }
    }
    
    this.state = 'stopped';
  }

  /**
   * Restart the agent
   */
  async restart() {
    this.metrics.restarts++;
    Logger.agent(this.config.type, `Restarting agent ${this.id} (attempt ${this.metrics.restarts})`);
    
    if (this.state === 'running') {
      await this.stop('restart');
    }
    
    // Wait before restart
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Restart with same task
    const taskFile = path.join(this.workDir, 'task.json');
    try {
      const taskData = await fs.readFile(taskFile, 'utf8');
      const task = JSON.parse(taskData);
      await this.start(task);
    } catch (error) {
      this.emit('error', { agentId: this.id, error });
    }
  }

  /**
   * Get agent health status
   */
  getHealth() {
    return {
      id: this.id,
      type: this.config.type,
      state: this.state,
      uptime: this.state === 'running' ? Date.now() - this.startTime : 0,
      metrics: this.metrics,
      pid: this.process?.pid
    };
  }

  /**
   * Get recent logs
   */
  getLogs(limit = 100) {
    return this.logs.slice(-limit);
  }

  /**
   * Clear logs
   */
  clearLogs() {
    this.logs = [];
  }
}

module.exports = AgentProcess;