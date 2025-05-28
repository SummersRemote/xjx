/**
 * Core converter interfaces and shared utilities
 */
import { Configuration } from './config';
import { XNode } from './xnode';
import { ValidationError } from './error';

/**
 * Node processing callback function
 */
export type NodeCallback = (node: XNode) => void;

/**
 * Converter interface - consistent across all converters
 */
export interface Converter<TInput, TOutput, TOptions = any> {
  convert(
    input: TInput, 
    config: Configuration, 
    options?: TOptions,
    beforeFn?: NodeCallback,
    afterFn?: NodeCallback
  ): TOutput;
}

/**
 * Validation function for API boundaries
 * @param condition Condition to check
 * @param message Error message if condition fails
 */
export function validateInput(condition: boolean, message: string): void {
  if (!condition) {
    throw new ValidationError(message);
  }
}

/**
 * JSON value types for converter options
 */
export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
export interface JsonObject { [key: string]: JsonValue }
export type JsonArray = JsonValue[];

/**
 * Options for JSON conversion
 */
export interface JsonOptions {
  /**
   * Whether to use high-fidelity mode
   */
  highFidelity?: boolean;
  
  /**
   * Override formatting options
   */
  formatting?: Partial<Configuration['formatting']>;
}

/**
 * Parse element name with optional prefix
 * @param name Full element name (may include prefix)
 * @param preservePrefixedNames Whether to preserve prefixed names
 * @returns Object with prefix and localName
 */
export function parseElementName(
  name: string, 
  preservePrefixedNames: boolean
): { prefix?: string; localName: string } {
  if (preservePrefixedNames && name.includes(':')) {
    const parts = name.split(':');
    return {
      prefix: parts[0],
      localName: parts[1]
    };
  }
  return { localName: name };
}

/**
 * Get the appropriate element name based on configuration
 * @param name Original name
 * @param prefix Optional namespace prefix
 * @param preservePrefixedNames Whether to preserve prefixed names
 * @returns Processed element name
 */
export function getElementName(
  name: string, 
  prefix: string | undefined, 
  preservePrefixedNames: boolean
): string {
  if (preservePrefixedNames && prefix) {
    return `${prefix}:${name}`;
  }
  return name;
}

/**
 * Get the appropriate attribute name based on configuration
 * @param originalName Original attribute name (may include prefix)
 * @param preservePrefixedNames Whether to preserve prefixed names
 * @returns Processed attribute name
 */
export function getAttributeName(
  originalName: string, 
  preservePrefixedNames: boolean
): string {
  if (preservePrefixedNames) {
    return originalName;
  }
  
  // Strip prefix if preservePrefixedNames is false
  if (originalName.includes(':')) {
    const parts = originalName.split(':');
    return parts[parts.length - 1]; // Return the local name part
  }
  
  return originalName;
}

/**
 * Process attributes consistently across converters
 * @param element Source element with attributes
 * @param config Configuration
 * @returns Processed attributes object
 */
export function processAttributes(
  element: Element,
  config: Configuration
): Record<string, any> | undefined {
  if (!element.attributes || element.attributes.length === 0 || !config.preserveAttributes) {
    return undefined;
  }

  const attributes: Record<string, any> = {};
  
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];

    // Skip namespace declarations
    if (attr.name === "xmlns" || attr.name.startsWith("xmlns:")) continue;

    const attrName = getAttributeName(attr.name, config.preservePrefixedNames);
    attributes[attrName] = attr.value;
  }

  return Object.keys(attributes).length > 0 ? attributes : undefined;
}

/**
 * Check if text has non-whitespace content
 * @param text Text to check
 * @returns True if has meaningful content
 */
export function hasTextContent(text: string): boolean {
  return text.trim().length > 0;
}

/**
 * Process namespace declarations consistently
 * @param element DOM element
 * @param currentMap Current namespace map
 * @returns Updated namespace declarations and map
 */
export function processNamespaceDeclarations(
  element: Element,
  currentMap: Record<string, string>
): { declarations: Record<string, string>; namespaceMap: Record<string, string> } {
  const declarations: Record<string, string> = {};
  const namespaceMap = { ...currentMap };
  
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];

    if (attr.name === "xmlns") {
      // Default namespace
      declarations[""] = attr.value;
      namespaceMap[""] = attr.value;
    } else if (attr.name.startsWith("xmlns:")) {
      // Prefixed namespace
      const prefix = attr.name.substring(6);
      declarations[prefix] = attr.value;
      namespaceMap[prefix] = attr.value;
    }
  }
  
  return { declarations, namespaceMap };
}

/**
 * Apply node callbacks consistently
 * @param node Node to process
 * @param beforeFn Optional before callback
 * @param afterFn Optional after callback
 */
export function applyNodeCallbacks(
  node: XNode,
  beforeFn?: NodeCallback,
  afterFn?: NodeCallback
): void {
  try {
    if (beforeFn) {
      beforeFn(node);
    }
  } catch (err) {
    console.warn(`Error in beforeFn callback: ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    if (afterFn) {
      afterFn(node);
    }
  } catch (err) {
    console.warn(`Error in afterFn callback: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Process attribute object from JSON
 * @param attrs Attributes object from JSON
 * @param config Configuration
 * @returns Processed attributes object
 */
export function processAttributeObject(
  attrs: JsonObject,
  config: Configuration
): Record<string, any> {
  const result: Record<string, any> = {};

  Object.entries(attrs).forEach(([key, value]) => {
    const finalAttrName = getAttributeName(key, config.preservePrefixedNames);
    result[finalAttrName] = value;
  });

  return result;
}