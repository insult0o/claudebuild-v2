const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');
const Logger = require('../../cli/utils/logger');

/**
 * Registry for available agent types and their capabilities
 */
class AgentRegistry {
  constructor() {
    this.agents = new Map();
    this.capabilities = new Map();
    this.aliases = new Map();
    this.handlers = new Map();
    this.instance = null;
  }

  static getInstance() {
    if (!AgentRegistry.instance) {
      AgentRegistry.instance = new AgentRegistry();
    }
    return AgentRegistry.instance;
  }

  static getAgent(type) {
    const instance = AgentRegistry.getInstance();
    return instance.getHandler(type);
  }

  /**
   * Initialize registry with built-in agents
   */
  async initialize() {
    // Register built-in agents
    this.registerBuiltinAgents();
    
    // Load agent handlers
    await this.loadAgentHandlers();
    
    // Load BMAD agents
    await this.loadBMADAgents();
    
    // Load custom agents
    await this.loadCustomAgents();
    
    Logger.info(`Agent registry initialized with ${this.agents.size} agents`);
  }

  /**
   * Load agent handler implementations
   */
  async loadAgentHandlers() {
    const handlersPath = path.join(__dirname, 'handlers');
    
    try {
      const files = await fs.readdir(handlersPath);
      
      for (const file of files) {
        if (file.endsWith('.js')) {
          try {
            const handler = require(path.join(handlersPath, file));
            // Check if it's already an instance or needs to be instantiated
            if (handler && handler.name) {
              this.handlers.set(handler.name, handler);
              Logger.debug(`Loaded handler: ${handler.name}`);
            } else if (typeof handler === 'function') {
              // It's a class, instantiate it
              const instance = new handler();
              if (instance.name) {
                this.handlers.set(instance.name, instance);
                Logger.debug(`Loaded handler: ${instance.name}`);
              }
            }
          } catch (error) {
            Logger.warn(`Failed to load handler ${file}: ${error.message}`);
          }
        }
      }
    } catch (error) {
      Logger.debug('No agent handlers directory found');
    }
  }

  /**
   * Get agent handler by type
   */
  getHandler(type) {
    return this.handlers.get(type);
  }

  /**
   * Register built-in agents
   */
  registerBuiltinAgents() {
    const builtinAgents = [
      {
        id: 'orchestrator',
        name: 'Orchestrator',
        type: 'orchestrator',
        description: 'Master orchestrator for coordinating other agents',
        capabilities: ['orchestration', 'planning', 'coordination'],
        runtime: 'node',
        config: {
          autoRestart: true,
          timeout: 0, // No timeout for orchestrator
          maxMemory: '512MB'
        }
      },
      {
        id: 'planner',
        name: 'Planner Agent',
        type: 'planner',
        description: 'Requirements analysis and PRD creation',
        capabilities: ['planning', 'requirements', 'analysis', 'documentation'],
        runtime: 'node',
        config: {
          autoRestart: false,
          timeout: 600000, // 10 minutes
          maxMemory: '512MB'
        }
      },
      {
        id: 'architect',
        name: 'Architect Agent',
        type: 'architect',
        description: 'System design and architecture documentation',
        capabilities: ['architecture', 'design', 'technical-planning', 'documentation'],
        runtime: 'node',
        config: {
          autoRestart: false,
          timeout: 600000, // 10 minutes
          maxMemory: '512MB'
        }
      },
      {
        id: 'scrummaster',
        name: 'ScrumMaster Agent',
        type: 'scrummaster',
        description: 'Story creation and task breakdown',
        capabilities: ['planning', 'story-creation', 'task-breakdown', 'estimation'],
        runtime: 'node',
        config: {
          autoRestart: false,
          timeout: 600000, // 10 minutes
          maxMemory: '512MB'
        }
      },
      {
        id: 'dev',
        name: 'Developer Agent',
        type: 'dev',
        description: 'Handles coding and implementation tasks',
        capabilities: ['development', 'coding', 'implementation', 'refactoring', 'testing'],
        runtime: 'node',
        config: {
          autoRestart: false,
          timeout: 600000, // 10 minutes
          maxMemory: '512MB'
        }
      },
      {
        id: 'builder',
        name: 'Builder Agent',
        type: 'builder',
        description: 'Story implementation and coding',
        capabilities: ['development', 'coding', 'implementation', 'testing'],
        runtime: 'node',
        config: {
          autoRestart: false,
          timeout: 1200000, // 20 minutes
          maxMemory: '1024MB'
        }
      },
      {
        id: 'qa',
        name: 'QA Agent',
        type: 'qa',
        description: 'Quality assurance and testing',
        capabilities: ['testing', 'quality-assurance', 'validation', 'review'],
        runtime: 'node',
        config: {
          autoRestart: false,
          timeout: 600000, // 10 minutes
          maxMemory: '512MB'
        }
      },
      {
        id: 'manager',
        name: 'Manager Agent',
        type: 'manager',
        description: 'Project management and PR creation',
        capabilities: ['management', 'integration', 'reporting', 'pr-creation'],
        runtime: 'node',
        config: {
          autoRestart: false,
          timeout: 600000, // 10 minutes
          maxMemory: '512MB'
        }
      },
      {
        id: 'generic',
        name: 'Generic Agent',
        type: 'generic',
        description: 'General purpose agent for various tasks',
        capabilities: ['general', 'task-execution'],
        runtime: 'node',
        config: {
          autoRestart: false,
          timeout: 300000, // 5 minutes
          maxMemory: '256MB'
        }
      }
    ];

    builtinAgents.forEach(agent => this.register(agent));
  }

