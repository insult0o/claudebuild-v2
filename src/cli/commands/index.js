const { initProject } = require('./init-enhanced');
const planCommand = require('./plan');
const buildCommand = require('./build');
const statusCommand = require('./status');
const agentCommand = require('./agent');
const workflowCommand = require('./workflow');
const dashboardCommand = require('./dashboard');
const configCommand = require('./config');
const sessionCommand = require('./session');
const slashCommand = require('./slash');

function registerAll(program) {
  // Init command
  program
    .command('init')
    .description('Initialize a new ClaudeBuild project')
    .action(initProject);

  // Plan command
  program
    .command('plan')
    .description('Start planning phase with BMAD agents')
    .option('-i, --issue <file>', 'Issue file (e.g., MAIN_ISSUE.md)')
    .option('-p, --project <name>', 'Project name')
    .option('-t, --type <type>', 'Project type (fullstack|backend|frontend)', 'fullstack')
    .option('-d, --description <desc>', 'Project description')
    .option('--skip-brief', 'Skip project brief and use existing')
    .option('--mcp', 'Use MCP server for context discovery', true)
    .option('--auto-approve', 'Skip review and auto-approve the plan')
    .option('--no-interactive', 'Run without interactive prompts')
    .action(planCommand);

  // Build command
  program
    .command('build')
    .description('Execute parallel development with multiple agents')
    .option('-t, --tasks <file>', 'Tasks file (default: tasks.json)', 'tasks.json')
    .option('-p, --parallel <n>', 'Number of parallel agents', '4')
    .option('--dry-run', 'Show what would be executed without running')
    .action(buildCommand);

  // Status command
  program
    .command('status')
    .description('Show current workflow status')
    .option('-w, --watch', 'Watch for changes')
    .option('-j, --json', 'Output as JSON')
    .action(statusCommand);

  // Agent command
  program
    .command('agent <action>')
    .description('Manage individual agents (list|run|stop)')
    .option('-n, --name <name>', 'Agent name')
    .option('-t, --task <task>', 'Task to assign')
    .action(agentCommand);

  // Workflow command
  program
    .command('workflow <type>')
    .description('Run complete workflow (greenfield|brownfield)')
    .option('-c, --config <file>', 'Workflow config file')
    .option('--auto', 'Run without prompts (fully automated)')
    .action(workflowCommand);

  // Dashboard command
  program
    .command('dashboard')
    .description('Launch visual dashboard in browser')
    .option('-p, --port <port>', 'Dashboard port', '3000')
    .action(dashboardCommand);

  // Config command
  program
    .command('config <action> [key] [value]')
    .description('Manage configuration (get|set|list|validate|env)')
    .option('-g, --global', 'Use global configuration')
    .option('-j, --json', 'Output as JSON')
    .option('--secure', 'Store value securely')
    .option('--show-secrets', 'Show sensitive values')
    .action(configCommand);

  // Session command
  program.addCommand(sessionCommand);

  // Slash command
  program.addCommand(slashCommand);
}

module.exports = { registerAll };