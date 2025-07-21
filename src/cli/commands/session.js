const { Command } = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');
const Logger = require('../utils/logger');
const worktreeManager = require('../../core/worktree');
const { formatTimestamp } = require('../utils/formatting');

/**
 * Session management commands
 * Provides CLI interface for worktree-based sessions
 */
const sessionCommand = new Command('session')
  .description('Manage ClaudeBuild sessions with git worktrees');

// New session
sessionCommand
  .command('new')
  .description('Create a new session')
  .option('-b, --base <branch>', 'Base branch', 'main')
  .option('-a, --agent <type>', 'Agent type', 'dev')
  .option('-t, --task <description>', 'Task description')
  .option('-i, --id <id>', 'Custom session ID')
  .action(async (options) => {
    try {
      await worktreeManager.initialize();

      // Generate session ID if not provided
      const sessionId = options.id || `session-${Date.now()}`;

      const session = await worktreeManager.createSession(sessionId, {
        baseBranch: options.base,
        agent: options.agent,
        task: { description: options.task }
      });

      Logger.success(`\nSession created: ${chalk.cyan(session.id)}`);
      Logger.info(`Branch: ${session.branch}`);
      Logger.info(`Worktree: ${session.worktree}`);
      Logger.info(`\nTo resume this session later, run:`);
      Logger.info(`  ${chalk.cyan(`claudebuild session resume ${session.id}`)}`);
    } catch (error) {
      Logger.error(`Failed to create session: ${error.message}`);
      process.exit(1);
    }
  });

// List sessions
sessionCommand
  .command('list')
  .alias('ls')
  .description('List all sessions')
  .option('-s, --status <status>', 'Filter by status (active, paused, completed)')
  .option('-a, --agent <type>', 'Filter by agent type')
  .action(async (options) => {
    try {
      await worktreeManager.initialize();
      const sessions = await worktreeManager.listSessions(options);

      if (sessions.length === 0) {
        Logger.info('No sessions found');
        return;
      }

      Logger.info(`\n${chalk.bold('Sessions:')}\n`);

      sessions.forEach(session => {
        const statusColor = {
          active: 'green',
          paused: 'yellow',
          completed: 'gray'
        }[session.status] || 'white';

        console.log(
          `${chalk[statusColor]('●')} ${chalk.bold(session.id)} ` +
          `[${session.agent}] ${chalk[statusColor](session.status)}`
        );
        
        if (session.task?.description) {
          console.log(`  Task: ${session.task.description}`);
        }
        
        console.log(`  Created: ${formatTimestamp(session.created)}`);
        console.log(`  Checkpoints: ${session.checkpoints.length}`);
        console.log();
      });

      // Show stats
      const stats = await worktreeManager.getStats();
      console.log(chalk.gray('─'.repeat(40)));
      console.log(
        `Total: ${stats.total} | ` +
        `Active: ${chalk.green(stats.active)} | ` +
        `Paused: ${chalk.yellow(stats.paused)} | ` +
        `Completed: ${chalk.gray(stats.completed)}`
      );
    } catch (error) {
      Logger.error(`Failed to list sessions: ${error.message}`);
      process.exit(1);
    }
  });

// Resume session
sessionCommand
  .command('resume <sessionId>')
  .description('Resume an existing session')
  .action(async (sessionId) => {
    try {
      await worktreeManager.initialize();
      const session = await worktreeManager.resumeSession(sessionId);

      Logger.success(`\nResumed session: ${chalk.cyan(session.id)}`);
      Logger.info(`Working directory: ${session.worktree}`);
      
      // Show recent checkpoints
      if (session.checkpoints.length > 0) {
        Logger.info(`\nRecent checkpoints:`);
        session.checkpoints.slice(-3).forEach(cp => {
          console.log(
            `  ${formatTimestamp(cp.timestamp)}: ${cp.message}`
          );
        });
      }
    } catch (error) {
      Logger.error(`Failed to resume session: ${error.message}`);
      process.exit(1);
    }
  });

