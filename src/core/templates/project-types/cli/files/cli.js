#!/usr/bin/env node

const { program } = require('commander');
const { version } = require('../package.json');

// Import commands
const helloCommand = require('../src/commands/hello');

// Configure CLI
program
  .name('{{kebabCase(projectName)}}')
  .description('{{description}}')
  .version(version);

// Register commands
program
  .command('hello [name]')
  .description('Say hello')
  .option('-u, --uppercase', 'Output in uppercase')
  .action(helloCommand);

// Add more commands here
// program
//   .command('command-name')
//   .description('Command description')
//   .action(require('../src/commands/command-name'));

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}