#!/usr/bin/env node

const blessed = require('blessed');
const worktreeManager = require('../../core/worktree');
const { formatTimestamp, formatStatus, progressBar } = require('../utils/formatting');
const Logger = require('../utils/logger');

/**
 * ClaudeBuild Terminal UI
 * Provides a tmux-style interface for session management
 */
class ClaudeBuildTUI {
  constructor() {
    this.screen = null;
    this.sessionList = null;
    this.detailsBox = null;
    this.logBox = null;
    this.inputBox = null;
    this.statusBar = null;
    this.currentSession = null;
    this.sessions = [];
  }

  /**
   * Initialize the TUI
   */
  async init() {
    // Initialize worktree manager
    await worktreeManager.initialize();

    // Create screen
    this.screen = blessed.screen({
      smartCSR: true,
      title: 'ClaudeBuild TUI',
      fullUnicode: true
    });

    // Create layout
    this.createLayout();

    // Setup key bindings
    this.setupKeyBindings();

    // Load initial data
    await this.refreshSessions();

    // Render screen
    this.screen.render();
  }

  /**
   * Create the TUI layout
   */
  createLayout() {
    // Session list (left panel)
    this.sessionList = blessed.list({
      parent: this.screen,
      label: ' Sessions ',
      top: 0,
      left: 0,
      width: '30%',
      height: '70%-1',
      border: {
        type: 'line'
      },
      style: {
        selected: {
          bg: 'blue',
          bold: true
        },
        border: {
          fg: 'blue'
        }
      },
      keys: true,
      vi: true,
      mouse: true,
      scrollable: true
    });

    // Details box (right panel, top)
    this.detailsBox = blessed.box({
      parent: this.screen,
      label: ' Session Details ',
      top: 0,
      left: '30%',
      width: '70%',
      height: '40%',
      border: {
        type: 'line'
      },
      style: {
        border: {
          fg: 'blue'
        }
      },
      scrollable: true,
      alwaysScroll: true,
      mouse: true
    });

    // Log box (right panel, bottom)
    this.logBox = blessed.log({
      parent: this.screen,
      label: ' Logs ',
      top: '40%',
      left: '30%',
      width: '70%',
      height: '30%-1',
      border: {
        type: 'line'
      },
      style: {
        border: {
          fg: 'blue'
        }
      },
      scrollable: true,
      alwaysScroll: true,
      mouse: true
    });

    // Input box (bottom)
    this.inputBox = blessed.textbox({
      parent: this.screen,
      label: ' Command ',
      bottom: 1,
      left: 0,
      width: '100%',
      height: 3,
      border: {
        type: 'line'
      },
      style: {
        border: {
          fg: 'blue'
        }
      },
      inputOnFocus: true
    });

    // Status bar (bottom)
    this.statusBar = blessed.box({
      parent: this.screen,
      bottom: 0,
      left: 0,
      width: '100%',
      height: 1,
      style: {
        bg: 'blue',
        fg: 'white'
      }
    });

    // Update status bar
    this.updateStatusBar();
  }

  /**
   * Setup keyboard shortcuts
   */
  setupKeyBindings() {
    // Global keys
    this.screen.key(['q', 'C-c'], () => this.quit());
    this.screen.key('n', () => this.createNewSession());
    this.screen.key('r', () => this.resumeSession());
    this.screen.key('p', () => this.pauseSession());
    this.screen.key('c', () => this.checkpoint());
    this.screen.key('d', () => this.showDiff());
    this.screen.key('m', () => this.mergeSession());
    this.screen.key('/', () => this.focusInput());
    this.screen.key('?', () => this.showHelp());
    this.screen.key('tab', () => this.focusNext());

    // Session list navigation
    this.sessionList.on('select', () => this.selectSession());
    this.sessionList.key(['j', 'down'], () => {
      this.sessionList.down();
      this.selectSession();
    });
    this.sessionList.key(['k', 'up'], () => {
      this.sessionList.up();
      this.selectSession();
    });

    // Input handling
    this.inputBox.key('enter', () => this.executeCommand());
    this.inputBox.key('escape', () => {
      this.inputBox.clearValue();
      this.sessionList.focus();
    });
  }

