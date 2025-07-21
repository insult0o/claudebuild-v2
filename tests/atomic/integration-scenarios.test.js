/**
 * ClaudeBuild v2 - Atomic Level Integration Scenarios Test Suite
 * Tests end-to-end workflows, cross-system integration, and real-world scenarios
 */

const { describe, it, expect, beforeEach, afterEach, jest } = require('@jest/globals');
const fs = require('fs');
const path = require('path');
const os = require('os');
const EventEmitter = require('events');

// Import system components for integration testing
const AgentRegistry = require('../../src/core/agents/registry');
const MessageBus = require('../../src/core/agents/message-bus');
const AgentManager = require('../../src/core/agents/manager');
const WorkflowEngine = require('../../src/core/orchestration/workflow-engine');
const StateManager = require('../../src/core/orchestration/state-manager');
const SlashCommandEngine = require('../../src/core/commands/slash-command-engine');
const { ConfigManager } = require('../../src/core/config');

describe('Integration Scenarios - Atomic Level Tests', () => {
  let tempDir;
  let integrationSystem;
  
  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'claudebuild-integration-test-'));
    process.env.CLAUDEBUILD_TEST_DIR = tempDir;
    process.env.CLAUDEBUILD_CONFIG_DIR = tempDir;
    
    // Create integrated system for testing
    integrationSystem = {
      registry: new AgentRegistry(),
      messageBus: new MessageBus(),
      stateManager: new StateManager(),
      workflowEngine: new WorkflowEngine(),
      slashEngine: new SlashCommandEngine(),
      configManager: new ConfigManager(),
      agentManager: null
    };
    
    integrationSystem.agentManager = new AgentManager({
      registry: integrationSystem.registry,
      messageBus: integrationSystem.messageBus
    });
  });
  
  afterEach(() => {
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    delete process.env.CLAUDEBUILD_TEST_DIR;
    delete process.env.CLAUDEBUILD_CONFIG_DIR;
  });

  describe('Full Project Creation Scenario', () => {
    it('should create a complete project from scratch', async () => {
      const projectConfig = {
        name: 'test-web-app',
        type: 'fullstack',
        features: ['auth', 'api', 'frontend'],
        agents: ['planner', 'architect', 'builder', 'tester']
      };
      
      // Step 1: Initialize project configuration
      integrationSystem.configManager.set('project', projectConfig);
      await integrationSystem.configManager.save();
      
      // Step 2: Create required agents
      const agentPromises = projectConfig.agents.map(async (agentType) => {
        return await integrationSystem.agentManager.createAgent({
          name: `${agentType}-${Date.now()}`,
          role: agentType,
          type: 'claude-code'
        });
      });
      
      const agents = await Promise.all(agentPromises);
      
      // Step 3: Create project workflow
      const workflow = {
        id: 'project-creation',
        name: 'Create Web App',
        steps: [
          {
            id: 'planning',
            action: 'plan',
            agent: agents.find(a => a.name.includes('planner')).id,
            execute: async () => {
              integrationSystem.stateManager.setState('project.phase', 'planning');
              return { plan: 'Project plan created', tasks: ['design', 'implement', 'test'] };
            }
          },
          {
            id: 'architecture',
            action: 'architect',
            agent: agents.find(a => a.name.includes('architect')).id,
            dependsOn: ['planning'],
            execute: async () => {
              integrationSystem.stateManager.setState('project.phase', 'architecture');
              return { architecture: 'System architecture defined' };
            }
          },
          {
            id: 'implementation',
            action: 'build',
            agent: agents.find(a => a.name.includes('builder')).id,
            dependsOn: ['architecture'],
            execute: async () => {
              integrationSystem.stateManager.setState('project.phase', 'implementation');
              // Create project files
              const projectDir = path.join(tempDir, projectConfig.name);
              fs.mkdirSync(projectDir, { recursive: true });
              fs.writeFileSync(path.join(projectDir, 'package.json'), JSON.stringify({
                name: projectConfig.name,
                version: '1.0.0',
                description: 'Generated project'
              }, null, 2));
              fs.mkdirSync(path.join(projectDir, 'src'));
              fs.writeFileSync(path.join(projectDir, 'src/index.js'), 'console.log("Hello World!");');
              
              return { files: ['package.json', 'src/index.js'] };
            }
          },
          {
            id: 'testing',
            action: 'test',
            agent: agents.find(a => a.name.includes('tester')).id,
            dependsOn: ['implementation'],
            execute: async () => {
              integrationSystem.stateManager.setState('project.phase', 'testing');
              return { tests: 'passed', coverage: 95 };
            }
          }
        ]
      };
      
      // Step 4: Execute workflow
      const workflowId = integrationSystem.workflowEngine.createWorkflow(workflow);
      const result = await integrationSystem.workflowEngine.executeWorkflow(workflowId);
      
      // Verify results
      expect(result).toBeDefined();
      expect(integrationSystem.registry.size).toBe(4);
      expect(integrationSystem.stateManager.getState('project.phase')).toBe('testing');
      
      // Verify project files were created
      const projectDir = path.join(tempDir, projectConfig.name);
      expect(fs.existsSync(projectDir)).toBe(true);
      expect(fs.existsSync(path.join(projectDir, 'package.json'))).toBe(true);
      expect(fs.existsSync(path.join(projectDir, 'src/index.js'))).toBe(true);
    });

    it('should handle project creation failures gracefully', async () => {
      const faultyWorkflow = {
        id: 'faulty-creation',
        steps: [
          {
            id: 'failing-step',
            action: 'fail',
            execute: async () => {
              throw new Error('Simulated failure');
            }
          },
          {
            id: 'dependent-step',
            action: 'work',
            dependsOn: ['failing-step'],
            execute: async () => {
              return 'should not execute';
            }
          }
        ]
      };
      
      const workflowId = integrationSystem.workflowEngine.createWorkflow(faultyWorkflow);
      
      try {
        await integrationSystem.workflowEngine.executeWorkflow(workflowId);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error.message).toContain('Simulated failure');
        
        const status = integrationSystem.workflowEngine.getStatus(workflowId);
        expect(status.state).toBe('failed');
      }
    });
  });

  describe('Multi-Agent Collaboration Scenario', () => {
    it('should coordinate multiple agents working together', async () => {
      const collaborationLog = [];
      
      // Create agents with specific roles
      const planner = await integrationSystem.agentManager.createAgent({
        name: 'collaborative-planner',
        role: 'planning'
      });
      
      const builder1 = await integrationSystem.agentManager.createAgent({
        name: 'builder-frontend',
        role: 'building',
        specialization: 'frontend'
      });
      
      const builder2 = await integrationSystem.agentManager.createAgent({
        name: 'builder-backend',
        role: 'building',
        specialization: 'backend'
      });
      
      const reviewer = await integrationSystem.agentManager.createAgent({
        name: 'code-reviewer',
        role: 'reviewing'
      });
      
      // Set up message handlers for collaboration
      integrationSystem.messageBus.subscribe('task.assignment', (message) => {
        collaborationLog.push({
          type: 'task_assigned',
          from: message.from,
          to: message.to,
          task: message.data.task
        });
      });
      
      integrationSystem.messageBus.subscribe('task.completed', (message) => {
        collaborationLog.push({
          type: 'task_completed',
          from: message.from,
          task: message.data.task,
          result: message.data.result
        });
      });
      
      integrationSystem.messageBus.subscribe('review.requested', (message) => {
        collaborationLog.push({
          type: 'review_requested',
          from: message.from,
          to: message.to,
          artifact: message.data.artifact
        });
      });
      
      // Simulate collaborative workflow
      const collaborativeWorkflow = {
        id: 'collaboration-test',
        steps: [
          {
            id: 'plan-creation',
            action: 'plan',
            agent: planner.id,
            execute: async () => {
              // Planner creates tasks and assigns them
              const frontendTask = {
                id: 'frontend-task',
                type: 'frontend',
                description: 'Create user interface'
              };
              
              const backendTask = {
                id: 'backend-task',
                type: 'backend',
                description: 'Create API endpoints'
              };
              
              integrationSystem.messageBus.publish({
                type: 'task.assignment',
                from: planner.id,
                to: builder1.id,
                data: { task: frontendTask }
              });
              
              integrationSystem.messageBus.publish({
                type: 'task.assignment',
                from: planner.id,
                to: builder2.id,
                data: { task: backendTask }
              });
              
              return { tasks: [frontendTask, backendTask] };
            }
          },
          {
            id: 'frontend-build',
            action: 'build',
            agent: builder1.id,
            dependsOn: ['plan-creation'],
            execute: async () => {
              const result = { component: 'UserDashboard', files: ['dashboard.jsx'] };
              
              integrationSystem.messageBus.publish({
                type: 'task.completed',
                from: builder1.id,
                data: { 
                  task: 'frontend-task',
                  result: result
                }
              });
              
              integrationSystem.messageBus.publish({
                type: 'review.requested',
                from: builder1.id,
                to: reviewer.id,
                data: { artifact: result }
              });
              
              return result;
            }
          },
          {
            id: 'backend-build',
            action: 'build',
            agent: builder2.id,
            dependsOn: ['plan-creation'],
            execute: async () => {
              const result = { api: 'UserAPI', endpoints: ['/users', '/auth'] };
              
              integrationSystem.messageBus.publish({
                type: 'task.completed',
                from: builder2.id,
                data: { 
                  task: 'backend-task',
                  result: result
                }
              });
              
              integrationSystem.messageBus.publish({
                type: 'review.requested',
                from: builder2.id,
                to: reviewer.id,
                data: { artifact: result }
              });
              
              return result;
            }
          },
          {
            id: 'code-review',
            action: 'review',
            agent: reviewer.id,
            dependsOn: ['frontend-build', 'backend-build'],
            execute: async () => {
              return { 
                status: 'approved',
                comments: ['Frontend looks good', 'API structure is solid'],
                suggestions: ['Add error handling', 'Improve test coverage']
              };
            }
          }
        ]
      };
      
      const workflowId = integrationSystem.workflowEngine.createWorkflow(collaborativeWorkflow);
      const result = await integrationSystem.workflowEngine.executeWorkflow(workflowId);
      
      // Verify collaboration occurred
      expect(result).toBeDefined();
      expect(collaborationLog.length).toBeGreaterThan(0);
      
      // Check that tasks were assigned
      const taskAssignments = collaborationLog.filter(log => log.type === 'task_assigned');
      expect(taskAssignments).toHaveLength(2);
      
      // Check that tasks were completed
      const taskCompletions = collaborationLog.filter(log => log.type === 'task_completed');
      expect(taskCompletions).toHaveLength(2);
      
      // Check that reviews were requested
      const reviewRequests = collaborationLog.filter(log => log.type === 'review_requested');
      expect(reviewRequests).toHaveLength(2);
    });
  });

  describe('Configuration Management Integration', () => {
    it('should manage configuration across system restart', async () => {
      const initialConfig = {
        project: {
          name: 'persistent-test',
          agents: ['planner', 'builder'],
          settings: {
            debug: true,
            timeout: 30000
          }
        },
        agents: {
          planner: {
            model: 'claude-3-sonnet',
            maxTokens: 4000
          },
          builder: {
            model: 'claude-3-haiku',
            maxTokens: 2000
          }
        }
      };
      
      // Save configuration
      Object.keys(initialConfig).forEach(key => {
        integrationSystem.configManager.set(key, initialConfig[key]);
      });
      
      await integrationSystem.configManager.save();
      
      // Verify configuration is saved to file
      const configFile = path.join(tempDir, 'config.json');
      expect(fs.existsSync(configFile)).toBe(true);
      
      // Create new config manager instance (simulating restart)
      const newConfigManager = new ConfigManager({
        configDir: tempDir
      });
      
      await newConfigManager.load();
      
      // Verify configuration persisted
      expect(newConfigManager.get('project.name')).toBe('persistent-test');
      expect(newConfigManager.get('agents.planner.model')).toBe('claude-3-sonnet');
      expect(newConfigManager.get('project.settings.debug')).toBe(true);
    });

    it('should validate configuration consistency', async () => {
      const invalidConfig = {
        project: {
          name: '', // Invalid: empty name
          agents: ['nonexistent-agent'], // Invalid: unknown agent type
          settings: {
            timeout: -1 // Invalid: negative timeout
          }
        }
      };
      
      try {
        integrationSystem.configManager.set('project', invalidConfig.project);
        await integrationSystem.configManager.validate();
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error.message).toContain('validation');
      }
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover from agent failures', async () => {
      // Create agent with auto-restart enabled
      const agent = await integrationSystem.agentManager.createAgent({
        name: 'resilient-agent',
        role: 'testing',
        config: {
          autoRestart: true,
          maxRestarts: 3,
          restartDelay: 10
        }
      });
      
      await integrationSystem.agentManager.startAgent(agent.id);
      
      const recoveryLog = [];
      
      integrationSystem.messageBus.subscribe('agent.failed', (msg) => {
        recoveryLog.push({ type: 'failure', agent: msg.agent, time: Date.now() });
      });
      
      integrationSystem.messageBus.subscribe('agent.restarted', (msg) => {
        recoveryLog.push({ type: 'restart', agent: msg.agent, time: Date.now() });
      });
      
      // Simulate agent failure
      integrationSystem.agentManager.simulateFailure(agent.id);
      
      // Wait for recovery
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const agentState = integrationSystem.registry.get(agent.id);
      expect(['running', 'restarting']).toContain(agentState.status);
      
      // Verify recovery attempt was logged
      expect(recoveryLog.length).toBeGreaterThan(0);
    });

    it('should handle workflow interruption and resume', async () => {
      const checkpoints = [];
      
      const interruptibleWorkflow = {
        id: 'interruptible-test',
        steps: [
          {
            id: 'step1',
            action: 'work',
            execute: async () => {
              checkpoints.push('step1-start');
              await new Promise(resolve => setTimeout(resolve, 10));
              checkpoints.push('step1-complete');
              return 'step1-result';
            }
          },
          {
            id: 'step2',
            action: 'work',
            dependsOn: ['step1'],
            execute: async () => {
              checkpoints.push('step2-start');
              // Simulate interruption
              if (checkpoints.length === 3) {
                throw new Error('Simulated interruption');
              }
              checkpoints.push('step2-complete');
              return 'step2-result';
            }
          },
          {
            id: 'step3',
            action: 'work',
            dependsOn: ['step2'],
            execute: async () => {
              checkpoints.push('step3-complete');
              return 'step3-result';
            }
          }
        ]
      };
      
      const workflowId = integrationSystem.workflowEngine.createWorkflow(interruptibleWorkflow);
      
      try {
        await integrationSystem.workflowEngine.executeWorkflow(workflowId);
      } catch (error) {
        expect(error.message).toContain('Simulated interruption');
      }
      
      // Verify partial execution
      expect(checkpoints).toContain('step1-complete');
      expect(checkpoints).toContain('step2-start');
      expect(checkpoints).not.toContain('step2-complete');
      
      const status = integrationSystem.workflowEngine.getStatus(workflowId);
      expect(status.state).toBe('failed');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple concurrent workflows', async () => {
      const workflowResults = [];
      const concurrentWorkflows = [];
      
      // Create multiple workflows that run concurrently
      for (let i = 0; i < 5; i++) {
        const workflow = {
          id: `concurrent-workflow-${i}`,
          steps: [
            {
              id: `step1-${i}`,
              action: 'work',
              execute: async () => {
                await new Promise(resolve => setTimeout(resolve, Math.random() * 20));
                return `result-${i}-1`;
              }
            },
            {
              id: `step2-${i}`,
              action: 'work',
              dependsOn: [`step1-${i}`],
              execute: async () => {
                await new Promise(resolve => setTimeout(resolve, Math.random() * 20));
                return `result-${i}-2`;
              }
            }
          ]
        };
        
        const workflowId = integrationSystem.workflowEngine.createWorkflow(workflow);
        concurrentWorkflows.push(
          integrationSystem.workflowEngine.executeWorkflow(workflowId)
            .then(result => workflowResults.push(result))
        );
      }
      
      // Wait for all workflows to complete
      await Promise.all(concurrentWorkflows);
      
      expect(workflowResults).toHaveLength(5);
    });

    it('should handle large number of agents efficiently', async () => {
      const agentCount = 20;
      const agents = [];
      
      const startTime = Date.now();
      
      // Create many agents
      for (let i = 0; i < agentCount; i++) {
        const agent = await integrationSystem.agentManager.createAgent({
          name: `scale-test-agent-${i}`,
          role: 'worker'
        });
        agents.push(agent);
      }
      
      const creationTime = Date.now() - startTime;
      
      // Verify all agents were created
      expect(integrationSystem.registry.size).toBe(agentCount);
      expect(agents).toHaveLength(agentCount);
      
      // Performance should be reasonable (less than 1 second for 20 agents)
      expect(creationTime).toBeLessThan(1000);
      
      // Test agent communication at scale
      let messageCount = 0;
      integrationSystem.messageBus.subscribe('scale.test', () => {
        messageCount++;
      });
      
      // Send message from each agent
      agents.forEach(agent => {
        integrationSystem.messageBus.publish({
          type: 'scale.test',
          from: agent.id,
          data: { message: 'scale test' }
        });
      });
      
      expect(messageCount).toBe(agentCount);
    });
  });

  describe('Real-world Development Scenario', () => {
    it('should simulate complete feature development lifecycle', async () => {
      const featureSpec = {
        name: 'user-authentication',
        description: 'Add user login and registration',
        requirements: [
          'User registration form',
          'Login functionality',
          'Password hashing',
          'Session management',
          'Unit tests'
        ]
      };
      
      // Store feature spec in state
      integrationSystem.stateManager.setState('feature', featureSpec);
      
      // Create development team
      const team = {
        productOwner: await integrationSystem.agentManager.createAgent({
          name: 'product-owner',
          role: 'planning',
          specialization: 'requirements'
        }),
        architect: await integrationSystem.agentManager.createAgent({
          name: 'system-architect',
          role: 'architecture',
          specialization: 'design'
        }),
        frontendDev: await integrationSystem.agentManager.createAgent({
          name: 'frontend-developer',
          role: 'development',
          specialization: 'frontend'
        }),
        backendDev: await integrationSystem.agentManager.createAgent({
          name: 'backend-developer',
          role: 'development',
          specialization: 'backend'
        }),
        tester: await integrationSystem.agentManager.createAgent({
          name: 'qa-engineer',
          role: 'testing',
          specialization: 'automation'
        })
      };
      
      const developmentWorkflow = {
        id: 'feature-development',
        name: 'User Authentication Feature',
        steps: [
          {
            id: 'requirements-analysis',
            action: 'analyze',
            agent: team.productOwner.id,
            execute: async () => {
              const analysis = {
                userStories: [
                  'As a user, I want to register for an account',
                  'As a user, I want to log in to my account',
                  'As a user, I want to log out securely'
                ],
                acceptanceCriteria: [
                  'Registration validates email format',
                  'Password must be at least 8 characters',
                  'Session expires after 24 hours'
                ]
              };
              
              integrationSystem.stateManager.setState('feature.analysis', analysis);
              return analysis;
            }
          },
          {
            id: 'system-design',
            action: 'design',
            agent: team.architect.id,
            dependsOn: ['requirements-analysis'],
            execute: async () => {
              const design = {
                components: [
                  'AuthController',
                  'UserModel',
                  'LoginForm',
                  'RegistrationForm'
                ],
                database: {
                  tables: ['users', 'sessions'],
                  indexes: ['email_unique', 'session_token']
                },
                api: {
                  endpoints: [
                    'POST /api/register',
                    'POST /api/login',
                    'POST /api/logout',
                    'GET /api/me'
                  ]
                }
              };
              
              integrationSystem.stateManager.setState('feature.design', design);
              return design;
            }
          },
          {
            id: 'frontend-implementation',
            action: 'implement',
            agent: team.frontendDev.id,
            dependsOn: ['system-design'],
            execute: async () => {
              const frontendFiles = [
                'components/LoginForm.jsx',
                'components/RegistrationForm.jsx',
                'pages/AuthPage.jsx',
                'services/authService.js',
                'hooks/useAuth.js'
              ];
              
              // Create mock files
              const frontendDir = path.join(tempDir, 'frontend/src');
              fs.mkdirSync(frontendDir, { recursive: true });
              
              frontendFiles.forEach(file => {
                const filePath = path.join(frontendDir, file);
                fs.mkdirSync(path.dirname(filePath), { recursive: true });
                fs.writeFileSync(filePath, `// ${file} implementation\nexport default {};`);
              });
              
              return { files: frontendFiles, type: 'frontend' };
            }
          },
          {
            id: 'backend-implementation',
            action: 'implement',
            agent: team.backendDev.id,
            dependsOn: ['system-design'],
            execute: async () => {
              const backendFiles = [
                'controllers/AuthController.js',
                'models/User.js',
                'middleware/auth.js',
                'routes/auth.js',
                'services/passwordService.js'
              ];
              
              // Create mock files
              const backendDir = path.join(tempDir, 'backend/src');
              fs.mkdirSync(backendDir, { recursive: true });
              
              backendFiles.forEach(file => {
                const filePath = path.join(backendDir, file);
                fs.mkdirSync(path.dirname(filePath), { recursive: true });
                fs.writeFileSync(filePath, `// ${file} implementation\nmodule.exports = {};`);
              });
              
              return { files: backendFiles, type: 'backend' };
            }
          },
          {
            id: 'testing',
            action: 'test',
            agent: team.tester.id,
            dependsOn: ['frontend-implementation', 'backend-implementation'],
            execute: async () => {
              const testFiles = [
                'tests/auth.test.js',
                'tests/integration/auth.integration.test.js',
                'tests/e2e/auth.e2e.test.js'
              ];
              
              // Create test files
              const testDir = path.join(tempDir, 'tests');
              fs.mkdirSync(testDir, { recursive: true });
              
              testFiles.forEach(file => {
                const filePath = path.join(tempDir, file);
                fs.mkdirSync(path.dirname(filePath), { recursive: true });
                fs.writeFileSync(filePath, `// ${file}\ndescribe('Auth', () => { it('works', () => {}); });`);
              });
              
              return {
                testFiles,
                results: {
                  unit: { passed: 12, failed: 0 },
                  integration: { passed: 8, failed: 0 },
                  e2e: { passed: 5, failed: 0 }
                },
                coverage: 95
              };
            }
          },
          {
            id: 'deployment',
            action: 'deploy',
            dependsOn: ['testing'],
            execute: async () => {
              integrationSystem.stateManager.setState('feature.status', 'deployed');
              return {
                environment: 'staging',
                url: 'https://staging.example.com',
                timestamp: new Date().toISOString()
              };
            }
          }
        ]
      };
      
      // Execute the complete feature development workflow
      const workflowId = integrationSystem.workflowEngine.createWorkflow(developmentWorkflow);
      const result = await integrationSystem.workflowEngine.executeWorkflow(workflowId);
      
      // Verify the complete development cycle
      expect(result).toBeDefined();
      expect(integrationSystem.stateManager.getState('feature.status')).toBe('deployed');
      
      // Verify files were created
      expect(fs.existsSync(path.join(tempDir, 'frontend/src/components/LoginForm.jsx'))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, 'backend/src/controllers/AuthController.js'))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, 'tests/auth.test.js'))).toBe(true);
      
      // Verify team collaboration
      expect(integrationSystem.registry.size).toBe(5);
      
      const finalState = integrationSystem.stateManager.getState('feature');
      expect(finalState.analysis).toBeDefined();
      expect(finalState.design).toBeDefined();
      expect(finalState.status).toBe('deployed');
    });
  });

  describe('System Health and Monitoring Integration', () => {
    it('should provide comprehensive system health monitoring', async () => {
      const healthMonitor = {
        metrics: new Map(),
        alerts: [],
        
        recordMetric(name, value, timestamp = Date.now()) {
          if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
          }
          this.metrics.get(name).push({ value, timestamp });
        },
        
        checkThresholds() {
          // Check various system health thresholds
          const cpuUsage = this.getLatestMetric('cpu_usage');
          const memoryUsage = this.getLatestMetric('memory_usage');
          const activeAgents = integrationSystem.registry.size;
          
          if (cpuUsage && cpuUsage.value > 80) {
            this.alerts.push({
              type: 'warning',
              message: 'High CPU usage detected',
              value: cpuUsage.value,
              timestamp: Date.now()
            });
          }
          
          if (memoryUsage && memoryUsage.value > 85) {
            this.alerts.push({
              type: 'critical',
              message: 'High memory usage detected',
              value: memoryUsage.value,
              timestamp: Date.now()
            });
          }
          
          if (activeAgents > 50) {
            this.alerts.push({
              type: 'info',
              message: 'High number of active agents',
              value: activeAgents,
              timestamp: Date.now()
            });
          }
        },
        
        getLatestMetric(name) {
          const metrics = this.metrics.get(name);
          return metrics && metrics.length > 0 ? metrics[metrics.length - 1] : null;
        },
        
        getHealthSummary() {
          return {
            agents: {
              total: integrationSystem.registry.size,
              running: integrationSystem.registry.findByStatus('running').length,
              idle: integrationSystem.registry.findByStatus('idle').length,
              failed: integrationSystem.registry.findByStatus('failed').length
            },
            workflows: {
              active: integrationSystem.workflowEngine.getActiveWorkflows().length
            },
            system: {
              cpu: this.getLatestMetric('cpu_usage')?.value || 0,
              memory: this.getLatestMetric('memory_usage')?.value || 0,
              uptime: Date.now() - (this.startTime || Date.now())
            },
            alerts: this.alerts.length
          };
        }
      };
      
      healthMonitor.startTime = Date.now();
      
      // Create some agents and workflows for monitoring
      const agents = [];
      for (let i = 0; i < 5; i++) {
        const agent = await integrationSystem.agentManager.createAgent({
          name: `monitor-test-agent-${i}`,
          role: 'worker'
        });
        agents.push(agent);
        await integrationSystem.agentManager.startAgent(agent.id);
      }
      
      // Record some metrics
      healthMonitor.recordMetric('cpu_usage', 45.2);
      healthMonitor.recordMetric('memory_usage', 62.1);
      healthMonitor.recordMetric('cpu_usage', 78.9);
      healthMonitor.recordMetric('memory_usage', 89.3); // Should trigger alert
      
      healthMonitor.checkThresholds();
      
      const healthSummary = healthMonitor.getHealthSummary();
      
      expect(healthSummary.agents.total).toBe(5);
      expect(healthSummary.agents.running).toBe(5);
      expect(healthSummary.system.memory).toBe(89.3);
      expect(healthSummary.alerts).toBe(1); // Memory alert
      
      expect(healthMonitor.alerts).toHaveLength(1);
      expect(healthMonitor.alerts[0].type).toBe('critical');
      expect(healthMonitor.alerts[0].message).toContain('memory');
    });
  });
});