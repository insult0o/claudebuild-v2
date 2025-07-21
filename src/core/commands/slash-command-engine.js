const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);
const Logger = require('../../cli/utils/logger');
const AgentManager = require('../agents/manager');
const WorktreeManager = require('../worktree');
const MCPClient = require('../agents/mcp/client');

/**
 * Slash Command Engine
 * Loads and executes markdown-based slash commands for ClaudeBuild
 */
class SlashCommandEngine {
  constructor(options = {}) {
    this.commandsDir = options.commandsDir || path.join(process.cwd(), 'commands');
    this.commands = new Map();
    this.agentManager = new AgentManager();
    this.worktreeManager = new WorktreeManager();
    this.mcpClient = null;
    this.initialized = false;
  }

  /**
   * Initialize the command engine
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Initialize subsystems
      await this.worktreeManager.initialize();
      await this.agentManager.initialize();

      // Load all commands
      await this.loadCommands();

      // Setup MCP if available
      if (process.env.CLAUDEBUILD_MCP_ENABLED !== 'false') {
        this.mcpClient = new MCPClient();
        await this.mcpClient.connect();
      }

      this.initialized = true;
      Logger.success(`Loaded ${this.commands.size} slash commands`);
    } catch (error) {
      Logger.error(`Failed to initialize command engine: ${error.message}`);
      throw error;
    }
  }

  /**
   * Load all commands from the commands directory
   */
  async loadCommands() {
    try {
      // Ensure commands directory exists
      if (!fs.existsSync(this.commandsDir)) {
        fs.mkdirSync(this.commandsDir, { recursive: true });
      }

      // Read all .md files
      const files = await readdir(this.commandsDir);
      const commandFiles = files.filter(f => f.endsWith('.md') && f !== 'README.md');

      for (const file of commandFiles) {
        await this.loadCommand(file);
      }
    } catch (error) {
      Logger.error(`Failed to load commands: ${error.message}`);
    }
  }

  /**
   * Load a single command from file
   */
  async loadCommand(filename) {
    try {
      const filepath = path.join(this.commandsDir, filename);
      const content = await readFile(filepath, 'utf8');
      const commandName = path.basename(filename, '.md');

      // Parse command metadata
      const command = {
        name: commandName,
        content,
        filepath,
        ...this.parseCommandMetadata(content)
      };

      this.commands.set(commandName, command);
      Logger.debug(`Loaded command: /${commandName}`);
    } catch (error) {
      Logger.error(`Failed to load command ${filename}: ${error.message}`);
    }
  }

