/**
 * Core converter interfaces and shared utilities - REFACTORED
 */
import { Configuration } from './config';
import { XNode } from './xnode';
import { ValidationError } from './error';

/**
 * Source operation hooks (for fromXml, fromJson, fromXnode)
 */
export interface SourceHooks<TInput> {
  /**
   * Applied before parsing source - receives raw input, can preprocess
   */
  beforeTransform?: (source: TInput) => TInput | void | undefined;
  
  /**
   * Applied after parsing - receives parsed XNode, can add metadata
   */
  afterTransform?: (xnode: XNode) => XNode | void | undefined;
}

/**
 * Output operation hooks (for toXml, toJson, toXnode)
 */
export interface OutputHooks<TOutput> {
  /**
   * Applied before conversion - receives XNode, can modify structure
   */
  beforeTransform?: (xnode: XNode) => XNode | void | undefined;
  
  /**
   * Applied after conversion - receives final output, can wrap/enrich
   */
  afterTransform?: (output: TOutput) => TOutput | void | undefined;
}

/**
 * Node operation hooks (for map and node transformations)
 */
export interface NodeHooks {
  /**
   * Applied before node transformation
   */
  beforeTransform?: (node: XNode) => XNode | void | undefined;
  
  /**
   * Applied after node transformation
   */
  afterTransform?: (node: XNode) => XNode | void | undefined;
}

/**
 * Pipeline-level hooks for cross-cutting concerns
 */
export interface PipelineHooks {
  /**
   * Called before each pipeline step
   */
  beforeStep?: (stepName: string, input: any) => void;
  
  /**
   * Called after each pipeline step
   */
  afterStep?: (stepName: string, output: any) => void;
}

/**
 * Converter interface - simplified without hooks in convert method
 */
export interface Converter<TInput, TOutput> {
  convert(input: TInput, config: Configuration): TOutput;
}

/**
 * Validation function for API boundaries
 */
export function validateInput(condition: boolean, message: string): void {
  if (!condition) {
    throw new ValidationError(message);
  }
}

/**
 * JSON value types for converter operations
 */
export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
export interface JsonObject { [key: string]: JsonValue }
export type JsonArray = JsonValue[];

/**
 * Apply source hooks during source operations
 */
export function applySourceHooks<TInput>(
  source: TInput,
  xnode: XNode,
  hooks?: SourceHooks<TInput>
): { source: TInput; xnode: XNode } {
  let processedSource = source;
  let processedXNode = xnode;

  if (hooks) {
    // Apply beforeTransform to source
    if (hooks.beforeTransform) {
      try {
        const beforeResult = hooks.beforeTransform(processedSource);
        if (beforeResult !== undefined && beforeResult !== null) {
          processedSource = beforeResult;
        }
      } catch (err) {
        console.warn(`Error in source beforeTransform: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // Apply afterTransform to XNode
    if (hooks.afterTransform) {
      try {
        const afterResult = hooks.afterTransform(processedXNode);
        if (afterResult && typeof afterResult === 'object' && typeof afterResult.name === 'string') {
          processedXNode = afterResult;
        }
      } catch (err) {
        console.warn(`Error in source afterTransform: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  return { source: processedSource, xnode: processedXNode };
}

/**
 * Apply output hooks during output operations
 */
export function applyOutputHooks<TOutput>(
  xnode: XNode,
  output: TOutput,
  hooks?: OutputHooks<TOutput>
): { xnode: XNode; output: TOutput } {
  let processedXNode = xnode;
  let processedOutput = output;

  if (hooks) {
    // Apply beforeTransform to XNode
    if (hooks.beforeTransform) {
      try {
        const beforeResult = hooks.beforeTransform(processedXNode);
        if (beforeResult && typeof beforeResult === 'object' && typeof beforeResult.name === 'string') {
          processedXNode = beforeResult;
        }
      } catch (err) {
        console.warn(`Error in output beforeTransform: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // Apply afterTransform to output
    if (hooks.afterTransform) {
      try {
        const afterResult = hooks.afterTransform(processedOutput);
        if (afterResult !== undefined && afterResult !== null) {
          processedOutput = afterResult;
        }
      } catch (err) {
        console.warn(`Error in output afterTransform: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  return { xnode: processedXNode, output: processedOutput };
}

/**
 * Apply node hooks during node transformations
 */
export function applyNodeHooks(
  node: XNode,
  hooks?: NodeHooks
): XNode {
  let processedNode = node;

  if (hooks) {
    // Apply beforeTransform
    if (hooks.beforeTransform) {
      try {
        const beforeResult = hooks.beforeTransform(processedNode);
        if (beforeResult && typeof beforeResult === 'object' && typeof beforeResult.name === 'string') {
          processedNode = beforeResult;
        }
      } catch (err) {
        console.warn(`Error in node beforeTransform: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // Apply afterTransform
    if (hooks.afterTransform) {
      try {
        const afterResult = hooks.afterTransform(processedNode);
        if (afterResult && typeof afterResult === 'object' && typeof afterResult.name === 'string') {
          processedNode = afterResult;
        }
      } catch (err) {
        console.warn(`Error in node afterTransform: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  return processedNode;
}

/**
 * Parse element name with optional prefix
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
 */
export function getAttributeName(
  originalName: string, 
  preservePrefixedNames: boolean
): string {
  if (preservePrefixedNames) {
    return originalName;
  }
  
  if (originalName.includes(':')) {
    const parts = originalName.split(':');
    return parts[parts.length - 1];
  }
  
  return originalName;
}

/**
 * Process attributes consistently across converters
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

    if (attr.name === "xmlns" || attr.name.startsWith("xmlns:")) continue;

    const attrName = getAttributeName(attr.name, config.preservePrefixedNames);
    attributes[attrName] = attr.value;
  }

  return Object.keys(attributes).length > 0 ? attributes : undefined;
}

/**
 * Check if text has non-whitespace content
 */
export function hasTextContent(text: string): boolean {
  return text.trim().length > 0;
}

/**
 * Process namespace declarations consistently
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
      declarations[""] = attr.value;
      namespaceMap[""] = attr.value;
    } else if (attr.name.startsWith("xmlns:")) {
      const prefix = attr.name.substring(6);
      declarations[prefix] = attr.value;
      namespaceMap[prefix] = attr.value;
    }
  }
  
  return { declarations, namespaceMap };
}

/**
 * Process attribute object from JSON
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