  /**
   * Load BMAD agent definitions
   */
  async loadBMADAgents() {
    const bmadAgentsPath = path.join(__dirname, '../../bmad/agents');
    
    try {
      // Check if BMAD agents directory exists
      await fs.access(bmadAgentsPath);
      const files = await fs.readdir(bmadAgentsPath);
      
      for (const file of files) {
        if (file.endsWith('.md')) {
          try {
            const agentDef = await this.parseBMADAgent(
              path.join(bmadAgentsPath, file)
            );
            if (agentDef) {
              this.register(agentDef);
            }
          } catch (error) {
            Logger.warn(`Failed to load BMAD agent ${file}: ${error.message}`);
          }
        }
      }
    } catch (error) {
      Logger.debug('BMAD agents directory not found, skipping');
    }
  }

  /**
   * Parse BMAD agent definition from markdown file
   */
  async parseBMADAgent(filePath) {
    const content = await fs.readFile(filePath, 'utf8');
    
    // Extract YAML frontmatter
    const yamlMatch = content.match(/^```yaml\n([\s\S]*?)\n```/m);
    if (!yamlMatch) {
      return null;
    }

    try {
      const yamlContent = yamlMatch[1];
      const parsed = yaml.load(yamlContent);
      
      // Convert BMAD format to our format
      const agentDef = {
        id: parsed.agent?.id || path.basename(filePath, '.md'),
        name: parsed.agent?.name || parsed.persona?.role,
        type: parsed.agent?.id || 'bmad',
        description: parsed.agent?.whenToUse || '',
        capabilities: this.extractCapabilities(parsed),
        runtime: 'node',
        config: {
          autoRestart: false,
          timeout: 600000, // 10 minutes
          maxMemory: '512MB',
          bmadDefinition: parsed
        }
      };

      return agentDef;
    } catch (error) {
      Logger.debug(`Failed to parse BMAD agent YAML: ${error.message}`);
      return null;
    }
  }

  /**
   * Extract capabilities from BMAD agent definition
   */
  extractCapabilities(bmadDef) {
    const capabilities = [];
    
    // Extract from agent definition
    if (bmadDef.agent?.id) {
      capabilities.push(bmadDef.agent.id);
    }
    
    // Extract from commands
    if (bmadDef.commands) {
      Object.keys(bmadDef.commands).forEach(cmd => {
        if (cmd.startsWith('*')) {
          capabilities.push(cmd.substring(1));
        }
      });
    }
    
    // Map common BMAD roles to capabilities
    const roleMap = {
      'analyst': ['analysis', 'requirements', 'research'],
      'pm': ['planning', 'product-management', 'requirements'],
      'architect': ['architecture', 'design', 'technical-planning'],
      'dev': ['development', 'coding', 'implementation'],
      'qa': ['testing', 'quality-assurance', 'validation'],
      'devops': ['deployment', 'infrastructure', 'automation']
    };
    
    const agentId = bmadDef.agent?.id;
    if (agentId && roleMap[agentId]) {
      capabilities.push(...roleMap[agentId]);
    }
    
    return [...new Set(capabilities)]; // Remove duplicates
  }

