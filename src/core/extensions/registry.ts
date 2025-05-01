/**
 * Consolidated registry system for XJX extensions
 * 
 * Provides a unified way to register transformers, utility functions,
 * and transformation operations that will be available on XJX instances.
 */

/**
 * Registry for extensions and transformation operations
 */
export class ExtensionRegistry {
  /**
   * Maps for different types of extensions
   */
  private static transformers = new Map<string, Function>();
  private static utilities = new Map<string, Function>();
  private static transformationOperations = new Map<string, Function>();

  /**
   * Register a transformer method to be available on XJX instances
   * @param name Method name
   * @param method Method implementation
   */
  public static registerTransformer(name: string, method: Function): void {
    if (ExtensionRegistry.transformers.has(name)) {
      console.warn(`Transformer '${name}' is already registered. It will be overwritten.`);
    }
    ExtensionRegistry.transformers.set(name, method);
  }

  /**
   * Get all registered transformers
   * @returns Map of method names to implementations
   */
  public static getAllTransformers(): Map<string, Function> {
    return new Map(ExtensionRegistry.transformers);
  }

  /**
   * Register a utility method to be available on XJX instances
   * @param name Method name
   * @param method Method implementation
   */
  public static registerUtility(name: string, method: Function): void {
    if (ExtensionRegistry.utilities.has(name)) {
      console.warn(`Utility '${name}' is already registered. It will be overwritten.`);
    }
    ExtensionRegistry.utilities.set(name, method);
  }

  /**
   * Get all registered utilities
   * @returns Map of method names to implementations
   */
  public static getAllUtilities(): Map<string, Function> {
    return new Map(ExtensionRegistry.utilities);
  }

  /**
   * Register a transformation operation (for internal use)
   * @param name Operation name
   * @param operation Operation implementation
   */
  public static registerTransformationOperation(name: string, operation: Function): void {
    if (ExtensionRegistry.transformationOperations.has(name)) {
      console.warn(`Operation '${name}' is already registered. It will be overwritten.`);
    }
    ExtensionRegistry.transformationOperations.set(name, operation);
  }

  /**
   * Get a transformation operation
   * @param name Operation name
   * @returns Operation implementation
   * @throws Error if operation is not found
   */
  public static getTransformationOperation(name: string): Function {
    const operation = ExtensionRegistry.transformationOperations.get(name);
    if (!operation) {
      throw new Error(`Transformation operation '${name}' is not registered.`);
    }
    return operation;
  }

  /**
   * Check if a transformation operation is registered
   * @param name Operation name
   * @returns Whether the operation is registered
   */
  public static hasTransformationOperation(name: string): boolean {
    return ExtensionRegistry.transformationOperations.has(name);
  }

  /**
   * Check if a utility method is registered
   * @param name Method name
   * @returns Whether the method is registered
   */
  public static hasUtility(name: string): boolean {
    return ExtensionRegistry.utilities.has(name);
  }

  /**
   * Check if a transformer method is registered
   * @param name Method name
   * @returns Whether the method is registered
   */
  public static hasTransformer(name: string): boolean {
    return ExtensionRegistry.transformers.has(name);
  }
  
  /**
   * Clear all registered methods and operations
   * For testing purposes
   */
  public static clearAll(): void {
    ExtensionRegistry.transformers.clear();
    ExtensionRegistry.utilities.clear();
    ExtensionRegistry.transformationOperations.clear();
  }
}