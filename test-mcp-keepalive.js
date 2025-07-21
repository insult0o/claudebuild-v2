#!/usr/bin/env node

const MCPClient = require('./src/core/agents/mcp/client');
const Logger = require('./src/cli/utils/logger');

/**
 * Test MCP Keep-Alive functionality
 */
async function testKeepAlive() {
  Logger.info('Testing MCP Keep-Alive Manager...\n');

  const client = new MCPClient({
    enableKeepAlive: true
  });

  try {
    // Connect to MCP server
    Logger.info('Connecting to MCP server...');
    await client.connect();
    Logger.success('✓ Connected successfully');

    // Check keep-alive status
    if (client.keepAlive) {
      const stats = client.keepAlive.getStats();
      Logger.success(`✓ Keep-alive is running: ${JSON.stringify(stats)}`);
    }

    // Test tool call
    Logger.info('\nTesting tool call...');
    const result = await client.callTool('web_search', { query: 'test query' });
    Logger.success('✓ Tool call successful');

    // Configure keep-alive
    Logger.info('\nConfiguring keep-alive...');
    client.keepAlive.configure({
      pingInterval: 5000 // 5 seconds for testing
    });
    Logger.success('✓ Keep-alive reconfigured');

    // Wait for a few pings
    Logger.info('\nWaiting for keep-alive pings...');
    await new Promise(resolve => setTimeout(resolve, 15000));

    // Check final stats
    const finalStats = client.keepAlive.getStats();
    Logger.success(`✓ Final stats: ${JSON.stringify(finalStats)}`);

    // Disconnect
    Logger.info('\nDisconnecting...');
    await client.disconnect();
    Logger.success('✓ Disconnected successfully');

  } catch (error) {
    Logger.error(`Test failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run test
testKeepAlive();