  /**
   * Refresh session list
   */
  async refreshSessions() {
    try {
      this.sessions = await worktreeManager.listSessions();
      
      // Update list
      const items = this.sessions.map(session => {
        const status = formatStatus(session.status);
        const time = formatTimestamp(session.created);
        return `${status} ${session.id} (${time})`;
      });

      this.sessionList.setItems(items);
      
      // Select first item if none selected
      if (this.sessions.length > 0 && !this.currentSession) {
        this.sessionList.select(0);
        this.selectSession();
      }

      this.screen.render();
    } catch (error) {
      this.log(`Error refreshing sessions: ${error.message}`, 'error');
    }
  }

  /**
   * Select a session
   */
  selectSession() {
    const index = this.sessionList.selected;
    if (index >= 0 && index < this.sessions.length) {
      this.currentSession = this.sessions[index];
      this.updateDetails();
    }
  }

  /**
   * Update session details
   */
  updateDetails() {
    if (!this.currentSession) {
      this.detailsBox.setContent('No session selected');
      return;
    }

    const session = this.currentSession;
    const details = [
      `{bold}Session ID:{/bold} ${session.id}`,
      `{bold}Status:{/bold} ${formatStatus(session.status)}`,
      `{bold}Branch:{/bold} ${session.branch}`,
      `{bold}Base Branch:{/bold} ${session.baseBranch}`,
      `{bold}Agent:{/bold} ${session.agent}`,
      `{bold}Created:{/bold} ${new Date(session.created).toLocaleString()}`,
      '',
      `{bold}Task:{/bold} ${session.task?.description || 'No description'}`,
      '',
      `{bold}Checkpoints:{/bold} ${session.checkpoints.length}`,
      ...session.checkpoints.slice(-5).map(cp => 
        `  • ${formatTimestamp(cp.timestamp)}: ${cp.message}`
      )
    ].join('\n');

    this.detailsBox.setContent(details);
    this.screen.render();
  }

  /**
   * Create new session
   */
  async createNewSession() {
    // Create input form
    const form = blessed.form({
      parent: this.screen,
      label: ' New Session ',
      top: 'center',
      left: 'center',
      width: '50%',
      height: 12,
      border: {
        type: 'line'
      },
      style: {
        border: {
          fg: 'green'
        }
      },
      keys: true
    });

    const taskInput = blessed.textarea({
      parent: form,
      label: 'Task Description:',
      top: 1,
      height: 3,
      inputOnFocus: true
    });

    const agentInput = blessed.textbox({
      parent: form,
      label: 'Agent Type:',
      top: 5,
      height: 1,
      value: 'dev',
      inputOnFocus: true
    });

    const buttons = blessed.box({
      parent: form,
      bottom: 1,
      height: 1
    });

    const submitBtn = blessed.button({
      parent: buttons,
      content: '[ Create ]',
      left: 2,
      shrink: true,
      style: {
        focus: {
          bg: 'green'
        }
      }
    });

    const cancelBtn = blessed.button({
      parent: buttons,
      content: '[ Cancel ]',
      right: 2,
      shrink: true,
      style: {
        focus: {
          bg: 'red'
        }
      }
    });

    // Handle submission
    submitBtn.on('press', async () => {
      const task = taskInput.getValue();
      const agent = agentInput.getValue();
      
      form.destroy();
      
      try {
        const sessionId = `session-${Date.now()}`;
        await worktreeManager.createSession(sessionId, {
          agent,
          task: { description: task }
        });
        
        this.log(`Created session: ${sessionId}`, 'success');
        await this.refreshSessions();
      } catch (error) {
        this.log(`Failed to create session: ${error.message}`, 'error');
      }
    });

    cancelBtn.on('press', () => {
      form.destroy();
      this.screen.render();
    });

    taskInput.focus();
    this.screen.render();
  }

