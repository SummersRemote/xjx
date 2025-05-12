/**
 * Configuration Manager - Simplified approach to configuration management
 * 
 * Replaces the ConfigService with a simpler, more functional approach
 * that eliminates the singleton pattern and reduces complexity.
 */
import { Configuration } from '../types/config-types';
import { DEFAULT_CONFIG } from './config';
import { CommonUtils } from '../utils/common-utils';

/**
 * Configuration utilities for the XJX library
 */
export const ConfigManager = {
  /**
   * Get a deep clone of the default configuration
   * @returns A fresh copy of the default configuration
   */
  getDefaultConfig(): Configuration {
    return CommonUtils.deepClone(DEFAULT_CONFIG);
  },
  
  /**
   * Merge configurations to create a new configuration
   * @param baseConfig Base configuration
   * @param overrideConfig Configuration to merge on top of base
   * @returns New merged configuration
   */
  mergeConfig(baseConfig: Configuration, overrideConfig: Partial<Configuration> = {}): Configuration {
    return CommonUtils.deepMerge(baseConfig, overrideConfig);
  },
  
  /**
   * Validate that a configuration has all required fields
   * Simple validation that ensures core properties exist
   * @param config Configuration to validate
   * @returns True if configuration is valid
   */
  isValidConfig(config: any): boolean {
    // Simple existence check for required properties
    if (!config || typeof config !== 'object') return false;
    
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
      if (config[prop] === undefined) return false;
    }
    
    // Check for output options
    if (!config.outputOptions || typeof config.outputOptions !== 'object') return false;
    if (!config.outputOptions.xml || typeof config.outputOptions.xml !== 'object') return false;
    
    // Check for prop names
    if (!config.propNames || typeof config.propNames !== 'object') return false;
    
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
      if (!config.propNames[prop]) return false;
    }
    
    return true;
  },
  
  /**
   * Create a valid configuration by merging with defaults if needed
   * @param config User-provided partial configuration
   * @returns Complete, valid configuration
   */
  createConfig(config: Partial<Configuration> = {}): Configuration {
    const baseConfig = this.getDefaultConfig();
    return this.mergeConfig(baseConfig, config);
  },
  
  /**
   * Get a value from configuration using dot notation path
   * @param config Configuration object
   * @param path Path to value (e.g., "outputOptions.indent")
   * @param defaultValue Default value if path doesn't exist
   * @returns Value at path or default value
   */
  getConfigValue<T>(config: Configuration, path: string, defaultValue?: T): T | undefined {
    return CommonUtils.getPath(config, path, defaultValue);
  }
};