/**
 * JSON utilities for XJX library - Simplified and consolidated
 */
import { LoggerFactory } from "./logger";
const logger = LoggerFactory.create();

import { Configuration } from './config';
import { JsonValue, JsonObject, JsonArray } from './converter';

/**
 * Check if a JSON value represents an empty element
 * Simplified logic with clearer conditions
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

    const { properties } = config;

    // Check high-fidelity format properties
    if (obj[properties.value] !== undefined) {
      return isEmptyElement(obj[properties.value], config);
    }

    if (obj[properties.children] !== undefined) {
      const children = obj[properties.children];
      return Array.isArray(children) 
        ? children.length === 0 || children.every(child => isEmptyElement(child, config))
        : isEmptyElement(children, config);
    }

    // Check standard format - filter out metadata properties
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

    return contentKeys.length === 0 || 
           contentKeys.every(key => isEmptyElement(obj[key], config));
  }

  // Primitive values are not empty
  return false;
}

/**
 * Remove empty elements from JSON structure - Simplified recursive approach
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

    // Check if object only has metadata but no content
    const { properties } = config;
    const contentKeys = Object.keys(processedObj).filter(key => 
      key !== properties.attribute &&
      key !== properties.namespace &&
      key !== properties.prefix &&
      key !== 'namespaceDeclarations' &&
      key !== 'isDefaultNamespace' &&
      key !== 'metadata'
    );

    // If no content keys but has metadata, keep it (represents empty element with attributes)
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

  // Handle empty strings
  if (typeof value === 'string' && value.trim() === '') {
    return undefined;
  }

  return value;
}