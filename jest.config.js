/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: 'node',
    extensionsToTreatAsEsm: ['.ts'],
    globals: {
      'ts-jest': {
        useESM: true
      }
    },
    moduleNameMapper: {
      '^(\.{1,2}/.*)\.js$': '$1'
    }
  };
  
  // src/index.ts
  export function greet(name: string): string {
    return `Hello, ${name}!`;
  }
  
  // test/index.test.ts
  import { greet } from '../src/index.js';
  
  test('greet returns the correct message', () => {
    expect(greet('World')).toBe('Hello, World!');
  });
  