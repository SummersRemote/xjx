/**
 * Minimal registry for transformation operations
 * 
 * Only handles core transformation operations needed by converters.
 */
export class TransformationRegistry {
    /**
     * Map for transformation operations
     */
    private static transformationOperations = new Map<string, Function>();
  
    /**
     * Register a transformation operation (for internal use)
     * @param name Operation name
     * @param operation Operation implementation
     */
    public static registerOperation(name: string, operation: Function): void {
      if (TransformationRegistry.transformationOperations.has(name)) {
        console.warn(`Operation '${name}' is already registered. It will be overwritten.`);
      }
      TransformationRegistry.transformationOperations.set(name, operation);
    }
  
    /**
     * Get a transformation operation
     * @param name Operation name
     * @returns Operation implementation
     * @throws Error if operation is not found
     */
    public static getOperation(name: string): Function {
      const operation = TransformationRegistry.transformationOperations.get(name);
      if (!operation) {
        throw new Error(`Transformation operation '${name}' is not registered.`);
      }
      return operation;
    }
    
    /**
     * Clear all registered operations
     * For testing purposes
     */
    public static clearAll(): void {
      TransformationRegistry.transformationOperations.clear();
    }
  }