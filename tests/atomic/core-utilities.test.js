/**
 * ClaudeBuild v2 - Atomic Level Core Utilities Test Suite
 * Tests the most fundamental building blocks of the system
 */

const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Import core utilities
const { ConfigManager } = require('../../src/core/config');
const Logger = require('../../src/cli/utils/logger');
const Validator = require('../../src/cli/utils/validator');
const ProgressBar = require('../../src/cli/utils/progress-bar');
const FormattingUtils = require('../../src/cli/utils/formatting');

describe('Core Utilities - Atomic Level Tests', () => {
  let tempDir;
  
  beforeEach(() => {
    // Create isolated test environment
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'claudebuild-test-'));
    process.env.CLAUDEBUILD_TEST_DIR = tempDir;
  });
  
  afterEach(() => {
    // Clean up test environment
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    delete process.env.CLAUDEBUILD_TEST_DIR;
  });

  describe('Logger Utility', () => {
    let logger;
    let logOutput = [];
    
    beforeEach(() => {
      logOutput = [];
      logger = new Logger({
        level: 'debug',
        output: (message) => logOutput.push(message)
      });
    });

    it('should create logger instance', () => {
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.warn).toBe('function');
    });

    it('should log messages at different levels', () => {
      logger.info('Test info message');
      logger.error('Test error message');
      logger.debug('Test debug message');
      logger.warn('Test warning message');
      
      expect(logOutput.length).toBe(4);
      expect(logOutput[0]).toContain('Test info message');
      expect(logOutput[1]).toContain('Test error message');
      expect(logOutput[2]).toContain('Test debug message');
      expect(logOutput[3]).toContain('Test warning message');
    });

    it('should respect log levels', () => {
      const errorLogger = new Logger({
        level: 'error',
        output: (message) => logOutput.push(message)
      });
      
      errorLogger.debug('Debug message');
      errorLogger.info('Info message');
      errorLogger.warn('Warning message');
      errorLogger.error('Error message');
      
      expect(logOutput.length).toBe(1);
      expect(logOutput[0]).toContain('Error message');
    });

    it('should format log messages with timestamps', () => {
      logger.info('Timestamped message');
      
      expect(logOutput[0]).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(logOutput[0]).toContain('[INFO]');
      expect(logOutput[0]).toContain('Timestamped message');
    });

    it('should handle structured logging', () => {
      logger.info('Structured log', { 
        component: 'test',
        action: 'logging',
        data: { key: 'value' }
      });
      
      const lastLog = logOutput[logOutput.length - 1];
      expect(lastLog).toContain('component');
      expect(lastLog).toContain('test');
      expect(lastLog).toContain('action');
      expect(lastLog).toContain('logging');
    });
  });

  describe('Validator Utility', () => {
    it('should validate project names', () => {
      expect(Validator.isValidProjectName('my-project')).toBe(true);
      expect(Validator.isValidProjectName('my_project')).toBe(true);
      expect(Validator.isValidProjectName('myProject')).toBe(true);
      expect(Validator.isValidProjectName('123project')).toBe(true);
      
      expect(Validator.isValidProjectName('')).toBe(false);
      expect(Validator.isValidProjectName('my project')).toBe(false);
      expect(Validator.isValidProjectName('my@project')).toBe(false);
      expect(Validator.isValidProjectName('my/project')).toBe(false);
    });

    it('should validate configuration objects', () => {
      const validConfig = {
        name: 'test-project',
        type: 'cli',
        agents: ['planner', 'builder'],
        settings: { debug: true }
      };
      
      expect(Validator.validateConfig(validConfig)).toBe(true);
      
      const invalidConfig = {
        // missing required fields
        type: 'cli'
      };
      
      expect(Validator.validateConfig(invalidConfig)).toBe(false);
    });

    it('should validate agent configurations', () => {
      const validAgent = {
        name: 'planner',
        role: 'planning',
        enabled: true,
        config: {}
      };
      
      expect(Validator.validateAgentConfig(validAgent)).toBe(true);
      
      const invalidAgent = {
        name: '', // invalid name
        role: 'planning'
      };
      
      expect(Validator.validateAgentConfig(invalidAgent)).toBe(false);
    });

    it('should validate file paths', () => {
      expect(Validator.isValidFilePath('/path/to/file.js')).toBe(true);
      expect(Validator.isValidFilePath('./relative/path.js')).toBe(true);
      expect(Validator.isValidFilePath('../parent/path.js')).toBe(true);
      
      expect(Validator.isValidFilePath('')).toBe(false);
      expect(Validator.isValidFilePath('invalid|path')).toBe(false);
    });

    it('should validate command arguments', () => {
      expect(Validator.validateCommandArgs(['build', '--watch'])).toBe(true);
      expect(Validator.validateCommandArgs(['plan', 'my-feature'])).toBe(true);
      
      expect(Validator.validateCommandArgs([])).toBe(false);
      expect(Validator.validateCommandArgs([''])).toBe(false);
    });
  });

  describe('Progress Bar Utility', () => {
    let progressBar;
    let output = [];
    
    beforeEach(() => {
      output = [];
      progressBar = new ProgressBar({
        total: 100,
        width: 20,
        output: (line) => output.push(line)
      });
    });

    it('should create progress bar instance', () => {
      expect(progressBar).toBeDefined();
      expect(typeof progressBar.update).toBe('function');
      expect(typeof progressBar.increment).toBe('function');
      expect(typeof progressBar.complete).toBe('function');
    });

    it('should update progress correctly', () => {
      progressBar.update(50);
      expect(progressBar.current).toBe(50);
      expect(progressBar.percentage).toBe(50);
    });

    it('should increment progress correctly', () => {
      progressBar.increment(10);
      expect(progressBar.current).toBe(10);
      
      progressBar.increment(25);
      expect(progressBar.current).toBe(35);
    });

    it('should format progress bar display', () => {
      progressBar.update(50);
      const display = progressBar.render();
      
      expect(display).toContain('50%');
      expect(display).toContain('█'); // filled blocks
      expect(display).toContain('░'); // empty blocks
    });

    it('should handle completion', () => {
      progressBar.complete();
      expect(progressBar.current).toBe(100);
      expect(progressBar.percentage).toBe(100);
      expect(progressBar.isComplete).toBe(true);
    });

    it('should prevent overflow', () => {
      progressBar.update(150); // Over 100%
      expect(progressBar.current).toBe(100);
      expect(progressBar.percentage).toBe(100);
    });
  });

  describe('Formatting Utility', () => {
    it('should format timestamps', () => {
      const timestamp = FormattingUtils.formatTimestamp(new Date('2023-01-01T12:00:00Z'));
      expect(timestamp).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
    });

    it('should format file sizes', () => {
      expect(FormattingUtils.formatFileSize(1024)).toBe('1.0 KB');
      expect(FormattingUtils.formatFileSize(1048576)).toBe('1.0 MB');
      expect(FormattingUtils.formatFileSize(1073741824)).toBe('1.0 GB');
      expect(FormattingUtils.formatFileSize(500)).toBe('500 B');
    });

    it('should format durations', () => {
      expect(FormattingUtils.formatDuration(1000)).toBe('1.0s');
      expect(FormattingUtils.formatDuration(60000)).toBe('1m 0s');
      expect(FormattingUtils.formatDuration(3661000)).toBe('1h 1m 1s');
    });

    it('should colorize text', () => {
      expect(FormattingUtils.colorize('red', 'Error message')).toContain('\u001b[31m');
      expect(FormattingUtils.colorize('green', 'Success message')).toContain('\u001b[32m');
      expect(FormattingUtils.colorize('yellow', 'Warning message')).toContain('\u001b[33m');
      expect(FormattingUtils.colorize('blue', 'Info message')).toContain('\u001b[34m');
    });

    it('should create tables', () => {
      const data = [
        ['Name', 'Status', 'Duration'],
        ['Agent 1', 'Running', '2m 30s'],
        ['Agent 2', 'Complete', '1m 15s']
      ];
      
      const table = FormattingUtils.createTable(data);
      expect(table).toContain('Name');
      expect(table).toContain('Status');
      expect(table).toContain('Duration');
      expect(table).toContain('Agent 1');
      expect(table).toContain('Running');
    });

    it('should truncate long text', () => {
      const longText = 'This is a very long text that should be truncated';
      expect(FormattingUtils.truncate(longText, 20)).toBe('This is a very lo...');
      expect(FormattingUtils.truncate('Short', 20)).toBe('Short');
    });
  });

  describe('Secure Storage Utility', () => {
    let secureStorage;
    
    beforeEach(() => {
      const { SecureStorage } = require('../../src/core/config/secure-storage');
      secureStorage = new SecureStorage(tempDir);
    });

    it('should store and retrieve secrets', async () => {
      await secureStorage.store('api-key', 'secret-value');
      const retrieved = await secureStorage.retrieve('api-key');
      expect(retrieved).toBe('secret-value');
    });

    it('should encrypt stored data', async () => {
      await secureStorage.store('password', 'my-secret-password');
      
      // Check that raw file doesn't contain plain text
      const files = fs.readdirSync(tempDir);
      const secretFile = files.find(f => f.includes('secret'));
      if (secretFile) {
        const raw = fs.readFileSync(path.join(tempDir, secretFile), 'utf8');
        expect(raw).not.toContain('my-secret-password');
      }
    });

    it('should handle missing keys', async () => {
      const missing = await secureStorage.retrieve('non-existent');
      expect(missing).toBeNull();
    });

    it('should delete secrets', async () => {
      await secureStorage.store('temp-key', 'temp-value');
      expect(await secureStorage.retrieve('temp-key')).toBe('temp-value');
      
      await secureStorage.delete('temp-key');
      expect(await secureStorage.retrieve('temp-key')).toBeNull();
    });

    it('should list stored keys', async () => {
      await secureStorage.store('key1', 'value1');
      await secureStorage.store('key2', 'value2');
      
      const keys = await secureStorage.listKeys();
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
    });
  });

  describe('Path Utilities', () => {
    it('should resolve project paths correctly', () => {
      const { resolveProjectPath } = require('../../src/cli/utils/config');
      
      const projectPath = resolveProjectPath('./test-project');
      expect(path.isAbsolute(projectPath)).toBe(true);
      expect(projectPath).toContain('test-project');
    });

    it('should handle template paths', () => {
      const { getTemplatePath } = require('../../src/cli/utils/config');
      
      const templatePath = getTemplatePath('cli');
      expect(templatePath).toContain('templates');
      expect(templatePath).toContain('cli');
    });

    it('should validate directory structure', () => {
      const { validateProjectStructure } = require('../../src/cli/utils/config');
      
      // Create a valid project structure
      const projectDir = path.join(tempDir, 'valid-project');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(path.join(projectDir, 'package.json'), '{}');
      fs.mkdirSync(path.join(projectDir, 'src'));
      
      expect(validateProjectStructure(projectDir)).toBe(true);
      
      // Test invalid structure
      const invalidDir = path.join(tempDir, 'invalid-project');
      fs.mkdirSync(invalidDir, { recursive: true });
      
      expect(validateProjectStructure(invalidDir)).toBe(false);
    });
  });

  describe('Error Handling Utilities', () => {
    it('should create structured errors', () => {
      const { ClaudeBuildError } = require('../../src/cli/utils/logger');
      
      const error = new ClaudeBuildError('Test error', 'VALIDATION_ERROR', {
        component: 'validator',
        field: 'projectName'
      });
      
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.context.component).toBe('validator');
      expect(error.context.field).toBe('projectName');
    });

    it('should format error messages', () => {
      const { formatError } = require('../../src/cli/utils/formatting');
      
      const error = new Error('Something went wrong');
      error.code = 'TEST_ERROR';
      
      const formatted = formatError(error);
      expect(formatted).toContain('Something went wrong');
      expect(formatted).toContain('TEST_ERROR');
    });

    it('should handle async errors', async () => {
      const { withErrorHandling } = require('../../src/cli/utils/logger');
      
      let errorCaught = null;
      
      const wrappedFunction = withErrorHandling(async () => {
        throw new Error('Async error');
      }, (error) => {
        errorCaught = error;
      });
      
      await wrappedFunction();
      expect(errorCaught).toBeDefined();
      expect(errorCaught.message).toBe('Async error');
    });
  });

  describe('Atomic Integration Tests', () => {
    it('should integrate logger with progress bar', () => {
      const logMessages = [];
      const logger = new Logger({
        output: (msg) => logMessages.push(msg)
      });
      
      const progressBar = new ProgressBar({
        total: 3,
        onUpdate: (current, total) => {
          logger.info(`Progress: ${current}/${total}`);
        }
      });
      
      progressBar.increment();
      progressBar.increment();
      progressBar.complete();
      
      expect(logMessages.length).toBe(3);
      expect(logMessages[0]).toContain('Progress: 1/3');
      expect(logMessages[2]).toContain('Progress: 3/3');
    });

    it('should integrate validator with formatter', () => {
      const errors = [
        { field: 'name', message: 'Name is required' },
        { field: 'type', message: 'Invalid project type' }
      ];
      
      const isValid = errors.length === 0;
      expect(isValid).toBe(false);
      
      if (!isValid) {
        const errorTable = FormattingUtils.createTable([
          ['Field', 'Error'],
          ...errors.map(e => [e.field, e.message])
        ]);
        
        expect(errorTable).toContain('Field');
        expect(errorTable).toContain('Error');
        expect(errorTable).toContain('Name is required');
      }
    });
  });
});