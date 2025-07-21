const EventEmitter = require('events');
const Logger = require('../../cli/utils/logger');
const DependencyResolver = require('./dependency-resolver');

/**
 * Workflow Engine
 * Manages workflow execution, task scheduling, and dependency resolution
 */
class WorkflowEngine extends EventEmitter {
  constructor() {
    super();
    this.workflows = new Map();
    this.taskQueues = new Map();
    this.dependencyResolver = new DependencyResolver();
  }

  /**
   * Initialize the workflow engine
   */
  async initialize() {
    Logger.debug('Workflow engine initialized');
  }

  /**
   * Create a new workflow
   */
  async createWorkflow(workflowId, definition, context = {}) {
    if (this.workflows.has(workflowId)) {
      throw new Error(`Workflow ${workflowId} already exists`);
    }

    const workflow = {
      id: workflowId,
      definition: definition,
      context: context,
      tasks: new Map(),
      taskQueue: [],
      completedTasks: new Set(),
      failedTasks: new Set(),
      skippedTasks: new Set(),
      status: 'created',
      results: {}
    };

    // Initialize tasks
    for (const [taskId, taskDef] of Object.entries(definition.tasks)) {
      workflow.tasks.set(taskId, {
        ...taskDef,
        id: taskId,
        status: 'pending',
        retries: 0
      });
    }

    // Build dependency graph
    if (definition.dependencies) {
      this.dependencyResolver.buildGraph(
        workflowId,
        Object.keys(definition.tasks),
        definition.dependencies
      );
    }

    this.workflows.set(workflowId, workflow);
    this.taskQueues.set(workflowId, []);

    Logger.debug(`Created workflow: ${workflowId}`);
    return workflow;
  }

  /**
   * Start workflow execution
   */
  async startWorkflow(workflowId) {
    const workflow = this.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    workflow.status = 'running';
    this.emit('workflow:ready', { workflowId });

    // Find tasks with no dependencies and mark them ready
    const readyTasks = this.dependencyResolver.getReadyTasks(workflowId);
    
    for (const taskId of readyTasks) {
      const task = workflow.tasks.get(taskId);
      if (task) {
        task.status = 'ready';
        this.emit('task:ready', { workflowId, taskId, task });
      }
    }

    // Check if workflow is already complete (no tasks)
    this.checkWorkflowCompletion(workflowId);
  }

  /**
   * Get workflow by ID
   */
  getWorkflow(workflowId) {
    return this.workflows.get(workflowId);
  }

  /**
   * Get task by ID
   */
  getTask(workflowId, taskId) {
    const workflow = this.getWorkflow(workflowId);
    return workflow?.tasks.get(taskId);
  }

  /**
   * Get all workflow tasks
   */
  getWorkflowTasks(workflowId) {
    const workflow = this.getWorkflow(workflowId);
    return workflow ? Array.from(workflow.tasks.keys()) : [];
  }

