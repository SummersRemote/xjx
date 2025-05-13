/**
 * Configuration system for the XJX library
 */
import { Common } from './common';

/**
 * Configuration interface for the library
 */
export interface Configuration {
  // Features to preserve during transformation
  preserveNamespaces: boolean;
  preserveComments: boolean;
  preserveProcessingInstr: boolean;
  preserveCDATA: boolean;
  preserveTextNodes: boolean;
  preserveWhitespace: boolean;
  preserveAttributes: boolean;

  // Output options
  outputOptions: {
    prettyPrint: boolean;
    indent: number;
    compact: boolean;
    json: Record<string, any>;
    xml: {
      declaration: boolean;
    };
  };

  // Property names in the JSON representation
  propNames: {
    namespace: string;
    prefix: string;
    attributes: string;
    value: string;
    cdata: string;
    comments: string;
    instruction: string;  
    target: string; 
    children: string;
  };
}

/**
 * Default configuration for the XJX library
 */
export const DEFAULT_CONFIG: Configuration = {
  preserveNamespaces: true,
  preserveComments: true,
  preserveProcessingInstr: true,
  preserveCDATA: true,
  preserveTextNodes: true,
  preserveWhitespace: false,
  preserveAttributes: true,

  outputOptions: {
    prettyPrint: true,
    indent: 2,
    compact: true,
    json: {},
    xml: {
      declaration: true,
    },
  },

  propNames: {
    namespace: "$ns",
    prefix: "$pre",
    attributes: "$attr",
    value: "$val",
    cdata: "$cdata",
    comments: "$cmnt",
    instruction: "$pi", 
    target: "$trgt",  
    children: "$children",
  },
};

/**
 * Configuration utilities for the XJX library
 */
export class Config {
  /**
   * Get a fresh copy of the default configuration
   * @returns A fresh copy of the default configuration
   */
  static getDefault(): Configuration {
    return Common.deepClone(DEFAULT_CONFIG);
  }
  
  /**
   * Merge configurations to create a new configuration
   * @param baseConfig Base configuration
   * @param overrideConfig Configuration to merge on top of base
   * @returns New merged configuration
   */
  static merge(baseConfig: Configuration, overrideConfig: Partial<Configuration> = {}): Configuration {
    return Common.deepMerge(baseConfig, overrideConfig);
  }
  
  /**
   * Validate that a configuration has all required fields
   * Simple validation that ensures core properties exist
   * @param config Configuration to validate
   * @returns True if configuration is valid
   */
  static isValid(config: any): boolean {
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
  }
  
  /**
   * Create a valid configuration by merging with defaults if needed
   * @param config User-provided partial configuration
   * @returns Complete, valid configuration
   */
  static create(config: Partial<Configuration> = {}): Configuration {
    const baseConfig = Config.getDefault();
    return Config.merge(baseConfig, config);
  }
  
  /**
   * Get a value from configuration using dot notation path
   * @param config Configuration object
   * @param path Path to value (e.g., "outputOptions.indent")
   * @param defaultValue Default value if path doesn't exist
   * @returns Value at path or default value
   */
  static getValue<T>(config: Configuration, path: string, defaultValue?: T): T | undefined {
    return Common.getPath(config, path, defaultValue);
  }
}