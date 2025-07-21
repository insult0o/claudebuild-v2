const chalk = require('chalk');
const ora = require('ora');

class Logger {
  static info(message) {
    console.log(chalk.blue('ℹ'), message);
  }

  static success(message) {
    console.log(chalk.green('✓'), message);
  }

  static error(message) {
    console.log(chalk.red('✗'), message);
  }

  static warn(message) {
    console.log(chalk.yellow('⚠'), message);
  }

  static debug(message) {
    if (process.env.DEBUG) {
      console.log(chalk.gray('⚙'), message);
    }
  }

  static agent(agentName, message) {
    const agentColors = {
      analyst: 'magenta',
      pm: 'blue',
      architect: 'yellow',
      dev: 'green',
      qa: 'cyan',
      orchestrator: 'white'
    };
    const color = agentColors[agentName.toLowerCase()] || 'gray';
    console.log(chalk[color](`[${agentName}]`), message);
  }

  static spinner(text) {
    return ora({
      text,
      spinner: 'dots'
    }).start();
  }

  static table(data) {
    console.table(data);
  }

  static divider() {
    console.log(chalk.gray('─'.repeat(60)));
  }

  static newline() {
    console.log('');
  }

  static section(title) {
    console.log('');
    console.log(chalk.bold.cyan(`═══ ${title} ═══`));
    console.log('');
  }
}

module.exports = Logger;