  /**
   * Resume selected session
   */
  async resumeSession() {
    if (!this.currentSession) {
      this.log('No session selected', 'warning');
      return;
    }

    if (this.currentSession.status === 'active') {
      this.log('Session is already active', 'info');
      return;
    }

    try {
      await worktreeManager.resumeSession(this.currentSession.id);
      this.log(`Resumed session: ${this.currentSession.id}`, 'success');
      await this.refreshSessions();
    } catch (error) {
      this.log(`Failed to resume session: ${error.message}`, 'error');
    }
  }

  /**
   * Pause selected session
   */
  async pauseSession() {
    if (!this.currentSession || this.currentSession.status !== 'active') {
      this.log('No active session selected', 'warning');
      return;
    }

    try {
      await worktreeManager.pauseSession(this.currentSession.id);
      this.log(`Paused session: ${this.currentSession.id}`, 'success');
      await this.refreshSessions();
    } catch (error) {
      this.log(`Failed to pause session: ${error.message}`, 'error');
    }
  }

  /**
   * Create checkpoint
   */
  async checkpoint() {
    if (!this.currentSession || this.currentSession.status !== 'active') {
      this.log('No active session selected', 'warning');
      return;
    }

    // Get message from input
    this.inputBox.setValue('checkpoint: ');
    this.inputBox.focus();
    
    this.inputBox.once('submit', async () => {
      const message = this.inputBox.getValue().replace('checkpoint: ', '');
      this.inputBox.clearValue();
      
      try {
        const checkpoint = await worktreeManager.checkpoint(
          this.currentSession.id,
          message
        );
        
        if (checkpoint) {
          this.log(`Created checkpoint: ${message}`, 'success');
          await this.refreshSessions();
        } else {
          this.log('No changes to checkpoint', 'info');
        }
      } catch (error) {
        this.log(`Failed to create checkpoint: ${error.message}`, 'error');
      }
    });
  }

  /**
   * Show diff for selected session
   */
  async showDiff() {
    if (!this.currentSession) {
      this.log('No session selected', 'warning');
      return;
    }

    try {
      const diff = await worktreeManager.getDiff(this.currentSession.id);
      
      if (!diff.trim()) {
        this.log('No changes in session', 'info');
        return;
      }

      // Create diff viewer
      const diffViewer = blessed.box({
        parent: this.screen,
        label: ` Diff: ${this.currentSession.id} `,
        top: 'center',
        left: 'center',
        width: '80%',
        height: '80%',
        border: {
          type: 'line'
        },
        style: {
          border: {
            fg: 'yellow'
          }
        },
        scrollable: true,
        alwaysScroll: true,
        mouse: true,
        keys: true,
        content: diff
      });

      diffViewer.key(['q', 'escape'], () => {
        diffViewer.destroy();
        this.screen.render();
      });

      diffViewer.focus();
      this.screen.render();
    } catch (error) {
      this.log(`Failed to get diff: ${error.message}`, 'error');
    }
  }

  /**
   * Merge selected session
   */
  async mergeSession() {
    if (!this.currentSession || this.currentSession.status === 'completed') {
      this.log('No active/paused session selected', 'warning');
      return;
    }

    // Confirm merge
    const confirm = blessed.question({
      parent: this.screen,
      border: 'line',
      height: 'shrink',
      width: 'half',
      top: 'center',
      left: 'center',
      label: ' Confirm Merge ',
      tags: true,
      style: {
        border: {
          fg: 'yellow'
        }
      }
    });

    confirm.ask(`Merge session ${this.currentSession.id} into main?`, async (err, value) => {
      if (value) {
        try {
          await worktreeManager.completeSession(this.currentSession.id, {
            merge: true
          });
          
          this.log(`Merged session: ${this.currentSession.id}`, 'success');
          await this.refreshSessions();
        } catch (error) {
          this.log(`Failed to merge session: ${error.message}`, 'error');
        }
      }
    });
  }

