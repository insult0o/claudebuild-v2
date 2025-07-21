const fs = require('fs').promises;
const path = require('path');
const Logger = require('../utils/logger');
const Validator = require('../utils/validator');
const { getInstance: getOrchestrator } = require('../../core/orchestration');
const ProgressBar = require('../utils/progress-bar');

async function buildCommand(options) {
  Logger.info('Starting multi-agent build process...');
  
  // Check if in a project
  if (!Validator.isClaudeBuildProject()) {
    Logger.error('Not in a ClaudeBuild project! Run `claudebuild init` first.');
    return;
  }

  const tasksFile = options.tasks || 'tasks.json';
  const parallelLimit = parseInt(options.parallel || '4');

  if (!Validator.fileExists(tasksFile)) {
    Logger.error(`Tasks file not found: ${tasksFile}`);
    Logger.info('Run `claudebuild plan` first to generate tasks');
    return;
  }

  if (!Validator.validateParallelLimit(parallelLimit)) {
    Logger.error('Invalid parallel limit. Must be between 1 and 10');
    return;
  }

  // Load tasks
  let tasks;
  try {
    const tasksData = await fs.readFile(tasksFile, 'utf8');
    tasks = JSON.parse(tasksData);
  } catch (error) {
    Logger.error(`Failed to load tasks file: ${error.message}`);
    return;
  }

  if (options.dryRun) {
    Logger.info('DRY RUN - Showing what would be executed:');
    Logger.info(`  Tasks file: ${tasksFile}`);
    Logger.info(`  Parallel agents: ${parallelLimit}`);
    Logger.info(`  Total tasks: ${tasks.tasks?.length || 0}`);
    Logger.newline();
    
    if (tasks.tasks) {
      Logger.info('Tasks to execute:');
      tasks.tasks.forEach((task, i) => {
        Logger.info(`  ${i + 1}. ${task.description || task.id}`);
        if (task.dependencies?.length > 0) {
          Logger.info(`     Dependencies: ${task.dependencies.join(', ')}`);
        }
      });
    }
    
    Logger.newline();
    Logger.info('Run without --dry-run to execute');
    return;
  }

  try {
    // Get orchestrator instance
    const orchestrator = getOrchestrator();
    
    // Start orchestrator if not already running
    if (!orchestrator.isRunning) {
      await orchestrator.start();
    }
    
    // Setup progress tracking
    const totalTasks = tasks.tasks?.length || 0;
    const progressBar = new ProgressBar(totalTasks);
    let completedCount = 0;
    let failedCount = 0;
    
    // Listen for task events
    orchestrator.on('task:completed', ({ taskId }) => {
      completedCount++;
      progressBar.update(completedCount, `Completed: ${taskId}`);
    });
    
    orchestrator.on('task:failed', ({ taskId, error }) => {
      failedCount++;
      progressBar.update(completedCount + failedCount, `Failed: ${taskId} - ${error}`);
    });
    
    orchestrator.on('task:started', ({ taskId, agentId }) => {
      Logger.debug(`Task ${taskId} started by agent ${agentId}`);
    });
    
    orchestrator.on('agent:progress', ({ agentId, progress }) => {
      Logger.debug(`Agent ${agentId} progress: ${progress}%`);
    });
    
    // Execute workflow
    Logger.newline();
    Logger.info(`📋 Executing ${totalTasks} tasks with up to ${parallelLimit} parallel agents...`);
    Logger.newline();
    
    progressBar.start();
    
    const workflowId = await orchestrator.executeTasksFile(tasksFile);
    
    // Wait for completion
    await waitForWorkflowCompletion(orchestrator, workflowId);
    
    if (progressBar && typeof progressBar.complete === 'function') {
      progressBar.complete();
    }
    
    // Get final status
    const status = await orchestrator.getWorkflowStatus(workflowId);
    
    Logger.newline();
    Logger.section('Build Summary');
    Logger.info(`Total tasks: ${totalTasks}`);
    Logger.success(`Completed: ${status.tasks.filter(t => t?.status === 'completed').length}`);
    
    if (failedCount > 0) {
      Logger.error(`Failed: ${failedCount}`);
    }
    
    const skippedCount = status.tasks.filter(t => t?.status === 'skipped').length;
    if (skippedCount > 0) {
      Logger.warn(`Skipped: ${skippedCount}`);
    }
    
    Logger.info(`Duration: ${formatDuration(status.startedAt, status.completedAt)}`);
    
    // Show failed tasks details
    if (failedCount > 0) {
      Logger.newline();
      Logger.error('Failed tasks:');
      status.tasks.filter(t => t?.status === 'failed').forEach(task => {
        Logger.error(`  - ${task.id}: ${task.error}`);
      });
    }
    
    Logger.newline();
    if (failedCount === 0) {
      Logger.success('✅ Build completed successfully!');
    } else {
      Logger.error('❌ Build completed with errors');
      process.exit(1);
    }
    
  } catch (error) {
    Logger.error('Build failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

/**
 * Wait for workflow to complete
 */
function waitForWorkflowCompletion(orchestrator, workflowId) {
  return new Promise((resolve) => {
    const checkCompletion = (event) => {
      if (event.workflowId === workflowId) {
        orchestrator.off('workflow:completed', checkCompletion);
        orchestrator.off('workflow:failed', checkFailed);
        resolve();
      }
    };
    
    const checkFailed = (event) => {
      if (event.workflowId === workflowId) {
        orchestrator.off('workflow:completed', checkCompletion);
        orchestrator.off('workflow:failed', checkFailed);
        resolve();
      }
    };
    
    orchestrator.on('workflow:completed', checkCompletion);
    orchestrator.on('workflow:failed', checkFailed);
  });
}

/**
 * Format duration between two timestamps
 */
function formatDuration(start, end) {
  if (!start || !end) {
    return 'Unknown';
  }
  
  const duration = new Date(end) - new Date(start);
  const seconds = Math.floor(duration / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

module.exports = buildCommand;