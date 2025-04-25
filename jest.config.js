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
  ],
  testMatch: [
    '**/test/**/*.ts?(x)', // Look for tests in the test directory
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
  ]
};

export default config;