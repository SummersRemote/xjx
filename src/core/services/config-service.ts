/**
 * ConfigService - Centralized configuration provider for XJX
 * 
 * Provides access to library configuration with validation, defaults, 
 * and configuration management capabilities.
 */
import { Configuration } from '../types/config-types';
import { DEFAULT_CONFIG } from '../config/config';
import { CommonUtils } from '../utils/common-utils';
import { ErrorUtils } from '../utils/error-utils';

/**
 * Configuration service with singleton pattern
 */
export class ConfigService {
  private static instance: ConfigService | null = null;
  private config: Configuration;
  
  /**
   * Get the singleton instance, creating it if necessary
   * @param initialConfig Optional configuration to initialize with
   * @returns The ConfigService instance
   */
  public static getInstance(initialConfig?: Partial<Configuration>): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService(initialConfig);
    } else if (initialConfig) {
      // If we already have an instance but new config is provided, update it
      ConfigService.instance.updateConfig(initialConfig);
    }
    return ConfigService.instance;
  }
  
  /**
   * Private constructor (singleton pattern)
   * @param initialConfig Optional partial configuration to merge with defaults
   */
  private constructor(initialConfig: Partial<Configuration> = {}) {
    // Initialize with deep-copied default config
    this.config = CommonUtils.deepClone(DEFAULT_CONFIG);
    
    // Merge with provided config
    if (initialConfig && Object.keys(initialConfig).length > 0) {
      this.config = CommonUtils.deepMerge(this.config, initialConfig);
    }
    
    // Validate the merged configuration
    this.validateConfig(this.config);
  }
  
  /**
   * Get the current configuration
   * @returns The current configuration object (readonly)
   */
  public getConfig(): Readonly<Configuration> {
    // Return a readonly version to prevent accidental mutation
    return Object.freeze(CommonUtils.deepClone(this.config));
  }
  
  /**
   * Get a mutable copy of the current configuration
   * @returns A mutable copy of the current configuration
   */
  public getMutableConfig(): Configuration {
    return CommonUtils.deepClone(this.config);
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
    const newConfig = CommonUtils.deepMerge(this.config, partialConfig);
    
    // Validate before updating
    this.validateConfig(newConfig);
    
    // Update the config
    this.config = newConfig;
  }
  
  /**
   * Reset to default configuration
   */
  public resetToDefaults(): void {
    this.config = CommonUtils.deepClone(DEFAULT_CONFIG);
  }
  
  /**
   * Set configuration directly (use with caution)
   * @param config Complete configuration object
   */
  public setConfig(config: Configuration): void {
    this.validateConfig(config);
    this.config = CommonUtils.deepClone(config);
  }
  
  /**
   * Get a specific configuration value by path
   * @param path Dot-notation path to configuration value
   * @param defaultValue Optional default value if path not found
   * @returns Configuration value or default
   */
  public getValue<T>(path: string, defaultValue?: T): T {
    return CommonUtils.getPath(this.config, path, defaultValue) as T;
  }
  
  /**
   * Validate configuration object
   * @private
   * @param config Configuration to validate
   * @throws ConfigurationError if validation fails
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
   * @param config Configuration to validate
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
      ErrorUtils.validate(
        config[prop as keyof Configuration] !== undefined,
        `Missing required configuration property: ${prop}`,
        'configuration'
      );
    }
  }
  
  /**
   * Validate property names
   * @private
   * @param propNames Property names configuration
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
      ErrorUtils.validate(
        !!propNames[prop],
        `Missing required propNames configuration: ${prop}`,
        'configuration'
      );
    }
    
    // Check for duplicate values
    const values = Object.values(propNames);
    const uniqueValues = new Set(values);
    
    ErrorUtils.validate(
      values.length === uniqueValues.size,
      'Duplicate values in propNames configuration',
      'configuration'
    );
  }
  
  /**
   * Validate output options
   * @private
   * @param outputOptions Output options configuration
   */
  private validateOutputOptions(outputOptions: any): void {
    if (outputOptions.indent !== undefined) {
      ErrorUtils.validate(
        typeof outputOptions.indent === 'number' && outputOptions.indent >= 0,
        'Invalid indent value in outputOptions',
        'configuration'
      );
    }
    
    if (outputOptions.prettyPrint !== undefined) {
      ErrorUtils.validate(
        typeof outputOptions.prettyPrint === 'boolean',
        'Invalid prettyPrint value in outputOptions',
        'configuration'
      );
    }
    
    if (outputOptions.compact !== undefined) {
      ErrorUtils.validate(
        typeof outputOptions.compact === 'boolean',
        'Invalid compact value in outputOptions',
        'configuration'
      );
    }
    
    ErrorUtils.validate(
      outputOptions.xml && typeof outputOptions.xml === 'object',
      'Missing xml configuration in outputOptions',
      'configuration'
    );
    
    if (outputOptions.xml.declaration !== undefined) {
      ErrorUtils.validate(
        typeof outputOptions.xml.declaration === 'boolean',
        'Invalid declaration value in outputOptions.xml',
        'configuration'
      );
    }
  }
  
  /**
   * For testing purposes only - reset the singleton instance
   */
  public static resetInstance(): void {
    ConfigService.instance = null;
  }
}