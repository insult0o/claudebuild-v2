const chalk = require('chalk');

/**
 * Hello command implementation
 * @param {string} name - Name to greet
 * @param {object} options - Command options
 */
function helloCommand(name = 'World', options) {
  const greeting = `Hello, ${name}!`;
  
  if (options.uppercase) {
    console.log(chalk.green(greeting.toUpperCase()));
  } else {
    console.log(chalk.green(greeting));
  }
}

module.exports = helloCommand;