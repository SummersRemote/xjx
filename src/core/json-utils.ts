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
 * @param config Configuration with property names to check for
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
 * Check if a JSON value represents an empty element
 * @param value JSON value to check
 * @param config Configuration for property names
 * @returns True if the value represents an empty element
 */
export function isEmptyElement(value: JsonValue, config: Configuration): boolean {
  // Null or undefined are empty
  if (value === null || value === undefined) {
    return true;
  }

  // Empty string is empty
  if (value === '') {
    return true;
  }

  // Arrays
  if (Array.isArray(value)) {
    // Empty array is empty
    if (value.length === 0) {
      return true;
    }
    // Array with all empty elements is empty
    return value.every(item => isEmptyElement(item, config));
  }

  // Objects
  if (typeof value === 'object') {
    const obj = value as JsonObject;
    const keys = Object.keys(obj);
    
    // Empty object is empty
    if (keys.length === 0) {
      return true;
    }

    const { properties } = config;

    // For high-fidelity format, check specific properties
    if (obj[properties.value] !== undefined) {
      // Has a value property - check if it's empty
      return isEmptyElement(obj[properties.value], config);
    }

    if (obj[properties.children] !== undefined) {
      // Has children property - check if all children are empty
      const children = obj[properties.children];
      if (Array.isArray(children)) {
        return children.length === 0 || children.every(child => isEmptyElement(child, config));
      }
      return isEmptyElement(children, config);
    }

    // For standard format, check if all properties are empty
    // Skip metadata properties like attributes, namespaces, etc.
    const contentKeys = keys.filter(key => 
      !key.startsWith('$') && 
      !key.startsWith('_') && 
      key !== properties.attribute &&
      key !== properties.namespace &&
      key !== properties.prefix &&
      key !== 'namespaceDeclarations' &&
      key !== 'isDefaultNamespace' &&
      key !== 'metadata'
    );

    if (contentKeys.length === 0) {
      return true;
    }

    // Check if all content properties are empty
    return contentKeys.every(key => isEmptyElement(obj[key], config));
  }

  // Primitive values - not empty unless they're falsy
  return false;
}

/**
 * Remove empty elements from JSON structure
 * An element is considered empty if:
 * - It's null, undefined, or empty string
 * - It's an empty object or array
 * - It contains only other empty elements
 * 
 * @param value JSON value to process
 * @param config Configuration for determining what's empty
 * @returns Processed JSON value with empty elements removed, or undefined if entire value is empty
 */
export function removeEmptyElements(value: JsonValue, config: Configuration): JsonValue | undefined {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return undefined;
  }

  // Handle arrays
  if (Array.isArray(value)) {
    const processedArray: JsonValue[] = [];

    for (const item of value) {
      const processedItem = removeEmptyElements(item, config);
      if (processedItem !== undefined) {
        processedArray.push(processedItem);
      }
    }

    return processedArray.length > 0 ? processedArray : undefined;
  }

  // Handle objects
  if (typeof value === 'object') {
    const obj = value as JsonObject;
    const processedObj: JsonObject = {};
    let hasContent = false;

    for (const [key, propValue] of Object.entries(obj)) {
      const processedValue = removeEmptyElements(propValue, config);
      if (processedValue !== undefined) {
        processedObj[key] = processedValue;
        hasContent = true;
      }
    }

    // After processing all properties, check if the object is still meaningful
    if (!hasContent) {
      return undefined;
    }

    // Special handling for high-fidelity format
    const { properties } = config;
    
    // If this object only has metadata (attributes, namespaces, etc.) but no content, it might be empty
    const contentKeys = Object.keys(processedObj).filter(key => 
      key !== properties.attribute &&
      key !== properties.namespace &&
      key !== properties.prefix &&
      key !== 'namespaceDeclarations' &&
      key !== 'isDefaultNamespace' &&
      key !== 'metadata'
    );

    // If no content keys, but has metadata, keep it (it represents an empty element with attributes)
    // If no content keys and no metadata, remove it
    if (contentKeys.length === 0) {
      const hasMetadata = 
        processedObj[properties.attribute] !== undefined ||
        processedObj[properties.namespace] !== undefined ||
        processedObj[properties.prefix] !== undefined ||
        processedObj.namespaceDeclarations !== undefined ||
        processedObj.metadata !== undefined;
      
      return hasMetadata ? processedObj : undefined;
    }

    return processedObj;
  }

  // Primitive values
  if (typeof value === 'string' && value.trim() === '') {
    return undefined;
  }

  return value;
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
  switch (config.strategies.arrayStrategy) {
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