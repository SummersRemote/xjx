/** @type {import('ts-jest').JestConfigWithTsJest} */
const config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom', // Use jsdom for browser-like environment
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/xjx.full.ts',
    '!src/core/adapters/dom-adapter.ts', // Complex DOM adapter with environment detection
  ],
  testMatch: [
    'test/unit/**/*.ts?(x)',
    '**/?(*.)+(spec|test).ts?(x)'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/test/jest.setup.ts'
  ],
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: 'reports/',
      filename: 'test-report.html',
      expand: false, // expands test case results
      includeFailureMsg: true,
      includeConsoleLog: true
    }]
  ],
  // Configure the timeout for each test (in milliseconds)
  testTimeout: 10000,
  // Verbose output with detailed test results
  verbose: true,
  // Add global teardown to clean up any resources
  globalTeardown: '<rootDir>/test/jest.teardown.js'
};

export default config;