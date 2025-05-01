// Jest setup file
// This is useful for global setup before running tests

// Set up global mocks if needed
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

// Mock DOM environment components if needed
if (typeof window === 'undefined') {
  global.window = {};
}

// Add any other global mocks or setup needed for tests