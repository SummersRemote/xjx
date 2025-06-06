/**
 * JSON adapter utilities - Pure semantic metadata approach
 */
import { JsonSourceConfiguration } from './config';

/**
 * JSON value types for adapter operations
 */
export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
export interface JsonObject { [key: string]: JsonValue }
export type JsonArray = JsonValue[];

/**
 * Check if a JSON value represents an empty element
 */
export function isEmptyElement(value: JsonValue, config: JsonSourceConfiguration): boolean {
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

    // Use semantic metadata detection instead of properties
    const contentKeys = getContentProperties(obj);
    return contentKeys.length === 0 || 
           contentKeys.every(key => isEmptyElement(obj[key], config));
  }

  // Primitive values are not empty
  return false;
}

/**
 * Remove empty elements from JSON structure
 */
export function removeEmptyElements(value: JsonValue, config: JsonSourceConfiguration): JsonValue | undefined {
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

    // Use semantic metadata detection
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
 * Check if object is in high-fidelity semantic format
 */
export function isHighFidelityJson(obj: JsonObject): boolean {
  return typeof obj['#type'] === 'string' && 
         typeof obj['#name'] === 'string';
}

/**
 * Check if property represents semantic metadata
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
 */
export function getContentProperties(obj: JsonObject): string[] {
  return Object.keys(obj).filter(key => !isSemanticMetadata(key));
}

/**
 * Get semantic metadata properties from object
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
 */
export function hasSemanticValue(obj: JsonObject): boolean {
  return obj['#value'] !== undefined;
}

/**
 * Get semantic value from object
 */
export function getSemanticValue(obj: JsonObject): JsonValue | undefined {
  return obj['#value'];
}

/**
 * Check if object has semantic children property
 */
export function hasSemanticChildren(obj: JsonObject): boolean {
  return obj['#children'] !== undefined;
}

/**
 * Get semantic children from object
 */
export function getSemanticChildren(obj: JsonObject): JsonValue | undefined {
  return obj['#children'];
}

/**
 * Detect semantic format type
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

/**
 * Get array item name for JSON conversion with fallback
 */
export function getJsonArrayItemName(config: JsonSourceConfiguration, parentPropertyName: string): string {
  return config.arrayItemNames[parentPropertyName] || config.defaultItemName;
}