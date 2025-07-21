const figlet = require('figlet');
const chalk = require('chalk');

function showBanner() {
  const banner = figlet.textSync('ClaudeBuild', {
    font: 'Standard',
    horizontalLayout: 'default',
    verticalLayout: 'default'
  });
  
  console.log(chalk.cyan(banner));
  console.log(chalk.gray('  Multi-Agent Development Orchestrator v1.0.0'));
  console.log(chalk.gray('  Powered by BMAD Method + Claude Code'));
  console.log('');
}

module.exports = { showBanner };