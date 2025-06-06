/**
 * Complete configuration system for semantic XNode with format-specific sections
 * ConfigurationHelper class removed for direct property access simplicity
 */
import { LoggerFactory } from "./logger";
const logger = LoggerFactory.create();

import { deepClone, deepMerge } from "./common";
import { XNode } from "./xnode";

/**
 * Base configuration interface for core XJX properties
 */
export interface BaseConfiguration {
  // Core preservation settings (cross-format)
  preserveComments: boolean;
  preserveInstructions: boolean;
  preserveWhitespace: boolean;

  // High-fidelity mode (verbose data structure mode)
  highFidelity: boolean;

  // Output formatting (cross-format)
  formatting: {
    indent: number;
    pretty: boolean;
  };

  // Fragment root name for functional operations
  fragmentRoot: string | XNode;
}

/**
 * XML-specific configuration options - Complete preservation control
 */
export interface XmlConfiguration {
  // Namespace handling
  preserveNamespaces: boolean;
  namespacePrefixHandling: 'preserve' | 'strip' | 'label';
  
  // Content preservation for data filtering
  preserveCDATA: boolean;
  preserveMixedContent: boolean;
  preserveTextNodes: boolean;
  preserveAttributes: boolean;
  preservePrefixedNames: boolean;
  
  // Semantic representation strategy
  attributeHandling: 'attributes' | 'fields'; // How to represent XML attributes in semantic model
  
  // XML-specific formatting
  prettyPrint: boolean;
  declaration: boolean; // Include <?xml declaration
  encoding: string;
}

/**
 * JSON-specific configuration options
 */
export interface JsonConfiguration {
  // Array handling
  arrayItemNames: Record<string, string>; // Custom names for array items by parent property
  defaultItemName: string; // Default name for array items
  
  // Object property representation
  fieldVsValue: 'auto' | 'field' | 'value'; // How to represent object properties
  
  // Value handling
  emptyValueHandling: 'null' | 'undefined' | 'remove'; // How to handle empty values
  
  // JSON-specific formatting
  prettyPrint: boolean;
}

/**
 * Main configuration interface with format-specific sections
 */
export interface Configuration extends BaseConfiguration {
  xml: XmlConfiguration;
  json: JsonConfiguration;
}

/**
 * Default configuration - Complete semantic architecture
 */
export const DEFAULT_CONFIG: Configuration = {
  // Core settings
  preserveComments: true,
  preserveInstructions: true,
  preserveWhitespace: false,
  
  // High-fidelity verbose mode
  highFidelity: false,

  // Output formatting
  formatting: {
    indent: 2,
    pretty: true
  },

  // Fragment root name for functional operations
  fragmentRoot: "results",

  // XML-specific defaults - Complete preservation control
  xml: {
    // Namespace handling
    preserveNamespaces: true,
    namespacePrefixHandling: 'preserve',
    
    // Content preservation for data filtering
    preserveCDATA: true,
    preserveMixedContent: true,
    preserveTextNodes: true,
    preserveAttributes: true,
    preservePrefixedNames: true,
    
    // Semantic representation
    attributeHandling: 'attributes',
    
    // XML formatting
    prettyPrint: true,
    declaration: true,
    encoding: 'UTF-8'
  },

  // JSON-specific defaults
  json: {
    // Array handling
    arrayItemNames: {},
    defaultItemName: "item",
    
    // Object representation
    fieldVsValue: 'auto',
    
    // Value handling
    emptyValueHandling: 'null',
    
    // JSON formatting
    prettyPrint: true
  }
};

/**
 * Get a fresh copy of the default configuration
 */
export function getDefaultConfig(): Configuration {
  return deepClone(DEFAULT_CONFIG);
}

/**
 * Merge configurations with deep merge for consistency
 */
export function mergeConfig(
  baseConfig: Configuration,
  overrideConfig: Partial<Configuration> = {}
): Configuration {
  return deepMerge(baseConfig, overrideConfig);
}

/**
 * Create or update configuration with smart defaults
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
    preserveComments: result.preserveComments,
    highFidelity: result.highFidelity,
    xmlNamespaces: result.xml.preserveNamespaces,
    xmlAttributeHandling: result.xml.attributeHandling,
    xmlPrettyPrint: result.xml.prettyPrint,
    jsonFieldVsValue: result.json.fieldVsValue,
    jsonPrettyPrint: result.json.prettyPrint,
    fragmentRoot: typeof result.fragmentRoot === 'string' ? result.fragmentRoot : 'custom-xnode',
    totalProperties: Object.keys(result).length
  });

  return result;
}

/**
 * Validate configuration for consistency and correctness
 */
export function validateConfig(config: Configuration): void {
  // Validate core settings
  if (typeof config.preserveComments !== 'boolean') {
    throw new Error('preserveComments must be a boolean');
  }

  if (typeof config.preserveInstructions !== 'boolean') {
    throw new Error('preserveInstructions must be a boolean');
  }

  if (typeof config.preserveWhitespace !== 'boolean') {
    throw new Error('preserveWhitespace must be a boolean');
  }

  if (typeof config.highFidelity !== 'boolean') {
    throw new Error('highFidelity must be a boolean');
  }

  // Validate formatting
  if (typeof config.formatting.indent !== 'number' || config.formatting.indent < 0) {
    throw new Error('formatting.indent must be a non-negative number');
  }

  if (typeof config.formatting.pretty !== 'boolean') {
    throw new Error('formatting.pretty must be a boolean');
  }

  // Validate XML configuration
  if (!['attributes', 'fields'].includes(config.xml.attributeHandling)) {
    throw new Error('xml.attributeHandling must be "attributes" or "fields"');
  }

  if (!['preserve', 'strip', 'label'].includes(config.xml.namespacePrefixHandling)) {
    throw new Error('xml.namespacePrefixHandling must be "preserve", "strip", or "label"');
  }

  if (typeof config.xml.prettyPrint !== 'boolean') {
    throw new Error('xml.prettyPrint must be a boolean');
  }

  if (typeof config.xml.declaration !== 'boolean') {
    throw new Error('xml.declaration must be a boolean');
  }

  // Validate JSON configuration
  if (!['auto', 'field', 'value'].includes(config.json.fieldVsValue)) {
    throw new Error('json.fieldVsValue must be "auto", "field", or "value"');
  }

  if (!['null', 'undefined', 'remove'].includes(config.json.emptyValueHandling)) {
    throw new Error('json.emptyValueHandling must be "null", "undefined", or "remove"');
  }

  if (typeof config.json.defaultItemName !== 'string' || config.json.defaultItemName.length === 0) {
    throw new Error('json.defaultItemName must be a non-empty string');
  }

  if (typeof config.json.prettyPrint !== 'boolean') {
    throw new Error('json.prettyPrint must be a boolean');
  }

  // Validate fragmentRoot
  if (typeof config.fragmentRoot !== 'string' && 
      (typeof config.fragmentRoot !== 'object' || !config.fragmentRoot.name)) {
    throw new Error('fragmentRoot must be a string or XNode with name property');
  }
}