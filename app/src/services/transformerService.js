// services/TransformerService.js
import { toBoolean, toNumber, regex, compose } from "../../../dist/esm/index.js";
import LoggingService from "./loggingService.js";

/**
 * Service for managing transform operations
 */
class TransformerService {
  /**
   * Create transformer functions from transform objects
   * @param {Array} transforms - Array of transform objects
   * @returns {Array} Array of transform functions
   */
  createTransformers(transforms) {
    if (!transforms || transforms.length === 0) return [];

    return transforms.map(transform => {
      const type = transform.type;
      const options = transform.options || {};

      switch (type) {
        case 'BooleanTransform':
          return toBoolean(options);
        case 'NumberTransform':
          return toNumber(options);
        case 'RegexTransform':
          if (options.pattern) {
            return regex(options.pattern, options.replacement || '', options);
          }
          return null;
        default:
          LoggingService.warn(`Unknown transform type: ${type}`);
          return null;
      }
    }).filter(Boolean); // Remove null items
  }

  /**
   * Combine multiple transform functions into a single function
   * @param {Array} transformFunctions - Array of transform functions
   * @returns {Function} Combined transform function
   */
  combineTransformers(transformFunctions) {
    if (!transformFunctions || transformFunctions.length === 0) {
      return null;
    }
    
    // Use compose to combine all transforms into a single function
    return compose(...transformFunctions);
  }

  /**
   * Create a function from a string
   * @param {string} functionString - Function string
   * @returns {Function} Created function
   */
  createFunction(functionString) {
    try {
      // Clean up the function string
      let cleanFunctionString = functionString.trim();
      
      // If it doesn't start with function, node =>, or similar, assume it's a function body
      if (!cleanFunctionString.startsWith('function') && 
          !cleanFunctionString.startsWith('(') && 
          !cleanFunctionString.includes('=>')) {
        cleanFunctionString = `node => ${cleanFunctionString}`;
      }
      
      // Try to create the function
      return new Function('return ' + cleanFunctionString)();
    } catch (err) {
      LoggingService.error('Error creating function from string:', err);
      
      // Provide a fallback function that does nothing
      return () => false;
    }
  }
}

// Export as a singleton instance
export default new TransformerService();