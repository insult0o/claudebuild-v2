const fs = require('fs').promises;
const path = require('path');
const Logger = require('../../cli/utils/logger');

/**
 * State Manager
 * Persists workflow and task states to disk
 */
class StateManager {
  constructor() {
    this.stateDir = path.join(process.cwd(), '.claudebuild/state');
    this.workflowStates = new Map();
    this.taskStates = new Map();
  }

  /**
   * Initialize state manager
   */
  async initialize() {
    // Ensure state directory exists
    await fs.mkdir(this.stateDir, { recursive: true });
    
    // Load existing states
    await this.loadStates();
    
    Logger.debug('State manager initialized');
  }

  /**
   * Load states from disk
   */
  async loadStates() {
    try {
      const files = await fs.readdir(this.stateDir);
      
      for (const file of files) {
        if (file.startsWith('workflow-') && file.endsWith('.json')) {
          const filePath = path.join(this.stateDir, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const state = JSON.parse(content);
          
          const workflowId = file.replace('workflow-', '').replace('.json', '');
          this.workflowStates.set(workflowId, state.workflow);
          
          if (state.tasks) {
            this.taskStates.set(workflowId, new Map(Object.entries(state.tasks)));
          }
        }
      }
      
      Logger.debug(`Loaded ${this.workflowStates.size} workflow states`);
      
    } catch (error) {
      Logger.debug('No existing states to load');
    }
  }

  /**
   * Save workflow state
   */
  async saveWorkflowState(workflowId, state) {
    // Update in-memory state
    const existingState = this.workflowStates.get(workflowId) || {};
    const updatedState = { ...existingState, ...state, lastUpdated: new Date().toISOString() };
    this.workflowStates.set(workflowId, updatedState);
    
    // Persist to disk
    await this.persistWorkflow(workflowId);
  }

  /**
   * Update workflow state
   */
  async updateWorkflowState(workflowId, updates) {
    const currentState = this.workflowStates.get(workflowId);
    if (!currentState) {
      throw new Error(`Workflow ${workflowId} state not found`);
    }
    
    await this.saveWorkflowState(workflowId, updates);
  }

  /**
   * Get workflow state
   */
  async getWorkflowState(workflowId) {
    return this.workflowStates.get(workflowId);
  }

  /**
   * Save task state
   */
  async saveTaskState(workflowId, taskId, state) {
    // Get or create task states for workflow
    let workflowTasks = this.taskStates.get(workflowId);
    if (!workflowTasks) {
      workflowTasks = new Map();
      this.taskStates.set(workflowId, workflowTasks);
    }
    
    // Update task state
    const existingState = workflowTasks.get(taskId) || {};
    const updatedState = { ...existingState, ...state, lastUpdated: new Date().toISOString() };
    workflowTasks.set(taskId, updatedState);
    
    // Persist to disk
    await this.persistWorkflow(workflowId);
  }

  /**
   * Update task state
   */
  async updateTaskState(workflowId, taskId, updates) {
    await this.saveTaskState(workflowId, taskId, updates);
  }

  /**
   * Get task state
   */
  async getTaskState(workflowId, taskId) {
    const workflowTasks = this.taskStates.get(workflowId);
    return workflowTasks?.get(taskId);
  }

  /**
   * Get all task states for a workflow
   */
  async getWorkflowTaskStates(workflowId) {
    const workflowTasks = this.taskStates.get(workflowId);
    return workflowTasks ? Object.fromEntries(workflowTasks) : {};
  }

  /**
   * Persist workflow state to disk
   */
  async persistWorkflow(workflowId) {
    const workflowState = this.workflowStates.get(workflowId);
    const taskStates = this.taskStates.get(workflowId);
    
    if (!workflowState) {
      return;
    }
    
    const state = {
      workflow: workflowState,
      tasks: taskStates ? Object.fromEntries(taskStates) : {}
    };
    
    const filePath = path.join(this.stateDir, `workflow-${workflowId}.json`);
    
    try {
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
      Logger.debug(`Persisted state for workflow ${workflowId}`);
    } catch (error) {
      Logger.error(`Failed to persist workflow state: ${error.message}`);
    }
  }

  /**
   * Delete workflow state
   */
  async deleteWorkflowState(workflowId) {
    // Remove from memory
    this.workflowStates.delete(workflowId);
    this.taskStates.delete(workflowId);
    
    // Remove from disk
    const filePath = path.join(this.stateDir, `workflow-${workflowId}.json`);
    
    try {
      await fs.unlink(filePath);
      Logger.debug(`Deleted state for workflow ${workflowId}`);
    } catch (error) {
      // File might not exist
      Logger.debug(`No state file to delete for workflow ${workflowId}`);
    }
  }

  /**
   * List all workflow states
   */
  async listWorkflows() {
    const workflows = [];
    
    for (const [workflowId, state] of this.workflowStates) {
      workflows.push({
        id: workflowId,
        status: state.status,
        startedAt: state.startedAt,
        completedAt: state.completedAt,
        lastUpdated: state.lastUpdated
      });
    }
    
    return workflows;
  }

  /**
   * Get workflow history
   */
  async getWorkflowHistory(workflowId) {
    const workflowState = this.workflowStates.get(workflowId);
    const taskStates = this.taskStates.get(workflowId);
    
    if (!workflowState) {
      return null;
    }
    
    const history = {
      workflow: workflowState,
      tasks: []
    };
    
    if (taskStates) {
      for (const [taskId, state] of taskStates) {
        history.tasks.push({
          id: taskId,
          ...state
        });
      }
    }
    
    // Sort tasks by start time
    history.tasks.sort((a, b) => {
      const aTime = a.startedAt || a.lastUpdated;
      const bTime = b.startedAt || b.lastUpdated;
      return new Date(aTime) - new Date(bTime);
    });
    
    return history;
  }

  /**
   * Clean up old states
   */
  async cleanup(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const workflowsToDelete = [];
    
    for (const [workflowId, state] of this.workflowStates) {
      const lastUpdated = new Date(state.lastUpdated || state.completedAt || state.startedAt);
      
      if (lastUpdated < cutoffDate && (state.status === 'completed' || state.status === 'failed')) {
        workflowsToDelete.push(workflowId);
      }
    }
    
    for (const workflowId of workflowsToDelete) {
      await this.deleteWorkflowState(workflowId);
    }
    
    Logger.info(`Cleaned up ${workflowsToDelete.length} old workflow states`);
  }

  /**
   * Export all states
   */
  async exportStates() {
    const states = [];
    
    for (const [workflowId, workflowState] of this.workflowStates) {
      const taskStates = this.taskStates.get(workflowId);
      
      states.push({
        workflowId,
        workflow: workflowState,
        tasks: taskStates ? Object.fromEntries(taskStates) : {}
      });
    }
    
    return states;
  }

  /**
   * Import states
   */
  async importStates(states) {
    for (const state of states) {
      this.workflowStates.set(state.workflowId, state.workflow);
      
      if (state.tasks) {
        this.taskStates.set(state.workflowId, new Map(Object.entries(state.tasks)));
      }
      
      await this.persistWorkflow(state.workflowId);
    }
    
    Logger.info(`Imported ${states.length} workflow states`);
  }
}

module.exports = StateManager;