# Story 004: Agent Runtime System

## Story Details
- **ID**: STORY-004
- **Epic**: Epic 2 - Multi-Agent Development
- **Priority**: P0 (Must Have)
- **Estimated Effort**: 5 points
- **Status**: Draft
- **Dependencies**: STORY-001 ✅, STORY-002 ✅

## User Story
As a developer, I want ClaudeBuild to manage and execute AI agents as separate processes so that multiple agents can work on different tasks simultaneously with proper isolation and resource management.

## Acceptance Criteria
- [ ] Agent runtime can spawn and manage multiple agent processes
- [ ] Each agent runs in isolation with its own working directory
- [ ] Agents can communicate through a message bus
- [ ] Agent lifecycle management (start, stop, restart, health checks)
- [ ] Resource limits enforced (CPU, memory, timeout)
- [ ] Agent output captured and logged
- [ ] Error handling and automatic restart on failure
- [ ] Support for different agent types (BMAD agents)
- [ ] Integration with Claude Code API

## Technical Requirements

### Agent Runtime Architecture
```
┌─────────────────────────────────────────────────┐
│             Orchestrator                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │   Agent     │  │   Message   │  │  State  │ │
│  │  Registry   │  │     Bus     │  │ Manager │ │
│  └─────────────┘  └─────────────┘  └─────────┘ │
└─────────────────────┬───────────────────────────┘
                      │
     ┌────────────────┼────────────────┐
     ▼                ▼                ▼
┌─────────┐     ┌─────────┐     ┌─────────┐
│ Agent 1 │     │ Agent 2 │     │ Agent 3 │
│ Process │     │ Process │     │ Process │
└─────────┘     └─────────┘     └─────────┘
```

### Implementation Tasks

#### Task 1: Core Agent Runtime
- [ ] Create AgentProcess class for process management
- [ ] Implement process spawning with proper isolation
- [ ] Add stdout/stderr capture and streaming
- [ ] Implement graceful shutdown
- [ ] Add health check mechanism

#### Task 2: Agent Registry
- [ ] Create registry for available agent types
- [ ] Load BMAD agent definitions
- [ ] Support custom agent types
- [ ] Agent capability discovery
- [ ] Version management

#### Task 3: Message Bus
- [ ] Implement inter-agent communication
- [ ] Create message queue system
- [ ] Add pub/sub for agent events
- [ ] Implement request/response patterns
- [ ] Add message persistence

#### Task 4: Resource Management
- [ ] CPU usage monitoring and limits
- [ ] Memory usage tracking
- [ ] Timeout enforcement
- [ ] Rate limiting for API calls
- [ ] Concurrent agent limits

#### Task 5: Claude Code Integration
- [ ] Create Claude API client wrapper
- [ ] Implement conversation management
- [ ] Add retry logic with backoff
- [ ] Token usage tracking
- [ ] Response caching

## Code Examples

### AgentProcess Class
```javascript
class AgentProcess extends EventEmitter {
  constructor(agentId, config) {
    super();
    this.id = agentId;
    this.config = config;
    this.process = null;
    this.state = 'idle';
    this.startTime = null;
    this.workDir = path.join('.claudebuild/agents', agentId);
  }

  async start(task) {
    // Ensure working directory exists
    await fs.mkdir(this.workDir, { recursive: true });
    
    // Prepare agent environment
    const env = {
      ...process.env,
      AGENT_ID: this.id,
      AGENT_TYPE: this.config.type,
      WORK_DIR: this.workDir,
      TASK_JSON: JSON.stringify(task)
    };
    
    // Spawn process
    this.process = spawn('node', [this.config.runtime], {
      cwd: this.workDir,
      env,
      stdio: ['pipe', 'pipe', 'pipe', 'ipc']
    });
    
    this.state = 'running';
    this.startTime = Date.now();
    
    // Handle process events
    this.setupProcessHandlers();
  }
  
  setupProcessHandlers() {
    this.process.stdout.on('data', (data) => {
      this.emit('output', data.toString());
    });
    
    this.process.stderr.on('data', (data) => {
      this.emit('error', data.toString());
    });
    
    this.process.on('message', (msg) => {
      this.emit('message', msg);
    });
    
    this.process.on('exit', (code, signal) => {
      this.state = 'stopped';
      this.emit('exit', { code, signal });
    });
  }
}
```

