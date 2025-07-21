#!/usr/bin/env node

const worktreeManager = require('./src/core/worktree');
const Logger = require('./src/cli/utils/logger');

/**
 * Test the new worktree management functionality
 */
async function testWorktreeManager() {
  Logger.info('Testing ClaudeBuild Worktree Manager...\n');

  try {
    // Initialize
    await worktreeManager.initialize();
    Logger.success('✓ Worktree manager initialized');

    // Create a test session
    const sessionId = `test-${Date.now()}`;
    const session = await worktreeManager.createSession(sessionId, {
      agent: 'test',
      task: { description: 'Test worktree functionality' }
    });
    Logger.success(`✓ Created session: ${session.id}`);

    // List sessions
    const sessions = await worktreeManager.listSessions();
    Logger.success(`✓ Listed ${sessions.length} session(s)`);

    // Create a checkpoint
    const checkpoint = await worktreeManager.checkpoint(
      sessionId,
      'Test checkpoint'
    );
    if (checkpoint) {
      Logger.success(`✓ Created checkpoint: ${checkpoint.message}`);
    }

    // Get diff
    const diff = await worktreeManager.getDiff(sessionId);
    Logger.success(`✓ Retrieved diff (${diff.length} bytes)`);

    // Get stats
    const stats = await worktreeManager.getStats();
    Logger.success(`✓ Stats: ${JSON.stringify(stats)}`);

    // Pause session
    await worktreeManager.pauseSession(sessionId);
    Logger.success(`✓ Paused session`);

    // Resume session
    await worktreeManager.resumeSession(sessionId);
    Logger.success(`✓ Resumed session`);

    // Complete session (without merge)
    await worktreeManager.completeSession(sessionId);
    Logger.success(`✓ Completed session`);

    Logger.success('\n✅ All worktree tests passed!');
  } catch (error) {
    Logger.error(`\n❌ Test failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run tests
testWorktreeManager();