/**
 * Centralized configuration provider for XJX
 * 
 * Implements a singleton pattern to ensure consistent configuration access
 * throughout the library. Provides validation, defaults, and type safety.
 */
import { Configuration } from '../types/config-types';
import { DEFAULT_CONFIG } from '../config/config';
import { ConfigurationError } from '../types/error-types';

/**
 * Configuration provider with singleton pattern
 */
export class ConfigProvider {
  private static instance: ConfigProvider | null = null;
  private config: Configuration;
  
  /**
   * Gets the singleton instance, creating it if necessary
   * @param initialConfig Optional configuration to initialize with
   * @returns The ConfigProvider instance
   */
  public static getInstance(initialConfig?: Partial<Configuration>): ConfigProvider {
    if (!ConfigProvider.instance) {
      ConfigProvider.instance = new ConfigProvider(initialConfig);
    } else if (initialConfig) {
      // If we already have an instance but new config is provided, update it
      ConfigProvider.instance.updateConfig(initialConfig);
    }
    return ConfigProvider.instance;
  }
  
  /**
   * Private constructor (singleton pattern)
   * @param initialConfig Optional partial configuration to merge with defaults
   */
  private constructor(initialConfig: Partial<Configuration> = {}) {
    // Initialize with deep-copied default config
    this.config = this.deepClone(DEFAULT_CONFIG);
    
    // Merge with provided config
    if (initialConfig && Object.keys(initialConfig).length > 0) {
      this.config = this.deepMerge(this.config, initialConfig);
    }
    
    // Validate the merged configuration
    this.validateConfig(this.config);
  }
  
  /**
   * Get the current configuration
   * @returns The current configuration object
   */
  public getConfig(): Readonly<Configuration> {
    // Return a readonly version to prevent accidental mutation
    return Object.freeze(this.deepClone(this.config));
  }
  
  /**
   * Get a mutable copy of the current configuration
   * @returns A mutable copy of the current configuration
   */
  public getMutableConfig(): Configuration {
    return this.deepClone(this.config);
  }
  
  /**
   * Update the configuration with new values
   * @param partialConfig Partial configuration to merge with current config
   */
  public updateConfig(partialConfig: Partial<Configuration>): void {
    if (!partialConfig || Object.keys(partialConfig).length === 0) {
      return;
    }
    
    // Create a new config by merging current with partial
    const newConfig = this.deepMerge(this.deepClone(this.config), partialConfig);
    
    // Validate before updating
    this.validateConfig(newConfig);
    
    // Update the config
    this.config = newConfig;
  }
  
  /**
   * Reset to default configuration
   */
  public resetToDefaults(): void {
    this.config = this.deepClone(DEFAULT_CONFIG);
  }
  
  /**
   * Set configuration directly (use with caution)
   * @param config Complete configuration object
   */
  public setConfig(config: Configuration): void {
    this.validateConfig(config);
    this.config = this.deepClone(config);
  }
  
  /**
   * Get a specific configuration value by path
   * @param path Dot-notation path to configuration value
   * @param defaultValue Optional default value if path not found
   * @returns Configuration value or default
   */
  public getValue<T>(path: string, defaultValue?: T): T {
    const segments = path.split('.');
    let current: any = this.config;
    
    for (const segment of segments) {
      if (current === undefined || current === null || typeof current !== 'object') {
        return defaultValue as T;
      }
      current = current[segment];
    }
    
    return (current === undefined) ? (defaultValue as T) : current;
  }
  
  /**
   * Deep clone an object
   * @private
   */
  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }
  
  /**
   * Deep merge two objects
   * @private
   */
  private deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
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
        // Fix: Use type assertion to ensure correct type compatibility
        (result[key as keyof T] as any) = this.deepMerge(
          targetValue as Record<string, any>,
          sourceValue as Record<string, any>
        );
      } else {
        // Otherwise just replace the value
        // Fix: Use type assertion to ensure correct type compatibility
        (result[key as keyof T] as any) = sourceValue;
      }
    });

    return result;
  }
  
  /**
   * Validate configuration object
   * @private
   */
  private validateConfig(config: Configuration): void {
    // Validate required properties
    this.validateRequiredProperties(config);
    
    // Validate prop names
    this.validatePropNames(config.propNames);
    
    // Validate output options
    this.validateOutputOptions(config.outputOptions);
  }
  
  /**
   * Validate required configuration properties
   * @private
   */
  private validateRequiredProperties(config: Configuration): void {
    const requiredProps = [
      'preserveNamespaces',
      'preserveComments',
      'preserveProcessingInstr',
      'preserveCDATA',
      'preserveTextNodes',
      'preserveWhitespace',
      'preserveAttributes',
      'outputOptions',
      'propNames'
    ];
    
    for (const prop of requiredProps) {
      if (config[prop as keyof Configuration] === undefined) {
        throw new ConfigurationError(`Missing required configuration property: ${prop}`);
      }
    }
  }
  
  /**
   * Validate property names
   * @private
   */
  private validatePropNames(propNames: Record<string, string>): void {
    const requiredPropNames = [
      'namespace',
      'prefix',
      'attributes',
      'value',
      'cdata',
      'comments',
      'instruction',
      'target',
      'children'
    ];
    
    for (const prop of requiredPropNames) {
      if (!propNames[prop]) {
        throw new ConfigurationError(`Missing required propNames configuration: ${prop}`);
      }
    }
    
    // Check for duplicate values
    const values = Object.values(propNames);
    const uniqueValues = new Set(values);
    
    if (values.length !== uniqueValues.size) {
      throw new ConfigurationError('Duplicate values in propNames configuration');
    }
  }
  
  /**
   * Validate output options
   * @private
   */
  private validateOutputOptions(outputOptions: any): void {
    if (outputOptions.indent !== undefined && 
        (typeof outputOptions.indent !== 'number' || outputOptions.indent < 0)) {
      throw new ConfigurationError('Invalid indent value in outputOptions');
    }
    
    if (outputOptions.prettyPrint !== undefined && 
        typeof outputOptions.prettyPrint !== 'boolean') {
      throw new ConfigurationError('Invalid prettyPrint value in outputOptions');
    }
    
    if (outputOptions.compact !== undefined && 
        typeof outputOptions.compact !== 'boolean') {
      throw new ConfigurationError('Invalid compact value in outputOptions');
    }
    
    if (!outputOptions.xml || typeof outputOptions.xml !== 'object') {
      throw new ConfigurationError('Missing xml configuration in outputOptions');
    }
    
    if (outputOptions.xml.declaration !== undefined && 
        typeof outputOptions.xml.declaration !== 'boolean') {
      throw new ConfigurationError('Invalid declaration value in outputOptions.xml');
    }
  }
  
  /**
   * For testing purposes only - reset the singleton instance
   */
  public static resetInstance(): void {
    ConfigProvider.instance = null;
  }
}