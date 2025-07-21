/**
 * Enhanced State Manager - KaibanJS-inspired Redux pattern for ClaudeBuild v2
 * Based on research findings from Architect Agent STUDY PHASE
 */

import { configureStore, createSlice } from '@reduxjs/toolkit';
import winston from 'winston';

// Agent state slice
const agentSlice = createSlice({
  name: 'agents',
  initialState: {
    active: new Map(),
    completed: new Map(),
    failed: new Map()
  },
  reducers: {
    agentStarted: (state, action) => {
      const { agentId, config } = action.payload;
      state.active.set(agentId, {
        ...config,
        status: 'active',
        startTime: new Date().toISOString(),
        progress: 0
      });
    },
    agentProgress: (state, action) => {
      const { agentId, progress, milestone } = action.payload;
      const agent = state.active.get(agentId);
      if (agent) {
        agent.progress = progress;
        agent.currentMilestone = milestone;
        agent.lastUpdate = new Date().toISOString();
      }
    },
    agentCompleted: (state, action) => {
      const { agentId, result } = action.payload;
      const agent = state.active.get(agentId);
      if (agent) {
        state.completed.set(agentId, {
          ...agent,
          status: 'completed',
          result,
          completedTime: new Date().toISOString()
        });
        state.active.delete(agentId);
      }
    },
    agentFailed: (state, action) => {
      const { agentId, error } = action.payload;
      const agent = state.active.get(agentId);
      if (agent) {
        state.failed.set(agentId, {
          ...agent,
          status: 'failed',
          error,
          failedTime: new Date().toISOString()
        });
        state.active.delete(agentId);
      }
    }
  }
});

// Task state slice - KaibanJS-style task result passing
const taskSlice = createSlice({
  name: 'tasks',
  initialState: {
    pending: [],
    active: new Map(),
    completed: new Map(),
    results: new Map() // Store task results for reference passing
  },
  reducers: {
    taskQueued: (state, action) => {
      const task = action.payload;
      state.pending.push(task);
    },
    taskStarted: (state, action) => {
      const { taskId, agentId } = action.payload;
      const taskIndex = state.pending.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        const task = state.pending.splice(taskIndex, 1)[0];
        state.active.set(taskId, {
          ...task,
          assignedAgent: agentId,
          startTime: new Date().toISOString()
        });
      }
    },
    taskCompleted: (state, action) => {
      const { taskId, result } = action.payload;
      const task = state.active.get(taskId);
      if (task) {
        state.completed.set(taskId, {
          ...task,
          result,
          completedTime: new Date().toISOString()
        });
        
        // Store result for KaibanJS-style reference passing
        state.results.set(task.sequenceNumber || taskId, result);
        
        state.active.delete(taskId);
      }
    }
  }
});

// Coordination slice for agent handoffs
const coordinationSlice = createSlice({
  name: 'coordination',
  initialState: {
    handoffs: [],
    sharedContext: new Map(),
    messageQueue: []
  },
  reducers: {
    handoffRequested: (state, action) => {
      const handoff = action.payload;
      state.handoffs.push({
        ...handoff,
        status: 'pending',
        timestamp: new Date().toISOString()
      });
    },
    handoffCompleted: (state, action) => {
      const { handoffId } = action.payload;
      const handoff = state.handoffs.find(h => h.id === handoffId);
      if (handoff) {
        handoff.status = 'completed';
        handoff.completedTime = new Date().toISOString();
      }
    },
    contextShared: (state, action) => {
      const { sourceAgent, targetAgent, context } = action.payload;
      const contextKey = `${sourceAgent}->${targetAgent}`;
      state.sharedContext.set(contextKey, {
        context,
        timestamp: new Date().toISOString()
      });
    }
  }
});

// MCP integration slice
const mcpSlice = createSlice({
  name: 'mcp',
  initialState: {
    connections: new Map(),
    toolUsage: [],
    resources: new Map(),
    capabilities: new Map()
  },
  reducers: {
    mcpConnected: (state, action) => {
      const { serverId, connection } = action.payload;
      state.connections.set(serverId, {
        ...connection,
        connectedTime: new Date().toISOString()
      });
    },
    toolUsed: (state, action) => {
      const usage = action.payload;
      state.toolUsage.push({
        ...usage,
        timestamp: new Date().toISOString()
      });
    },
    resourceRegistered: (state, action) => {
      const { resourceId, resource } = action.payload;
      state.resources.set(resourceId, resource);
    },
    capabilityDiscovered: (state, action) => {
      const { agentId, capabilities } = action.payload;
      state.capabilities.set(agentId, {
        capabilities,
        discoveredTime: new Date().toISOString()
      });
    }
  }
});

