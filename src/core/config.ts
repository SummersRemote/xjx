/**
 * Unified configuration system - no core/extension split needed
 * Extensions simply augment the main Configuration interface
 */
import { LoggerFactory } from "./logger";
const logger = LoggerFactory.create();

import { deepClone, deepMerge } from "./common";
import { XNode } from "./xnode";

/**
 * Main configuration interface - extensions augment this directly via module augmentation
 * No need for core/extension separation - it's all just configuration
 */
export interface Configuration {
  // Core XJX properties
  preserveNamespaces: boolean;
  preserveComments: boolean;
  preserveProcessingInstr: boolean;
  preserveCDATA: boolean;
  preserveTextNodes: boolean;
  preserveWhitespace: boolean;
  preserveAttributes: boolean;
  preservePrefixedNames: boolean;

  // High-level transformation strategies
  strategies: {
    highFidelity: boolean;
    attributeStrategy: 'merge' | 'prefix' | 'property';
    textStrategy: 'direct' | 'property';
    namespaceStrategy: 'prefix' | 'property';
    arrayStrategy: 'multiple' | 'always' | 'never';
    emptyElementStrategy: 'object' | 'null' | 'string' | 'remove';
    mixedContentStrategy: 'preserve' | 'merge';
  };

  // Property names and special markers
  properties: {
    attribute: string;
    value: string;
    namespace: string;
    prefix: string;
    cdata: string;
    comment: string;
    processingInstr: string;
    target: string;
    children: string;
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

  // Fragment root name or XNode for functional operations
  fragmentRoot: string | XNode;

}

/**
 * Default configuration - includes all built-in XJX defaults
 * Extension defaults are merged by XJX during registration
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
  preservePrefixedNames: false,

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
    namespace: "$ns",
    prefix: "$pre",
    cdata: "$cdata",
    comment: "$cmnt",
    processingInstr: "$pi",
    target: "$trgt",
    children: "$children"
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
  },

  // Fragment root name for functional operations
  fragmentRoot: "results"
};

/**
 * Get a fresh copy of the default configuration
 * @returns A fresh copy of the default configuration
 */
export function getDefaultConfig(): Configuration {
  return deepClone(DEFAULT_CONFIG);
}

/**
 * Merge configurations with deep merge for consistency
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
    attributeStrategy: result.strategies.attributeStrategy,
    emptyElementStrategy: result.strategies.emptyElementStrategy,
    fragmentRoot: typeof result.fragmentRoot === 'string' ? result.fragmentRoot : 'custom-xnode',
    totalProperties: Object.keys(result).length
  });

  return result;
}