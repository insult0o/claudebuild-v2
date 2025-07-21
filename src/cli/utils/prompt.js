const readline = require('readline');
const chalk = require('chalk');

/**
 * Interactive prompt utilities
 */
class Prompt {
  /**
   * Ask a yes/no question
   */
  static async confirm(question, defaultValue = true) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      const defaultHint = defaultValue ? 'Y/n' : 'y/N';
      rl.question(`${question} (${defaultHint}): `, (answer) => {
        rl.close();
        const normalized = answer.toLowerCase().trim();
        if (normalized === '') {
          resolve(defaultValue);
        } else {
          resolve(normalized === 'y' || normalized === 'yes');
        }
      });
    });
  }

  /**
   * Ask for text input
   */
  static async input(question, defaultValue = '') {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      const defaultHint = defaultValue ? ` (${defaultValue})` : '';
      rl.question(`${question}${defaultHint}: `, (answer) => {
        rl.close();
        resolve(answer.trim() || defaultValue);
      });
    });
  }

  /**
   * Ask for multi-line input
   */
  static async multiline(question) {
    console.log(`${question} (Press Ctrl+D when done):`);
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true
    });

    const lines = [];
    
    return new Promise((resolve) => {
      rl.on('line', (line) => {
        lines.push(line);
      });

      rl.on('close', () => {
        resolve(lines.join('\n'));
      });
    });
  }

  /**
   * Select from options
   */
  static async select(question, options) {
    console.log(`${question}`);
    options.forEach((option, index) => {
      console.log(`  ${chalk.cyan(index + 1)}. ${option}`);
    });

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question('Select option: ', (answer) => {
        rl.close();
        const index = parseInt(answer) - 1;
        if (index >= 0 && index < options.length) {
          resolve(options[index]);
        } else {
          console.log(chalk.red('Invalid selection'));
          resolve(null);
        }
      });
    });
  }

  /**
   * Display a formatted review
   */
  static showReview(title, content) {
    console.log(chalk.bold.blue(`\n=== ${title} ===`));
    console.log(content);
    console.log(chalk.gray('─'.repeat(80)));
  }
}

module.exports = Prompt;