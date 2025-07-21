#!/usr/bin/env node

const { program } = require('commander');
const { showBanner } = require('../src/cli/templates/banner');
const commands = require('../src/cli/commands');
const config = require('../src/cli/utils/config');
const Validator = require('../src/cli/utils/validator');
const Logger = require('../src/cli/utils/logger');

// Check for updates (implement later)
// const updateNotifier = require('update-notifier');
// const pkg = require('../package.json');
// updateNotifier({ pkg }).notify();

// Show banner for main commands (not for --help or --version)
const showBannerCommands = ['init', 'plan', 'build', 'workflow'];
const currentCommand = process.argv[2];
const shouldShowBanner = showBannerCommands.includes(currentCommand) && 
                        config.get('ui.showBanner') !== false;

if (shouldShowBanner) {
  showBanner();
}

// Check dependencies on first run
async function checkEnvironment() {
  const issues = await Validator.checkDependencies();
  if (issues.length > 0) {
    Logger.warn('Environment issues detected:');
    issues.forEach(issue => Logger.warn(`  • ${issue}`));
    Logger.newline();
  }
}

// Configure CLI
program
  .name('claudebuild')
  .description('Multi-agent development orchestrator combining BMAD methodology with Claude Code')
  .version(require('../package.json').version)
  .hook('preAction', async () => {
    // Check environment before running commands
    if (currentCommand && currentCommand !== 'init') {
      await checkEnvironment();
    }
  });

// Register all commands
commands.registerAll(program);

// Custom help
program.on('--help', () => {
  console.log('');
  console.log('Examples:');
  console.log('  $ claudebuild init                    # Initialize new project');
  console.log('  $ claudebuild plan                    # Start planning phase');
  console.log('  $ claudebuild build                   # Execute development');
  console.log('  $ claudebuild status --watch          # Monitor progress');
  console.log('  $ claudebuild agent list              # List available agents');
  console.log('  $ claudebuild workflow greenfield     # Run full workflow');
  console.log('  $ claudebuild dashboard               # Open web dashboard');
  console.log('');
  console.log('For more information, visit: https://github.com/claudebuild/claudebuild');
});

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}