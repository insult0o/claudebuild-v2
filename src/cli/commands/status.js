const fs = require('fs');
const path = require('path');
const Logger = require('../utils/logger');
const Validator = require('../utils/validator');
const chalk = require('chalk');

async function statusCommand(options) {
  // Check if in a project
  if (!Validator.isClaudeBuildProject()) {
    Logger.error('Not in a ClaudeBuild project!');
    return;
  }

  const statusFile = '.claudebuild/STATUS_BOARD.md';
  
  if (!Validator.fileExists(statusFile)) {
    Logger.warn('No status board found. Project may not be active.');
    return;
  }

  if (options.json) {
    // Output as JSON (for programmatic use)
    const status = {
      project: 'ClaudeBuild',
      phase: 'Development',
      agents: {
        active: 0,
        total: 4
      },
      tasks: {
        completed: 0,
        total: 18
      }
    };
    console.log(JSON.stringify(status, null, 2));
    return;
  }

  // Read and display status
  try {
    const content = fs.readFileSync(statusFile, 'utf8');
    
    if (options.watch) {
      // Watch mode
      console.clear();
      console.log(content);
      Logger.divider();
      Logger.info('Watching for changes... (Press Ctrl+C to exit)');
      
      const chokidar = require('chokidar');
      chokidar.watch(statusFile).on('change', () => {
        console.clear();
        const updated = fs.readFileSync(statusFile, 'utf8');
        console.log(updated);
        Logger.divider();
        Logger.info('Watching for changes... (Press Ctrl+C to exit)');
      });
    } else {
      // Single display
      console.log(content);
    }
  } catch (error) {
    Logger.error('Failed to read status board');
    Logger.debug(error.message);
  }
}

module.exports = statusCommand;