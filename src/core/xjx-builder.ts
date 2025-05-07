/**
 * XJX Builder implementation - Fluent API for XML/JSON transformations
 * 
 * This builder works with the extension system where most functionality
 * is implemented through registered extensions.
 */
import {
  Configuration,
  Transform,
  TransformDirection,
  NodeModel
} from './types/transform-interfaces';
import { ConfigProvider } from './config/config-provider';
import { XJXError } from './types/error-types';

/**
 * Builder for XJX transformations
 * 
 * This class primarily serves as a state container for the fluent API.
 * Most functionality is implemented through extensions.
 */
export class XjxBuilder {
  // Public properties that extensions can access
  public xnode: NodeModel | null = null;
  public transforms: Transform[] = [];
  public config: Configuration;
  public direction: TransformDirection | null = null;
  public configProvider: ConfigProvider;
  
  /**
   * Create a new builder instance
   */
  constructor() {
    // Get the singleton config provider
    this.configProvider = ConfigProvider.getInstance();
    
    // Initialize with a deep clone of the global configuration
    this.config = this.deepClone(this.configProvider.getMutableConfig());
  }
  
  /**
   * Validate that a source has been set before transformation
   * @throws XJXError if no source has been set
   */
  public validateSource(): void {
    if (!this.xnode || !this.direction) {
      throw new XJXError('No source set: call fromXml() or fromJson() before transformation');
    }
  }
  
  /**
   * Deep merge two objects
   * @param target Target object
   * @param source Source object
   * @returns Merged object
   */
  public deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
    if (!source || typeof source !== 'object' || source === null) {
      return target;
    }

    if (!target || typeof target !== 'object' || target === null) {
      return source as T;
    }

    const result = this.deepClone(target);

    Object.keys(source).forEach((key) => {
      const sourceValue = source[key as keyof Partial<T>];
      const targetValue = result[key as keyof T];

      // If both values are objects, recursively merge them
      if (
        sourceValue !== null &&
        targetValue !== null &&
        typeof sourceValue === 'object' &&
        typeof targetValue === 'object' &&
        !Array.isArray(sourceValue) &&
        !Array.isArray(targetValue)
      ) {
        (result[key as keyof T] as any) = this.deepMerge(
          targetValue as Record<string, any>,
          sourceValue as Record<string, any>
        );
      } else {
        // Otherwise just replace the value
        (result[key as keyof T] as any) = sourceValue;
      }
    });

    return result;
  }
  
  /**
   * Deep clone an object
   * @param obj Object to clone
   * @returns Cloned object
   */
  public deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }
}