  /**
   * Load custom agent definitions
   */
  async loadCustomAgents() {
    const customAgentsPath = path.join(process.cwd(), '.claudebuild/custom-agents');
    
    try {
      await fs.access(customAgentsPath);
      const files = await fs.readdir(customAgentsPath);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const content = await fs.readFile(
              path.join(customAgentsPath, file),
              'utf8'
            );
            const agentDef = JSON.parse(content);
            this.register(agentDef);
          } catch (error) {
            Logger.warn(`Failed to load custom agent ${file}: ${error.message}`);
          }
        }
      }
    } catch (error) {
      Logger.debug('Custom agents directory not found, skipping');
    }
  }

  /**
   * Register an agent definition
   */
  register(agentDef) {
    // Validate agent definition
    if (!agentDef.id || !agentDef.type) {
      throw new Error('Agent must have id and type');
    }

    // Store agent
    this.agents.set(agentDef.id, agentDef);
    
    // Index capabilities
    (agentDef.capabilities || []).forEach(capability => {
      if (!this.capabilities.has(capability)) {
        this.capabilities.set(capability, new Set());
      }
      this.capabilities.get(capability).add(agentDef.id);
    });
    
    // Register aliases
    if (agentDef.aliases) {
      agentDef.aliases.forEach(alias => {
        this.aliases.set(alias, agentDef.id);
      });
    }
    
    Logger.debug(`Registered agent: ${agentDef.id} (${agentDef.name})`);
  }

  /**
   * Get agent definition by ID
   */
  get(agentId) {
    // Check direct ID
    if (this.agents.has(agentId)) {
      return this.agents.get(agentId);
    }
    
    // Check aliases
    if (this.aliases.has(agentId)) {
      return this.agents.get(this.aliases.get(agentId));
    }
    
    return null;
  }

  /**
   * Find agents by capability
   */
  findByCapability(capability) {
    const agentIds = this.capabilities.get(capability);
    if (!agentIds) {
      return [];
    }
    
    return Array.from(agentIds).map(id => this.agents.get(id));
  }

  /**
   * Find best agent for a task
   */
  findAgentForTask(task) {
    // If task specifies agent type, use that
    if (task.agentType) {
      return this.get(task.agentType);
    }
    
    // Otherwise, find by required capabilities
    const requiredCaps = task.requiredCapabilities || [];
    if (requiredCaps.length === 0) {
      // Default to generic agent
      return this.get('generic');
    }
    
    // Find agents that have all required capabilities
    const candidates = [];
    
    for (const [agentId, agentDef] of this.agents) {
      const agentCaps = new Set(agentDef.capabilities || []);
      const hasAllCaps = requiredCaps.every(cap => agentCaps.has(cap));
      
      if (hasAllCaps) {
        candidates.push(agentDef);
      }
    }
    
    // Return first match (could be enhanced with scoring)
    return candidates[0] || this.get('generic');
  }

  /**
   * List all registered agents
   */
  list() {
    return Array.from(this.agents.values());
  }

  /**
   * Get agent statistics
   */
  getStats() {
    return {
      totalAgents: this.agents.size,
      byType: this.getAgentsByType(),
      capabilities: Array.from(this.capabilities.keys())
    };
  }

  /**
   * Group agents by type
   */
  getAgentsByType() {
    const byType = {};
    
    for (const agent of this.agents.values()) {
      const type = agent.type || 'unknown';
      if (!byType[type]) {
        byType[type] = [];
      }
      byType[type].push(agent.id);
    }
    
    return byType;
  }
}

module.exports = AgentRegistry;