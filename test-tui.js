#!/usr/bin/env node

const blessed = require('blessed');
const Logger = require('./src/cli/utils/logger');

/**
 * Test basic blessed TUI setup
 */
async function testTUI() {
  Logger.info('Testing Blessed TUI setup...\n');

  try {
    // Create a simple screen
    const screen = blessed.screen({
      smartCSR: true,
      title: 'ClaudeBuild TUI Test'
    });

    // Create a box
    const box = blessed.box({
      parent: screen,
      top: 'center',
      left: 'center',
      width: '50%',
      height: '50%',
      content: 'ClaudeBuild TUI Test\n\nPress q to quit',
      border: {
        type: 'line'
      },
      style: {
        border: {
          fg: 'blue'
        }
      }
    });

    // Quit on q
    screen.key(['q', 'C-c'], () => {
      Logger.success('✓ TUI test completed');
      process.exit(0);
    });

    // Render
    screen.render();

    Logger.success('✓ TUI initialized successfully');
    Logger.info('Press q to exit the test');

  } catch (error) {
    Logger.error(`TUI test failed: ${error.message}`);
    process.exit(1);
  }
}

// Run test
testTUI();