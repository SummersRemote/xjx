/**
 * Unified Registry System for XJX
 * 
 * Combines the functionality of TransformationRegistry and ExtensionRegistry
 * to provide a single point of registration for all extension types.
 */

/**
 * Types of registrable components
 */
export enum RegistryType {
  TRANSFORMER = 'transformer',
  UTILITY = 'utility',
  TRANSFORM_OPERATION = 'transformOperation',
  EXTENSION = 'extension'
}

/**
 * Unified registry for all XJX extensions
 */
export class UnifiedRegistry {
  private static registry = new Map<RegistryType, Map<string, Function>>();
  
  // Initialize registry maps for each type
  static {
    Object.values(RegistryType).forEach(type => {
      UnifiedRegistry.registry.set(type, new Map<string, Function>());
    });
  }
  
  /**
   * Register a component in the registry
   * @param type Registry type
   * @param name Component name
   * @param implementation Component implementation
   */
  public static register(type: RegistryType, name: string, implementation: Function): void {
    const typeRegistry = UnifiedRegistry.getTypeRegistry(type);
    
    if (typeRegistry.has(name)) {
      console.warn(`${type} '${name}' is already registered. It will be overwritten.`);
    }
    
    typeRegistry.set(name, implementation);
  }
  
  /**
   * Get a component from the registry
   * @param type Registry type
   * @param name Component name
   * @returns Component implementation
   * @throws Error if component is not found
   */
  public static get(type: RegistryType, name: string): Function {
    const typeRegistry = UnifiedRegistry.getTypeRegistry(type);
    const implementation = typeRegistry.get(name);
    
    if (!implementation) {
      throw new Error(`${type} '${name}' is not registered.`);
    }
    
    return implementation;
  }
  
  /**
   * Check if a component is registered
   * @param type Registry type
   * @param name Component name
   * @returns Whether the component is registered
   */
  public static has(type: RegistryType, name: string): boolean {
    return UnifiedRegistry.getTypeRegistry(type).has(name);
  }
  
  /**
   * Get all components of a specific type
   * @param type Registry type
   * @returns Map of component names to implementations
   */
  public static getAll(type: RegistryType): Map<string, Function> {
    return new Map(UnifiedRegistry.getTypeRegistry(type));
  }
  
  /**
   * Clear all components of a specific type
   * @param type Registry type to clear
   */
  public static clear(type: RegistryType): void {
    UnifiedRegistry.getTypeRegistry(type).clear();
  }
  
  /**
   * Clear all registered components
   */
  public static clearAll(): void {
    Object.values(RegistryType).forEach(type => {
      UnifiedRegistry.clear(type);
    });
  }
  
  /**
   * Helper to get type-specific registry
   * @private
   */
  private static getTypeRegistry(type: RegistryType): Map<string, Function> {
    const typeRegistry = UnifiedRegistry.registry.get(type);
    
    if (!typeRegistry) {
      throw new Error(`Invalid registry type: ${type}`);
    }
    
    return typeRegistry;
  }
  
  // Convenience methods for backward compatibility
  
  /**
   * Register a transformer (backward compatibility)
   */
  public static registerTransformer(name: string, implementation: Function): void {
    UnifiedRegistry.register(RegistryType.TRANSFORMER, name, implementation);
  }
  
  /**
   * Register a utility (backward compatibility)
   */
  public static registerUtility(name: string, implementation: Function): void {
    UnifiedRegistry.register(RegistryType.UTILITY, name, implementation);
  }
  
  /**
   * Register a transformation operation (backward compatibility)
   */
  public static registerTransformOperation(name: string, implementation: Function): void {
    UnifiedRegistry.register(RegistryType.TRANSFORM_OPERATION, name, implementation);
  }
  
  /**
   * Get a transformation operation (backward compatibility)
   */
  public static getTransformOperation(name: string): Function {
    return UnifiedRegistry.get(RegistryType.TRANSFORM_OPERATION, name);
  }
}