// Checkpoint session
sessionCommand
  .command('checkpoint <sessionId>')
  .alias('cp')
  .description('Create a checkpoint (commit) in the session')
  .option('-m, --message <message>', 'Checkpoint message')
  .action(async (sessionId, options) => {
    try {
      await worktreeManager.initialize();

      // Get message if not provided
      let message = options.message;
      if (!message) {
        const response = await inquirer.prompt([{
          type: 'input',
          name: 'message',
          message: 'Checkpoint message:',
          validate: input => input.trim() !== ''
        }]);
        message = response.message;
      }

      const checkpoint = await worktreeManager.checkpoint(sessionId, message);

      if (checkpoint) {
        Logger.success(`Created checkpoint: ${checkpoint.id}`);
      } else {
        Logger.info('No changes to checkpoint');
      }
    } catch (error) {
      Logger.error(`Failed to create checkpoint: ${error.message}`);
      process.exit(1);
    }
  });

// Show diff
sessionCommand
  .command('diff <sessionId>')
  .description('Show changes in the session')
  .option('--staged', 'Show staged changes only')
  .option('-b, --base <branch>', 'Compare against different base branch')
  .action(async (sessionId, options) => {
    try {
      await worktreeManager.initialize();
      const diff = await worktreeManager.getDiff(sessionId, options);

      if (diff.trim()) {
        console.log(diff);
      } else {
        Logger.info('No changes in session');
      }
    } catch (error) {
      Logger.error(`Failed to get diff: ${error.message}`);
      process.exit(1);
    }
  });

// Pause session
sessionCommand
  .command('pause <sessionId>')
  .description('Pause a session (creates checkpoint)')
  .action(async (sessionId) => {
    try {
      await worktreeManager.initialize();
      await worktreeManager.pauseSession(sessionId);
      Logger.success(`Session ${sessionId} paused`);
    } catch (error) {
      Logger.error(`Failed to pause session: ${error.message}`);
      process.exit(1);
    }
  });

// Complete session
sessionCommand
  .command('complete <sessionId>')
  .description('Complete and optionally merge a session')
  .option('--merge', 'Merge into base branch')
  .option('--squash', 'Squash commits when merging')
  .option('-t, --target <branch>', 'Target branch for merge', 'main')
  .action(async (sessionId, options) => {
    try {
      await worktreeManager.initialize();

      // Confirm if merging
      if (options.merge) {
        const { confirm } = await inquirer.prompt([{
          type: 'confirm',
          name: 'confirm',
          message: `Merge session ${sessionId} into ${options.target}?`,
          default: false
        }]);

        if (!confirm) {
          Logger.info('Merge cancelled');
          return;
        }
      }

      await worktreeManager.completeSession(sessionId, options);
      Logger.success(`Session ${sessionId} completed`);
    } catch (error) {
      Logger.error(`Failed to complete session: ${error.message}`);
      process.exit(1);
    }
  });

// Terminal UI mode
sessionCommand
  .command('tui')
  .description('Launch Terminal UI mode')
  .action(async () => {
    try {
      const TUI = require('../tui/main');
      const tui = new TUI();
      await tui.run();
    } catch (error) {
      Logger.error(`Failed to launch TUI: ${error.message}`);
      process.exit(1);
    }
  });

