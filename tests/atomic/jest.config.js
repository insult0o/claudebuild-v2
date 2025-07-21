/**
 * Jest Configuration for ClaudeBuild v2 Atomic Level Tests
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/tests/atomic/**/*.test.js'
  ],
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/tests/atomic/setup.js'
  ],
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/node_modules/**',
    '!src/**/dist/**'
  ],
  
  coverageDirectory: 'tests/atomic/coverage',
  
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'json',
    'lcov'
  ],
  
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Test timeout
  testTimeout: 30000,
  
  // Verbose output
  verbose: true,
  
  // Transform configuration
  transform: {
    '^.+\\.jsx?$': 'babel-jest'
  },
  
  // Module mapping for mocks
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },
  
  // Global setup and teardown
  globalSetup: '<rootDir>/tests/atomic/global-setup.js',
  globalTeardown: '<rootDir>/tests/atomic/global-teardown.js',
  
  // Mock configuration
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  // Error handling
  errorOnDeprecated: true,
  
  // Parallel test execution
  maxWorkers: '50%',
  
  // Test result processors
  testResultsProcessor: '<rootDir>/tests/atomic/results-processor.js',
  
  // Reporter configuration
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './tests/atomic/reports',
        filename: 'atomic-test-report.html',
        expand: true,
        hideIcon: false,
        pageTitle: 'ClaudeBuild v2 Atomic Tests'
      }
    ],
    [
      'jest-junit',
      {
        outputDirectory: './tests/atomic/reports',
        outputName: 'atomic-test-results.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true
      }
    ]
  ],
  
  // Test sequence and grouping
  testSequencer: '<rootDir>/tests/atomic/custom-sequencer.js'
};