/**
 * Global teardown for Jest tests.
 * Used to clean up any resources after all tests have run.
 */

// This module is executed after all tests have run.
// It can be used for clean-up tasks, like closing connections,
// removing temp files, or releasing other resources.

export default async function() {
    // Clean up JSDOM resources if needed
    // Using try/catch since the DOMAdapter might not be available in some test environments
    try {
      const { DOMAdapter } = await import('../src/core/adapters/dom-adapter.js');
      DOMAdapter.cleanup();
    } catch (error) {
      console.log('Note: Could not perform DOMAdapter cleanup.');
    }
    
    // Additional teardown code can be added here if needed
    console.log('\nTest suite execution completed. Teardown finished.');
  }