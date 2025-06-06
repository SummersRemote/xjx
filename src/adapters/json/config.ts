/**
 * JSON adapter configuration - Separated source and output configurations
 */

/**
 * JSON source-specific configuration options (parsing)
 */
export interface JsonSourceConfiguration {
  // Array handling
  arrayItemNames: Record<string, string>; // Custom names for array items by parent property
  defaultItemName: string; // Default name for array items
  
  // Object property representation
  fieldVsValue: 'auto' | 'field' | 'value'; // How to represent object properties
  
  // Value handling
  emptyValueHandling: 'null' | 'undefined' | 'remove'; // How to handle empty values
}

/**
 * JSON output-specific configuration options (serialization)
 */
export interface JsonOutputConfiguration {
  // JSON-specific formatting
  prettyPrint: boolean;
}

/**
 * Default JSON source configuration
 */
export const DEFAULT_JSON_SOURCE_CONFIG: JsonSourceConfiguration = {
  // Array handling
  arrayItemNames: {},
  defaultItemName: "item",
  
  // Object representation
  fieldVsValue: 'auto',
  
  // Value handling
  emptyValueHandling: 'null'
};

/**
 * Default JSON output configuration
 */
export const DEFAULT_JSON_OUTPUT_CONFIG: JsonOutputConfiguration = {
  // JSON formatting
  prettyPrint: true
};