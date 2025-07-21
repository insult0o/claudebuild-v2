/** @type {import('jest').Config} */
const config = {
  // ClaudeBuild v2.1.0 Superior Testing Configuration
  displayName: 'ClaudeBuild v2.1.0 - Industry Leading Test Suite',
  
  // Test environment configuration
  testEnvironment: 'node',
  testEnvironmentOptions: {
    node: {
      // Enable ES modules for modern JavaScript
      experimentalVmModules: true
    }
  },

  // Coverage configuration - Industry leading 85%+ target
  collectCoverage: true,
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.{js,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.config.{js,ts}',
    '!src/**/index.{js,ts}',
    '!**/node_modules/**',
    '!**/vendor/**'
  ],
  
  // Coverage thresholds - Exceeds all competitors
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    },
    // Critical agent coordination requires 95% coverage
    'src/enhanced-mcp/': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    },
    // BMAD workflow validation requires 95% coverage
    'src/agents/': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    },
    // GUI components require 80% coverage
    'src/gui/': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  // Test file patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.{js,ts,tsx}',
    '<rootDir>/src/**/__tests__/**/*.{js,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,ts,tsx}'
  ],

  // Module resolution
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
    '^@mocks/(.*)$': '<rootDir>/tests/mocks/$1'
  },

  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup/jest.setup.js',
    '<rootDir>/tests/setup/agent.setup.js',
    '<rootDir>/tests/setup/mcp.setup.js'
  ],

  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        jsx: 'react-jsx'
      }
    }],
    '^.+\\.(js|jsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-react', { runtime: 'automatic' }]
      ]
    }]
  },

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Test timeout configuration - Optimized for fast feedback
  testTimeout: 10000, // 10 seconds max per test
  slowTestThreshold: 5000, // Warn if test takes >5 seconds

  // Performance optimization
  maxWorkers: '75%', // Use 75% of available CPU cores
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',

  // Reporter configuration
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'coverage',
      outputName: 'junit.xml',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}',
      ancestorSeparator: ' › '
    }],
    ['@jest/reporters/coverage-reporter.js', {
      includeConsoleOutput: true
    }]
  ],

  // Error handling
  errorOnDeprecated: true,
  bail: false, // Run all tests to get complete coverage picture
  verbose: true,

  // Mock configuration
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Global test configuration
  globals: {
    'ts-jest': {
      useESM: true
    },
    // ClaudeBuild test environment variables
    CLAUDEBUILD_TEST_MODE: true,
    CLAUDEBUILD_QUALITY_STANDARD: 99,
    MCP_SERVER_URL: 'ws://localhost:8080/test-mcp'
  },

  // Test projects for different test types
  projects: [
    // Unit tests project
    {
      displayName: 'Unit Tests',
      testMatch: ['<rootDir>/tests/unit/**/*.test.{js,ts,tsx}'],
      testEnvironment: 'node',
      maxWorkers: '100%', // Fully parallel unit tests
      testTimeout: 5000    // Fast unit tests
    },
    
    // Integration tests project  
    {
      displayName: 'Integration Tests',
      testMatch: ['<rootDir>/tests/integration/**/*.test.{js,ts,tsx}'],
      testEnvironment: 'node',
      maxWorkers: '50%',  // Limited parallelism for integration
      testTimeout: 15000,  // Longer timeout for integration
      setupFilesAfterEnv: [
        '<rootDir>/tests/setup/jest.setup.js',
        '<rootDir>/tests/setup/integration.setup.js'
      ]
    },

    // GUI tests project
    {
      displayName: 'GUI Tests',
      testMatch: ['<rootDir>/tests/gui/**/*.test.{js,ts,tsx}'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: [
        '<rootDir>/tests/setup/jest.setup.js',
        '<rootDir>/tests/setup/gui.setup.js'
      ],
      moduleNameMapping: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2)$': '<rootDir>/tests/mocks/fileMock.js'
      }
    }
  ],

  // Watch mode configuration
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/',
    '<rootDir>/.git/',
    '<rootDir>/dist/',
    '<rootDir>/build/'
  ],

  // Competitive advantage validation
  testResultsProcessor: '<rootDir>/tests/processors/competitive-analysis.js',
  
  // Custom test environment for ClaudeBuild features
  globalSetup: '<rootDir>/tests/setup/global.setup.js',
  globalTeardown: '<rootDir>/tests/setup/global.teardown.js'
};

module.exports = config;