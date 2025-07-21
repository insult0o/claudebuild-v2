const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const Logger = require('../../cli/utils/logger');

/**
 * Git Worktree Manager
 * Handles creation and management of isolated git worktrees for sessions
 * Based on patterns from Claude Squad
 */
class WorktreeManager {
  constructor() {
    this.worktreeBase = path.join(process.cwd(), '.claudebuild/worktrees');
    this.sessionsFile = path.join(process.cwd(), '.claudebuild/sessions.json');
  }

  /**
   * Initialize worktree management
   */
  async initialize() {
    // Ensure worktree directory exists
    if (!fs.existsSync(this.worktreeBase)) {
      fs.mkdirSync(this.worktreeBase, { recursive: true });
    }

    // Load existing sessions
    await this.loadSessions();
  }

  /**
   * Create a new session with isolated worktree
   */
  async createSession(sessionId, options = {}) {
    const { baseBranch = 'main', agent = 'default', task = {} } = options;
    const branch = `session/${sessionId}`;
    const worktreePath = path.join(this.worktreeBase, sessionId);

    try {
      // Check if we're in a git repository
      await execAsync('git rev-parse --git-dir');

      // Create and checkout new branch
      Logger.info(`Creating worktree for session ${sessionId}`);
      await execAsync(`git worktree add -b ${branch} "${worktreePath}" ${baseBranch}`);

      // Create session record
      const session = {
        id: sessionId,
        branch,
        worktree: worktreePath,
        baseBranch,
        agent,
        task,
        status: 'active',
        created: new Date().toISOString(),
        checkpoints: []
      };

      // Save session
      await this.saveSession(session);

      Logger.success(`Session ${sessionId} created with worktree at ${worktreePath}`);
      return session;
    } catch (error) {
      Logger.error(`Failed to create session: ${error.message}`);
      throw error;
    }
  }

  /**
   * Resume an existing session
   */
  async resumeSession(sessionId) {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Check if worktree still exists
    if (!fs.existsSync(session.worktree)) {
      // Recreate worktree
      Logger.warn(`Recreating missing worktree for session ${sessionId}`);
      await execAsync(`git worktree add "${session.worktree}" ${session.branch}`);
    }

    session.status = 'active';
    session.resumed = new Date().toISOString();
    await this.saveSession(session);

    Logger.success(`Resumed session ${sessionId}`);
    return session;
  }

  /**
   * Create a checkpoint (commit) in the session
   */
  async checkpoint(sessionId, message, options = {}) {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    try {
      // Stage all changes
      await execAsync(`git -C "${session.worktree}" add -A`);

      // Check if there are changes to commit
      const { stdout: status } = await execAsync(
        `git -C "${session.worktree}" status --porcelain`
      );

      if (status.trim()) {
        // Commit changes
        const commitMessage = `[${sessionId}] ${message}`;
        await execAsync(
          `git -C "${session.worktree}" commit -m "${commitMessage}"`
        );

        // Get commit hash
        const { stdout: hash } = await execAsync(
          `git -C "${session.worktree}" rev-parse HEAD`
        );

        const checkpoint = {
          id: `cp-${Date.now()}`,
          message,
          hash: hash.trim(),
          timestamp: new Date().toISOString(),
          ...options
        };

        session.checkpoints.push(checkpoint);
        await this.saveSession(session);

        Logger.success(`Created checkpoint: ${message}`);
        return checkpoint;
      } else {
        Logger.info('No changes to checkpoint');
        return null;
      }
    } catch (error) {
      Logger.error(`Failed to create checkpoint: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get diff for a session
   */
  async getDiff(sessionId, options = {}) {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const { staged = false, baseBranch = session.baseBranch } = options;

    try {
      const diffCmd = staged
        ? `git -C "${session.worktree}" diff --cached`
        : `git -C "${session.worktree}" diff ${baseBranch}...HEAD`;

      const { stdout } = await execAsync(diffCmd);
      return stdout;
    } catch (error) {
      Logger.error(`Failed to get diff: ${error.message}`);
      throw error;
    }
  }

  /**
   * List all sessions
   */
  async listSessions(filter = {}) {
    const sessions = await this.loadSessions();
    
    return Object.values(sessions).filter(session => {
      if (filter.status && session.status !== filter.status) return false;
      if (filter.agent && session.agent !== filter.agent) return false;
      return true;
    });
  }

  /**
   * Pause a session
   */
  async pauseSession(sessionId) {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Create checkpoint before pausing
    await this.checkpoint(sessionId, 'Session paused');

    session.status = 'paused';
    session.paused = new Date().toISOString();
    await this.saveSession(session);

    Logger.info(`Session ${sessionId} paused`);
    return session;
  }

  /**
   * Complete and merge a session
   */
  async completeSession(sessionId, options = {}) {
    const { merge = false, squash = false, targetBranch = 'main' } = options;
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    try {
      // Final checkpoint
      await this.checkpoint(sessionId, 'Session completed');

      if (merge) {
        // Checkout target branch
        await execAsync(`git checkout ${targetBranch}`);

        // Merge session branch
        const mergeCmd = squash
          ? `git merge --squash ${session.branch}`
          : `git merge ${session.branch}`;
        
        await execAsync(mergeCmd);

        if (squash) {
          // Commit squashed changes
          await execAsync(`git commit -m "Merged session ${sessionId}"`);
        }

        Logger.success(`Merged session ${sessionId} into ${targetBranch}`);
      }

      // Update session status
      session.status = 'completed';
      session.completed = new Date().toISOString();
      await this.saveSession(session);

      // Remove worktree
      await this.cleanupWorktree(sessionId);

      return session;
    } catch (error) {
      Logger.error(`Failed to complete session: ${error.message}`);
      throw error;
    }
  }

  /**
   * Clean up a worktree
   */
  async cleanupWorktree(sessionId) {
    const session = await this.getSession(sessionId);
    if (!session) return;

    try {
      // Remove worktree
      await execAsync(`git worktree remove "${session.worktree}" --force`);
      Logger.info(`Cleaned up worktree for session ${sessionId}`);
    } catch (error) {
      Logger.warn(`Failed to cleanup worktree: ${error.message}`);
    }
  }

  /**
   * Get a specific session
   */
  async getSession(sessionId) {
    const sessions = await this.loadSessions();
    return sessions[sessionId];
  }

  /**
   * Load sessions from file
   */
  async loadSessions() {
    if (!this.sessions) {
      try {
        if (fs.existsSync(this.sessionsFile)) {
          const data = fs.readFileSync(this.sessionsFile, 'utf8');
          this.sessions = JSON.parse(data);
        } else {
          this.sessions = {};
        }
      } catch (error) {
        Logger.warn(`Failed to load sessions: ${error.message}`);
        this.sessions = {};
      }
    }
    return this.sessions;
  }

  /**
   * Save session to file
   */
  async saveSession(session) {
    const sessions = await this.loadSessions();
    sessions[session.id] = session;
    
    // Ensure directory exists
    const dir = path.dirname(this.sessionsFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(
      this.sessionsFile,
      JSON.stringify(sessions, null, 2)
    );
    
    this.sessions = sessions;
  }

  /**
   * Get session statistics
   */
  async getStats() {
    const sessions = await this.loadSessions();
    const stats = {
      total: 0,
      active: 0,
      paused: 0,
      completed: 0,
      checkpoints: 0
    };

    Object.values(sessions).forEach(session => {
      stats.total++;
      stats[session.status]++;
      stats.checkpoints += session.checkpoints.length;
    });

    return stats;
  }
}

module.exports = WorktreeManager;