### Agent Registry
```javascript
class AgentRegistry {
  constructor() {
    this.agents = new Map();
    this.capabilities = new Map();
  }
  
  async loadBMADAgents() {
    const agentsDir = path.join(__dirname, '../bmad/agents');
    const files = await fs.readdir(agentsDir);
    
    for (const file of files) {
      if (file.endsWith('.md')) {
        const agentDef = await this.parseAgentDefinition(
          path.join(agentsDir, file)
        );
        this.register(agentDef);
      }
    }
  }
  
  register(agentDef) {
    this.agents.set(agentDef.id, agentDef);
    
    // Index capabilities
    agentDef.capabilities.forEach(cap => {
      if (!this.capabilities.has(cap)) {
        this.capabilities.set(cap, []);
      }
      this.capabilities.get(cap).push(agentDef.id);
    });
  }
  
  findAgentForTask(task) {
    // Find best agent based on task requirements
    const requiredCaps = task.requiredCapabilities || [];
    const candidates = [];
    
    for (const [agentId, agentDef] of this.agents) {
      const hasAllCaps = requiredCaps.every(cap => 
        agentDef.capabilities.includes(cap)
      );
      if (hasAllCaps) {
        candidates.push(agentDef);
      }
    }
    
    return candidates[0]; // Simple selection, could be enhanced
  }
}
```

### Message Bus
```javascript
class MessageBus extends EventEmitter {
  constructor() {
    super();
    this.channels = new Map();
    this.pendingRequests = new Map();
  }
  
  subscribe(channel, agentId, handler) {
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Map());
    }
    this.channels.get(channel).set(agentId, handler);
  }
  
  publish(channel, message, fromAgent) {
    const subscribers = this.channels.get(channel);
    if (subscribers) {
      subscribers.forEach((handler, agentId) => {
        if (agentId !== fromAgent) {
          handler(message);
        }
      });
    }
  }
  
  async request(targetAgent, message, fromAgent, timeout = 30000) {
    const requestId = generateId();
    
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error('Request timeout'));
      }, timeout);
      
      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        timer
      });
      
      this.publish(`agent:${targetAgent}`, {
        type: 'request',
        id: requestId,
        from: fromAgent,
        payload: message
      });
    });
  }
}
```

### Resource Monitor
```javascript
class ResourceMonitor {
  constructor(limits) {
    this.limits = limits;
    this.usage = new Map();
  }
  
  async checkProcess(pid) {
    const stats = await this.getProcessStats(pid);
    
    return {
      cpu: stats.cpu,
      memory: stats.memory,
      withinLimits: stats.cpu <= this.limits.cpu && 
                    stats.memory <= this.limits.memory
    };
  }
  
  async enforceLimit(agentProcess) {
    const check = await this.checkProcess(agentProcess.process.pid);
    
    if (!check.withinLimits) {
      Logger.warn(`Agent ${agentProcess.id} exceeding limits`);
      
      if (check.memory > this.limits.memory) {
        // Hard limit - kill process
        agentProcess.stop('memory_limit_exceeded');
      } else if (check.cpu > this.limits.cpu) {
        // Soft limit - throttle
        await this.throttleProcess(agentProcess.process.pid);
      }
    }
  }
}
```

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests for all components
- [ ] Integration tests for agent lifecycle
- [ ] Performance tests for concurrent agents
- [ ] Documentation for agent development
- [ ] Error handling tested
- [ ] Resource limits enforced
- [ ] Claude API integration working

## Notes
- Consider using Worker Threads for lighter agents
- Implement circuit breaker for API calls
- Add metrics collection for monitoring
- Consider agent pooling for efficiency
- Plan for distributed execution in future

---
**Story created by**: SM Agent
**Date**: 2024-07-20
**Ready for development**: Yes