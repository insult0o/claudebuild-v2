const axios = require('axios');

class ClaudeBuildMonitor {
  constructor(monitoringUrl = 'http://localhost:3001') {
    this.monitoringUrl = monitoringUrl;
  }
  
  async sendAgentUpdate(agentId, status, data = {}) {
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
  
  async sendWorkflowUpdate(workflowId, status, progress, tasks = []) {
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
}

module.exports = ClaudeBuildMonitor;