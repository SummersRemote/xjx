/**
 * JSON utilities and type definitions
 */
import { getPath, setPath } from './common';
import { logger } from './error';

/**
 * Basic JSON primitive types
 */
export type JSONPrimitive = string | number | boolean | null;

/**
 * JSON array type (recursive definition)
 */
export type JSONArray = JSONValue[];

/**
 * JSON object type (recursive definition)
 */
export interface JSONObject {
  [key: string]: JSONValue;
}

/**
 * Combined JSON value type that can be any valid JSON structure
 */
export type JSONValue = JSONPrimitive | JSONArray | JSONObject;

/**
 * Detect if an object is in XJX JSON format
 * @param obj JSON object to check
 * @param namingConfig Configuration for XJX JSON property names
 * @returns true if the object is in XJX format
 */
export function isXjxFormat(obj: Record<string, any>, namingConfig: Record<string, string>): boolean {
  // Empty object is not in XJX format
  if (!obj || typeof obj !== 'object' || Object.keys(obj).length === 0) {
    return false;
  }
  
  // Get the first root element
  const rootKey = Object.keys(obj)[0];
  const rootObj = obj[rootKey];
  
  // Not an object, not XJX format
  if (!rootObj || typeof rootObj !== 'object') {
    return false;
  }
  
  // Check for XJX-specific properties
  return rootObj[namingConfig.value] !== undefined ||
         rootObj[namingConfig.children] !== undefined ||
         rootObj[namingConfig.attribute] !== undefined ||
         rootObj[namingConfig.namespace] !== undefined ||
         rootObj[namingConfig.prefix] !== undefined ||
         rootObj[namingConfig.cdata] !== undefined ||
         rootObj[namingConfig.comment] !== undefined ||
         rootObj[namingConfig.processingInstr] !== undefined;
}

/**
 * Recursively compacts a JSON structure by removing empty objects and arrays
 * Empty means: {}, [], null, undefined
 * Preserves all primitive values including empty strings, 0, false, etc.
 *
 * @param value JSON value to compact
 * @returns Compacted JSON value or undefined if the value is completely empty
 */
export function compact(value: JSONValue): JSONValue | undefined {
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
    const compactedArray: JSONValue[] = [];

    for (const item of value) {
      const compactedItem = compact(item);
      if (compactedItem !== undefined) {
        compactedArray.push(compactedItem);
      }
    }

    return compactedArray.length > 0 ? compactedArray : undefined;
  }

  // Handle objects
  const compactedObj: JSONObject = {};
  let hasProperties = false;

  for (const [key, propValue] of Object.entries(value as JSONObject)) {
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
export function safeStringify(obj: JSONValue, indent: number = 2): string {
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
export function safeParse(text: string): JSONValue | null {
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
export function getValueByPath<T>(obj: JSONValue, path: string, defaultValue?: T): T | undefined {
  return getPath(obj, path, defaultValue);
}

/**
 * Set a value in a JSON object using a path
 * @param obj Object to set value in
 * @param path Path to value (dot notation)
 * @param value Value to set
 * @returns New object with value set (original object is not modified)
 */
export function setValueByPath<T extends JSONValue>(obj: T, path: string, value: JSONValue): T {
  return setPath(obj, path, value);
}