  /**
   * Focus input box
   */
  focusInput() {
    this.inputBox.focus();
  }

  /**
   * Execute command from input
   */
  async executeCommand() {
    const command = this.inputBox.getValue().trim();
    this.inputBox.clearValue();
    
    if (!command) return;

    // Parse command
    const [cmd, ...args] = command.split(' ');

    switch (cmd) {
      case 'new':
        await this.createNewSession();
        break;
      case 'resume':
        await this.resumeSession();
        break;
      case 'pause':
        await this.pauseSession();
        break;
      case 'checkpoint':
      case 'cp':
        await this.checkpoint();
        break;
      case 'diff':
        await this.showDiff();
        break;
      case 'merge':
        await this.mergeSession();
        break;
      case 'refresh':
        await this.refreshSessions();
        break;
      case 'help':
        this.showHelp();
        break;
      default:
        this.log(`Unknown command: ${cmd}`, 'error');
    }

    this.sessionList.focus();
  }

  /**
   * Show help
   */
  showHelp() {
    const help = blessed.box({
      parent: this.screen,
      label: ' Help ',
      top: 'center',
      left: 'center',
      width: '60%',
      height: '60%',
      border: {
        type: 'line'
      },
      style: {
        border: {
          fg: 'green'
        }
      },
      scrollable: true,
      mouse: true,
      keys: true,
      content: [
        '{bold}Keyboard Shortcuts:{/bold}',
        '',
        '  n        - Create new session',
        '  r        - Resume selected session',
        '  p        - Pause selected session',
        '  c        - Create checkpoint',
        '  d        - Show diff',
        '  m        - Merge session',
        '  /        - Focus command input',
        '  Tab      - Switch focus',
        '  q        - Quit',
        '  ?        - Show this help',
        '',
        '{bold}Commands:{/bold}',
        '',
        '  new               - Create new session',
        '  resume            - Resume selected session',
        '  pause             - Pause selected session',
        '  checkpoint <msg>  - Create checkpoint',
        '  diff              - Show diff',
        '  merge             - Merge session',
        '  refresh           - Refresh session list',
        '  help              - Show help'
      ].join('\n'),
      tags: true
    });

    help.key(['q', 'escape'], () => {
      help.destroy();
      this.screen.render();
    });

    help.focus();
    this.screen.render();
  }

  /**
   * Focus next element
   */
  focusNext() {
    if (this.sessionList.focused) {
      this.detailsBox.focus();
    } else if (this.detailsBox.focused) {
      this.logBox.focus();
    } else if (this.logBox.focused) {
      this.inputBox.focus();
    } else {
      this.sessionList.focus();
    }
  }

  /**
   * Update status bar
   */
  updateStatusBar() {
    const shortcuts = [
      'n:new',
      'r:resume',
      'p:pause',
      'c:checkpoint',
      'd:diff',
      'm:merge',
      '?:help',
      'q:quit'
    ].join(' | ');

    this.statusBar.setContent(` ClaudeBuild TUI | ${shortcuts} `);
  }

  /**
   * Log message
   */
  log(message, level = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const levelColors = {
      info: '{blue-fg}',
      success: '{green-fg}',
      warning: '{yellow-fg}',
      error: '{red-fg}'
    };
    
    const color = levelColors[level] || '';
    this.logBox.log(`${color}[${timestamp}] ${message}{/}`);
  }

  /**
   * Quit the TUI
   */
  quit() {
    process.exit(0);
  }

  /**
   * Run the TUI
   */
  async run() {
    await this.init();
  }
}

// Run TUI
if (require.main === module) {
  const tui = new ClaudeBuildTUI();
  tui.run().catch(error => {
    console.error('TUI Error:', error);
    process.exit(1);
  });
}

module.exports = ClaudeBuildTUI;