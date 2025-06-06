/**
 * Core converter interfaces and shared utilities - Direct configuration property access
 * ConfigurationHelper removed for simplicity and consistency
 */
import { LoggerFactory } from "../core/logger";
const logger = LoggerFactory.create();

import { Configuration } from './config';
import { XNode } from './xnode';
import { SourceHooks, OutputHooks, NodeHooks } from "./hooks";

/**
 * JSON value types for converter operations
 */
export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
export interface JsonObject { [key: string]: JsonValue }
export type JsonArray = JsonValue[];

/**
 * Converter interface (legacy - kept for compatibility)
 */
export interface Converter<TInput, TOutput> {
  convert(input: TInput, config: Configuration): TOutput;
}

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
        logger.warn(`Error in source beforeTransform: ${err instanceof Error ? err.message : String(err)}`);
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
        logger.warn(`Error in source afterTransform: ${err instanceof Error ? err.message : String(err)}`);
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
        logger.warn(`Error in output beforeTransform: ${err instanceof Error ? err.message : String(err)}`);
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
        logger.warn(`Error in output afterTransform: ${err instanceof Error ? err.message : String(err)}`);
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
        logger.warn(`Error in node beforeTransform: ${err instanceof Error ? err.message : String(err)}`);
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
        logger.warn(`Error in node afterTransform: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  return processedNode;
}

/**
 * Parse element name with optional prefix using direct configuration property access
 */
export function parseElementName(
  name: string, 
  config: Configuration
): { prefix?: string; localName: string } {
  const xmlConfig = config.xml;
  
  if (xmlConfig.preservePrefixedNames && name.includes(':')) {
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
 * Direct configuration property access instead of ConfigurationHelper
 */
export function getElementName(
  name: string, 
  prefix: string | undefined, 
  config: Configuration
): string {
  const xmlConfig = config.xml;
  
  if (xmlConfig.preservePrefixedNames && prefix) {
    return `${prefix}:${name}`;
  }
  return name;
}

/**
 * Get the appropriate attribute name based on configuration
 * Direct configuration property access instead of ConfigurationHelper
 */
export function getAttributeName(
  originalName: string, 
  config: Configuration
): string {
  const xmlConfig = config.xml;
  
  if (xmlConfig.preservePrefixedNames) {
    return originalName;
  }
  
  if (originalName.includes(':')) {
    const parts = originalName.split(':');
    return parts[parts.length - 1];
  }
  
  return originalName;
}

/**
 * Process attributes for semantic XNode using direct configuration property access
 */
export function processAttributes(
  element: Element,
  config: Configuration
): Record<string, any> | undefined {
  const xmlConfig = config.xml;
  
  if (!element.attributes || element.attributes.length === 0 || !xmlConfig.preserveAttributes) {
    return undefined;
  }

  const attributes: Record<string, any> = {};
  
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];

    if (attr.name === "xmlns" || attr.name.startsWith("xmlns:")) continue;

    const attrName = getAttributeName(attr.name, config);
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
 * Process attribute object from JSON using direct configuration property access
 */
export function processAttributeObject(
  attrs: JsonObject,
  config: Configuration
): Record<string, any> {
  const result: Record<string, any> = {};

  Object.entries(attrs).forEach(([key, value]) => {
    const finalAttrName = getAttributeName(key, config);
    result[finalAttrName] = value;
  });

  return result;
}