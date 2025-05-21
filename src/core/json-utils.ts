/**
 * JSON utilities and type definitions
 */
import { getPath, setPath } from './common';
import { logger } from './error';
import { Configuration } from './config';
import { FormatDetectionResult, JsonValue, JsonObject, JsonArray } from './converter';

/**
 * Detect JSON format (high-fidelity vs standard)
 * @param json JSON value to analyze
 * @param config Configuration with property names
 * @returns Format detection result
 */
export function detectJsonFormat(json: JsonValue, config: Configuration): FormatDetectionResult {
  // Default result
  const result: FormatDetectionResult = {
    isHighFidelity: false,
    isArray: Array.isArray(json)
  };
  
  // Handle array
  if (result.isArray) {
    const arr = json as JsonArray;
    // Check if any items look like high-fidelity
    if (arr.length > 0 && typeof arr[0] === 'object' && arr[0] !== null) {
      // Check first item if it has high-fidelity markers
      const firstItemKeys = Object.keys(arr[0] as JsonObject);
      // If first key is an object, check its properties
      if (firstItemKeys.length === 1) {
        const firstKey = firstItemKeys[0];
        const firstObj = (arr[0] as JsonObject)[firstKey];
        if (typeof firstObj === 'object' && firstObj !== null) {
          result.isHighFidelity = hasHighFidelityMarkers(firstObj as JsonObject, config);
        }
      }
    }
    return result;
  }
  
  // Handle object
  if (json && typeof json === 'object' && !Array.isArray(json)) {
    const obj = json as JsonObject;
    const keys = Object.keys(obj);
    
    // Empty object is not high-fidelity
    if (keys.length === 0) {
      return result;
    }
    
    // Store root name for the first key
    result.rootName = keys[0];
    
    // Get first property's value
    const firstProp = obj[keys[0]];
    
    // If first property is an object, check its properties
    if (typeof firstProp === 'object' && firstProp !== null) {
      result.isHighFidelity = hasHighFidelityMarkers(firstProp as JsonObject, config);
    }
  }
  
  return result;
}

/**
 * Check if an object has high-fidelity markers
 * @param obj Object to check
 * @param config Configuration with property names
 * @returns True if the object has high-fidelity markers
 */
function hasHighFidelityMarkers(obj: JsonObject, config: Configuration): boolean {
  const { properties } = config;
  
  // Check for high-fidelity specific properties
  return (
    obj[properties.attribute] !== undefined ||
    obj[properties.children] !== undefined ||
    obj[properties.namespace] !== undefined ||
    obj[properties.prefix] !== undefined ||
    obj[properties.cdata] !== undefined ||
    obj[properties.comment] !== undefined ||
    obj[properties.processingInstr] !== undefined ||
    obj[properties.value] !== undefined
  );
}

/**
 * Recursively compacts a JSON structure by removing empty objects and arrays
 * Empty means: {}, [], null, undefined
 * Preserves all primitive values including empty strings, 0, false, etc.
 *
 * @param value JSON value to compact
 * @returns Compacted JSON value or undefined if the value is completely empty
 */
export function compact(value: JsonValue): JsonValue | undefined {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return undefined;
  }

  // Preserve primitive values
  if (typeof value !== "object") {
    return value;
  }

  // Handle arrays
  if (Array.isArray(value)) {
    const compactedArray: JsonValue[] = [];

    for (const item of value) {
      const compactedItem = compact(item);
      if (compactedItem !== undefined) {
        compactedArray.push(compactedItem);
      }
    }

    return compactedArray.length > 0 ? compactedArray : undefined;
  }

  // Handle objects
  const compactedObj: JsonObject = {};
  let hasProperties = false;

  for (const [key, propValue] of Object.entries(value as JsonObject)) {
    const compactedValue = compact(propValue);
    if (compactedValue !== undefined) {
      compactedObj[key] = compactedValue;
      hasProperties = true;
    }
  }

  return hasProperties ? compactedObj : undefined;
}

/**
 * Safely stringify JSON for debugging
 * @param obj Object to stringify
 * @param indent Optional indentation level
 * @returns JSON string representation
 */
export function safeStringify(obj: JsonValue, indent: number = 2): string {
  try {
    return JSON.stringify(obj, null, indent);
  } catch (err) {
    logger.error('Failed to stringify JSON', { error: err });
    return "[Cannot stringify object]";
  }
}

/**
 * Safely parse a JSON string
 * @param text JSON string to parse
 * @returns Parsed object or null if parsing fails
 */
export function safeParse(text: string): JsonValue | null {
  try {
    return JSON.parse(text);
  } catch (err) {
    logger.error('Failed to parse JSON string', { error: err });
    return null;
  }
}

/**
 * Get a value from a JSON object using a path
 * @param obj Object to get value from
 * @param path Path to value (dot notation)
 * @param defaultValue Default value if path not found
 * @returns Value at path or default value
 */
export function getValueByPath<T>(obj: JsonValue, path: string, defaultValue?: T): T | undefined {
  return getPath(obj, path, defaultValue);
}

/**
 * Set a value in a JSON object using a path
 * @param obj Object to set value in
 * @param path Path to value (dot notation)
 * @param value Value to set
 * @returns New object with value set (original object is not modified)
 */
export function setValueByPath<T extends JsonValue>(obj: T, path: string, value: JsonValue): T {
  return setPath(obj, path, value);
}

/**
 * Create an array for a value if it's not already an array
 * @param value Value to ensureArray
 * @param strategy Array strategy
 * @returns Array containing the value, or the original array, or empty array
 */
export function ensureArray<T>(value: T | T[] | undefined | null, strategy: 'multiple' | 'always' | 'never'): T[] {
  // Handle undefined/null
  if (value === undefined || value === null) {
    return [];
  }
  
  // Already an array
  if (Array.isArray(value)) {
    return value;
  }
  
  // Based on strategy
  switch (strategy) {
    case 'always':
      // Always create an array even for single value
      return [value];
    case 'never':
      // Never create arrays (use last value)
      return [value];
    case 'multiple':
    default:
      // Create array only for multiple values (single value isn't wrapped)
      return [value];
  }
}

/**
 * Add a value to an array based on array strategy
 * @param array Target array 
 * @param value Value to add
 * @param strategy Array strategy
 * @returns Updated array
 */
export function addToArray<T>(array: T[], value: T, strategy: 'multiple' | 'always' | 'never'): T[] {
  if (strategy === 'never') {
    // Replace last value instead of adding
    return [value];
  }
  
  // For 'multiple' and 'always', just append
  array.push(value);
  return array;
}

/**
 * Check if property name is in the forceArrays list
 * @param propName Property name to check
 * @param forceArrays List of properties to force as arrays
 * @returns True if the property should be forced as array
 */
export function shouldForceArray(propName: string, forceArrays: string[]): boolean {
  return forceArrays.includes(propName);
}

/**
 * Determine if a value should be an array based on configuration
 * @param propName Property name
 * @param value Current value
 * @param config Configuration
 * @returns True if the value should be an array
 */
export function shouldBeArray(propName: string, value: any, config: Configuration): boolean {
  // Check force arrays list
  if (shouldForceArray(propName, config.arrays.forceArrays)) {
    return true;
  }
  
  // Check strategy
  switch (config.arrayStrategy) {
    case 'always':
      return true;
    case 'never':
      return false;
    case 'multiple':
    default:
      // Only arrays if multiple items
      return Array.isArray(value) && value.length > 1;
  }
}