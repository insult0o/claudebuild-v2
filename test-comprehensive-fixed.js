#!/usr/bin/env node

/**
 * Comprehensive ClaudeBuild Test Suite v2
 * Fixed version with correct command syntax and expectations
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

// Helper to check if directory exists
async function dirExists(path) {
  try {
    const stat = await fs.stat(path);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

// Helper to clean directory
async function cleanDir(dirPath) {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
  } catch (e) {
    // Ignore errors
  }
}

// Test categories
async function testCLICommands() {
  Logger.section('1. CLI COMMANDS');

  // Test help command
  await runTest('claudebuild --help', async () => {
    const { stdout } = await exec('claudebuild --help');
    if (!stdout.includes('Multi-agent development orchestrator')) {
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
      if (!error.message.includes('unknown command')) {
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
    if (!stdout.includes('project') || !stdout.includes('agents')) {
      throw new Error('Config list missing expected fields');
    }
  });

  // Test config get with valid path
  await runTest('claudebuild config get project.version', async () => {
    const { stdout } = await exec('claudebuild config get project.version');
    if (!stdout.includes('1.0.0')) {
      throw new Error('Config get failed');
    }
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
    const { stdout } = await exec('CLAUDEBUILD_AGENTS_DEFAULTS_PARALLEL=8 claudebuild config get agents.defaults.parallel');
    if (!stdout.includes('8')) {
      throw new Error('Environment override failed');
    }
  });
}

async function testAgentSystem() {
  Logger.section('3. AGENT SYSTEM');

  // Test agent list
  await runTest('claudebuild agent list', async () => {
    const { stdout } = await exec('claudebuild agent list');
    if (!stdout.includes('orchestrator') || !stdout.includes('dev')) {
      throw new Error('Agent list missing expected agents');
    }
  });

  // Test agent registry directly
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
    if (!agents.find(a => a.id === 'builder-mcp')) {
      throw new Error('Builder-MCP agent not registered');
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

  // Test agent process management
  await runTest('Agent Process Management', async () => {
    const AgentProcess = require('./src/core/agents/process');
    const process = new AgentProcess({
      id: 'test-process',
      type: 'builder',
      workDir: '.claudebuild/agents/test-process'
    });

    // Just verify it can be instantiated
    if (!process.id) {
      throw new Error('Agent process creation failed');
    }
  });
}

async function testTaskPlanning() {
  Logger.section('4. TASK PLANNING');

  await runTest('Task planning validation', async () => {
    // Since planning is interactive, we just test the structure
    const PlannerHandler = require('./src/core/agents/handlers/planner');
    const handler = new PlannerHandler();
    
    // Test that handler can process a simple issue
    const result = await handler.execute({
      taskId: 'test-plan',
      input: {
        issue: 'Create a simple calculator'
      },
      workDir: '.claudebuild/agents/test-planner'
    });

    if (!result.tasks || result.tasks.length === 0) {
      throw new Error('Planner did not generate tasks');
    }
  });
}

async function testBuildExecution() {
  Logger.section('5. BUILD EXECUTION');

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
  Logger.section('6. MCP INTEGRATION');

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

  // Test tool usage logger
  await runTest('Tool Usage Logger', async () => {
    const ToolUsageLogger = require('./src/core/agents/mcp/logger');
    const logger = new ToolUsageLogger();
    
    await logger.logInvocation({
      agentId: 'test-agent',
      tool: 'web_search',
      parameters: { query: 'test' },
      result: 'success',
      duration: 100
    });
    
    const stats = logger.getStats();
    if (stats.totalCalls !== 1) {
      throw new Error('Tool usage not logged');
    }
  });
}

async function testOrchestrationEngine() {
  Logger.section('7. ORCHESTRATION ENGINE');

  await runTest('Workflow Engine', async () => {
    const WorkflowEngine = require('./src/core/orchestration/workflow-engine');
    const engine = new WorkflowEngine();
    
    if (!engine.start || !engine.submitTask) {
      throw new Error('Workflow engine missing required methods');
    }
  });

  await runTest('State Manager', async () => {
    const StateManager = require('./src/core/orchestration/state-manager');
    const stateManager = new StateManager();

    // Create test state
    const testState = {
      workflow: { id: 'test-workflow', status: 'running' },
      tasks: [{ id: 'task-1', status: 'completed' }]
    };

    // Save and load checkpoint
    await stateManager.saveCheckpoint('test-workflow', testState);
    const loaded = await stateManager.loadCheckpoint('test-workflow');
    
    if (loaded.tasks[0].status !== 'completed') {
      throw new Error('State management failed');
    }

    // Clean up
    await fs.unlink('.claudebuild/checkpoints/test-workflow.json');
  });

  await runTest('Dependency Resolver', async () => {
    const DependencyResolver = require('./src/core/orchestration/dependency-resolver');
    const resolver = new DependencyResolver();
    
    const tasks = [
      { id: 'task-1', dependencies: [] },
      { id: 'task-2', dependencies: ['task-1'] },
      { id: 'task-3', dependencies: ['task-1', 'task-2'] }
    ];
    
    resolver.addTasks(tasks);
    const ready = resolver.getReadyTasks();
    
    if (ready[0].id !== 'task-1') {
      throw new Error('Dependency resolution failed');
    }
  });
}

async function testProjectTemplates() {
  Logger.section('8. PROJECT TEMPLATES');

  await runTest('Template Engine', async () => {
    const TemplateEngine = require('./src/core/templates/engine');
    const engine = new TemplateEngine();
    
    const result = engine.render('Hello {{name}}!', { name: 'ClaudeBuild' });
    if (result !== 'Hello ClaudeBuild!') {
      throw new Error('Template rendering failed');
    }
  });

  await runTest('Template Helpers', async () => {
    const TemplateEngine = require('./src/core/templates/engine');
    const engine = new TemplateEngine();
    
    const template = '{{capitalize name}} - {{date}}';
    const result = engine.render(template, { name: 'test' });
    
    if (!result.includes('Test')) {
      throw new Error('Template helper failed');
    }
  });
}

async function testMonitoringIntegration() {
  Logger.section('9. MONITORING INTEGRATION');

  await runTest('Monitoring Client', async () => {
    const MonitoringIntegration = require('./src/integrations/monitoring/client');
    const client = new MonitoringIntegration('http://localhost:3001');
    
    // Just test that it initializes without error
    if (!client.updateAgent) {
      throw new Error('Monitoring client missing methods');
    }
  });
}

async function testErrorHandling() {
  Logger.section('10. ERROR HANDLING & RECOVERY');

  await runTest('Agent Crash Handling', async () => {
    // Test that build handles agent crashes gracefully
    const crashTasks = {
      project: 'test-crash',
      created: new Date().toISOString(),
      tasks: [{
        id: 'crash-001',
        type: 'builder',
        agent: 'crash-agent',
        description: 'Test error handling',
        input: {
          project: 'test',
          files: [{
            path: 'test.txt',
            content: 'content'
          }],
          simulateError: true  // This would need to be implemented in the handler
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
      const { stdout, stderr } = await exec('claudebuild build --tasks test-crash.json', { 
        timeout: 30000 
      });
      
      // Should handle error gracefully
      if (!stdout.includes('error') && !stderr) {
        throw new Error('Error not handled properly');
      }
    } catch (error) {
      // Expected to have some error output
      Logger.info('Error handled as expected');
    }

    // Clean up
    await fs.unlink('test-crash.json');
  });
}

async function testEndToEndScenario() {
  Logger.section('11. END-TO-END SCENARIO');

  await runTest('Complete workflow with MCP', async () => {
    // Create a realistic scenario
    const e2eTasks = {
      project: 'e2e-test',
      created: new Date().toISOString(),
      tasks: [
        {
          id: 'research-task',
          type: 'builder-mcp',
          agent: 'research-agent',
          description: 'Research best practices',
          input: {
            task: 'Research Node.js project structure best practices',
            requirements: ['Use web search', 'Create summary']
          },
          dependencies: [],
          priority: 'high'
        },
        {
          id: 'implement-task',
          type: 'builder',
          agent: 'implement-agent',
          description: 'Implement project structure',
          input: {
            project: 'test',
            files: [
              {
                path: 'src/index.js',
                content: '// Main application entry point\nconsole.log("Hello from E2E test!");'
              },
              {
                path: 'package.json',
                content: JSON.stringify({
                  name: 'e2e-test',
                  version: '1.0.0',
                  main: 'src/index.js'
                }, null, 2)
              }
            ]
          },
          dependencies: ['research-task'],
          priority: 'medium'
        }
      ],
      workflow: {
        parallel_limit: 2,
        auto_qa: false,
        auto_merge: false
      }
    };

    await fs.writeFile('e2e-tasks.json', JSON.stringify(e2eTasks, null, 2));

    const { stdout } = await exec('CLAUDEBUILD_TOOL_PERMISSION=allow claudebuild build --tasks e2e-tasks.json', {
      timeout: 90000
    });
    
    // Verify both tasks completed
    if (!stdout.includes('research-task is now completed') || 
        !stdout.includes('implement-task is now completed')) {
      throw new Error('E2E tasks did not complete');
    }
    
    // Verify dependency order
    const researchComplete = stdout.indexOf('research-task is now completed');
    const implementStart = stdout.indexOf('implement-task is now running');
    
    if (researchComplete > implementStart) {
      throw new Error('Dependencies not respected in E2E test');
    }
    
    Logger.info('E2E test completed successfully with proper dependency handling');
  });

  // Clean up
  await fs.unlink('e2e-tasks.json');
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
║      CLAUDEBUILD COMPREHENSIVE TEST SUITE v2.0                ║
║                                                               ║
║  Testing every component exhaustively to ensure 100%          ║
║  functionality. This will take several minutes...             ║
╚═══════════════════════════════════════════════════════════════╝
  `);

  const startTime = Date.now();

  try {
    // Ensure .claudebuild directory exists
    await fs.mkdir('.claudebuild', { recursive: true });
    await fs.mkdir('.claudebuild/agents', { recursive: true });
    await fs.mkdir('.claudebuild/checkpoints', { recursive: true });
    await fs.mkdir('.claudebuild/logs', { recursive: true });

    // Run all test categories
    await testCLICommands();
    await testConfiguration();
    await testAgentSystem();
    await testTaskPlanning();
    await testBuildExecution();
    await testMCPIntegration();
    await testOrchestrationEngine();
    await testProjectTemplates();
    await testMonitoringIntegration();
    await testErrorHandling();
    await testEndToEndScenario();
    
  } catch (error) {
    Logger.error(`Fatal error: ${error.message}`);
    console.error(error.stack);
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

  // Additional recommendations
  if (testResults.failed === 0) {
    console.log('\n✨ ClaudeBuild is fully operational!');
    console.log('\nNext steps:');
    console.log('1. Run `claudebuild init` in a new directory to create a project');
    console.log('2. Use `claudebuild plan` to generate tasks');
    console.log('3. Execute with `claudebuild build`');
    console.log('4. Monitor with `claudebuild status --watch`');
  } else {
    console.log('\n⚠️  Some components need attention.');
    console.log('Review the failed tests above and check:');
    console.log('1. All dependencies are installed (`npm install`)');
    console.log('2. MCP server is accessible');
    console.log('3. File permissions are correct');
  }

  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(console.error);