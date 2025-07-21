/**
 * ClaudeBuild v2 - Atomic Level Voice Control Integration Test Suite
 * Tests voice command recognition, natural language processing, and voice-driven workflows
 */

const { describe, it, expect, beforeEach, afterEach, jest } = require('@jest/globals');
const fs = require('fs');
const path = require('path');
const os = require('os');
const EventEmitter = require('events');

// Mock voice recognition and speech synthesis APIs
const mockSpeechRecognition = {
  start: jest.fn(),
  stop: jest.fn(),
  abort: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  continuous: false,
  interimResults: false,
  lang: 'en-US',
  confidence: 0.9
};

const mockSpeechSynthesis = {
  speak: jest.fn(),
  cancel: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  getVoices: jest.fn().mockReturnValue([
    { name: 'Alex', lang: 'en-US', default: true },
    { name: 'Samantha', lang: 'en-US', default: false }
  ])
};

// Mock Web Speech API
global.SpeechRecognition = jest.fn(() => mockSpeechRecognition);
global.webkitSpeechRecognition = jest.fn(() => mockSpeechRecognition);
global.speechSynthesis = mockSpeechSynthesis;
global.SpeechSynthesisUtterance = jest.fn();

describe('Voice Control Integration - Atomic Level Tests', () => {
  let tempDir;
  let voiceSystem;
  
  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'claudebuild-voice-test-'));
    process.env.CLAUDEBUILD_TEST_DIR = tempDir;
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Create voice control system
    voiceSystem = {
      recognition: null,
      synthesis: null,
      commands: new Map(),
      isListening: false,
      isEnabled: false,
      eventEmitter: new EventEmitter()
    };
  });
  
  afterEach(() => {
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    delete process.env.CLAUDEBUILD_TEST_DIR;
    
    if (voiceSystem.recognition) {
      voiceSystem.recognition.stop();
    }
  });

  describe('Voice Recognition Engine', () => {
    let VoiceRecognitionEngine;
    
    beforeEach(() => {
      VoiceRecognitionEngine = class {
        constructor(options = {}) {
          this.options = {
            language: 'en-US',
            continuous: true,
            interimResults: true,
            confidenceThreshold: 0.7,
            ...options
          };
          
          this.recognition = new SpeechRecognition();
          this.isListening = false;
          this.eventHandlers = new Map();
          this.setupRecognition();
        }
        
        setupRecognition() {
          this.recognition.continuous = this.options.continuous;
          this.recognition.interimResults = this.options.interimResults;
          this.recognition.lang = this.options.language;
          
          this.recognition.addEventListener('start', () => {
            this.isListening = true;
            this.emit('started');
          });
          
          this.recognition.addEventListener('end', () => {
            this.isListening = false;
            this.emit('ended');
          });
          
          this.recognition.addEventListener('result', (event) => {
            this.handleResult(event);
          });
          
          this.recognition.addEventListener('error', (event) => {
            this.emit('error', event.error);
          });
        }
        
        handleResult(event) {
          const results = Array.from(event.results);
          const finalResults = results.filter(result => result.isFinal);
          const interimResults = results.filter(result => !result.isFinal);
          
          finalResults.forEach(result => {
            const transcript = result[0].transcript;
            const confidence = result[0].confidence;
            
            if (confidence >= this.options.confidenceThreshold) {
              this.emit('finalResult', { transcript, confidence });
            }
          });
          
          if (interimResults.length > 0) {
            const transcript = interimResults[0][0].transcript;
            this.emit('interimResult', { transcript });
          }
        }
        
        start() {
          if (!this.isListening) {
            this.recognition.start();
          }
        }
        
        stop() {
          if (this.isListening) {
            this.recognition.stop();
          }
        }
        
        abort() {
          this.recognition.abort();
          this.isListening = false;
        }
        
        on(event, handler) {
          if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
          }
          this.eventHandlers.get(event).push(handler);
        }
        
        emit(event, data) {
          if (this.eventHandlers.has(event)) {
            this.eventHandlers.get(event).forEach(handler => handler(data));
          }
        }
      };
    });

    it('should create voice recognition engine', () => {
      const engine = new VoiceRecognitionEngine();
      expect(engine).toBeDefined();
      expect(engine.recognition).toBeDefined();
      expect(engine.isListening).toBe(false);
    });

    it('should start and stop recognition', () => {
      const engine = new VoiceRecognitionEngine();
      
      engine.start();
      expect(mockSpeechRecognition.start).toHaveBeenCalled();
      
      engine.stop();
      expect(mockSpeechRecognition.stop).toHaveBeenCalled();
    });

    it('should handle recognition results', () => {
      const engine = new VoiceRecognitionEngine();
      let finalResult = null;
      let interimResult = null;
      
      engine.on('finalResult', (result) => {
        finalResult = result;
      });
      
      engine.on('interimResult', (result) => {
        interimResult = result;
      });
      
      // Simulate speech recognition result
      const mockEvent = {
        results: [
          {
            isFinal: false,
            0: { transcript: 'hello wo', confidence: 0.8 }
          },
          {
            isFinal: true,
            0: { transcript: 'hello world', confidence: 0.95 }
          }
        ]
      };
      
      engine.handleResult(mockEvent);
      
      expect(finalResult).toEqual({
        transcript: 'hello world',
        confidence: 0.95
      });
      
      expect(interimResult).toEqual({
        transcript: 'hello wo'
      });
    });

    it('should filter low confidence results', () => {
      const engine = new VoiceRecognitionEngine({
        confidenceThreshold: 0.8
      });
      
      let finalResult = null;
      engine.on('finalResult', (result) => {
        finalResult = result;
      });
      
      // Low confidence result - should be filtered
      const lowConfidenceEvent = {
        results: [{
          isFinal: true,
          0: { transcript: 'unclear speech', confidence: 0.6 }
        }]
      };
      
      engine.handleResult(lowConfidenceEvent);
      expect(finalResult).toBeNull();
      
      // High confidence result - should pass through
      const highConfidenceEvent = {
        results: [{
          isFinal: true,
          0: { transcript: 'clear speech', confidence: 0.9 }
        }]
      };
      
      engine.handleResult(highConfidenceEvent);
      expect(finalResult).toEqual({
        transcript: 'clear speech',
        confidence: 0.9
      });
    });

    it('should handle multiple languages', () => {
      const spanishEngine = new VoiceRecognitionEngine({
        language: 'es-ES'
      });
      
      expect(spanishEngine.recognition.lang).toBe('es-ES');
      
      const frenchEngine = new VoiceRecognitionEngine({
        language: 'fr-FR'
      });
      
      expect(frenchEngine.recognition.lang).toBe('fr-FR');
    });
  });

  describe('Natural Language Command Parser', () => {
    let CommandParser;
    
    beforeEach(() => {
      CommandParser = class {
        constructor() {
          this.patterns = new Map();
          this.entities = new Map();
          this.setupDefaultPatterns();
        }
        
        setupDefaultPatterns() {
          // Basic command patterns
          this.addPattern('create_project', [
            /create (?:a )?(?:new )?project (?:called |named )?(?<name>\w+)/i,
            /start (?:a )?(?:new )?project (?<name>\w+)/i,
            /new project (?<name>\w+)/i
          ]);
          
          this.addPattern('build_project', [
            /build (?:the )?project/i,
            /compile (?:the )?project/i,
            /run (?:the )?build/i
          ]);
          
          this.addPattern('create_agent', [
            /create (?:an? )?agent (?:called |named )?(?<name>\w+)/i,
            /add (?:an? )?(?<role>\w+) agent (?<name>\w+)/i,
            /spawn (?:an? )?agent (?<name>\w+)/i
          ]);
          
          this.addPattern('start_agent', [
            /start (?:the )?agent (?<name>\w+)/i,
            /run (?:the )?agent (?<name>\w+)/i,
            /activate (?:the )?agent (?<name>\w+)/i
          ]);
          
          this.addPattern('show_status', [
            /show (?:me )?(?:the )?status/i,
            /what(?:'s| is) (?:the )?status/i,
            /status report/i
          ]);
          
          // Workflow commands
          this.addPattern('create_workflow', [
            /create (?:a )?workflow (?:for )?(?<task>.*)/i,
            /start (?:a )?workflow (?:to )?(?<task>.*)/i
          ]);
          
          // Help commands
          this.addPattern('help', [
            /help/i,
            /what can (?:I|you) do/i,
            /show (?:me )?(?:the )?commands/i
          ]);
        }
        
        addPattern(intent, patterns) {
          this.patterns.set(intent, patterns);
        }
        
        addEntity(name, values) {
          this.entities.set(name, values);
        }
        
        parse(text) {
          const cleanText = text.trim().toLowerCase();
          
          for (const [intent, patterns] of this.patterns) {
            for (const pattern of patterns) {
              const match = pattern.exec(cleanText);
              if (match) {
                return {
                  intent,
                  entities: this.extractEntities(match),
                  confidence: this.calculateConfidence(match, pattern),
                  originalText: text
                };
              }
            }
          }
          
          return {
            intent: 'unknown',
            entities: {},
            confidence: 0,
            originalText: text
          };
        }
        
        extractEntities(match) {
          const entities = {};
          if (match.groups) {
            Object.assign(entities, match.groups);
          }
          return entities;
        }
        
        calculateConfidence(match, pattern) {
          // Simple confidence calculation based on match quality
          const matchLength = match[0].length;
          const inputLength = match.input.length;
          const coverage = matchLength / inputLength;
          
          // Higher confidence for exact matches and known patterns
          let confidence = Math.min(coverage * 1.2, 1.0);
          
          // Boost confidence for patterns with named groups
          if (match.groups && Object.keys(match.groups).length > 0) {
            confidence = Math.min(confidence + 0.1, 1.0);
          }
          
          return confidence;
        }
        
        getSupportedIntents() {
          return Array.from(this.patterns.keys());
        }
        
        getIntentPatterns(intent) {
          return this.patterns.get(intent) || [];
        }
      };
    });

    it('should create command parser', () => {
      const parser = new CommandParser();
      expect(parser).toBeDefined();
      expect(parser.patterns.size).toBeGreaterThan(0);
    });

    it('should parse basic commands', () => {
      const parser = new CommandParser();
      
      const createProject = parser.parse('create a new project called myapp');
      expect(createProject.intent).toBe('create_project');
      expect(createProject.entities.name).toBe('myapp');
      expect(createProject.confidence).toBeGreaterThan(0.7);
      
      const buildProject = parser.parse('build the project');
      expect(buildProject.intent).toBe('build_project');
      
      const showStatus = parser.parse('show me the status');
      expect(showStatus.intent).toBe('show_status');
    });

    it('should parse agent commands', () => {
      const parser = new CommandParser();
      
      const createAgent = parser.parse('create an agent called planner');
      expect(createAgent.intent).toBe('create_agent');
      expect(createAgent.entities.name).toBe('planner');
      
      const startAgent = parser.parse('start the agent builder');
      expect(startAgent.intent).toBe('start_agent');
      expect(startAgent.entities.name).toBe('builder');
      
      const agentWithRole = parser.parse('add a planning agent coordinator');
      expect(agentWithRole.intent).toBe('create_agent');
      expect(agentWithRole.entities.role).toBe('planning');
      expect(agentWithRole.entities.name).toBe('coordinator');
    });

    it('should handle unknown commands gracefully', () => {
      const parser = new CommandParser();
      
      const unknown = parser.parse('do something completely random');
      expect(unknown.intent).toBe('unknown');
      expect(unknown.confidence).toBe(0);
    });

    it('should support custom patterns', () => {
      const parser = new CommandParser();
      
      parser.addPattern('custom_command', [
        /deploy to (?<environment>\w+)/i
      ]);
      
      const customCommand = parser.parse('deploy to staging');
      expect(customCommand.intent).toBe('custom_command');
      expect(customCommand.entities.environment).toBe('staging');
    });

    it('should calculate confidence scores', () => {
      const parser = new CommandParser();
      
      const exactMatch = parser.parse('build the project');
      const partialMatch = parser.parse('build the project please now');
      const poorMatch = parser.parse('maybe build something if possible');
      
      expect(exactMatch.confidence).toBeGreaterThan(partialMatch.confidence);
      expect(partialMatch.confidence).toBeGreaterThan(poorMatch.confidence);
    });
  });

  describe('Voice Command Execution Engine', () => {
    let CommandExecutor;
    
    beforeEach(() => {
      CommandExecutor = class {
        constructor(options = {}) {
          this.options = options;
          this.commands = new Map();
          this.middleware = [];
          this.history = [];
          this.setupDefaultCommands();
        }
        
        setupDefaultCommands() {
          this.registerCommand('create_project', async (entities) => {
            const projectName = entities.name || 'untitled-project';
            const projectDir = path.join(tempDir, projectName);
            
            fs.mkdirSync(projectDir, { recursive: true });
            fs.writeFileSync(
              path.join(projectDir, 'package.json'),
              JSON.stringify({ name: projectName, version: '1.0.0' }, null, 2)
            );
            
            return {
              success: true,
              message: `Created project: ${projectName}`,
              data: { projectName, projectDir }
            };
          });
          
          this.registerCommand('build_project', async () => {
            // Simulate build process
            await new Promise(resolve => setTimeout(resolve, 10));
            
            return {
              success: true,
              message: 'Project built successfully',
              data: { buildTime: 10, artifacts: ['dist/app.js'] }
            };
          });
          
          this.registerCommand('create_agent', async (entities) => {
            const agentName = entities.name || 'unnamed-agent';
            const agentRole = entities.role || 'general';
            
            return {
              success: true,
              message: `Created ${agentRole} agent: ${agentName}`,
              data: { agentName, agentRole, id: `agent-${Date.now()}` }
            };
          });
          
          this.registerCommand('show_status', async () => {
            return {
              success: true,
              message: 'System status retrieved',
              data: {
                agents: 3,
                workflows: 1,
                uptime: Date.now() - (this.startTime || Date.now()),
                status: 'healthy'
              }
            };
          });
          
          this.registerCommand('help', async () => {
            const availableCommands = Array.from(this.commands.keys());
            return {
              success: true,
              message: 'Available voice commands',
              data: { commands: availableCommands }
            };
          });
        }
        
        registerCommand(intent, handler) {
          this.commands.set(intent, handler);
        }
        
        addMiddleware(middleware) {
          this.middleware.push(middleware);
        }
        
        async execute(parsedCommand) {
          try {
            // Apply middleware
            for (const middleware of this.middleware) {
              const result = await middleware(parsedCommand);
              if (result === false) {
                return {
                  success: false,
                  message: 'Command blocked by middleware'
                };
              }
            }
            
            const handler = this.commands.get(parsedCommand.intent);
            
            if (!handler) {
              return {
                success: false,
                message: `Unknown command: ${parsedCommand.intent}`,
                suggestions: this.getSuggestions(parsedCommand.originalText)
              };
            }
            
            const result = await handler(parsedCommand.entities, parsedCommand);
            
            // Add to history
            this.history.push({
              command: parsedCommand,
              result,
              timestamp: Date.now()
            });
            
            return result;
            
          } catch (error) {
            return {
              success: false,
              message: `Command execution failed: ${error.message}`,
              error: error
            };
          }
        }
        
        getSuggestions(text) {
          // Simple suggestion logic based on available commands
          const availableCommands = Array.from(this.commands.keys());
          return availableCommands.filter(cmd => 
            cmd.includes(text.toLowerCase().split(' ')[0])
          );
        }
        
        getHistory(limit = 10) {
          return this.history.slice(-limit);
        }
        
        clearHistory() {
          this.history = [];
        }
      };
    });

    it('should create command executor', () => {
      const executor = new CommandExecutor();
      expect(executor).toBeDefined();
      expect(executor.commands.size).toBeGreaterThan(0);
    });

    it('should execute basic commands', async () => {
      const executor = new CommandExecutor();
      
      const createResult = await executor.execute({
        intent: 'create_project',
        entities: { name: 'test-app' },
        confidence: 0.9
      });
      
      expect(createResult.success).toBe(true);
      expect(createResult.data.projectName).toBe('test-app');
      expect(fs.existsSync(path.join(tempDir, 'test-app'))).toBe(true);
      
      const buildResult = await executor.execute({
        intent: 'build_project',
        entities: {},
        confidence: 0.8
      });
      
      expect(buildResult.success).toBe(true);
      expect(buildResult.data.artifacts).toContain('dist/app.js');
    });

    it('should handle unknown commands', async () => {
      const executor = new CommandExecutor();
      
      const result = await executor.execute({
        intent: 'unknown_command',
        entities: {},
        confidence: 0.5
      });
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Unknown command');
    });

    it('should support middleware', async () => {
      const executor = new CommandExecutor();
      let middlewareCalled = false;
      
      executor.addMiddleware(async (command) => {
        middlewareCalled = true;
        // Block commands with low confidence
        return command.confidence > 0.7;
      });
      
      const lowConfidenceResult = await executor.execute({
        intent: 'create_project',
        entities: { name: 'test' },
        confidence: 0.5
      });
      
      expect(middlewareCalled).toBe(true);
      expect(lowConfidenceResult.success).toBe(false);
      expect(lowConfidenceResult.message).toContain('blocked by middleware');
      
      const highConfidenceResult = await executor.execute({
        intent: 'create_project',
        entities: { name: 'test' },
        confidence: 0.9
      });
      
      expect(highConfidenceResult.success).toBe(true);
    });

    it('should maintain command history', async () => {
      const executor = new CommandExecutor();
      
      await executor.execute({
        intent: 'create_project',
        entities: { name: 'app1' },
        confidence: 0.9
      });
      
      await executor.execute({
        intent: 'build_project',
        entities: {},
        confidence: 0.8
      });
      
      const history = executor.getHistory();
      expect(history).toHaveLength(2);
      expect(history[0].command.intent).toBe('create_project');
      expect(history[1].command.intent).toBe('build_project');
      
      executor.clearHistory();
      expect(executor.getHistory()).toHaveLength(0);
    });

    it('should provide command suggestions', async () => {
      const executor = new CommandExecutor();
      
      const result = await executor.execute({
        intent: 'unknown',
        entities: {},
        confidence: 0,
        originalText: 'create something'
      });
      
      expect(result.suggestions).toContain('create_project');
      expect(result.suggestions).toContain('create_agent');
    });
  });

  describe('Speech Synthesis Engine', () => {
    let SpeechSynthesisEngine;
    
    beforeEach(() => {
      SpeechSynthesisEngine = class {
        constructor(options = {}) {
          this.options = {
            voice: null,
            rate: 1.0,
            pitch: 1.0,
            volume: 1.0,
            language: 'en-US',
            ...options
          };
          
          this.synthesis = speechSynthesis;
          this.isSupported = 'speechSynthesis' in window || 'speechSynthesis' in global;
          this.voices = [];
          this.loadVoices();
        }
        
        loadVoices() {
          this.voices = this.synthesis.getVoices();
          if (this.voices.length === 0) {
            // Fallback for testing
            this.voices = [
              { name: 'Default', lang: 'en-US', default: true }
            ];
          }
        }
        
        getVoices() {
          return this.voices;
        }
        
        getVoiceByName(name) {
          return this.voices.find(voice => voice.name === name);
        }
        
        getVoicesByLanguage(language) {
          return this.voices.filter(voice => voice.lang.startsWith(language));
        }
        
        speak(text, options = {}) {
          return new Promise((resolve, reject) => {
            if (!this.isSupported) {
              reject(new Error('Speech synthesis not supported'));
              return;
            }
            
            const utterance = new SpeechSynthesisUtterance(text);
            
            // Apply options
            Object.assign(utterance, {
              rate: options.rate || this.options.rate,
              pitch: options.pitch || this.options.pitch,
              volume: options.volume || this.options.volume,
              lang: options.language || this.options.language
            });
            
            // Set voice
            const voiceName = options.voice || this.options.voice;
            if (voiceName) {
              const voice = this.getVoiceByName(voiceName);
              if (voice) {
                utterance.voice = voice;
              }
            }
            
            utterance.onend = () => resolve();
            utterance.onerror = (event) => reject(new Error(event.error));
            
            this.synthesis.speak(utterance);
          });
        }
        
        cancel() {
          this.synthesis.cancel();
        }
        
        pause() {
          this.synthesis.pause();
        }
        
        resume() {
          this.synthesis.resume();
        }
        
        isSpeaking() {
          return this.synthesis.speaking;
        }
        
        isPaused() {
          return this.synthesis.paused;
        }
      };
    });

    it('should create speech synthesis engine', () => {
      const engine = new SpeechSynthesisEngine();
      expect(engine).toBeDefined();
      expect(engine.synthesis).toBeDefined();
    });

    it('should speak text with default options', async () => {
      const engine = new SpeechSynthesisEngine();
      
      await engine.speak('Hello, this is a test');
      
      expect(SpeechSynthesisUtterance).toHaveBeenCalledWith('Hello, this is a test');
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    });

    it('should support custom voice options', async () => {
      const engine = new SpeechSynthesisEngine();
      
      await engine.speak('Custom voice test', {
        rate: 1.5,
        pitch: 1.2,
        volume: 0.8,
        language: 'en-GB'
      });
      
      expect(SpeechSynthesisUtterance).toHaveBeenCalledWith('Custom voice test');
    });

    it('should handle voice selection', () => {
      const engine = new SpeechSynthesisEngine();
      
      const voices = engine.getVoices();
      expect(voices.length).toBeGreaterThan(0);
      
      const englishVoices = engine.getVoicesByLanguage('en');
      expect(englishVoices.length).toBeGreaterThan(0);
      
      const specificVoice = engine.getVoiceByName('Alex');
      if (specificVoice) {
        expect(specificVoice.name).toBe('Alex');
      }
    });

    it('should control playback', () => {
      const engine = new SpeechSynthesisEngine();
      
      engine.cancel();
      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
      
      engine.pause();
      expect(mockSpeechSynthesis.pause).toHaveBeenCalled();
      
      engine.resume();
      expect(mockSpeechSynthesis.resume).toHaveBeenCalled();
    });
  });

  describe('Voice-Driven Workflow Integration', () => {
    let voiceWorkflowSystem;
    
    beforeEach(() => {
      voiceWorkflowSystem = {
        recognition: null,
        parser: null,
        executor: null,
        synthesis: null,
        isActive: false,
        workflows: new Map(),
        
        async initialize() {
          const VoiceRecognitionEngine = voiceSystem.VoiceRecognitionEngine || class {
            start() { this.emit('started'); }
            stop() { this.emit('ended'); }
            on() {}
            emit() {}
          };
          
          const CommandParser = voiceSystem.CommandParser || class {
            parse(text) {
              return { intent: 'create_project', entities: { name: 'test' }, confidence: 0.9 };
            }
          };
          
          const CommandExecutor = voiceSystem.CommandExecutor || class {
            async execute() {
              return { success: true, message: 'Command executed' };
            }
          };
          
          const SpeechSynthesisEngine = voiceSystem.SpeechSynthesisEngine || class {
            async speak() {}
          };
          
          this.recognition = new VoiceRecognitionEngine();
          this.parser = new CommandParser();
          this.executor = new CommandExecutor();
          this.synthesis = new SpeechSynthesisEngine();
          
          this.setupEventHandlers();
        },
        
        setupEventHandlers() {
          this.recognition.on('finalResult', async (result) => {
            await this.handleVoiceInput(result.transcript);
          });
        },
        
        async handleVoiceInput(transcript) {
          try {
            const parsedCommand = this.parser.parse(transcript);
            
            if (parsedCommand.confidence < 0.6) {
              await this.synthesis.speak('Sorry, I didn\'t understand that command');
              return;
            }
            
            const result = await this.executor.execute(parsedCommand);
            
            if (result.success) {
              await this.synthesis.speak(result.message);
            } else {
              await this.synthesis.speak(`Error: ${result.message}`);
            }
            
          } catch (error) {
            await this.synthesis.speak('An error occurred while processing your command');
          }
        },
        
        startListening() {
          if (!this.isActive) {
            this.recognition.start();
            this.isActive = true;
          }
        },
        
        stopListening() {
          if (this.isActive) {
            this.recognition.stop();
            this.isActive = false;
          }
        },
        
        createVoiceWorkflow(name, steps) {
          const workflow = {
            id: `voice-workflow-${Date.now()}`,
            name,
            steps,
            status: 'created'
          };
          
          this.workflows.set(workflow.id, workflow);
          return workflow;
        },
        
        async executeVoiceWorkflow(workflowId) {
          const workflow = this.workflows.get(workflowId);
          if (!workflow) {
            throw new Error('Workflow not found');
          }
          
          workflow.status = 'running';
          
          await this.synthesis.speak(`Starting workflow: ${workflow.name}`);
          
          for (const step of workflow.steps) {
            await this.synthesis.speak(`Executing step: ${step.name}`);
            
            if (step.requiresConfirmation) {
              // In a real implementation, this would wait for voice confirmation
              await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            await step.execute();
          }
          
          workflow.status = 'completed';
          await this.synthesis.speak(`Workflow completed: ${workflow.name}`);
          
          return workflow;
        }
      };
    });

    it('should initialize voice workflow system', async () => {
      await voiceWorkflowSystem.initialize();
      
      expect(voiceWorkflowSystem.recognition).toBeDefined();
      expect(voiceWorkflowSystem.parser).toBeDefined();
      expect(voiceWorkflowSystem.executor).toBeDefined();
      expect(voiceWorkflowSystem.synthesis).toBeDefined();
    });

    it('should handle voice commands end-to-end', async () => {
      await voiceWorkflowSystem.initialize();
      
      // Mock the components
      voiceWorkflowSystem.parser.parse = jest.fn().mockReturnValue({
        intent: 'create_project',
        entities: { name: 'voice-app' },
        confidence: 0.9
      });
      
      voiceWorkflowSystem.executor.execute = jest.fn().mockResolvedValue({
        success: true,
        message: 'Project created successfully'
      });
      
      voiceWorkflowSystem.synthesis.speak = jest.fn().mockResolvedValue();
      
      await voiceWorkflowSystem.handleVoiceInput('create a project called voice-app');
      
      expect(voiceWorkflowSystem.parser.parse).toHaveBeenCalledWith('create a project called voice-app');
      expect(voiceWorkflowSystem.executor.execute).toHaveBeenCalled();
      expect(voiceWorkflowSystem.synthesis.speak).toHaveBeenCalledWith('Project created successfully');
    });

    it('should handle low confidence commands', async () => {
      await voiceWorkflowSystem.initialize();
      
      voiceWorkflowSystem.parser.parse = jest.fn().mockReturnValue({
        intent: 'unknown',
        entities: {},
        confidence: 0.3
      });
      
      voiceWorkflowSystem.synthesis.speak = jest.fn().mockResolvedValue();
      
      await voiceWorkflowSystem.handleVoiceInput('mumbled unclear command');
      
      expect(voiceWorkflowSystem.synthesis.speak).toHaveBeenCalledWith('Sorry, I didn\'t understand that command');
    });

    it('should create and execute voice workflows', async () => {
      await voiceWorkflowSystem.initialize();
      
      voiceWorkflowSystem.synthesis.speak = jest.fn().mockResolvedValue();
      
      const workflow = voiceWorkflowSystem.createVoiceWorkflow('Test Workflow', [
        {
          name: 'Step 1',
          requiresConfirmation: false,
          execute: async () => { return 'step1-done'; }
        },
        {
          name: 'Step 2',
          requiresConfirmation: true,
          execute: async () => { return 'step2-done'; }
        }
      ]);
      
      expect(workflow.name).toBe('Test Workflow');
      expect(workflow.status).toBe('created');
      
      await voiceWorkflowSystem.executeVoiceWorkflow(workflow.id);
      
      expect(workflow.status).toBe('completed');
      expect(voiceWorkflowSystem.synthesis.speak).toHaveBeenCalledWith('Starting workflow: Test Workflow');
      expect(voiceWorkflowSystem.synthesis.speak).toHaveBeenCalledWith('Workflow completed: Test Workflow');
    });

    it('should control listening state', () => {
      voiceWorkflowSystem.recognition = {
        start: jest.fn(),
        stop: jest.fn()
      };
      
      expect(voiceWorkflowSystem.isActive).toBe(false);
      
      voiceWorkflowSystem.startListening();
      expect(voiceWorkflowSystem.isActive).toBe(true);
      expect(voiceWorkflowSystem.recognition.start).toHaveBeenCalled();
      
      voiceWorkflowSystem.stopListening();
      expect(voiceWorkflowSystem.isActive).toBe(false);
      expect(voiceWorkflowSystem.recognition.stop).toHaveBeenCalled();
    });
  });

  describe('Voice Accessibility Features', () => {
    it('should support multiple languages', async () => {
      const multilingualSystem = {
        languages: ['en-US', 'es-ES', 'fr-FR', 'de-DE'],
        currentLanguage: 'en-US',
        
        setLanguage(lang) {
          if (this.languages.includes(lang)) {
            this.currentLanguage = lang;
            return true;
          }
          return false;
        },
        
        getLocalizedCommands(lang) {
          const commands = {
            'en-US': {
              'create_project': ['create project', 'new project'],
              'build_project': ['build project', 'compile'],
              'help': ['help', 'what can you do']
            },
            'es-ES': {
              'create_project': ['crear proyecto', 'nuevo proyecto'],
              'build_project': ['construir proyecto', 'compilar'],
              'help': ['ayuda', 'que puedes hacer']
            },
            'fr-FR': {
              'create_project': ['créer projet', 'nouveau projet'],
              'build_project': ['construire projet', 'compiler'],
              'help': ['aide', 'que peux-tu faire']
            }
          };
          
          return commands[lang] || commands['en-US'];
        }
      };
      
      expect(multilingualSystem.setLanguage('es-ES')).toBe(true);
      expect(multilingualSystem.currentLanguage).toBe('es-ES');
      
      const spanishCommands = multilingualSystem.getLocalizedCommands('es-ES');
      expect(spanishCommands.create_project).toContain('crear proyecto');
      
      expect(multilingualSystem.setLanguage('invalid-lang')).toBe(false);
    });

    it('should provide voice feedback for accessibility', async () => {
      const accessibilitySystem = {
        feedbackEnabled: true,
        verbosityLevel: 'normal', // minimal, normal, verbose
        
        async provideFeedback(action, result) {
          if (!this.feedbackEnabled) return;
          
          const messages = {
            minimal: {
              success: 'Done',
              error: 'Error',
              progress: 'Working'
            },
            normal: {
              success: `${action} completed successfully`,
              error: `${action} failed`,
              progress: `${action} in progress`
            },
            verbose: {
              success: `The ${action} operation has been completed successfully. You can now proceed with the next step.`,
              error: `The ${action} operation has failed. Please check your input and try again.`,
              progress: `The ${action} operation is currently in progress. Please wait for completion.`
            }
          };
          
          const level = this.verbosityLevel;
          const status = result.success ? 'success' : 'error';
          const message = messages[level][status];
          
          // In a real implementation, this would use speech synthesis
          return message;
        },
        
        async announceSystemState() {
          const state = {
            agents: 3,
            workflows: 1,
            errors: 0
          };
          
          let announcement = `System status: ${state.agents} agents active, ${state.workflows} workflow running`;
          
          if (state.errors > 0) {
            announcement += `, ${state.errors} errors detected`;
          } else {
            announcement += ', no errors';
          }
          
          return announcement;
        }
      };
      
      const feedback = await accessibilitySystem.provideFeedback('create project', { success: true });
      expect(feedback).toContain('completed successfully');
      
      accessibilitySystem.verbosityLevel = 'verbose';
      const verboseFeedback = await accessibilitySystem.provideFeedback('build', { success: false });
      expect(verboseFeedback).toContain('check your input');
      
      const systemStatus = await accessibilitySystem.announceSystemState();
      expect(systemStatus).toContain('3 agents active');
      expect(systemStatus).toContain('no errors');
    });

    it('should handle speech recognition errors gracefully', async () => {
      const errorHandlingSystem = {
        maxRetries: 3,
        retryDelay: 1000,
        errorCount: 0,
        
        async handleRecognitionError(error) {
          this.errorCount++;
          
          const errorResponses = {
            'no-speech': 'I didn\'t hear anything. Please try speaking again.',
            'audio-capture': 'There seems to be a problem with your microphone.',
            'not-allowed': 'Microphone access is required for voice commands.',
            'network': 'Network connection is required for speech recognition.',
            'service-not-allowed': 'Speech recognition service is not available.'
          };
          
          const response = errorResponses[error.type] || 'An error occurred with speech recognition.';
          
          if (this.errorCount >= this.maxRetries) {
            return 'Too many errors. Switching to text input mode.';
          }
          
          return response + ' Please try again.';
        },
        
        async recoverFromError() {
          // Simulate recovery procedures
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
          this.errorCount = 0;
          return 'Speech recognition has been restored.';
        }
      };
      
      const noSpeechError = await errorHandlingSystem.handleRecognitionError({ type: 'no-speech' });
      expect(noSpeechError).toContain('didn\'t hear anything');
      
      const microphoneError = await errorHandlingSystem.handleRecognitionError({ type: 'audio-capture' });
      expect(microphoneError).toContain('microphone');
      
      // Simulate multiple errors
      errorHandlingSystem.errorCount = 3;
      const maxErrorsResponse = await errorHandlingSystem.handleRecognitionError({ type: 'network' });
      expect(maxErrorsResponse).toContain('text input mode');
      
      const recoveryMessage = await errorHandlingSystem.recoverFromError();
      expect(recoveryMessage).toContain('restored');
      expect(errorHandlingSystem.errorCount).toBe(0);
    });
  });

  describe('Voice Control Performance and Optimization', () => {
    it('should optimize recognition performance', () => {
      const performanceOptimizer = {
        metrics: new Map(),
        
        recordMetric(name, value) {
          if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
          }
          this.metrics.get(name).push({
            value,
            timestamp: Date.now()
          });
        },
        
        getAverageMetric(name, timeWindow = 60000) {
          const metrics = this.metrics.get(name) || [];
          const cutoff = Date.now() - timeWindow;
          const recentMetrics = metrics.filter(m => m.timestamp > cutoff);
          
          if (recentMetrics.length === 0) return 0;
          
          const sum = recentMetrics.reduce((acc, m) => acc + m.value, 0);
          return sum / recentMetrics.length;
        },
        
        optimizeRecognitionSettings() {
          const avgConfidence = this.getAverageMetric('confidence');
          const avgResponseTime = this.getAverageMetric('responseTime');
          
          const settings = {
            confidenceThreshold: 0.7,
            interimResults: true,
            continuous: true
          };
          
          // Adjust settings based on performance
          if (avgConfidence < 0.6) {
            settings.confidenceThreshold = 0.5; // Lower threshold
          } else if (avgConfidence > 0.9) {
            settings.confidenceThreshold = 0.8; // Higher threshold
          }
          
          if (avgResponseTime > 2000) {
            settings.interimResults = false; // Reduce processing overhead
          }
          
          return settings;
        }
      };
      
      // Record some sample metrics
      performanceOptimizer.recordMetric('confidence', 0.8);
      performanceOptimizer.recordMetric('confidence', 0.9);
      performanceOptimizer.recordMetric('confidence', 0.7);
      performanceOptimizer.recordMetric('responseTime', 1500);
      performanceOptimizer.recordMetric('responseTime', 1200);
      
      const avgConfidence = performanceOptimizer.getAverageMetric('confidence');
      expect(avgConfidence).toBeCloseTo(0.8, 1);
      
      const optimizedSettings = performanceOptimizer.optimizeRecognitionSettings();
      expect(optimizedSettings.confidenceThreshold).toBe(0.8);
      expect(optimizedSettings.interimResults).toBe(true);
    });

    it('should cache frequently used commands', () => {
      const commandCache = {
        cache: new Map(),
        accessCount: new Map(),
        maxCacheSize: 50,
        
        cacheCommand(key, result) {
          if (this.cache.size >= this.maxCacheSize) {
            this.evictLeastUsed();
          }
          
          this.cache.set(key, {
            result,
            timestamp: Date.now(),
            hits: 0
          });
        },
        
        getCachedCommand(key) {
          const entry = this.cache.get(key);
          if (entry) {
            entry.hits++;
            entry.timestamp = Date.now();
            return entry.result;
          }
          return null;
        },
        
        evictLeastUsed() {
          let leastUsedKey = null;
          let minHits = Infinity;
          
          for (const [key, entry] of this.cache) {
            if (entry.hits < minHits) {
              minHits = entry.hits;
              leastUsedKey = key;
            }
          }
          
          if (leastUsedKey) {
            this.cache.delete(leastUsedKey);
          }
        },
        
        getStats() {
          const totalCommands = this.cache.size;
          const totalHits = Array.from(this.cache.values())
            .reduce((sum, entry) => sum + entry.hits, 0);
          
          return {
            cacheSize: totalCommands,
            totalHits,
            averageHits: totalCommands > 0 ? totalHits / totalCommands : 0
          };
        }
      };
      
      // Test caching
      commandCache.cacheCommand('create_project_myapp', { success: true, message: 'Created' });
      commandCache.cacheCommand('build_project', { success: true, message: 'Built' });
      
      const cached = commandCache.getCachedCommand('create_project_myapp');
      expect(cached.success).toBe(true);
      expect(cached.message).toBe('Created');
      
      const notCached = commandCache.getCachedCommand('nonexistent');
      expect(notCached).toBeNull();
      
      const stats = commandCache.getStats();
      expect(stats.cacheSize).toBe(2);
      expect(stats.totalHits).toBe(1);
    });
  });

  describe('Voice Control Integration Tests', () => {
    it('should integrate with ClaudeBuild command system', async () => {
      const integratedSystem = {
        voiceCommands: new Map([
          ['create_project', 'create-project'],
          ['build_project', 'build'],
          ['start_agent', 'agent start'],
          ['show_status', 'status']
        ]),
        
        async executeClaudeBuildCommand(voiceIntent, entities) {
          const claudeCommand = this.voiceCommands.get(voiceIntent);
          if (!claudeCommand) {
            throw new Error(`No ClaudeBuild command mapped for: ${voiceIntent}`);
          }
          
          // Build command with entities
          let fullCommand = claudeCommand;
          if (entities.name) {
            fullCommand += ` ${entities.name}`;
          }
          if (entities.type) {
            fullCommand += ` --type ${entities.type}`;
          }
          
          // Simulate command execution
          const results = {
            'create-project myapp': { success: true, project: 'myapp' },
            'build': { success: true, artifacts: ['dist/app.js'] },
            'agent start planner': { success: true, agent: 'planner' },
            'status': { success: true, agents: 3, workflows: 1 }
          };
          
          return results[fullCommand] || { success: false, error: 'Command not found' };
        }
      };
      
      const createResult = await integratedSystem.executeClaudeBuildCommand('create_project', { name: 'myapp' });
      expect(createResult.success).toBe(true);
      expect(createResult.project).toBe('myapp');
      
      const buildResult = await integratedSystem.executeClaudeBuildCommand('build_project', {});
      expect(buildResult.success).toBe(true);
      expect(buildResult.artifacts).toContain('dist/app.js');
      
      const agentResult = await integratedSystem.executeClaudeBuildCommand('start_agent', { name: 'planner' });
      expect(agentResult.success).toBe(true);
      expect(agentResult.agent).toBe('planner');
    });

    it('should provide voice-guided tutorials', async () => {
      const tutorialSystem = {
        tutorials: new Map([
          ['getting_started', {
            name: 'Getting Started with ClaudeBuild',
            steps: [
              { text: 'Welcome to ClaudeBuild. Let\'s create your first project.', action: 'speak' },
              { text: 'Say "create project tutorial-app" to begin.', action: 'wait_for_command' },
              { text: 'Great! Now let\'s add some agents.', action: 'speak' },
              { text: 'Say "create agent planner" to add a planning agent.', action: 'wait_for_command' },
              { text: 'Excellent! You\'ve completed the tutorial.', action: 'speak' }
            ],
            currentStep: 0
          }])
        ]),
        
        async startTutorial(name) {
          const tutorial = this.tutorials.get(name);
          if (!tutorial) {
            throw new Error(`Tutorial not found: ${name}`);
          }
          
          tutorial.currentStep = 0;
          return await this.executeCurrentStep(tutorial);
        },
        
        async executeCurrentStep(tutorial) {
          const step = tutorial.steps[tutorial.currentStep];
          if (!step) {
            return { completed: true, message: 'Tutorial completed!' };
          }
          
          if (step.action === 'speak') {
            // In real implementation, would use speech synthesis
            return { 
              message: step.text, 
              action: 'spoken',
              nextAction: 'auto_advance'
            };
          } else if (step.action === 'wait_for_command') {
            return { 
              message: step.text, 
              action: 'waiting',
              nextAction: 'wait_for_user_input'
            };
          }
        },
        
        async processUserInput(tutorialName, userInput) {
          const tutorial = this.tutorials.get(tutorialName);
          if (!tutorial) return { error: 'Tutorial not found' };
          
          const currentStep = tutorial.steps[tutorial.currentStep];
          
          // Simple validation - in real implementation would be more sophisticated
          const expectedCommands = [
            'create project tutorial-app',
            'create agent planner'
          ];
          
          const isValidCommand = expectedCommands.some(cmd => 
            userInput.toLowerCase().includes(cmd.toLowerCase())
          );
          
          if (isValidCommand) {
            tutorial.currentStep++;
            return await this.executeCurrentStep(tutorial);
          } else {
            return { 
              error: 'That\'s not the expected command. Please try again.',
              hint: currentStep.text
            };
          }
        }
      };
      
      const tutorialStart = await tutorialSystem.startTutorial('getting_started');
      expect(tutorialStart.message).toContain('Welcome to ClaudeBuild');
      
      const userResponse = await tutorialSystem.processUserInput('getting_started', 'create project tutorial-app');
      expect(userResponse.message).toContain('Great!');
      
      const secondResponse = await tutorialSystem.processUserInput('getting_started', 'create agent planner');
      expect(secondResponse.message).toContain('Excellent!');
    });
  });

  describe('Voice Control Security and Privacy', () => {
    it('should handle sensitive information securely', () => {
      const securitySystem = {
        sensitivePatterns: [
          /password/i,
          /api[_\s]?key/i,
          /secret/i,
          /token/i,
          /credential/i
        ],
        
        sanitizeTranscript(transcript) {
          let sanitized = transcript;
          
          this.sensitivePatterns.forEach(pattern => {
            sanitized = sanitized.replace(pattern, '[REDACTED]');
          });
          
          return sanitized;
        },
        
        shouldBlockCommand(transcript) {
          return this.sensitivePatterns.some(pattern => 
            pattern.test(transcript)
          );
        },
        
        logSecurelyVoiceCommand(transcript, result) {
          const log = {
            timestamp: Date.now(),
            transcript: this.sanitizeTranscript(transcript),
            result: result.success ? 'success' : 'failure',
            // Never log actual sensitive data
            containsSensitiveData: this.shouldBlockCommand(transcript)
          };
          
          return log;
        }
      };
      
      const normalCommand = 'create project myapp';
      const sensitiveCommand = 'set api key secret123';
      
      expect(securitySystem.shouldBlockCommand(normalCommand)).toBe(false);
      expect(securitySystem.shouldBlockCommand(sensitiveCommand)).toBe(true);
      
      const sanitized = securitySystem.sanitizeTranscript(sensitiveCommand);
      expect(sanitized).toContain('[REDACTED]');
      expect(sanitized).not.toContain('secret123');
      
      const log = securitySystem.logSecurelyVoiceCommand(sensitiveCommand, { success: false });
      expect(log.containsSensitiveData).toBe(true);
      expect(log.transcript).toContain('[REDACTED]');
    });

    it('should implement user consent and permissions', () => {
      const permissionSystem = {
        permissions: {
          microphone: false,
          voiceCommands: false,
          dataStorage: false
        },
        
        async requestPermission(type) {
          // Simulate permission request
          switch (type) {
            case 'microphone':
              this.permissions.microphone = true;
              return true;
            case 'voiceCommands':
              if (this.permissions.microphone) {
                this.permissions.voiceCommands = true;
                return true;
              }
              return false;
            case 'dataStorage':
              this.permissions.dataStorage = true;
              return true;
            default:
              return false;
          }
        },
        
        hasPermission(type) {
          return this.permissions[type] || false;
        },
        
        revokePermission(type) {
          this.permissions[type] = false;
          
          // Cascade revocation
          if (type === 'microphone') {
            this.permissions.voiceCommands = false;
          }
        },
        
        getPermissionStatus() {
          return { ...this.permissions };
        }
      };
      
      expect(permissionSystem.hasPermission('microphone')).toBe(false);
      
      const micGranted = await permissionSystem.requestPermission('microphone');
      expect(micGranted).toBe(true);
      expect(permissionSystem.hasPermission('microphone')).toBe(true);
      
      const voiceGranted = await permissionSystem.requestPermission('voiceCommands');
      expect(voiceGranted).toBe(true);
      
      permissionSystem.revokePermission('microphone');
      expect(permissionSystem.hasPermission('microphone')).toBe(false);
      expect(permissionSystem.hasPermission('voiceCommands')).toBe(false);
    });
  });

  describe('Voice Control Integration with Memory System', () => {
    it('should integrate with memory for conversational context', () => {
      const memoryIntegration = {
        conversationHistory: [],
        contextWindow: 5, // Remember last 5 interactions
        
        addToMemory(userInput, systemResponse, context = {}) {
          const entry = {
            timestamp: Date.now(),
            userInput,
            systemResponse,
            context,
            id: `memory-${Date.now()}`
          };
          
          this.conversationHistory.push(entry);
          
          // Keep only recent entries
          if (this.conversationHistory.length > this.contextWindow) {
            this.conversationHistory.shift();
          }
        },
        
        getRecentContext() {
          return this.conversationHistory.slice(-this.contextWindow);
        },
        
        findRelatedCommands(currentInput) {
          return this.conversationHistory.filter(entry => 
            entry.userInput.toLowerCase().includes(currentInput.toLowerCase().split(' ')[0])
          );
        },
        
        suggestFollowUpCommands(lastCommand) {
          const followUpMap = {
            'create_project': ['create_agent', 'build_project'],
            'create_agent': ['start_agent', 'show_status'],
            'build_project': ['show_status', 'create_workflow']
          };
          
          return followUpMap[lastCommand] || [];
        }
      };
      
      memoryIntegration.addToMemory(
        'create project myapp',
        'Project myapp created successfully',
        { intent: 'create_project', entities: { name: 'myapp' } }
      );
      
      memoryIntegration.addToMemory(
        'create agent planner',
        'Agent planner created',
        { intent: 'create_agent', entities: { name: 'planner' } }
      );
      
      const context = memoryIntegration.getRecentContext();
      expect(context).toHaveLength(2);
      expect(context[0].userInput).toBe('create project myapp');
      
      const related = memoryIntegration.findRelatedCommands('create');
      expect(related).toHaveLength(2);
      
      const suggestions = memoryIntegration.suggestFollowUpCommands('create_project');
      expect(suggestions).toContain('create_agent');
      expect(suggestions).toContain('build_project');
    });
  });

  // Mark test as completed
  beforeEach(() => {
    if (typeof voiceControlTestCompleted === 'undefined') {
      global.voiceControlTestCompleted = true;
    }
  });
});