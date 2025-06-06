/**
 * Updated configuration system for semantic XNode with format-specific sections
 * Replaces mixed-format configuration with clean separation
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

  // Output formatting (cross-format)
  formatting: {
    indent: number;
    pretty: boolean;
  };

  // Fragment root name for functional operations
  fragmentRoot: string | XNode;
}

/**
 * XML-specific configuration options
 */
export interface XmlConfiguration {
  preserveNamespaces: boolean;
  preserveCDATA: boolean;
  preserveMixedContent: boolean;
  attributeHandling: 'attributes' | 'fields'; // How to represent XML attributes in semantic model
  namespacePrefixHandling: 'preserve' | 'strip' | 'label'; // How to handle namespace prefixes
}

/**
 * JSON-specific configuration options
 */
export interface JsonConfiguration {
  arrayItemNames: Record<string, string>; // Custom names for array items by parent property
  defaultItemName: string; // Default name for array items
  fieldVsValue: 'auto' | 'field' | 'value'; // How to represent object properties
  emptyValueHandling: 'null' | 'undefined' | 'remove'; // How to handle empty values
}

/**
 * Main configuration interface with format-specific sections
 */
export interface Configuration extends BaseConfiguration {
  xml: XmlConfiguration;
  json: JsonConfiguration;
}

/**
 * Default configuration - clean separation by format
 */
export const DEFAULT_CONFIG: Configuration = {
  // Core settings
  preserveComments: true,
  preserveInstructions: true,
  preserveWhitespace: false,

  // Output formatting
  formatting: {
    indent: 2,
    pretty: true
  },

  // Fragment root name for functional operations
  fragmentRoot: "results",

  // XML-specific defaults
  xml: {
    preserveNamespaces: true,
    preserveCDATA: true,
    preserveMixedContent: true,
    attributeHandling: 'attributes',
    namespacePrefixHandling: 'preserve'
  },

  // JSON-specific defaults
  json: {
    arrayItemNames: {},
    defaultItemName: "item",
    fieldVsValue: 'auto',
    emptyValueHandling: 'null'
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
    xmlNamespaces: result.xml.preserveNamespaces,
    xmlAttributeHandling: result.xml.attributeHandling,
    jsonFieldVsValue: result.json.fieldVsValue,
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

  // Validate fragmentRoot
  if (typeof config.fragmentRoot !== 'string' && 
      (typeof config.fragmentRoot !== 'object' || !config.fragmentRoot.name)) {
    throw new Error('fragmentRoot must be a string or XNode with name property');
  }
}

/**
 * Get format-specific configuration helpers
 */
export class ConfigurationHelper {
  constructor(private config: Configuration) {}

  /**
   * Get XML-specific configuration
   */
  getXmlConfig(): XmlConfiguration {
    return this.config.xml;
  }

  /**
   * Get JSON-specific configuration
   */
  getJsonConfig(): JsonConfiguration {
    return this.config.json;
  }

  /**
   * Check if comments should be preserved for any format
   */
  shouldPreserveComments(): boolean {
    return this.config.preserveComments;
  }

  /**
   * Check if instructions should be preserved for any format
   */
  shouldPreserveInstructions(): boolean {
    return this.config.preserveInstructions;
  }

  /**
   * Check if whitespace should be preserved for any format
   */
  shouldPreserveWhitespace(): boolean {
    return this.config.preserveWhitespace;
  }

  /**
   * Get the fragment root name as string
   */
  getFragmentRootName(): string {
    if (typeof this.config.fragmentRoot === 'string') {
      return this.config.fragmentRoot;
    }
    return this.config.fragmentRoot.name || 'results';
  }

  /**
   * Get array item name for JSON conversion
   */
  getJsonArrayItemName(parentPropertyName: string): string {
    return this.config.json.arrayItemNames[parentPropertyName] || 
           this.config.json.defaultItemName;
  }

  /**
   * Determine if XML attributes should be represented as semantic attributes
   */
  shouldUseSemanticAttributes(): boolean {
    return this.config.xml.attributeHandling === 'attributes';
  }

  /**
   * Check if JSON empty values should be removed
   */
  shouldRemoveJsonEmptyValues(): boolean {
    return this.config.json.emptyValueHandling === 'remove';
  }
}