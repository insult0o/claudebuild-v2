const axios = require('axios').default;

/**
 * Monitoring integration for ClaudeBuild
 * Sends real-time updates to the monitoring dashboard
 */
class MonitoringIntegration {
  constructor(monitoringUrl = 'http://localhost:3001') {
    this.monitoringUrl = monitoringUrl;
    this.enabled = true;
  }

  /**
   * Initialize monitoring - register event handlers
   */
  initialize(orchestrator, agentManager) {
    if (!this.enabled) return;

    console.log(`Initializing monitoring integration with ${this.monitoringUrl}`);

    // Orchestrator events
    orchestrator.on('workflow:started', (event) => {
      this.sendWorkflowUpdate(event.workflowId, 'started', 0, []);
    });

    orchestrator.on('workflow:completed', (event) => {
      this.sendWorkflowUpdate(event.workflowId, 'completed', 100, event.results);
    });

    orchestrator.on('task:started', (event) => {
      this.updateWorkflowTask(event.workflowId, event.taskId, 'running');
    });

    orchestrator.on('task:completed', (event) => {
      this.updateWorkflowTask(event.workflowId, event.taskId, 'completed');
    });

    orchestrator.on('task:failed', (event) => {
      this.updateWorkflowTask(event.workflowId, event.taskId, 'failed');
    });

    // Agent events
    agentManager.on('agent:started', (event) => {
      this.sendAgentUpdate(event.agentId, 'started', {});
    });

    agentManager.on('agent:progress', (event) => {
      this.sendAgentUpdate(event.agentId, 'running', { progress: event.progress });
    });

    agentManager.on('agent:completed', (event) => {
      this.sendAgentUpdate(event.agentId, 'completed', event.result || {});
    });

    agentManager.on('agent:error', (event) => {
      this.sendAgentUpdate(event.agentId, 'error', { error: event.error });
    });

    agentManager.on('agent:exit', (event) => {
      this.sendAgentUpdate(event.agentId, 'stopped', { exitCode: event.code });
    });
  }

  /**
   * Send agent update to monitoring dashboard
   */
  async sendAgentUpdate(agentId, status, data = {}) {
    if (!this.enabled) return;

    try {
      await axios.post(`${this.monitoringUrl}/api/claudebuild/agent-update`, {
        agentId,
        status,
        data
      });
    } catch (error) {
      console.error('Failed to send agent update:', error.message);
    }
  }

  /**
   * Send workflow update to monitoring dashboard
   */
  async sendWorkflowUpdate(workflowId, status, progress, tasks = []) {
    if (!this.enabled) return;

    try {
      await axios.post(`${this.monitoringUrl}/api/claudebuild/workflow-update`, {
        workflowId,
        status,
        progress,
        tasks
      });
    } catch (error) {
      console.error('Failed to send workflow update:', error.message);
    }
  }

  /**
   * Update specific task in workflow
   */
  async updateWorkflowTask(workflowId, taskId, taskStatus) {
    // This would need to fetch current workflow state and update it
    // For now, just log it
    console.log(`Task ${taskId} in workflow ${workflowId} is now ${taskStatus}`);
  }
}

module.exports = MonitoringIntegration;