// Interactive session manager
sessionCommand
  .command('interactive')
  .alias('i')
  .description('Launch interactive session manager')
  .action(async () => {
    try {
      await worktreeManager.initialize();

      while (true) {
        const { action } = await inquirer.prompt([{
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: [
            { name: 'Create new session', value: 'new' },
            { name: 'Resume session', value: 'resume' },
            { name: 'List sessions', value: 'list' },
            { name: 'Create checkpoint', value: 'checkpoint' },
            { name: 'View diff', value: 'diff' },
            { name: 'Complete session', value: 'complete' },
            new inquirer.Separator(),
            { name: 'Exit', value: 'exit' }
          ]
        }]);

        if (action === 'exit') break;

        // Handle each action
        switch (action) {
          case 'new':
            await interactiveNewSession();
            break;
          case 'resume':
            await interactiveResumeSession();
            break;
          case 'list':
            await sessionCommand.commands.find(c => c.name() === 'list').action({});
            break;
          case 'checkpoint':
            await interactiveCheckpoint();
            break;
          case 'diff':
            await interactiveDiff();
            break;
          case 'complete':
            await interactiveComplete();
            break;
        }

        console.log(); // Add spacing
      }
    } catch (error) {
      Logger.error(`Interactive mode error: ${error.message}`);
      process.exit(1);
    }
  });

// Interactive helper functions
async function interactiveNewSession() {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'task',
      message: 'Task description:'
    },
    {
      type: 'list',
      name: 'agent',
      message: 'Agent type:',
      choices: ['dev', 'architect', 'qa', 'analyst', 'custom']
    },
    {
      type: 'input',
      name: 'base',
      message: 'Base branch:',
      default: 'main'
    }
  ]);

  const sessionId = `session-${Date.now()}`;
  await worktreeManager.createSession(sessionId, answers);
}

async function interactiveResumeSession() {
  const sessions = await worktreeManager.listSessions({ status: 'paused' });
  
  if (sessions.length === 0) {
    Logger.info('No paused sessions to resume');
    return;
  }

  const { sessionId } = await inquirer.prompt([{
    type: 'list',
    name: 'sessionId',
    message: 'Select session to resume:',
    choices: sessions.map(s => ({
      name: `${s.id} - ${s.task?.description || 'No description'}`,
      value: s.id
    }))
  }]);

  await worktreeManager.resumeSession(sessionId);
}

async function interactiveCheckpoint() {
  const sessions = await worktreeManager.listSessions({ status: 'active' });
  
  if (sessions.length === 0) {
    Logger.info('No active sessions');
    return;
  }

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'sessionId',
      message: 'Select session:',
      choices: sessions.map(s => ({
        name: `${s.id} - ${s.task?.description || 'No description'}`,
        value: s.id
      }))
    },
    {
      type: 'input',
      name: 'message',
      message: 'Checkpoint message:'
    }
  ]);

  await worktreeManager.checkpoint(answers.sessionId, answers.message);
}

async function interactiveDiff() {
  const sessions = await worktreeManager.listSessions();
  
  if (sessions.length === 0) {
    Logger.info('No sessions found');
    return;
  }

  const { sessionId } = await inquirer.prompt([{
    type: 'list',
    name: 'sessionId',
    message: 'Select session:',
    choices: sessions.map(s => ({
      name: `${s.id} - ${s.status}`,
      value: s.id
    }))
  }]);

  const diff = await worktreeManager.getDiff(sessionId);
  if (diff.trim()) {
    console.log(diff);
  } else {
    Logger.info('No changes in session');
  }
}

async function interactiveComplete() {
  const sessions = await worktreeManager.listSessions({ status: 'active' });
  
  if (sessions.length === 0) {
    Logger.info('No active sessions to complete');
    return;
  }

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'sessionId',
      message: 'Select session to complete:',
      choices: sessions.map(s => ({
        name: `${s.id} - ${s.task?.description || 'No description'}`,
        value: s.id
      }))
    },
    {
      type: 'confirm',
      name: 'merge',
      message: 'Merge into base branch?',
      default: false
    }
  ]);

  if (answers.merge) {
    answers.squash = (await inquirer.prompt([{
      type: 'confirm',
      name: 'squash',
      message: 'Squash commits?',
      default: false
    }])).squash;
  }

  await worktreeManager.completeSession(answers.sessionId, answers);
}

module.exports = sessionCommand;