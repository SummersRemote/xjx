/**
 * Registry system for XJX extensions
 * 
 * Provides a simple way to register methods that will be
 * automatically available on XJX instances.
 */

/**
 * Registry for extension methods
 */
export class ExtensionRegistry {
    /**
     * Map of registered methods
     */
    private static methods = new Map<string, Function>();
  
    /**
     * Register a method to be available on XJX instances
     * @param name Method name
     * @param method Method implementation
     */
    public static registerMethod(name: string, method: Function): void {
      if (ExtensionRegistry.methods.has(name)) {
        console.warn(`Method '${name}' is already registered. It will be overwritten.`);
      }
      ExtensionRegistry.methods.set(name, method);
    }
  
    /**
     * Get all registered methods
     * @returns Map of method names to implementations
     */
    public static getAllMethods(): Map<string, Function> {
      return new Map(ExtensionRegistry.methods);
    }
  
    /**
     * Check if a method is registered
     * @param name Method name
     * @returns Whether the method is registered
     */
    public static hasMethod(name: string): boolean {
      return ExtensionRegistry.methods.has(name);
    }
  
    /**
     * Clear all registered methods
     * For testing purposes
     */
    public static clearMethods(): void {
      ExtensionRegistry.methods.clear();
    }
  }