  /**
   * Complete a task
   */
  async completeTask(workflowId, taskId, result) {
    const workflow = this.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const task = workflow.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found in workflow ${workflowId}`);
    }

    // Update task status
    task.status = 'completed';
    workflow.completedTasks.add(taskId);
    workflow.results[taskId] = result;

    // Mark task as completed in dependency graph
    this.dependencyResolver.completeTask(workflowId, taskId);

    // Find newly ready tasks
    const newlyReadyTasks = this.dependencyResolver.getReadyTasks(workflowId);
    
    Logger.info(`After completing ${taskId}, found ${newlyReadyTasks.length} newly ready tasks: ${newlyReadyTasks.join(', ')}`);
    
    for (const readyTaskId of newlyReadyTasks) {
      const readyTask = workflow.tasks.get(readyTaskId);
      if (readyTask && readyTask.status === 'pending') {
        readyTask.status = 'ready';
        Logger.info(`Emitting task:ready for ${readyTaskId}`);
        this.emit('task:ready', { 
          workflowId, 
          taskId: readyTaskId, 
          task: readyTask 
        });
      }
    }

    // Check if workflow is complete
    this.checkWorkflowCompletion(workflowId);
  }

  /**
   * Skip a task (for non-critical failures)
   */
  async skipTask(workflowId, taskId) {
    const workflow = this.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const task = workflow.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    // Mark as skipped
    task.status = 'skipped';
    workflow.skippedTasks.add(taskId);

    // Treat as completed for dependency purposes
    this.dependencyResolver.completeTask(workflowId, taskId);

    // Check for newly ready tasks
    const newlyReadyTasks = this.dependencyResolver.getReadyTasks(workflowId);
    
    for (const readyTaskId of newlyReadyTasks) {
      const readyTask = workflow.tasks.get(readyTaskId);
      if (readyTask && readyTask.status === 'pending') {
        readyTask.status = 'ready';
        this.emit('task:ready', { 
          workflowId, 
          taskId: readyTaskId, 
          task: readyTask 
        });
      }
    }

    // Check completion
    this.checkWorkflowCompletion(workflowId);
  }

  /**
   * Retry a failed task
   */
  async retryTask(workflowId, taskId) {
    const workflow = this.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const task = workflow.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    // Reset task status
    task.status = 'ready';
    workflow.failedTasks.delete(taskId);

    // Emit ready event again
    this.emit('task:ready', { workflowId, taskId, task });
  }

  /**
   * Queue a task (when parallel limit reached)
   */
  queueTask(workflowId, taskId) {
    const queue = this.taskQueues.get(workflowId);
    if (queue && !queue.includes(taskId)) {
      queue.push(taskId);
      Logger.debug(`Queued task ${taskId} for workflow ${workflowId}`);
    }
  }

  /**
   * Dequeue a task
   */
  dequeueTask(workflowId, taskId) {
    const queue = this.taskQueues.get(workflowId);
    if (!queue) {
      return null;
    }

    const index = queue.indexOf(taskId);
    if (index !== -1) {
      queue.splice(index, 1);
      const task = this.getTask(workflowId, taskId);
      return task;
    }

    return null;
  }

  /**
   * Get queued tasks
   */
  getQueuedTasks(workflowId) {
    return this.taskQueues.get(workflowId) || [];
  }

  /**
   * Pause workflow execution
   */
  async pauseWorkflow(workflowId) {
    const workflow = this.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    workflow.status = 'paused';
    Logger.info(`Workflow ${workflowId} paused`);
  }

  /**
   * Resume workflow execution
   */
  async resumeWorkflow(workflowId) {
    const workflow = this.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    workflow.status = 'running';
    
    // Re-emit ready tasks
    for (const [taskId, task] of workflow.tasks) {
      if (task.status === 'ready') {
        this.emit('task:ready', { workflowId, taskId, task });
      }
    }

    Logger.info(`Workflow ${workflowId} resumed`);
  }

  /**
   * Check if workflow is complete
   */
  checkWorkflowCompletion(workflowId) {
    const workflow = this.getWorkflow(workflowId);
    if (!workflow || workflow.status !== 'running') {
      return;
    }

    const totalTasks = workflow.tasks.size;
    const processedTasks = workflow.completedTasks.size + 
                          workflow.failedTasks.size + 
                          workflow.skippedTasks.size;

    if (processedTasks >= totalTasks) {
      workflow.status = 'completed';
      
      // Collect results
      const results = {
        completed: Array.from(workflow.completedTasks),
        failed: Array.from(workflow.failedTasks),
        skipped: Array.from(workflow.skippedTasks),
        outputs: workflow.results
      };

      this.emit('workflow:completed', { workflowId, results });
      
      // Cleanup
      this.cleanupWorkflow(workflowId);
    }
  }

  /**
   * Cleanup workflow resources
   */
  cleanupWorkflow(workflowId) {
    // Remove from dependency resolver
    this.dependencyResolver.removeWorkflow(workflowId);
    
    // Remove task queue
    this.taskQueues.delete(workflowId);
    
    // Note: We keep the workflow in memory for status queries
    // In production, we might want to persist to disk and remove from memory
  }

  /**
   * Get workflow statistics
   */
  getWorkflowStats(workflowId) {
    const workflow = this.getWorkflow(workflowId);
    if (!workflow) {
      return null;
    }

    return {
      totalTasks: workflow.tasks.size,
      completedTasks: workflow.completedTasks.size,
      failedTasks: workflow.failedTasks.size,
      skippedTasks: workflow.skippedTasks.size,
      pendingTasks: Array.from(workflow.tasks.values())
        .filter(t => t.status === 'pending').length,
      runningTasks: Array.from(workflow.tasks.values())
        .filter(t => t.status === 'running').length,
      queuedTasks: this.getQueuedTasks(workflowId).length
    };
  }

  /**
   * Export workflow definition
   */
  exportWorkflow(workflowId) {
    const workflow = this.getWorkflow(workflowId);
    if (!workflow) {
      return null;
    }

    return {
      id: workflowId,
      definition: workflow.definition,
      context: workflow.context,
      status: workflow.status,
      stats: this.getWorkflowStats(workflowId),
      results: workflow.results
    };
  }
}

module.exports = WorkflowEngine;