// Coordination middleware for agent communication
const coordinationMiddleware = (store) => (next) => (action) => {
  const result = next(action);
  
  // Handle agent coordination events
  if (action.type === 'tasks/taskCompleted') {
    // Check for dependent tasks
    const state = store.getState();
    const completedTask = state.tasks.completed.get(action.payload.taskId);
    
    if (completedTask?.nextAgent) {
      // Trigger handoff to next agent
      store.dispatch(coordinationSlice.actions.handoffRequested({
        id: `handoff-${Date.now()}`,
        fromAgent: completedTask.assignedAgent,
        toAgent: completedTask.nextAgent,
        context: {
          completedTask,
          result: action.payload.result
        }
      }));
    }
  }
  
  return result;
};

// MCP middleware for tool usage logging
const mcpMiddleware = (store) => (next) => (action) => {
  const result = next(action);
  
  // Log all MCP-related actions
  if (action.type.startsWith('mcp/')) {
    winston.info('MCP Action', {
      action: action.type,
      payload: action.payload,
      timestamp: new Date().toISOString()
    });
  }
  
  return result;
};

// Logging middleware
const loggingMiddleware = (store) => (next) => (action) => {
  const start = Date.now();
  const result = next(action);
  const duration = Date.now() - start;
  
  winston.debug('State Action', {
    type: action.type,
    duration,
    timestamp: new Date().toISOString()
  });
  
  return result;
};

/**
 * ClaudeBuild State Manager - Redux-inspired state management
 * Implements KaibanJS patterns for task result passing and coordination
 */
export class ClaudeBuildStateManager {
  constructor() {
    this.store = configureStore({
      reducer: {
        agents: agentSlice.reducer,
        tasks: taskSlice.reducer,
        coordination: coordinationSlice.reducer,
        mcp: mcpSlice.reducer
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: {
            // Ignore these action types for Map serialization
            ignoredActions: ['persist/PERSIST']
          }
        }).concat([
          coordinationMiddleware,
          mcpMiddleware,
          loggingMiddleware
        ])
    });
    
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'claudebuild-state-manager' },
      transports: [
        new winston.transports.File({ filename: 'logs/state-error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/state-combined.log' })
      ]
    });
  }

  /**
   * KaibanJS-style task result injection
   * Replaces {taskResult:N} patterns with actual results
   */
  injectTaskResults(task, previousResults = null) {
    if (!previousResults) {
      previousResults = this.getTaskResults();
    }

    const enrichedTask = { ...task };
    
    // Process task context for result references
    if (enrichedTask.context) {
      enrichedTask.context = this.resolveTaskReferences(
        enrichedTask.context, 
        previousResults
      );
    }
    
    // Process task inputs for result references
    if (enrichedTask.inputs) {
      enrichedTask.inputs = this.resolveTaskReferences(
        enrichedTask.inputs, 
        previousResults
      );
    }

    this.logger.info('Task results injected', {
      taskId: task.id,
      referencesResolved: this.countReferences(task),
      timestamp: new Date().toISOString()
    });

    return enrichedTask;
  }

  /**
   * Resolve {taskResult:N} references to actual task results
   */
  resolveTaskReferences(obj, results) {
    if (typeof obj === 'string') {
      return obj.replace(/\{taskResult:(\d+)\}/g, (match, taskIndex) => {
        const result = results.get(parseInt(taskIndex));
        if (result && result.output) {
          return JSON.stringify(result.output);
        }
        return match; // Keep original if no result found
      });
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.resolveTaskReferences(item, results));
    }
    
    if (obj && typeof obj === 'object') {
      const resolved = {};
      Object.keys(obj).forEach(key => {
        resolved[key] = this.resolveTaskReferences(obj[key], results);
      });
      return resolved;
    }
    
    return obj;
  }

  /**
   * Count {taskResult:N} references in task
   */
  countReferences(task) {
    const taskStr = JSON.stringify(task);
    const matches = taskStr.match(/\{taskResult:\d+\}/g);
    return matches ? matches.length : 0;
  }

  /**
   * Get current task results for reference passing
   */
  getTaskResults() {
    const state = this.store.getState();
    return state.tasks.results;
  }

  /**
   * Get current state snapshot
   */
  getState() {
    return this.store.getState();
  }

  /**
   * Dispatch action to store
   */
  dispatch(action) {
    return this.store.dispatch(action);
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener) {
    return this.store.subscribe(listener);
  }

  // Action creators for easy access
  get actions() {
    return {
      agents: agentSlice.actions,
      tasks: taskSlice.actions,
      coordination: coordinationSlice.actions,
      mcp: mcpSlice.actions
    };
  }
}

export default ClaudeBuildStateManager;