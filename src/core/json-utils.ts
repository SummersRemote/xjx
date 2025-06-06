/**
 * JSON utilities for XJX library - Pure semantic metadata approach
 * PHASE 2: All legacy 'properties' references eliminated
 */
import { LoggerFactory } from "./logger";
const logger = LoggerFactory.create();

import { Configuration } from './config';
import { JsonValue, JsonObject, JsonArray } from './converter';

/**
 * Check if a JSON value represents an empty element
 * STANDARDIZED: Pure semantic metadata detection
 */
export function isEmptyElement(value: JsonValue, config: Configuration): boolean {
  // Null, undefined, or empty string are empty
  if (value === null || value === undefined || value === '') {
    return true;
  }

  // Arrays
  if (Array.isArray(value)) {
    return value.length === 0 || value.every(item => isEmptyElement(item, config));
  }

  // Objects
  if (typeof value === 'object') {
    const obj = value as JsonObject;
    const keys = Object.keys(obj);
    
    if (keys.length === 0) {
      return true;
    }

    // Check high-fidelity format properties (semantic approach)
    if (obj['#value'] !== undefined) {
      return isEmptyElement(obj['#value'], config);
    }

    if (obj['#children'] !== undefined) {
      const children = obj['#children'];
      return Array.isArray(children) 
        ? children.length === 0 || children.every(child => isEmptyElement(child, config))
        : isEmptyElement(children, config);
    }

    // STANDARDIZED: Use semantic metadata detection instead of properties
    const contentKeys = getContentProperties(obj);
    return contentKeys.length === 0 || 
           contentKeys.every(key => isEmptyElement(obj[key], config));
  }

  // Primitive values are not empty
  return false;
}

/**
 * Remove empty elements from JSON structure
 * STANDARDIZED: Pure semantic metadata detection
 */
export function removeEmptyElements(value: JsonValue, config: Configuration): JsonValue | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    const processedArray = value
      .map(item => removeEmptyElements(item, config))
      .filter(item => item !== undefined);
    
    return processedArray.length > 0 ? processedArray : undefined;
  }

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

    if (!hasContent) {
      return undefined;
    }

    // STANDARDIZED: Use semantic metadata detection
    const contentKeys = getContentProperties(processedObj);

    // If no content keys but has metadata, keep it (represents empty element with attributes)
    if (contentKeys.length === 0) {
      const hasMetadata = Object.keys(processedObj).some(key => isSemanticMetadata(key));
      return hasMetadata ? processedObj : undefined;
    }

    return processedObj;
  }

  // Handle empty strings
  if (typeof value === 'string' && value.trim() === '') {
    return undefined;
  }

  return value;
}

/**
 * STANDARDIZED: Semantic metadata detection utilities
 */

/**
 * Check if object is in high-fidelity semantic format
 */
export function isHighFidelityJson(obj: JsonObject): boolean {
  return typeof obj['#type'] === 'string' && 
         typeof obj['#name'] === 'string';
}

/**
 * Check if property represents semantic metadata
 * STANDARDIZED: Complete semantic metadata detection
 */
export function isSemanticMetadata(key: string): boolean {
  return key.startsWith('#') ||           // Semantic properties (#type, #name, #value, etc.)
         key.startsWith('@') ||           // XML attributes (@id, @class, etc.)
         key === 'namespaceDeclarations' ||
         key === 'isDefaultNamespace' ||
         key === 'metadata' ||
         // Additional semantic markers
         key.endsWith('#ns') ||           // Namespace annotations (@id#ns)
         key.endsWith('#label');          // Label annotations (@id#label)
}

/**
 * Get content properties from object (excluding semantic metadata)
 * STANDARDIZED: Replaces legacy properties-based approach
 */
export function getContentProperties(obj: JsonObject): string[] {
  return Object.keys(obj).filter(key => !isSemanticMetadata(key));
}

/**
 * Get semantic metadata properties from object
 * STANDARDIZED: Pure semantic approach
 */
export function getSemanticMetadata(obj: JsonObject): JsonObject {
  const metadata: JsonObject = {};
  
  Object.keys(obj).forEach(key => {
    if (isSemanticMetadata(key)) {
      metadata[key] = obj[key];
    }
  });
  
  return metadata;
}

/**
 * Check if object has semantic value property
 * STANDARDIZED: Replaces legacy properties.value checks
 */
export function hasSemanticValue(obj: JsonObject): boolean {
  return obj['#value'] !== undefined;
}

/**
 * Get semantic value from object
 * STANDARDIZED: Replaces legacy properties.value access
 */
export function getSemanticValue(obj: JsonObject): JsonValue | undefined {
  return obj['#value'];
}

/**
 * Check if object has semantic children property
 * STANDARDIZED: Replaces legacy properties.children checks
 */
export function hasSemanticChildren(obj: JsonObject): boolean {
  return obj['#children'] !== undefined;
}

/**
 * Get semantic children from object
 * STANDARDIZED: Replaces legacy properties.children access
 */
export function getSemanticChildren(obj: JsonObject): JsonValue | undefined {
  return obj['#children'];
}

/**
 * Detect semantic format type
 * STANDARDIZED: Format detection without legacy properties
 */
export function detectSemanticFormat(obj: JsonObject): 'high-fidelity' | 'standard' | 'mixed' {
  if (isHighFidelityJson(obj)) {
    return 'high-fidelity';
  }
  
  const hasSemanticKeys = Object.keys(obj).some(key => key.startsWith('#'));
  const hasStandardKeys = Object.keys(obj).some(key => !isSemanticMetadata(key));
  
  if (hasSemanticKeys && hasStandardKeys) {
    return 'mixed';
  }
  
  return 'standard';
}

/**
 * Normalize object to standard format
 * STANDARDIZED: Convert various formats to consistent structure
 */
export function normalizeSemanticObject(obj: JsonObject): JsonObject {
  const format = detectSemanticFormat(obj);
  
  switch (format) {
    case 'high-fidelity':
      // Extract from high-fidelity format
      const result: JsonObject = {};
      
      if (obj['#value'] !== undefined) {
        result['#value'] = obj['#value'];
      }
      
      if (obj['#children'] !== undefined) {
        result['#children'] = obj['#children'];
      }
      
      // Preserve other semantic metadata
      Object.entries(obj).forEach(([key, value]) => {
        if (key.startsWith('#') && !['#value', '#children'].includes(key)) {
          result[key] = value;
        }
      });
      
      return result;
      
    case 'mixed':
    case 'standard':
    default:
      // Already in standard format or mixed - return as-is
      return obj;
  }
}