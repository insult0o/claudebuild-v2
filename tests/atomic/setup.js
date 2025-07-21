/**
 * Jest Setup for ClaudeBuild v2 Atomic Level Tests
 * Global test environment configuration and utilities
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Global test utilities
global.testUtils = {
  // Create temporary directory for test
  createTempDir: (prefix = 'claudebuild-test-') => {
    return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  },
  
  // Clean up temporary directory
  cleanupTempDir: (dir) => {
    if (dir && fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  },
  
  // Wait for async operation
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Generate test data
  generateTestData: {
    agent: (overrides = {}) => ({
      id: `agent-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      name: 'test-agent',
      role: 'testing',
      status: 'idle',
      created: new Date().toISOString(),
      ...overrides
    }),
    
    workflow: (overrides = {}) => ({
      id: `workflow-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      name: 'test-workflow',
      status: 'created',
      steps: [],
      created: new Date().toISOString(),
      ...overrides
    }),
    
    project: (overrides = {}) => ({
      name: 'test-project',
      type: 'web-app',
      version: '1.0.0',
      created: new Date().toISOString(),
      ...overrides
    })
  },
  
  // Mock factories
  createMockLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }),
  
  createMockEventEmitter: () => {
    const events = new Map();
    return {
      on: jest.fn((event, handler) => {
        if (!events.has(event)) events.set(event, []);
        events.get(event).push(handler);
      }),
      emit: jest.fn((event, data) => {
        if (events.has(event)) {
          events.get(event).forEach(handler => handler(data));
        }
      }),
      off: jest.fn((event, handler) => {
        if (events.has(event)) {
          const handlers = events.get(event);
          const index = handlers.indexOf(handler);
          if (index > -1) handlers.splice(index, 1);
        }
      })
    };
  },
  
  // Assertion helpers
  expectEventuallyTrue: async (condition, timeout = 5000, interval = 100) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (condition()) return true;
      await global.testUtils.wait(interval);
    }
    throw new Error(`Condition not met within ${timeout}ms`);
  },
  
  expectValidUUID: (value) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(uuidRegex.test(value)).toBe(true);
  },
  
  expectValidTimestamp: (value) => {
    const timestamp = new Date(value);
    expect(timestamp.getTime()).not.toBeNaN();
    expect(timestamp.getTime()).toBeGreaterThan(0);
  },
  
  // Performance helpers
  measurePerformance: async (operation, name = 'operation') => {
    const start = process.hrtime.bigint();
    const result = await operation();
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds
    
    return {
      result,
      duration,
      name,
      timestamp: Date.now()
    };
  },
  
  // Memory helpers
  getMemoryUsage: () => {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024 * 100) / 100, // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100, // MB
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100, // MB
      external: Math.round(usage.external / 1024 / 1024 * 100) / 100 // MB
    };
  }
};

// Global mock implementations
global.mockImplementations = {
  // Mock File System
  mockFS: {
    existsSync: jest.fn(),
    readFileSync: jest.fn(),
    writeFileSync: jest.fn(),
    mkdirSync: jest.fn(),
    rmSync: jest.fn(),
    readdirSync: jest.fn()
  },
  
  // Mock Process
  mockProcess: {
    env: { ...process.env },
    argv: [...process.argv],
    cwd: jest.fn(() => process.cwd()),
    exit: jest.fn()
  },
  
  // Mock Network
  mockHttp: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  }
};

// Test environment setup
beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.CLAUDEBUILD_TEST_MODE = 'atomic';
  
  // Silence console output during tests (unless explicitly enabled)
  if (!process.env.CLAUDEBUILD_TEST_VERBOSE) {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  }
});

afterEach(() => {
  // Cleanup test environment variables
  delete process.env.CLAUDEBUILD_TEST_MODE;
  
  // Restore console if mocked
  if (console.log.mockRestore) {
    console.log.mockRestore();
    console.warn.mockRestore();
    console.error.mockRestore();
  }
});

// Global error handling for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process in test mode, just log
});

// Increase default timeout for integration tests
jest.setTimeout(30000);

// Custom matchers
expect.extend({
  toBeValidAgent(received) {
    const pass = (
      typeof received === 'object' &&
      received !== null &&
      typeof received.id === 'string' &&
      typeof received.name === 'string' &&
      typeof received.role === 'string' &&
      ['idle', 'running', 'stopped', 'failed', 'completed'].includes(received.status)
    );
    
    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to be a valid agent`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${JSON.stringify(received)} to be a valid agent`,
        pass: false
      };
    }
  },
  
  toBeValidWorkflow(received) {
    const pass = (
      typeof received === 'object' &&
      received !== null &&
      typeof received.id === 'string' &&
      typeof received.name === 'string' &&
      Array.isArray(received.steps) &&
      ['created', 'running', 'completed', 'failed'].includes(received.status)
    );
    
    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to be a valid workflow`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${JSON.stringify(received)} to be a valid workflow`,
        pass: false
      };
    }
  },
  
  toHaveValidPerformance(received, maxDuration = 1000) {
    const pass = (
      typeof received === 'object' &&
      received !== null &&
      typeof received.duration === 'number' &&
      received.duration >= 0 &&
      received.duration <= maxDuration
    );
    
    if (pass) {
      return {
        message: () => `expected performance ${received.duration}ms not to be within acceptable range (0-${maxDuration}ms)`,
        pass: true
      };
    } else {
      return {
        message: () => `expected performance ${received.duration}ms to be within acceptable range (0-${maxDuration}ms)`,
        pass: false
      };
    }
  }
});

console.log('🔧 ClaudeBuild v2 Atomic Test Suite Setup Complete');
console.log(`📊 Jest Version: ${require('jest/package.json').version}`);
console.log(`🟢 Node Version: ${process.version}`);
console.log(`🖥️  Platform: ${process.platform}`);