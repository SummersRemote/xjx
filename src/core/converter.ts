/**
 * Core converter interfaces and shared utilities - Format-neutral only
 * Adapter-specific functions moved to their respective adapters
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
 * Check if text has non-whitespace content
 */
export function hasTextContent(text: string): boolean {
  return text.trim().length > 0;
}

/**
 * Process namespace declarations consistently (format-neutral utility)
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