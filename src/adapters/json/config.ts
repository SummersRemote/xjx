/**
 * JSON adapter configuration - Self-contained JSON-specific settings
 */

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
 * Default JSON configuration
 */
export const DEFAULT_JSON_CONFIG: JsonConfiguration = {
  // Array handling
  arrayItemNames: {},
  defaultItemName: "item",
  
  // Object representation
  fieldVsValue: 'auto',
  
  // Value handling
  emptyValueHandling: 'null',
  
  // JSON formatting
  prettyPrint: true
};