/**
 * ClaudeBuild v2 - Atomic Level Agent Subsystems Test Suite
 * Tests agent core functionality, message bus, registry, and MCP integration
 */

const { describe, it, expect, beforeEach, afterEach, jest } = require('@jest/globals');
const fs = require('fs');
const path = require('path');
const os = require('os');
const EventEmitter = require('events');

// Import agent subsystems
const AgentRegistry = require('../../src/core/agents/registry');
const MessageBus = require('../../src/core/agents/message-bus');
const AgentManager = require('../../src/core/agents/manager');
const AgentProcess = require('../../src/core/agents/process');
const MCPClient = require('../../src/core/agents/mcp/client');
const MCPLogger = require('../../src/core/agents/mcp/logger');

describe('Agent Subsystems - Atomic Level Tests', () => {
  let tempDir;
  
  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'claudebuild-agents-test-'));
    process.env.CLAUDEBUILD_TEST_DIR = tempDir;
  });
  
  afterEach(() => {
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    delete process.env.CLAUDEBUILD_TEST_DIR;
  });

  describe('Agent Registry', () => {
    let registry;
    
    beforeEach(() => {
      registry = new AgentRegistry();
    });

    it('should create empty registry', () => {
      expect(registry).toBeDefined();
      expect(registry.size).toBe(0);
      expect(registry.getAllAgents()).toEqual([]);
    });

    it('should register agents', () => {
      const agent = {
        id: 'test-agent-1',
        name: 'planner',
        role: 'planning',
        status: 'idle',
        config: {}
      };
      
      registry.register(agent);
      
      expect(registry.size).toBe(1);
      expect(registry.has('test-agent-1')).toBe(true);
      expect(registry.get('test-agent-1')).toEqual(agent);
    });

    it('should prevent duplicate registration', () => {
      const agent1 = { id: 'duplicate', name: 'planner' };
      const agent2 = { id: 'duplicate', name: 'builder' };
      
      registry.register(agent1);
      expect(() => registry.register(agent2)).toThrow('Agent with ID duplicate already registered');
    });

    it('should unregister agents', () => {
      const agent = { id: 'temp-agent', name: 'temp' };
      
      registry.register(agent);
      expect(registry.has('temp-agent')).toBe(true);
      
      registry.unregister('temp-agent');
      expect(registry.has('temp-agent')).toBe(false);
      expect(registry.size).toBe(0);
    });

    it('should find agents by role', () => {
      const planner = { id: 'p1', name: 'planner1', role: 'planning' };
      const builder = { id: 'b1', name: 'builder1', role: 'building' };
      const planner2 = { id: 'p2', name: 'planner2', role: 'planning' };
      
      registry.register(planner);
      registry.register(builder);
      registry.register(planner2);
      
      const planners = registry.findByRole('planning');
      expect(planners).toHaveLength(2);
      expect(planners.map(a => a.id)).toContain('p1');
      expect(planners.map(a => a.id)).toContain('p2');
    });

    it('should find agents by status', () => {
      const running = { id: 'r1', name: 'runner', status: 'running' };
      const idle = { id: 'i1', name: 'idler', status: 'idle' };
      const running2 = { id: 'r2', name: 'runner2', status: 'running' };
      
      registry.register(running);
      registry.register(idle);
      registry.register(running2);
      
      const runningAgents = registry.findByStatus('running');
      expect(runningAgents).toHaveLength(2);
      expect(runningAgents.map(a => a.id)).toContain('r1');
      expect(runningAgents.map(a => a.id)).toContain('r2');
    });

    it('should update agent status', () => {
      const agent = { id: 'status-test', name: 'test', status: 'idle' };
      registry.register(agent);
      
      registry.updateStatus('status-test', 'running');
      expect(registry.get('status-test').status).toBe('running');
      
      registry.updateStatus('status-test', 'completed');
      expect(registry.get('status-test').status).toBe('completed');
    });

    it('should handle metadata updates', () => {
      const agent = { id: 'meta-test', name: 'test', metadata: {} };
      registry.register(agent);
      
      registry.updateMetadata('meta-test', { 
        startTime: Date.now(),
        tasks: ['task1', 'task2'],
        progress: 50
      });
      
      const updated = registry.get('meta-test');
      expect(updated.metadata.startTime).toBeDefined();
      expect(updated.metadata.tasks).toEqual(['task1', 'task2']);
      expect(updated.metadata.progress).toBe(50);
    });
  });

  describe('Message Bus', () => {
    let messageBus;
    
    beforeEach(() => {
      messageBus = new MessageBus();
    });

    it('should create message bus instance', () => {
      expect(messageBus).toBeDefined();
      expect(typeof messageBus.publish).toBe('function');
      expect(typeof messageBus.subscribe).toBe('function');
      expect(typeof messageBus.unsubscribe).toBe('function');
    });

    it('should publish and receive messages', (done) => {
      const testMessage = {
        type: 'test-message',
        from: 'test-sender',
        to: 'test-receiver',
        data: { key: 'value' }
      };
      
      messageBus.subscribe('test-message', (message) => {
        expect(message).toEqual(testMessage);
        done();
      });
      
      messageBus.publish(testMessage);
    });

    it('should handle multiple subscribers', () => {
      let received1 = false;
      let received2 = false;
      
      messageBus.subscribe('multi-test', () => { received1 = true; });
      messageBus.subscribe('multi-test', () => { received2 = true; });
      
      messageBus.publish({ type: 'multi-test', data: 'test' });
      
      expect(received1).toBe(true);
      expect(received2).toBe(true);
    });

    it('should unsubscribe correctly', () => {
      let callCount = 0;
      const handler = () => { callCount++; };
      
      messageBus.subscribe('unsub-test', handler);
      messageBus.publish({ type: 'unsub-test' });
      expect(callCount).toBe(1);
      
      messageBus.unsubscribe('unsub-test', handler);
      messageBus.publish({ type: 'unsub-test' });
      expect(callCount).toBe(1); // Should not increment
    });

    it('should handle message queuing when no subscribers', () => {
      messageBus.publish({ type: 'queued-message', data: 'test' });
      
      let receivedMessage = null;
      messageBus.subscribe('queued-message', (msg) => {
        receivedMessage = msg;
      });
      
      // Should receive queued message
      expect(receivedMessage).toBeDefined();
      expect(receivedMessage.data).toBe('test');
    });

    it('should validate message format', () => {
      expect(() => {
        messageBus.publish({ invalid: 'message' }); // missing type
      }).toThrow('Message must have a type');
      
      expect(() => {
        messageBus.publish('not an object');
      }).toThrow('Message must be an object');
    });

    it('should handle wildccard subscriptions', () => {
      let receivedMessages = [];
      
      messageBus.subscribe('agent.*', (msg) => {
        receivedMessages.push(msg);
      });
      
      messageBus.publish({ type: 'agent.started', data: 'start' });
      messageBus.publish({ type: 'agent.completed', data: 'complete' });
      messageBus.publish({ type: 'system.error', data: 'error' });
      
      expect(receivedMessages).toHaveLength(2);
      expect(receivedMessages[0].data).toBe('start');
      expect(receivedMessages[1].data).toBe('complete');
    });
  });

  describe('Agent Process', () => {
    let agentProcess;
    
    beforeEach(() => {
      agentProcess = new AgentProcess({
        id: 'test-process',
        name: 'test-agent',
        command: 'echo',
        args: ['hello', 'world']
      });
    });

    it('should create agent process', () => {
      expect(agentProcess).toBeDefined();
      expect(agentProcess.id).toBe('test-process');
      expect(agentProcess.name).toBe('test-agent');
      expect(agentProcess.status).toBe('idle');
    });

    it('should start process', async () => {
      await agentProcess.start();
      expect(agentProcess.status).toBe('running');
      expect(agentProcess.pid).toBeDefined();
    });

    it('should capture output', async () => {
      const output = await agentProcess.run();
      expect(output.stdout).toContain('hello world');
      expect(output.stderr).toBe('');
      expect(output.exitCode).toBe(0);
    });

    it('should handle process errors', async () => {
      const errorProcess = new AgentProcess({
        id: 'error-test',
        command: 'nonexistent-command'
      });
      
      try {
        await errorProcess.start();
      } catch (error) {
        expect(error.code).toBe('ENOENT');
      }
    });

    it('should stop process', async () => {
      await agentProcess.start();
      expect(agentProcess.status).toBe('running');
      
      await agentProcess.stop();
      expect(agentProcess.status).toBe('stopped');
    });

    it('should handle timeouts', async () => {
      const longProcess = new AgentProcess({
        id: 'timeout-test',
        command: 'sleep',
        args: ['10'],
        timeout: 100 // 100ms timeout
      });
      
      const start = Date.now();
      try {
        await longProcess.run();
      } catch (error) {
        expect(error.code).toBe('TIMEOUT');
        expect(Date.now() - start).toBeLessThan(200);
      }
    });

    it('should monitor resource usage', async () => {
      await agentProcess.start();
      
      const stats = await agentProcess.getStats();
      expect(stats).toHaveProperty('memory');
      expect(stats).toHaveProperty('cpu');
      expect(stats).toHaveProperty('uptime');
    });
  });

  describe('Agent Manager', () => {
    let manager;
    let registry;
    let messageBus;
    
    beforeEach(() => {
      registry = new AgentRegistry();
      messageBus = new MessageBus();
      manager = new AgentManager({ registry, messageBus });
    });

    it('should create agent manager', () => {
      expect(manager).toBeDefined();
      expect(typeof manager.createAgent).toBe('function');
      expect(typeof manager.startAgent).toBe('function');
      expect(typeof manager.stopAgent).toBe('function');
    });

    it('should create and register agents', async () => {
      const agentConfig = {
        name: 'planner',
        role: 'planning',
        type: 'claude-code',
        config: { model: 'claude-3-sonnet' }
      };
      
      const agent = await manager.createAgent(agentConfig);
      
      expect(agent).toBeDefined();
      expect(agent.id).toBeDefined();
      expect(registry.has(agent.id)).toBe(true);
      expect(registry.get(agent.id).name).toBe('planner');
    });

    it('should start agents', async () => {
      const agent = await manager.createAgent({
        name: 'test-agent',
        role: 'testing'
      });
      
      await manager.startAgent(agent.id);
      
      const registeredAgent = registry.get(agent.id);
      expect(registeredAgent.status).toBe('running');
    });

    it('should stop agents', async () => {
      const agent = await manager.createAgent({
        name: 'stop-test',
        role: 'testing'
      });
      
      await manager.startAgent(agent.id);
      expect(registry.get(agent.id).status).toBe('running');
      
      await manager.stopAgent(agent.id);
      expect(registry.get(agent.id).status).toBe('stopped');
    });

    it('should handle agent lifecycle events', async () => {
      let events = [];
      
      messageBus.subscribe('agent.*', (msg) => {
        events.push(msg.type);
      });
      
      const agent = await manager.createAgent({
        name: 'lifecycle-test',
        role: 'testing'
      });
      
      await manager.startAgent(agent.id);
      await manager.stopAgent(agent.id);
      
      expect(events).toContain('agent.created');
      expect(events).toContain('agent.started');
      expect(events).toContain('agent.stopped');
    });

    it('should monitor agent health', async () => {
      const agent = await manager.createAgent({
        name: 'health-test',
        role: 'testing'
      });
      
      await manager.startAgent(agent.id);
      
      const health = await manager.checkHealth(agent.id);
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('uptime');
      expect(health).toHaveProperty('lastActivity');
    });

    it('should handle agent failures', async () => {
      const agent = await manager.createAgent({
        name: 'failure-test',
        role: 'testing',
        config: { autoRestart: true }
      });
      
      // Simulate agent failure
      await manager.startAgent(agent.id);
      manager.simulateFailure(agent.id);
      
      // Wait for auto-restart
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const status = registry.get(agent.id).status;
      expect(['running', 'restarting']).toContain(status);
    });
  });

  describe('MCP Client', () => {
    let mcpClient;
    
    beforeEach(() => {
      mcpClient = new MCPClient({
        serverUrl: 'http://localhost:3000',
        timeout: 5000
      });
    });

    it('should create MCP client', () => {
      expect(mcpClient).toBeDefined();
      expect(typeof mcpClient.connect).toBe('function');
      expect(typeof mcpClient.sendMessage).toBe('function');
      expect(typeof mcpClient.disconnect).toBe('function');
    });

    it('should handle connection lifecycle', async () => {
      // Mock server for testing
      const mockServer = {
        on: jest.fn(),
        send: jest.fn(),
        close: jest.fn()
      };
      
      mcpClient.mockConnection(mockServer);
      
      await mcpClient.connect();
      expect(mcpClient.isConnected).toBe(true);
      
      await mcpClient.disconnect();
      expect(mcpClient.isConnected).toBe(false);
    });

    it('should send and receive messages', async () => {
      const mockServer = {
        on: jest.fn(),
        send: jest.fn(),
        close: jest.fn()
      };
      
      mcpClient.mockConnection(mockServer);
      await mcpClient.connect();
      
      const message = {
        type: 'tool_call',
        tool: 'read_file',
        args: { path: '/test/file.txt' }
      };
      
      await mcpClient.sendMessage(message);
      expect(mockServer.send).toHaveBeenCalledWith(JSON.stringify(message));
    });

    it('should handle connection errors', async () => {
      mcpClient.serverUrl = 'http://invalid-url:9999';
      
      try {
        await mcpClient.connect();
      } catch (error) {
        expect(error.code).toBe('ECONNREFUSED');
      }
    });

    it('should implement keep-alive mechanism', async () => {
      const mockServer = {
        on: jest.fn(),
        send: jest.fn(),
        close: jest.fn()
      };
      
      mcpClient.mockConnection(mockServer);
      mcpClient.keepAliveInterval = 50; // 50ms for testing
      
      await mcpClient.connect();
      
      // Wait for at least one keep-alive
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockServer.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'ping' })
      );
    });

    it('should queue messages when disconnected', async () => {
      const message = { type: 'test', data: 'queued' };
      
      // Send while disconnected
      mcpClient.sendMessage(message);
      
      expect(mcpClient.messageQueue).toHaveLength(1);
      expect(mcpClient.messageQueue[0]).toEqual(message);
    });
  });

  describe('MCP Logger', () => {
    let mcpLogger;
    let logOutput = [];
    
    beforeEach(() => {
      logOutput = [];
      mcpLogger = new MCPLogger({
        level: 'debug',
        format: 'json',
        output: (log) => logOutput.push(log)
      });
    });

    it('should create MCP logger', () => {
      expect(mcpLogger).toBeDefined();
      expect(typeof mcpLogger.logToolCall).toBe('function');
      expect(typeof mcpLogger.logResponse).toBe('function');
      expect(typeof mcpLogger.logError).toBe('function');
    });

    it('should log tool calls', () => {
      mcpLogger.logToolCall('read_file', { path: '/test.txt' }, 'agent-1');
      
      expect(logOutput).toHaveLength(1);
      const log = JSON.parse(logOutput[0]);
      expect(log.type).toBe('tool_call');
      expect(log.tool).toBe('read_file');
      expect(log.args.path).toBe('/test.txt');
      expect(log.agent).toBe('agent-1');
    });

    it('should log responses', () => {
      mcpLogger.logResponse('read_file', { content: 'file content' }, 200);
      
      expect(logOutput).toHaveLength(1);
      const log = JSON.parse(logOutput[0]);
      expect(log.type).toBe('tool_response');
      expect(log.tool).toBe('read_file');
      expect(log.response.content).toBe('file content');
      expect(log.status).toBe(200);
    });

    it('should log errors with context', () => {
      mcpLogger.logError(new Error('Connection failed'), {
        tool: 'write_file',
        agent: 'builder-1',
        attempt: 3
      });
      
      expect(logOutput).toHaveLength(1);
      const log = JSON.parse(logOutput[0]);
      expect(log.type).toBe('error');
      expect(log.error.message).toBe('Connection failed');
      expect(log.context.tool).toBe('write_file');
      expect(log.context.attempt).toBe(3);
    });

    it('should handle structured logging', () => {
      mcpLogger.info('Agent started', {
        agent: 'planner-1',
        config: { model: 'claude-3-sonnet' },
        timestamp: Date.now()
      });
      
      const log = JSON.parse(logOutput[0]);
      expect(log.level).toBe('info');
      expect(log.message).toBe('Agent started');
      expect(log.agent).toBe('planner-1');
      expect(log.config.model).toBe('claude-3-sonnet');
    });

    it('should filter by log level', () => {
      const errorLogger = new MCPLogger({
        level: 'error',
        output: (log) => logOutput.push(log)
      });
      
      errorLogger.debug('Debug message');
      errorLogger.info('Info message');
      errorLogger.warn('Warning message');
      errorLogger.error('Error message');
      
      expect(logOutput).toHaveLength(1);
      const log = JSON.parse(logOutput[0]);
      expect(log.level).toBe('error');
    });
  });

  describe('Agent Integration Tests', () => {
    let system;
    
    beforeEach(() => {
      system = {
        registry: new AgentRegistry(),
        messageBus: new MessageBus(),
        manager: null
      };
      
      system.manager = new AgentManager({
        registry: system.registry,
        messageBus: system.messageBus
      });
    });

    it('should handle agent communication', async () => {
      const messages = [];
      
      system.messageBus.subscribe('agent.message', (msg) => {
        messages.push(msg);
      });
      
      const planner = await system.manager.createAgent({
        name: 'planner',
        role: 'planning'
      });
      
      const builder = await system.manager.createAgent({
        name: 'builder',
        role: 'building'
      });
      
      // Simulate planner sending task to builder
      system.messageBus.publish({
        type: 'agent.message',
        from: planner.id,
        to: builder.id,
        data: {
          task: 'build_feature',
          spec: { name: 'user-auth' }
        }
      });
      
      expect(messages).toHaveLength(1);
      expect(messages[0].from).toBe(planner.id);
      expect(messages[0].to).toBe(builder.id);
      expect(messages[0].data.task).toBe('build_feature');
    });

    it('should handle agent coordination', async () => {
      const agents = [];
      
      // Create multiple agents
      for (let i = 0; i < 3; i++) {
        const agent = await system.manager.createAgent({
          name: `worker-${i}`,
          role: 'worker'
        });
        agents.push(agent);
        await system.manager.startAgent(agent.id);
      }
      
      // Check all agents are registered and running
      expect(system.registry.size).toBe(3);
      const runningAgents = system.registry.findByStatus('running');
      expect(runningAgents).toHaveLength(3);
    });

    it('should handle agent failures and recovery', async () => {
      const agent = await system.manager.createAgent({
        name: 'fragile-agent',
        role: 'testing',
        config: { autoRestart: true, maxRestarts: 2 }
      });
      
      await system.manager.startAgent(agent.id);
      
      // Simulate multiple failures
      system.manager.simulateFailure(agent.id);
      await new Promise(resolve => setTimeout(resolve, 50));
      
      system.manager.simulateFailure(agent.id);
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Should still be attempting recovery
      const agentState = system.registry.get(agent.id);
      expect(['running', 'restarting', 'failed']).toContain(agentState.status);
      expect(agentState.metadata.restartCount).toBeLessThanOrEqual(2);
    });
  });
});