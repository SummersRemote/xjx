# XJX Library Tests

This directory contains tests for the XJX library. The tests are written using Jest and run in a JSDOM environment to simulate browser behavior.

## Test Structure

- `XJX.test.ts` - Tests for the main facade class
- `utils/XMLUtil.test.ts` - Tests for XML utility functions
- `utils/JSONUtil.test.ts` - Tests for JSON utility functions
- `jest.setup.js` - Setup file for Jest testing environment

## Running Tests

To run the tests, use one of the following commands:

```bash
# Run all tests
npm test

# Run tests in watch mode (useful during development)
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Writing Tests

When writing tests for the XJX library, consider the following:

1. Tests should be placed in this `/test` directory, mirroring the structure of the `/src` directory
2. Each test file should focus on testing a single class or module
3. Use descriptive test names following the pattern: `it('should do something when something happens')`
4. Use the JSDOM environment to test browser-specific functionality
5. Clean up resources after each test to prevent memory leaks

## Test Environment

The tests run in a JSDOM environment, which provides browser-like globals such as `window`, `document`, `DOMParser`, and `XMLSerializer`. This allows us to test DOM operations without a real browser.

The `jest.setup.js` file configures the test environment and provides any necessary mocks for browser APIs that JSDOM doesn't implement.

## Coverage Requirements

New features should aim for at least 80% test coverage, with a focus on testing:

1. Normal usage patterns
2. Edge cases and error handling
3. Configuration options
4. Cross-environment compatibility

## Debugging Tests

If you encounter issues with tests, you can use the following techniques:

1. Run a single test file: `npx jest path/to/file.test.ts`
2. Debug a specific test: `npx jest -t "test name pattern" --runInBand`
3. Increase verbosity: `npx jest --verbose`
4. Debug in Node.js: Add `debugger` statements and run with `node --inspect-brk node_modules/.bin/jest --runInBand`