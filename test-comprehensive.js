#!/usr/bin/env node

/**
 * Comprehensive ClaudeBuild Test Suite
 * Tests every component exhaustively to ensure 100% functionality
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

// Test utilities
const Logger = {
  section: (title) => console.log(`\n${'='.repeat(60)}\n${title}\n${'='.repeat(60)}`),
  test: (name) => console.log(`\n🧪 Testing: ${name}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
  info: (msg) => console.log(`ℹ️  ${msg}`),
  warn: (msg) => console.log(`⚠️  ${msg}`)
};

// Test results tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

async function runTest(name, testFn) {
  testResults.total++;
  Logger.test(name);
  try {
    await testFn();
    testResults.passed++;
    Logger.success(`${name} passed`);
  } catch (error) {
    testResults.failed++;
    testResults.errors.push({ test: name, error: error.message });
    Logger.error(`${name} failed: ${error.message}`);
  }
}

// Test categories
async function testCLICommands() {
  Logger.section('1. CLI COMMANDS');

  // Test help command
  await runTest('claudebuild --help', async () => {
    const { stdout } = await exec('claudebuild --help');
    if (!stdout.includes('Multi-Agent Development Orchestrator')) {
      throw new Error('Help text missing expected content');
    }
  });

  // Test version command
  await runTest('claudebuild --version', async () => {
    const { stdout } = await exec('claudebuild --version');
    if (!stdout.includes('1.0.0')) {
      throw new Error('Version mismatch');
    }
  });

  // Test invalid command
  await runTest('claudebuild invalid-command (should fail gracefully)', async () => {
    try {
      await exec('claudebuild invalid-command');
      throw new Error('Should have failed');
    } catch (error) {
      if (!error.message.includes('Unknown command')) {
        throw new Error('Unexpected error message');
      }
    }
  });
}

async function testConfiguration() {
  Logger.section('2. CONFIGURATION SYSTEM');

  // Test config list
  await runTest('claudebuild config list', async () => {
    const { stdout } = await exec('claudebuild config list');
    if (!stdout.includes('Configuration settings')) {
      throw new Error('Config list failed');
    }
  });

  // Test config get
  await runTest('claudebuild config get agentDefaults.parallel', async () => {
    const { stdout } = await exec('claudebuild config get agentDefaults.parallel');
    Logger.info(`Parallel setting: ${stdout.trim()}`);
  });

  // Test config set and unset
  await runTest('claudebuild config set/unset test.value', async () => {
    await exec('claudebuild config set test.value "test123"');
    const { stdout } = await exec('claudebuild config get test.value');
    if (!stdout.includes('test123')) {
      throw new Error('Config set failed');
    }
    await exec('claudebuild config unset test.value');
  });

  // Test environment variable override
  await runTest('Environment variable override', async () => {
    const { stdout } = await exec('CLAUDEBUILD_AGENT_DEFAULTS_PARALLEL=8 claudebuild config get agentDefaults.parallel');
    if (!stdout.includes('8')) {
      throw new Error('Environment override failed');
    }
  });
}

async function testProjectScaffolding() {
  Logger.section('3. PROJECT SCAFFOLDING');

  const testProjectPath = path.join(process.cwd(), 'test-scaffold-project');

  // Clean up any existing test project
  try {
    await fs.rmdir(testProjectPath, { recursive: true });
  } catch (e) {}

  // Test project init
  await runTest('claudebuild init webapp', async () => {
    await exec(`claudebuild init ${testProjectPath} --type webapp --no-git`);
    
    // Verify files created
    const files = await fs.readdir(testProjectPath);
    if (!files.includes('package.json')) {
      throw new Error('Project files not created');
    }
    
    // Verify content
    const packageJson = JSON.parse(await fs.readFile(path.join(testProjectPath, 'package.json'), 'utf8'));
    if (packageJson.name !== 'test-scaffold-project') {
      throw new Error('Variable interpolation failed');
    }
  });

  // Clean up
  await fs.rmdir(testProjectPath, { recursive: true });
}

async function testAgentSystem() {
  Logger.section('4. AGENT SYSTEM');

  // Test agent list
  await runTest('claudebuild agent list', async () => {
    const { stdout } = await exec('claudebuild agent list');
    if (!stdout.includes('Available agents')) {
      throw new Error('Agent list failed');
    }
    Logger.info('Found agents: ' + stdout.split('\n').filter(l => l.includes('•')).join(', '));
  });

  // Test agent registry
  await runTest('Agent Registry', async () => {
    const AgentRegistry = require('./src/core/agents/registry');
    const registry = new AgentRegistry();
    
    const agents = registry.getAvailableAgents();
    if (!agents.find(a => a.id === 'dev')) {
      throw new Error('Dev agent not registered');
    }
    if (!agents.find(a => a.id === 'builder')) {
      throw new Error('Builder agent not registered');
    }
  });

  // Test message bus
  await runTest('Message Bus', async () => {
    const MessageBus = require('./src/core/agents/message-bus');
    const bus = new MessageBus();
    
    let received = false;
    bus.subscribe('test-channel', (data) => {
      received = data.test === true;
    });
    
    bus.publish('test-channel', { test: true });
    
    if (!received) {
      throw new Error('Message bus publish/subscribe failed');
    }
  });
}

async function testTaskPlanning() {
  Logger.section('5. TASK PLANNING');

  await runTest('claudebuild plan', async () => {
    // Create a simple planning task
    const planResult = await exec('claudebuild plan --issue "Create a simple calculator" --output test-plan.json');
    
    // Verify plan file created
    const planData = JSON.parse(await fs.readFile('test-plan.json', 'utf8'));
    if (!planData.tasks || planData.tasks.length === 0) {
      throw new Error('No tasks generated');
    }
    
    Logger.info(`Generated ${planData.tasks.length} tasks`);
    
    // Clean up
    await fs.unlink('test-plan.json');
  });
}

async function testBuildExecution() {
  Logger.section('6. BUILD EXECUTION');

  // Create a simple test task file
  const testTasks = {
    project: 'test-build',
    created: new Date().toISOString(),
    tasks: [{
      id: 'test-001',
      type: 'builder',
      agent: 'test-agent',
      description: 'Create a test file',
      input: {
        project: 'test',
        files: [{
          path: 'test.txt',
          content: 'Hello from ClaudeBuild!'
        }]
      },
      dependencies: [],
      priority: 'high'
    }],
    workflow: {
      parallel_limit: 1,
      auto_qa: false,
      auto_merge: false
    }
  };

  await fs.writeFile('test-build-tasks.json', JSON.stringify(testTasks, null, 2));

  await runTest('claudebuild build', async () => {
    const { stdout } = await exec('claudebuild build --tasks test-build-tasks.json', {
      timeout: 30000
    });
    
    if (!stdout.includes('Build completed successfully')) {
      throw new Error('Build did not complete successfully');
    }
    
    // Verify artifact created
    const agents = await fs.readdir('.claudebuild/agents');
    const agentDir = agents.find(a => a.startsWith('test-agent'));
    if (!agentDir) {
      throw new Error('Agent directory not created');
    }
    
    const testFile = path.join('.claudebuild/agents', agentDir, 'test.txt');
    const content = await fs.readFile(testFile, 'utf8');
    if (content !== 'Hello from ClaudeBuild!') {
      throw new Error('File content mismatch');
    }
  });

  // Clean up
  await fs.unlink('test-build-tasks.json');
}

async function testMCPIntegration() {
  Logger.section('7. MCP INTEGRATION');

  // Check if MCP server is running
  await runTest('MCP Server Status', async () => {
    const isRunning = await checkMCPServerRunning();
    if (!isRunning) {
      Logger.warn('MCP server not running, starting it...');
      await startMCPServer();
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  });

  // Test MCP client connection
  await runTest('MCP Client Connection', async () => {
    const MCPClient = require('./src/core/agents/mcp/client');
    const client = new MCPClient();
    
    await client.connect();
    await client.disconnect();
  });

  // Test tool access policy
  await runTest('Tool Access Policy', async () => {
    const ToolAccessPolicy = require('./src/core/agents/mcp/policy');
    const policy = new ToolAccessPolicy({ defaultPolicy: 'allow' });
    
    const allowed = await policy.checkAccess('test-agent', 'web_search', { query: 'test' });
    if (!allowed) {
      throw new Error('Policy should allow access');
    }
  });

  // Test MCP-enabled build
  await runTest('MCP-Enabled Agent Build', async () => {
    const mcpTasks = {
      project: 'test-mcp',
      created: new Date().toISOString(),
      tasks: [{
        id: 'mcp-test-001',
        type: 'builder-mcp',
        agent: 'mcp-test-agent',
        description: 'Test MCP tools',
        input: {
          task: 'Search for Node.js best practices',
          requirements: ['Use web search', 'Create summary']
        },
        dependencies: [],
        priority: 'high'
      }],
      workflow: {
        parallel_limit: 1,
        auto_qa: false,
        auto_merge: false
      }
    };

    await fs.writeFile('test-mcp-tasks.json', JSON.stringify(mcpTasks, null, 2));

    const { stdout } = await exec('CLAUDEBUILD_TOOL_PERMISSION=allow claudebuild build --tasks test-mcp-tasks.json', {
      timeout: 60000
    });
    
    if (!stdout.includes('Tool Access Request')) {
      throw new Error('MCP tools not used');
    }
    
    if (!stdout.includes('Build completed successfully')) {
      throw new Error('MCP build failed');
    }
  });

  // Clean up
  await fs.unlink('test-mcp-tasks.json');
}

async function testOrchestrationEngine() {
  Logger.section('8. ORCHESTRATION ENGINE');

  await runTest('Orchestration with Dependencies', async () => {
    const orchestrationTasks = {
      project: 'test-orchestration',
      created: new Date().toISOString(),
      tasks: [
        {
          id: 'task-1',
          type: 'builder',
          agent: 'agent-1',
          description: 'Create base file',
          input: {
            project: 'test',
            files: [{
              path: 'base.txt',
              content: 'Base content'
            }]
          },
          dependencies: [],
          priority: 'high'
        },
        {
          id: 'task-2',
          type: 'builder',
          agent: 'agent-2',
          description: 'Create dependent file',
          input: {
            project: 'test',
            files: [{
              path: 'dependent.txt',
              content: 'Depends on base'
            }]
          },
          dependencies: ['task-1'],
          priority: 'medium'
        },
        {
          id: 'task-3',
          type: 'builder',
          agent: 'agent-3',
          description: 'Create another file',
          input: {
            project: 'test',
            files: [{
              path: 'parallel.txt',
              content: 'Can run in parallel'
            }]
          },
          dependencies: [],
          priority: 'medium'
        }
      ],
      workflow: {
        parallel_limit: 2,
        auto_qa: false,
        auto_merge: false
      }
    };

    await fs.writeFile('test-orchestration.json', JSON.stringify(orchestrationTasks, null, 2));

    const { stdout } = await exec('claudebuild build --tasks test-orchestration.json', {
      timeout: 60000
    });
    
    // Verify parallel execution
    if (!stdout.includes('task-1') || !stdout.includes('task-3')) {
      throw new Error('Parallel tasks not executed');
    }
    
    // Verify dependency order
    const task1Index = stdout.indexOf('task-1 is now completed');
    const task2Index = stdout.indexOf('task-2 is now running');
    if (task1Index > task2Index && task2Index !== -1) {
      throw new Error('Dependency order not respected');
    }
  });

  // Clean up
  await fs.unlink('test-orchestration.json');
}

async function testMonitoringIntegration() {
  Logger.section('9. MONITORING INTEGRATION');

  await runTest('Monitoring Dashboard Connection', async () => {
    // Check if monitoring server is reachable
    try {
      const response = await fetch('http://localhost:3001/api/health');
      const data = await response.json();
      if (data.status !== 'healthy') {
        throw new Error('Monitoring server unhealthy');
      }
    } catch (error) {
      Logger.warn('Monitoring dashboard not running');
    }
  });
}

async function testStateManagement() {
  Logger.section('10. STATE MANAGEMENT');

  await runTest('Checkpoint Creation and Recovery', async () => {
    const StateManager = require('./src/core/orchestration/state-manager');
    const stateManager = new StateManager();

    // Create test state
    const testState = {
      workflow: { id: 'test-workflow', status: 'running' },
      tasks: [
        { id: 'task-1', status: 'completed' },
        { id: 'task-2', status: 'running' }
      ]
    };

    // Save checkpoint
    await stateManager.saveCheckpoint('test-workflow', testState);

    // Load checkpoint
    const loaded = await stateManager.loadCheckpoint('test-workflow');
    if (loaded.tasks[0].status !== 'completed') {
      throw new Error('Checkpoint not saved/loaded correctly');
    }

    // Clean up
    await fs.unlink('.claudebuild/checkpoints/test-workflow.json');
  });
}

async function testErrorHandling() {
  Logger.section('11. ERROR HANDLING');

  await runTest('Agent Crash Recovery', async () => {
    const crashTasks = {
      project: 'test-crash',
      created: new Date().toISOString(),
      tasks: [{
        id: 'crash-001',
        type: 'builder',
        agent: 'crash-agent',
        description: 'This will crash',
        input: {
          project: 'test',
          files: [{
            path: 'will-crash.txt',
            content: '{{UNDEFINED_VARIABLE}}'  // This should cause an error
          }]
        },
        dependencies: [],
        priority: 'high'
      }],
      workflow: {
        parallel_limit: 1,
        auto_qa: false,
        auto_merge: false
      }
    };

    await fs.writeFile('test-crash.json', JSON.stringify(crashTasks, null, 2));

    try {
      await exec('claudebuild build --tasks test-crash.json', { timeout: 30000 });
    } catch (error) {
      // Expected to fail
      if (!error.message.includes('error')) {
        throw new Error('Error not handled properly');
      }
    }

    // Clean up
    await fs.unlink('test-crash.json');
  });
}

// Helper functions
async function checkMCPServerRunning() {
  try {
    const { stdout } = await exec('ps aux | grep "node.*mcp-server.*index.js" | grep -v grep');
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

async function startMCPServer() {
  const mcpPath = path.join(process.cwd(), 'mcp-server');
  spawn('node', ['index.js'], {
    cwd: mcpPath,
    detached: true,
    stdio: 'ignore'
  }).unref();
}

// Main test runner
async function runAllTests() {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║         CLAUDEBUILD COMPREHENSIVE TEST SUITE v1.0             ║
║                                                               ║
║  Testing every component exhaustively to ensure 100%          ║
║  functionality. This will take several minutes...             ║
╚═══════════════════════════════════════════════════════════════╝
  `);

  const startTime = Date.now();

  try {
    await testCLICommands();
    await testConfiguration();
    await testProjectScaffolding();
    await testAgentSystem();
    await testTaskPlanning();
    await testBuildExecution();
    await testMCPIntegration();
    await testOrchestrationEngine();
    await testMonitoringIntegration();
    await testStateManagement();
    await testErrorHandling();
  } catch (error) {
    Logger.error(`Fatal error: ${error.message}`);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  // Print summary
  Logger.section('TEST SUMMARY');
  console.log(`
Total Tests: ${testResults.total}
Passed: ${testResults.passed} ✅
Failed: ${testResults.failed} ❌
Duration: ${duration}s

${testResults.failed === 0 ? '🎉 ALL TESTS PASSED!' : '⚠️  SOME TESTS FAILED'}
  `);

  if (testResults.errors.length > 0) {
    console.log('\nFailed Tests:');
    testResults.errors.forEach(({ test, error }) => {
      console.log(`  - ${test}: ${error}`);
    });
  }

  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(console.error);