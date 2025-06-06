/**
 * JSON utilities for XJX library - Semantic configuration approach
 * Legacy 'properties' references removed, uses format-specific configuration
 */
import { LoggerFactory } from "./logger";
const logger = LoggerFactory.create();

import { Configuration } from './config';
import { JsonValue, JsonObject, JsonArray } from './converter';

/**
 * Check if a JSON value represents an empty element
 * Updated for semantic configuration without legacy properties
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

    // Check standard format - filter out metadata properties (semantic metadata)
    const contentKeys = keys.filter(key => 
      !key.startsWith('#') &&      // Semantic metadata
      !key.startsWith('@') &&      // XML attributes
      !key.startsWith('_') &&      // Internal properties
      key !== 'namespaceDeclarations' &&
      key !== 'isDefaultNamespace' &&
      key !== 'metadata'
    );

    return contentKeys.length === 0 || 
           contentKeys.every(key => isEmptyElement(obj[key], config));
  }

  // Primitive values are not empty
  return false;
}

/**
 * Remove empty elements from JSON structure - Semantic metadata aware
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

    // Check if object only has semantic metadata but no content
    const contentKeys = Object.keys(processedObj).filter(key => 
      !key.startsWith('#') &&      // Semantic metadata
      !key.startsWith('@') &&      // XML attributes  
      key !== 'namespaceDeclarations' &&
      key !== 'isDefaultNamespace' &&
      key !== 'metadata'
    );

    // If no content keys but has metadata, keep it (represents empty element with attributes)
    if (contentKeys.length === 0) {
      const hasMetadata = 
        Object.keys(processedObj).some(key => 
          key.startsWith('#') ||    // Semantic metadata
          key.startsWith('@') ||    // XML attributes
          key === 'namespaceDeclarations' ||
          key === 'metadata'
        );
      
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
 * Semantic metadata detection utilities
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
 */
export function isSemanticMetadata(key: string): boolean {
  return key.startsWith('#') ||           // Semantic properties
         key.startsWith('@') ||           // XML attributes
         key === 'namespaceDeclarations' ||
         key === 'isDefaultNamespace' ||
         key === 'metadata';
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