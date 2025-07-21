const ClaudeBuildMonitor = require('/home/insulto/claudebuild/monitoring-dashboard/src/api/claudebuild-monitor');

// This file should be added to ClaudeBuild to send updates to the monitoring dashboard
const monitor = new ClaudeBuildMonitor();

// Example usage in ClaudeBuild:
// When agent status changes:
// await monitor.sendAgentUpdate(agentId, 'running', { task: taskId });

// When workflow updates:
// await monitor.sendWorkflowUpdate(workflowId, 'running', 50, tasks);

module.exports = monitor;