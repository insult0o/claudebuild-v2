/**
 * ClaudeBuild v2 - Atomic Level Command Systems Test Suite
 * Tests CLI commands, slash commands, workflow engine, and orchestration
 */

const { describe, it, expect, beforeEach, afterEach, jest } = require('@jest/globals');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Import command systems
const SlashCommandEngine = require('../../src/core/commands/slash-command-engine');
const WorkflowEngine = require('../../src/core/orchestration/workflow-engine');
const StateManager = require('../../src/core/orchestration/state-manager');
const DependencyResolver = require('../../src/core/orchestration/dependency-resolver');

// Import CLI commands
const BuildCommand = require('../../src/cli/commands/build');
const PlanCommand = require('../../src/cli/commands/plan');
const AgentCommand = require('../../src/cli/commands/agent');
const WorkflowCommand = require('../../src/cli/commands/workflow');
const ConfigCommand = require('../../src/cli/commands/config');

describe('Command Systems - Atomic Level Tests', () => {
  let tempDir;
  
  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'claudebuild-commands-test-'));
    process.env.CLAUDEBUILD_TEST_DIR = tempDir;
    process.env.CLAUDEBUILD_CONFIG_DIR = tempDir;
  });
  
  afterEach(() => {
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    delete process.env.CLAUDEBUILD_TEST_DIR;
    delete process.env.CLAUDEBUILD_CONFIG_DIR;
  });

  describe('Slash Command Engine', () => {
    let engine;
    
    beforeEach(() => {
      engine = new SlashCommandEngine();
    });

    it('should create slash command engine', () => {
      expect(engine).toBeDefined();
      expect(typeof engine.register).toBe('function');
      expect(typeof engine.execute).toBe('function');
      expect(typeof engine.list).toBe('function');
    });

    it('should register slash commands', () => {
      const testCommand = {
        name: 'hello',
        description: 'Says hello',
        execute: (args) => `Hello ${args.name || 'World'}!`
      };
      
      engine.register(testCommand);
      
      const commands = engine.list();
      expect(commands).toHaveLength(1);
      expect(commands[0].name).toBe('hello');
    });

    it('should execute registered commands', async () => {
      engine.register({
        name: 'add',
        execute: (args) => (args.a || 0) + (args.b || 0)
      });
      
      const result = await engine.execute('add', { a: 5, b: 3 });
      expect(result).toBe(8);
    });

    it('should handle command arguments', async () => {
      engine.register({
        name: 'greet',
        execute: (args) => `Hello ${args.name}! Age: ${args.age}`
      });
      
      const result = await engine.execute('greet', { 
        name: 'Alice', 
        age: 30 
      });
      
      expect(result).toBe('Hello Alice! Age: 30');
    });

    it('should validate command registration', () => {
      expect(() => {
        engine.register({ name: '' }); // Missing name
      }).toThrow('Command name is required');
      
      expect(() => {
        engine.register({ name: 'test' }); // Missing execute
      }).toThrow('Command execute function is required');
    });

    it('should handle unknown commands', async () => {
      try {
        await engine.execute('unknown-command');
      } catch (error) {
        expect(error.message).toContain('Command not found');
      }
    });

    it('should support command aliases', () => {
      engine.register({
        name: 'build',
        aliases: ['b', 'compile'],
        execute: () => 'Building...'
      });
      
      expect(engine.hasCommand('build')).toBe(true);
      expect(engine.hasCommand('b')).toBe(true);
      expect(engine.hasCommand('compile')).toBe(true);
    });

    it('should handle async commands', async () => {
      engine.register({
        name: 'async-task',
        execute: async (args) => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return `Async result: ${args.input}`;
        }
      });
      
      const result = await engine.execute('async-task', { input: 'test' });
      expect(result).toBe('Async result: test');
    });

    it('should provide command help', () => {
      engine.register({
        name: 'test-cmd',
        description: 'A test command',
        usage: 'test-cmd [options]',
        examples: ['test-cmd --verbose']
      });
      
      const help = engine.getHelp('test-cmd');
      expect(help).toContain('A test command');
      expect(help).toContain('test-cmd [options]');
      expect(help).toContain('test-cmd --verbose');
    });
  });

  describe('Workflow Engine', () => {
    let workflowEngine;
    
    beforeEach(() => {
      workflowEngine = new WorkflowEngine();
    });

    it('should create workflow engine', () => {
      expect(workflowEngine).toBeDefined();
      expect(typeof workflowEngine.createWorkflow).toBe('function');
      expect(typeof workflowEngine.executeWorkflow).toBe('function');
      expect(typeof workflowEngine.getStatus).toBe('function');
    });

    it('should create simple workflows', () => {
      const workflow = {
        id: 'test-workflow',
        name: 'Test Workflow',
        steps: [
          { id: 'step1', action: 'plan', agent: 'planner' },
          { id: 'step2', action: 'build', agent: 'builder', dependsOn: ['step1'] }
        ]
      };
      
      const workflowId = workflowEngine.createWorkflow(workflow);
      expect(workflowId).toBeDefined();
      
      const status = workflowEngine.getStatus(workflowId);
      expect(status.state).toBe('created');
      expect(status.steps).toHaveLength(2);
    });

    it('should execute workflow steps in order', async () => {
      const executedSteps = [];
      
      const workflow = {
        id: 'sequence-test',
        steps: [
          { 
            id: 'first', 
            action: 'test',
            execute: () => { executedSteps.push('first'); }
          },
          { 
            id: 'second', 
            action: 'test',
            dependsOn: ['first'],
            execute: () => { executedSteps.push('second'); }
          },
          { 
            id: 'third', 
            action: 'test',
            dependsOn: ['second'],
            execute: () => { executedSteps.push('third'); }
          }
        ]
      };
      
      const workflowId = workflowEngine.createWorkflow(workflow);
      await workflowEngine.executeWorkflow(workflowId);
      
      expect(executedSteps).toEqual(['first', 'second', 'third']);
    });

    it('should handle parallel execution', async () => {
      const startTimes = {};
      const endTimes = {};
      
      const workflow = {
        id: 'parallel-test',
        steps: [
          { 
            id: 'prep', 
            action: 'prepare',
            execute: async () => {
              startTimes.prep = Date.now();
              await new Promise(resolve => setTimeout(resolve, 10));
              endTimes.prep = Date.now();
            }
          },
          { 
            id: 'task1', 
            action: 'work',
            dependsOn: ['prep'],
            execute: async () => {
              startTimes.task1 = Date.now();
              await new Promise(resolve => setTimeout(resolve, 20));
              endTimes.task1 = Date.now();
            }
          },
          { 
            id: 'task2', 
            action: 'work',
            dependsOn: ['prep'],
            execute: async () => {
              startTimes.task2 = Date.now();
              await new Promise(resolve => setTimeout(resolve, 20));
              endTimes.task2 = Date.now();
            }
          }
        ]
      };
      
      const workflowId = workflowEngine.createWorkflow(workflow);
      await workflowEngine.executeWorkflow(workflowId);
      
      // task1 and task2 should start around the same time (after prep)
      const task1Start = startTimes.task1;
      const task2Start = startTimes.task2;
      const timeDiff = Math.abs(task1Start - task2Start);
      
      expect(timeDiff).toBeLessThan(10); // Should start within 10ms of each other
    });

    it('should handle workflow errors', async () => {
      const workflow = {
        id: 'error-test',
        steps: [
          { 
            id: 'failing-step', 
            action: 'fail',
            execute: () => { throw new Error('Step failed'); }
          },
          { 
            id: 'dependent-step', 
            action: 'work',
            dependsOn: ['failing-step'],
            execute: () => 'should not execute'
          }
        ]
      };
      
      const workflowId = workflowEngine.createWorkflow(workflow);
      
      try {
        await workflowEngine.executeWorkflow(workflowId);
      } catch (error) {
        expect(error.message).toContain('Step failed');
      }
      
      const status = workflowEngine.getStatus(workflowId);
      expect(status.state).toBe('failed');
    });

    it('should support conditional steps', async () => {
      let executedSteps = [];
      
      const workflow = {
        id: 'conditional-test',
        steps: [
          { 
            id: 'check', 
            action: 'condition',
            execute: () => ({ shouldContinue: true })
          },
          { 
            id: 'conditional-step', 
            action: 'work',
            dependsOn: ['check'],
            condition: (results) => results.check.shouldContinue,
            execute: () => { executedSteps.push('conditional'); }
          },
          { 
            id: 'always-step', 
            action: 'work',
            dependsOn: ['check'],
            execute: () => { executedSteps.push('always'); }
          }
        ]
      };
      
      const workflowId = workflowEngine.createWorkflow(workflow);
      await workflowEngine.executeWorkflow(workflowId);
      
      expect(executedSteps).toContain('conditional');
      expect(executedSteps).toContain('always');
    });

    it('should provide workflow progress tracking', async () => {
      const workflow = {
        id: 'progress-test',
        steps: [
          { id: 'step1', action: 'work', execute: async () => { 
            await new Promise(resolve => setTimeout(resolve, 10)); 
          }},
          { id: 'step2', action: 'work', dependsOn: ['step1'], execute: async () => { 
            await new Promise(resolve => setTimeout(resolve, 10)); 
          }},
          { id: 'step3', action: 'work', dependsOn: ['step2'], execute: async () => { 
            await new Promise(resolve => setTimeout(resolve, 10)); 
          }}
        ]
      };
      
      const workflowId = workflowEngine.createWorkflow(workflow);
      
      // Start workflow execution (don't await)
      const executionPromise = workflowEngine.executeWorkflow(workflowId);
      
      // Check progress during execution
      await new Promise(resolve => setTimeout(resolve, 15));
      
      const midStatus = workflowEngine.getStatus(workflowId);
      expect(['running', 'completed']).toContain(midStatus.state);
      
      await executionPromise;
      
      const finalStatus = workflowEngine.getStatus(workflowId);
      expect(finalStatus.state).toBe('completed');
      expect(finalStatus.progress.completed).toBe(3);
    });
  });

  describe('State Manager', () => {
    let stateManager;
    
    beforeEach(() => {
      stateManager = new StateManager();
    });

    it('should create state manager', () => {
      expect(stateManager).toBeDefined();
      expect(typeof stateManager.setState).toBe('function');
      expect(typeof stateManager.getState).toBe('function');
      expect(typeof stateManager.subscribe).toBe('function');
    });

    it('should manage application state', () => {
      stateManager.setState('user.name', 'Alice');
      stateManager.setState('user.age', 30);
      stateManager.setState('project.name', 'my-app');
      
      expect(stateManager.getState('user.name')).toBe('Alice');
      expect(stateManager.getState('user.age')).toBe(30);
      expect(stateManager.getState('project.name')).toBe('my-app');
    });

    it('should handle nested state paths', () => {
      stateManager.setState('app.settings.theme', 'dark');
      stateManager.setState('app.settings.debug', true);
      
      expect(stateManager.getState('app.settings.theme')).toBe('dark');
      expect(stateManager.getState('app.settings.debug')).toBe(true);
      expect(stateManager.getState('app.settings')).toEqual({
        theme: 'dark',
        debug: true
      });
    });

    it('should notify subscribers of state changes', () => {
      let notifications = [];
      
      stateManager.subscribe('counter', (value, oldValue) => {
        notifications.push({ value, oldValue });
      });
      
      stateManager.setState('counter', 1);
      stateManager.setState('counter', 2);
      stateManager.setState('counter', 3);
      
      expect(notifications).toHaveLength(3);
      expect(notifications[0]).toEqual({ value: 1, oldValue: undefined });
      expect(notifications[1]).toEqual({ value: 2, oldValue: 1 });
      expect(notifications[2]).toEqual({ value: 3, oldValue: 2 });
    });

    it('should support wildcard subscriptions', () => {
      let userChanges = [];
      
      stateManager.subscribe('user.*', (value, oldValue, path) => {
        userChanges.push({ path, value, oldValue });
      });
      
      stateManager.setState('user.name', 'Bob');
      stateManager.setState('user.email', 'bob@example.com');
      stateManager.setState('other.data', 'should not trigger');
      
      expect(userChanges).toHaveLength(2);
      expect(userChanges[0].path).toBe('user.name');
      expect(userChanges[1].path).toBe('user.email');
    });

    it('should persist state to storage', async () => {
      const storageFile = path.join(tempDir, 'state.json');
      const persistentState = new StateManager({ 
        persistence: { file: storageFile } 
      });
      
      persistentState.setState('persistent.data', 'test-value');
      persistentState.setState('persistent.number', 42);
      
      await persistentState.save();
      
      expect(fs.existsSync(storageFile)).toBe(true);
      
      // Load in new instance
      const newStateManager = new StateManager({ 
        persistence: { file: storageFile } 
      });
      
      await newStateManager.load();
      
      expect(newStateManager.getState('persistent.data')).toBe('test-value');
      expect(newStateManager.getState('persistent.number')).toBe(42);
    });

    it('should handle state transactions', () => {
      let changeCount = 0;
      
      stateManager.subscribe('*', () => changeCount++);
      
      stateManager.transaction(() => {
        stateManager.setState('batch.item1', 'value1');
        stateManager.setState('batch.item2', 'value2');
        stateManager.setState('batch.item3', 'value3');
      });
      
      // Should only trigger one change notification for the entire transaction
      expect(changeCount).toBe(1);
      expect(stateManager.getState('batch')).toEqual({
        item1: 'value1',
        item2: 'value2',
        item3: 'value3'
      });
    });
  });

  describe('Dependency Resolver', () => {
    let resolver;
    
    beforeEach(() => {
      resolver = new DependencyResolver();
    });

    it('should create dependency resolver', () => {
      expect(resolver).toBeDefined();
      expect(typeof resolver.addDependency).toBe('function');
      expect(typeof resolver.resolve).toBe('function');
      expect(typeof resolver.hasCycles).toBe('function');
    });

    it('should resolve simple dependencies', () => {
      resolver.addDependency('B', 'A'); // B depends on A
      resolver.addDependency('C', 'B'); // C depends on B
      
      const order = resolver.resolve();
      expect(order.indexOf('A')).toBeLessThan(order.indexOf('B'));
      expect(order.indexOf('B')).toBeLessThan(order.indexOf('C'));
    });

    it('should handle complex dependency graphs', () => {
      // A complex dependency graph:
      // D depends on B, C
      // B depends on A
      // C depends on A
      // E depends on D
      
      resolver.addDependency('B', 'A');
      resolver.addDependency('C', 'A');
      resolver.addDependency('D', 'B');
      resolver.addDependency('D', 'C');
      resolver.addDependency('E', 'D');
      
      const order = resolver.resolve();
      
      expect(order.indexOf('A')).toBeLessThan(order.indexOf('B'));
      expect(order.indexOf('A')).toBeLessThan(order.indexOf('C'));
      expect(order.indexOf('B')).toBeLessThan(order.indexOf('D'));
      expect(order.indexOf('C')).toBeLessThan(order.indexOf('D'));
      expect(order.indexOf('D')).toBeLessThan(order.indexOf('E'));
    });

    it('should detect circular dependencies', () => {
      resolver.addDependency('A', 'B');
      resolver.addDependency('B', 'C');
      resolver.addDependency('C', 'A'); // Creates a cycle
      
      expect(resolver.hasCycles()).toBe(true);
      
      expect(() => {
        resolver.resolve();
      }).toThrow('Circular dependency detected');
    });

    it('should handle self-dependencies', () => {
      expect(() => {
        resolver.addDependency('A', 'A'); // Self-dependency
      }).toThrow('Self-dependency not allowed');
    });

    it('should support conditional dependencies', () => {
      resolver.addDependency('B', 'A');
      resolver.addConditionalDependency('C', 'B', (context) => context.buildType === 'production');
      
      const devOrder = resolver.resolve({ buildType: 'development' });
      expect(devOrder).not.toContain('C');
      
      const prodOrder = resolver.resolve({ buildType: 'production' });
      expect(prodOrder).toContain('C');
      expect(prodOrder.indexOf('B')).toBeLessThan(prodOrder.indexOf('C'));
    });

    it('should provide dependency analysis', () => {
      resolver.addDependency('B', 'A');
      resolver.addDependency('C', 'A');
      resolver.addDependency('D', 'B');
      resolver.addDependency('D', 'C');
      
      const analysis = resolver.analyze();
      
      expect(analysis.nodes).toContain('A');
      expect(analysis.nodes).toContain('B');
      expect(analysis.nodes).toContain('C');
      expect(analysis.nodes).toContain('D');
      
      expect(analysis.dependencies['B']).toContain('A');
      expect(analysis.dependencies['D']).toContain('B');
      expect(analysis.dependencies['D']).toContain('C');
      
      expect(analysis.dependents['A']).toContain('B');
      expect(analysis.dependents['A']).toContain('C');
    });
  });

  describe('CLI Commands Integration', () => {
    let mockContext;
    
    beforeEach(() => {
      mockContext = {
        config: {
          get: jest.fn(),
          set: jest.fn(),
          save: jest.fn()
        },
        logger: {
          info: jest.fn(),
          error: jest.fn(),
          debug: jest.fn()
        },
        agentManager: {
          createAgent: jest.fn(),
          startAgent: jest.fn(),
          stopAgent: jest.fn()
        },
        workflowEngine: {
          createWorkflow: jest.fn(),
          executeWorkflow: jest.fn()
        }
      };
    });

    describe('Build Command', () => {
      let buildCommand;
      
      beforeEach(() => {
        buildCommand = new BuildCommand(mockContext);
      });

      it('should execute build command', async () => {
        mockContext.workflowEngine.createWorkflow.mockReturnValue('workflow-1');
        mockContext.workflowEngine.executeWorkflow.mockResolvedValue({
          status: 'completed',
          artifacts: ['build/app.js', 'build/app.css']
        });
        
        const result = await buildCommand.execute({
          target: 'production',
          watch: false
        });
        
        expect(result.status).toBe('completed');
        expect(mockContext.workflowEngine.createWorkflow).toHaveBeenCalled();
        expect(mockContext.workflowEngine.executeWorkflow).toHaveBeenCalledWith('workflow-1');
      });

      it('should handle build errors', async () => {
        mockContext.workflowEngine.executeWorkflow.mockRejectedValue(
          new Error('Build failed')
        );
        
        try {
          await buildCommand.execute({ target: 'production' });
        } catch (error) {
          expect(error.message).toBe('Build failed');
          expect(mockContext.logger.error).toHaveBeenCalled();
        }
      });
    });

    describe('Plan Command', () => {
      let planCommand;
      
      beforeEach(() => {
        planCommand = new PlanCommand(mockContext);
      });

      it('should create execution plan', async () => {
        mockContext.agentManager.createAgent.mockResolvedValue({
          id: 'planner-1',
          name: 'planner'
        });
        
        const result = await planCommand.execute({
          feature: 'user-authentication',
          agents: ['planner', 'architect']
        });
        
        expect(result.plan).toBeDefined();
        expect(result.agents).toContain('planner-1');
        expect(mockContext.agentManager.createAgent).toHaveBeenCalled();
      });
    });

    describe('Agent Command', () => {
      let agentCommand;
      
      beforeEach(() => {
        agentCommand = new AgentCommand(mockContext);
      });

      it('should list agents', async () => {
        const result = await agentCommand.execute({ action: 'list' });
        expect(typeof result.agents).toBe('object');
      });

      it('should start specific agent', async () => {
        await agentCommand.execute({ 
          action: 'start', 
          agent: 'builder-1' 
        });
        
        expect(mockContext.agentManager.startAgent).toHaveBeenCalledWith('builder-1');
      });

      it('should stop specific agent', async () => {
        await agentCommand.execute({ 
          action: 'stop', 
          agent: 'builder-1' 
        });
        
        expect(mockContext.agentManager.stopAgent).toHaveBeenCalledWith('builder-1');
      });
    });
  });

  describe('Command System Integration', () => {
    let system;
    
    beforeEach(() => {
      system = {
        slashEngine: new SlashCommandEngine(),
        workflowEngine: new WorkflowEngine(),
        stateManager: new StateManager(),
        dependencyResolver: new DependencyResolver()
      };
    });

    it('should integrate slash commands with workflows', async () => {
      // Register slash command that creates workflow
      system.slashEngine.register({
        name: 'deploy',
        execute: async (args) => {
          const workflow = {
            id: 'deploy-workflow',
            steps: [
              { id: 'build', action: 'build' },
              { id: 'test', action: 'test', dependsOn: ['build'] },
              { id: 'deploy', action: 'deploy', dependsOn: ['test'] }
            ]
          };
          
          const workflowId = system.workflowEngine.createWorkflow(workflow);
          return await system.workflowEngine.executeWorkflow(workflowId);
        }
      });
      
      const result = await system.slashEngine.execute('deploy', { 
        environment: 'production' 
      });
      
      expect(result).toBeDefined();
    });

    it('should manage state across command executions', async () => {
      system.slashEngine.register({
        name: 'set-env',
        execute: (args) => {
          system.stateManager.setState('environment', args.env);
          return `Environment set to ${args.env}`;
        }
      });
      
      system.slashEngine.register({
        name: 'get-env',
        execute: () => {
          return system.stateManager.getState('environment') || 'not set';
        }
      });
      
      await system.slashEngine.execute('set-env', { env: 'staging' });
      const result = await system.slashEngine.execute('get-env');
      
      expect(result).toBe('staging');
    });

    it('should coordinate complex multi-command workflows', async () => {
      const executionLog = [];
      
      // Register multiple coordinated commands
      ['prepare', 'analyze', 'generate', 'validate'].forEach(action => {
        system.slashEngine.register({
          name: action,
          execute: async (args) => {
            executionLog.push(action);
            system.stateManager.setState(`status.${action}`, 'completed');
            return `${action} completed`;
          }
        });
      });
      
      // Create workflow that uses these commands
      const workflow = {
        id: 'multi-command-workflow',
        steps: [
          { id: 'step1', action: 'prepare' },
          { id: 'step2', action: 'analyze', dependsOn: ['step1'] },
          { id: 'step3', action: 'generate', dependsOn: ['step2'] },
          { id: 'step4', action: 'validate', dependsOn: ['step3'] }
        ].map(step => ({
          ...step,
          execute: () => system.slashEngine.execute(step.action)
        }))
      };
      
      const workflowId = system.workflowEngine.createWorkflow(workflow);
      await system.workflowEngine.executeWorkflow(workflowId);
      
      expect(executionLog).toEqual(['prepare', 'analyze', 'generate', 'validate']);
      expect(system.stateManager.getState('status.validate')).toBe('completed');
    });
  });
});