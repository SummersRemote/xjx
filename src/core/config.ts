/**
 * Configuration system for the XJX library
 */
import { deepClone, deepMerge } from "./common";
import { logger } from "./error";

export interface Configuration {
  // Features to preserve during transformation
  preserveNamespaces: boolean;
  preserveComments: boolean;
  preserveProcessingInstr: boolean;
  preserveCDATA: boolean;
  preserveTextNodes: boolean;
  preserveWhitespace: boolean;
  preserveAttributes: boolean;
  preservePrefixedNames: boolean;  // Preserve prefixed names in JSON properties

  // High-level transformation strategies
  strategies: {
    highFidelity: boolean;  // Master toggle for high-fidelity mode
    attributeStrategy: 'merge' | 'prefix' | 'property';
    textStrategy: 'direct' | 'property';
    namespaceStrategy: 'prefix' | 'property';
    arrayStrategy: 'multiple' | 'always' | 'never';
    emptyElementStrategy: 'object' | 'null' | 'string';
    mixedContentStrategy: 'preserve' | 'prioritize-text' | 'prioritize-elements';
  };

  // Property names and special markers
  properties: {
    attribute: string;
    value: string;
    text: string;
    namespace: string;
    prefix: string;
    cdata: string;
    comment: string;
    processingInstr: string;
    target: string;
    children: string;
    compact: boolean;
  };

  // Prefix configurations
  prefixes: {
    attribute: string;
    namespace: string;
    comment: string;
    cdata: string;
    pi: string;
  };

  // Array configurations
  arrays: {
    forceArrays: string[];
    defaultItemName: string;
    itemNames: Record<string, string>;
  };

  // Output formatting
  formatting: {
    indent: number;
    declaration: boolean;
    pretty: boolean;
  };
}

/**
 * Default configuration for the XJX library
 */
export const DEFAULT_CONFIG: Configuration = {
  // Preservation settings
  preserveNamespaces: true,
  preserveComments: true,
  preserveProcessingInstr: true,
  preserveCDATA: true,
  preserveTextNodes: true,
  preserveWhitespace: false,
  preserveAttributes: true,
  preservePrefixedNames: false,  // Default to false for backward compatibility

  // High-level strategies
  strategies: {
    highFidelity: false,
    attributeStrategy: 'merge',
    textStrategy: 'direct',
    namespaceStrategy: 'prefix',
    arrayStrategy: 'multiple',
    emptyElementStrategy: 'object',
    mixedContentStrategy: 'preserve',
  },

  // Property names
  properties: {
    attribute: "$attr",
    value: "$val",
    text: "_text",
    namespace: "$ns",
    prefix: "$pre",
    cdata: "$cdata",
    comment: "$cmnt",
    processingInstr: "$pi",
    target: "$trgt",
    children: "$children",
    compact: true
  },

  // Prefix configurations
  prefixes: {
    attribute: '@',
    namespace: 'xmlns:',
    comment: '#',
    cdata: '!',
    pi: '?'
  },

  // Array configurations
  arrays: {
    forceArrays: [],
    defaultItemName: "item",
    itemNames: {}
  },

  // Output formatting
  formatting: {
    indent: 2,
    declaration: true,
    pretty: true
  }
};

/**
 * Get a fresh copy of the default configuration
 * @returns A fresh copy of the default configuration
 */
export function getDefaultConfig(): Configuration {
  return deepClone(DEFAULT_CONFIG);
}

/**
 * Merge configurations to create a new configuration
 * @param baseConfig Base configuration
 * @param overrideConfig Configuration to merge on top of base
 * @returns New merged configuration
 */
export function mergeConfig(
  baseConfig: Configuration,
  overrideConfig: Partial<Configuration> = {}
): Configuration {
  return deepMerge(baseConfig, overrideConfig);
}

/**
 * Create or update configuration with smart defaults
 * @param config Partial configuration to apply
 * @param baseConfig Optional base configuration (uses default if not provided)
 * @returns Complete valid configuration
 */
export function createConfig(
  config: Partial<Configuration> = {},
  baseConfig?: Configuration
): Configuration {
  // Use provided base or get default
  const base = baseConfig || getDefaultConfig();

  // Skip merge if empty config (optimization)
  if (!config || Object.keys(config).length === 0) {
    logger.debug("Empty configuration provided, skipping merge");
    return base;
  }

  // Merge and return
  const result = mergeConfig(base, config);

  logger.debug("Successfully created/updated configuration", {
    preserveNamespaces: result.preserveNamespaces,
    highFidelity: result.strategies.highFidelity,
    attributeStrategy: result.strategies.attributeStrategy
  });

  return result;
}

// /**
//  * Create effective configuration for JSON conversion by merging options
//  * @param baseConfig Base configuration
//  * @param options JSON conversion options
//  * @returns Effective configuration
//  */
// export function createJsonConfig(
//   baseConfig: Configuration,
//   options?: {
//     highFidelity?: boolean;
//     attributeStrategy?: 'merge' | 'prefix' | 'property';
//     textStrategy?: 'direct' | 'property';
//     namespaceStrategy?: 'prefix' | 'property';
//     arrayStrategy?: 'multiple' | 'always' | 'never';
//     emptyElementStrategy?: 'object' | 'null' | 'string';
//     mixedContentStrategy?: 'preserve' | 'prioritize-text' | 'prioritize-elements';
//     formatting?: Partial<Configuration['formatting']>;
//   }
// ): Configuration {
//   if (!options || Object.keys(options).length === 0) {
//     return baseConfig;
//   }
  
//   // Create override configuration from options
//   const overrides: Partial<Configuration> = {};
  
//   // Apply direct strategy options
//   if (options.highFidelity !== undefined || 
//       options.attributeStrategy !== undefined ||
//       options.textStrategy !== undefined ||
//       options.namespaceStrategy !== undefined ||
//       options.arrayStrategy !== undefined ||
//       options.emptyElementStrategy !== undefined ||
//       options.mixedContentStrategy !== undefined) {
    
//     overrides.strategies = { ...baseConfig.strategies };
    
//     if (options.highFidelity !== undefined) overrides.strategies.highFidelity = options.highFidelity;
//     if (options.attributeStrategy !== undefined) overrides.strategies.attributeStrategy = options.attributeStrategy;
//     if (options.textStrategy !== undefined) overrides.strategies.textStrategy = options.textStrategy;
//     if (options.namespaceStrategy !== undefined) overrides.strategies.namespaceStrategy = options.namespaceStrategy;
//     if (options.arrayStrategy !== undefined) overrides.strategies.arrayStrategy = options.arrayStrategy;
//     if (options.emptyElementStrategy !== undefined) overrides.strategies.emptyElementStrategy = options.emptyElementStrategy;
//     if (options.mixedContentStrategy !== undefined) overrides.strategies.mixedContentStrategy = options.mixedContentStrategy;
//   }
  
//   // Apply formatting options if provided
//   if (options.formatting) {
//     overrides.formatting = {
//       ...baseConfig.formatting,
//       ...options.formatting
//     };
//   }
  
//   return mergeConfig(baseConfig, overrides);
// }