  /**
   * Parse command metadata from markdown
   */
  parseCommandMetadata(content) {
    const metadata = {};

    // Extract purpose
    const purposeMatch = content.match(/## Purpose\n(.+?)(?=\n##|$)/s);
    if (purposeMatch) {
      metadata.purpose = purposeMatch[1].trim();
    }

    // Extract usage examples
    const usageMatch = content.match(/## Usage\n```\n(.+?)\n```/s);
    if (usageMatch) {
      metadata.usage = usageMatch[1].trim();
    }

    // Extract process steps
    const processMatch = content.match(/## Process\n(.+?)(?=\n##|$)/s);
    if (processMatch) {
      metadata.process = processMatch[1].trim();
    }

    return metadata;
  }

  /**
   * Execute a slash command
   */
  async execute(commandStr, options = {}) {
    // Parse command and arguments
    const { command, args, flags } = this.parseCommand(commandStr);

    if (!this.commands.has(command)) {
      throw new Error(`Unknown command: /${command}`);
    }

    Logger.info(`Executing /${command}`);

    // Get command definition
    const cmdDef = this.commands.get(command);

    // Build context for agent
    const context = await this.buildContext(cmdDef, args, flags, options);

    // Execute based on command type
    switch (command) {
      case 'plan':
        return await this.executePlan(context);
      case 'build':
        return await this.executeBuild(context);
      case 'review':
        return await this.executeReview(context);
      case 'spec':
        return await this.executeSpec(context);
      default:
        return await this.executeGeneric(cmdDef, context);
    }
  }

  /**
   * Parse command string into components
   */
  parseCommand(commandStr) {
    const parts = commandStr.split(/\s+/);
    const command = parts[0].replace(/^\//, '');
    const args = [];
    const flags = {};

    for (let i = 1; i < parts.length; i++) {
      if (parts[i].startsWith('--')) {
        const key = parts[i].substring(2);
        const value = parts[i + 1] && !parts[i + 1].startsWith('--') 
          ? parts[++i] 
          : true;
        flags[key] = value;
      } else {
        args.push(parts[i]);
      }
    }

    return { command, args, flags };
  }

  /**
   * Build context for command execution
   */
  async buildContext(cmdDef, args, flags, options) {
    const context = {
      command: cmdDef,
      args,
      flags,
      workDir: process.cwd(),
      timestamp: new Date().toISOString(),
      ...options
    };

    // Add MCP tools if available
    if (this.mcpClient && this.mcpClient.isConnected()) {
      context.tools = {
        web_search: (query) => this.mcpClient.callTool('web_search', { query }),
        github_search: (query, type) => this.mcpClient.callTool('github_search', { query, type })
      };
    }

    // Add project context
    const claudeMd = path.join(process.cwd(), 'CLAUDE.md');
    if (fs.existsSync(claudeMd)) {
      context.projectContext = await readFile(claudeMd, 'utf8');
    }

    return context;
  }

  /**
   * Execute /plan command
   */
  async executePlan(context) {
    const { args, flags } = context;
    const requirement = args.join(' ');

    // Create planner agent
    const agent = await this.agentManager.createAgent({
      type: 'planner',
      task: {
        description: requirement,
        useSubAgents: flags.parallel,
        thinkHard: true
      }
    });

    // Execute planning
    const result = await agent.execute({
      ...context,
      input: {
        requirement,
        methodology: 'BMAD',
        outputFormat: {
          prd: 'plans/PRD-{timestamp}.md',
          architecture: 'plans/architecture-{timestamp}.md',
          tasks: 'tasks/tasks.json'
        }
      }
    });

    Logger.success('Planning complete');
    return result;
  }

  /**
   * Execute /build command
   */
  async executeBuild(context) {
    const { flags } = context;
    
    // Load tasks
    let tasks = [];
    if (flags.from) {
      const tasksFile = path.join(process.cwd(), flags.from);
      const tasksData = JSON.parse(await readFile(tasksFile, 'utf8'));
      tasks = tasksData.tasks || [];
    } else if (flags.task) {
      tasks = [{ id: flags.task, agent: flags.agent || 'dev' }];
    }

    // Setup parallel execution
    const parallel = parseInt(flags.parallel) || 3;
    const results = [];

    // Process tasks in batches
    for (let i = 0; i < tasks.length; i += parallel) {
      const batch = tasks.slice(i, i + parallel);
      const batchResults = await Promise.all(
        batch.map(task => this.buildTask(task, context))
      );
      results.push(...batchResults);
    }

    Logger.success(`Built ${results.length} tasks`);
    return results;
  }

  /**
   * Build a single task
   */
  async buildTask(task, context) {
    // Create worktree for isolation
    const session = await this.worktreeManager.createSession(
      `build-${task.id}`,
      {
        agent: task.agent,
        task
      }
    );

    // Create builder agent
    const agent = await this.agentManager.createAgent({
      type: task.agent || 'dev',
      workDir: session.worktree,
      task
    });

    // Execute build
    const result = await agent.execute({
      ...context,
      session,
      input: task
    });

    // Create checkpoint
    await this.worktreeManager.checkpoint(
      session.id,
      `Completed task: ${task.title || task.id}`
    );

    return result;
  }

  /**
   * Execute /review command
   */
  async executeReview(context) {
    const { flags } = context;
    const hats = (flags.hat || 'best-practices').split(',');
    const results = [];

    // Run reviews in parallel
    const reviews = await Promise.all(
      hats.map(hat => this.runReview(hat, context))
    );

    results.push(...reviews);

    // Aggregate results
    const summary = this.aggregateReviews(results);
    Logger.success(`Review complete: ${summary.score}/10`);
    
    return summary;
  }

  /**
   * Run a single review with specific perspective
   */
  async runReview(hat, context) {
    const agent = await this.agentManager.createAgent({
      type: 'reviewer',
      perspective: hat
    });

    return await agent.execute({
      ...context,
      input: {
        perspective: hat,
        branch: context.flags.branch || 'main',
        pr: context.flags.pr
      }
    });
  }

  /**
   * Execute /spec command
   */
  async executeSpec(context) {
    const { args, flags } = context;
    const subtask = args.join(' ') || flags.task;

    const agent = await this.agentManager.createAgent({
      type: 'architect',
      task: { description: `Create specification for: ${subtask}` }
    });

    const result = await agent.execute({
      ...context,
      input: {
        subtask,
        thinkHard: true,
        considerEdgeCases: true
      }
    });

    // Save spec
    const specPath = `specs/${subtask.replace(/\s+/g, '-')}.md`;
    fs.writeFileSync(specPath, result.specification);
    
    Logger.success(`Specification saved to ${specPath}`);
    return result;
  }

  /**
   * Execute generic command
   */
  async executeGeneric(cmdDef, context) {
    // Create agent with command prompt
    const agent = await this.agentManager.createAgent({
      type: 'generic',
      systemPrompt: cmdDef.content
    });

    return await agent.execute(context);
  }

  /**
   * Aggregate review results
   */
  aggregateReviews(reviews) {
    const scores = reviews.map(r => r.score || 5);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    const issues = [];
    const suggestions = [];

    reviews.forEach(review => {
      if (review.issues) issues.push(...review.issues);
      if (review.suggestions) suggestions.push(...review.suggestions);
    });

    return {
      score: Math.round(avgScore * 10) / 10,
      reviews: reviews.length,
      issues: issues.length,
      suggestions: suggestions.length,
      details: reviews
    };
  }

  /**
   * List available commands
   */
  listCommands() {
    const commands = [];
    
    for (const [name, cmd] of this.commands) {
      commands.push({
        name: `/${name}`,
        purpose: cmd.purpose || 'No description available'
      });
    }

    return commands;
  }

  /**
   * Get command help
   */
  getHelp(commandName) {
    const cmd = this.commands.get(commandName);
    if (!cmd) {
      throw new Error(`Unknown command: /${commandName}`);
    }

    return {
      name: `/${commandName}`,
      purpose: cmd.purpose,
      usage: cmd.usage,
      process: cmd.process,
      content: cmd.content
    };
  }
}

module.exports = SlashCommandEngine;