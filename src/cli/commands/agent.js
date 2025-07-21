const Logger = require('../utils/logger');
const Validator = require('../utils/validator');

async function agentCommand(action, options) {
  const validActions = ['list', 'run', 'stop'];
  
  if (!validActions.includes(action)) {
    Logger.error(`Invalid action: ${action}`);
    Logger.info(`Valid actions: ${validActions.join(', ')}`);
    return;
  }

  switch (action) {
    case 'list':
      listAgents();
      break;
      
    case 'run':
      if (!options.name) {
        Logger.error('Agent name required. Use --name <agent>');
        return;
      }
      if (!Validator.validateAgentName(options.name)) {
        Logger.error(`Invalid agent name: ${options.name}`);
        Logger.info('Valid agents: analyst, pm, architect, dev, qa, devops');
        return;
      }
      runAgent(options.name, options.task);
      break;
      
    case 'stop':
      if (!options.name) {
        Logger.error('Agent name required. Use --name <agent>');
        return;
      }
      stopAgent(options.name);
      break;
  }
}

function listAgents() {
  Logger.info('Available agents:');
  Logger.newline();
  
  const agents = [
    { name: 'analyst', role: 'Requirements Analysis', icon: '🔍' },
    { name: 'pm', role: 'Product Management', icon: '📋' },
    { name: 'architect', role: 'System Architecture', icon: '🏗️' },
    { name: 'dev', role: 'Development', icon: '💻' },
    { name: 'qa', role: 'Quality Assurance', icon: '🧪' },
    { name: 'devops', role: 'DevOps & Deployment', icon: '🚀' }
  ];
  
  agents.forEach(agent => {
    console.log(`  ${agent.icon}  ${agent.name.padEnd(12)} - ${agent.role}`);
  });
  
  Logger.newline();
  Logger.info('Run an agent with: claudebuild agent run --name <agent>');
}

function runAgent(name, task) {
  Logger.info(`Starting ${name} agent...`);
  if (task) {
    Logger.info(`Task: ${task}`);
  }
  Logger.newline();
  Logger.warn('Agent execution not yet implemented');
  Logger.info(`This will launch the ${name} agent with Claude Code`);
}

function stopAgent(name) {
  Logger.info(`Stopping ${name} agent...`);
  Logger.warn('Agent control not yet implemented');
}

module.exports = agentCommand;