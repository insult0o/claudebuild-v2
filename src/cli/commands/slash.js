const { Command } = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');
const Logger = require('../utils/logger');
const SlashCommandEngine = require('../../core/commands/slash-command-engine');

/**
 * Slash command CLI interface
 */
const slashCommand = new Command('slash')
  .description('Execute ClaudeBuild slash commands')
  .alias('/')
  .argument('[command]', 'Slash command to execute')
  .argument('[args...]', 'Command arguments')
  .option('--list', 'List all available commands')
  .option('--help-cmd <cmd>', 'Get help for specific command')
  .option('--dry-run', 'Preview without execution')
  .option('--yolo', 'Skip all confirmations')
  .action(async (command, args, options) => {
    try {
      const engine = new SlashCommandEngine();
      await engine.initialize();

      // List commands
      if (options.list) {
        const commands = engine.listCommands();
        Logger.info('\nAvailable slash commands:\n');
        
        commands.forEach(cmd => {
          console.log(`  ${chalk.cyan(cmd.name.padEnd(15))} ${cmd.purpose}`);
        });
        
        console.log(`\nUse ${chalk.cyan('claudebuild slash --help-cmd <command>')} for details`);
        return;
      }

      // Show command help
      if (options.helpCmd) {
        const help = engine.getHelp(options.helpCmd);
        
        console.log(`\n${chalk.bold(help.name)}\n`);
        console.log(`${chalk.gray('Purpose:')} ${help.purpose}\n`);
        
        if (help.usage) {
          console.log(chalk.gray('Usage:'));
          console.log(chalk.cyan(help.usage));
          console.log();
        }
        
        if (help.process) {
          console.log(chalk.gray('Process:'));
          console.log(help.process);
        }
        
        return;
      }

      // Execute command
      if (command) {
        // Build full command string
        const fullCommand = `/${command} ${args.join(' ')}`.trim();
        
        // Confirm unless yolo mode
        if (!options.yolo && !options.dryRun) {
          const { confirm } = await inquirer.prompt([{
            type: 'confirm',
            name: 'confirm',
            message: `Execute: ${chalk.cyan(fullCommand)}?`,
            default: true
          }]);
          
          if (!confirm) {
            Logger.info('Command cancelled');
            return;
          }
        }

        if (options.dryRun) {
          Logger.info(`Would execute: ${fullCommand}`);
          return;
        }

        // Execute
        Logger.info(`Executing: ${chalk.cyan(fullCommand)}`);
        const result = await engine.execute(fullCommand, options);
        
        // Display results
        if (result) {
          if (typeof result === 'object') {
            console.log(JSON.stringify(result, null, 2));
          } else {
            console.log(result);
          }
        }
        
        Logger.success('Command completed');
      } else {
        // Interactive mode
        await interactiveMode(engine, options);
      }
    } catch (error) {
      Logger.error(`Command failed: ${error.message}`);
      process.exit(1);
    }
  });

/**
 * Interactive command selection
 */
async function interactiveMode(engine, options) {
  const commands = engine.listCommands();
  
  while (true) {
    const { action } = await inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: 'Select a slash command:',
      choices: [
        ...commands.map(cmd => ({
          name: `${cmd.name} - ${cmd.purpose}`,
          value: cmd.name
        })),
        new inquirer.Separator(),
        { name: 'Exit', value: 'exit' }
      ]
    }]);

    if (action === 'exit') break;

    // Get command arguments
    const help = engine.getHelp(action.substring(1));
    
    if (help.usage) {
      console.log(`\n${chalk.gray('Usage:')} ${chalk.cyan(help.usage)}\n`);
    }

    const { args } = await inquirer.prompt([{
      type: 'input',
      name: 'args',
      message: 'Enter command arguments:',
      default: ''
    }]);

    // Build and execute command
    const fullCommand = `${action} ${args}`.trim();
    
    try {
      Logger.info(`Executing: ${chalk.cyan(fullCommand)}`);
      const result = await engine.execute(fullCommand, options);
      
      if (result) {
        console.log('\nResult:');
        console.log(JSON.stringify(result, null, 2));
      }
    } catch (error) {
      Logger.error(`Command failed: ${error.message}`);
    }

    console.log(); // Add spacing
  }
}

// Add shortcuts subcommand
slashCommand
  .command('add <name>')
  .description('Add a new slash command')
  .option('-t, --template <template>', 'Use command template')
  .action(async (name, options) => {
    try {
      const fs = require('fs');
      const path = require('path');
      
      const commandsDir = path.join(process.cwd(), 'commands');
      const commandFile = path.join(commandsDir, `${name}.md`);
      
      // Check if exists
      if (fs.existsSync(commandFile)) {
        Logger.error(`Command /${name} already exists`);
        return;
      }

      // Create template
      const template = `# /${name} - Your Command Description

## Purpose
What this command accomplishes

## Usage
\`\`\`
/${name} [options] [arguments]
\`\`\`

## Process

### 1. Step One
Description of first step

### 2. Step Two  
Description of second step

Think ultra hard about the requirements and create TODOs for execution.

## Options
- \`--parallel <n>\` - Run n agents concurrently
- \`--agent <role>\` - Specify agent type

## Examples
\`\`\`bash
/${name} --parallel 3
\`\`\`

## Next Steps
After this command, typically run:
- \`/review\` to validate output
- \`/test\` to verify functionality
`;

      // Ensure directory exists
      if (!fs.existsSync(commandsDir)) {
        fs.mkdirSync(commandsDir, { recursive: true });
      }

      // Write file
      fs.writeFileSync(commandFile, template);
      
      Logger.success(`Created command template: ${commandFile}`);
      Logger.info(`Edit the file to customize your command`);
    } catch (error) {
      Logger.error(`Failed to create command: ${error.message}`);
    }
  });

module.exports = slashCommand;