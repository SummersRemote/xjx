/**
 * Common utilities for functional operations
 * 
 * This file contains shared functions for tree traversal and result handling
 * used by the functional API methods.
 * 
 * Note: Main functional utilities have been moved to functional-api.ts to avoid
 * circular import issues. This file now contains only shared utilities.
 */
import { LoggerFactory } from "./logger";
const logger = LoggerFactory.create();

import { XNode, createElement } from './xnode';

/**
 * Create a container node for results
 * @param rootName Name for the container element
 * @returns A new container node
 */
export function createResultsContainer(rootName: string = 'results'): XNode {
  return createElement(rootName);
}

/**
 * Walk the tree and apply a visitor function to each node
 * @param node Root node to start traversal
 * @param visitor Function to apply to each node
 * @param context Optional context passed to the visitor
 * @returns The result from the root node visitor
 */
export function walkTree<T>(
  node: XNode, 
  visitor: (node: XNode, context?: any) => T,
  context?: any
): T {
  try {
    // Apply visitor to current node
    const result = visitor(node, context);
    
    // Recursively visit children
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        walkTree(child, visitor, context);
      }
    }
    
    return result;
  } catch (err) {
    logger.warn(`Error in tree walker for node: ${node.name}`, { 
      error: err instanceof Error ? err.message : String(err)
    });
    return undefined as unknown as T;
  }
}