/**
 * Common utilities for functional operations
 * 
 * This file contains shared functions for tree traversal and result handling
 * used by the functional API methods.
 */
import { LoggerFactory } from "./logger";
const logger = LoggerFactory.create();

import { XNode, createElement, cloneNode  } from './xnode';

/**
 * Create a container node for results
 * @param rootName Name for the container element
 * @returns A new container node
 */
export function createResultsContainer(rootName: string = 'results'): XNode {
  return createElement(rootName);
}

export function compose(...transforms: Transform[]): Transform {
  return (node: XNode): XNode => {
    return transforms.reduce((result, transform) => {
      try {
        return transform(result);
      } catch (err) {
        // If transform fails, return original node
        logger.warn(`Transform error on node '${result.name}':`, err);
        return result;
      }
    }, node);
  };
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
/**
 * A transform function that processes an XNode
 */

export type Transform = (node: XNode) => XNode;
/**
 * Compose multiple transforms into a single transform
 * Transforms are applied in order (left to right)
 *
 * @example
 * ```typescript
 * const processPrice = compose(
 *   regex(/[^\d.]/g, ''),  // Remove non-digits and dots
 *   toNumber({ precision: 2 }),
 *   (node) => ({ ...node, value: node.value * 1.1 })  // Add 10% markup
 * );
 *
 * xjx.fromXml(xml)
 *    .filter(node => node.name === 'price')
 *    .map(processPrice)
 *    .toJson();
 * ```
 *
 * @param transforms Array of transforms to compose
 * @returns A composed transform function
 */

/**
 * Walk the tree and collect nodes that match a predicate
 */
export function collectNodes(
  node: XNode, 
  predicate: (node: XNode) => boolean
): XNode[] {
  const results: XNode[] = [];
  
  walkTree(node, (current) => {
    try {
      if (predicate(current)) {
        results.push(cloneNode(current, true));
      }
    } catch (err) {
      logger.warn(`Error evaluating predicate on node: ${current.name}`, {
        error: err instanceof Error ? err.message : String(err)
      });
    }
    
    return undefined;
  });
  
  return results;
}

/**
 * Filter implementation that properly handles negations
 */
export function filterNodeHierarchy(
  node: XNode,
  predicate: (node: XNode) => boolean
): XNode | null {
  try {
    const filterNode = (currentNode: XNode): XNode | null => {
      let keepThisNode: boolean;
      
      try {
        keepThisNode = predicate(currentNode);
      } catch (err) {
        logger.warn(`Error in filter predicate for node ${currentNode.name}:`, err);
        keepThisNode = false;
      }
      
      const keptChildren: XNode[] = [];
      
      if (currentNode.children && currentNode.children.length > 0) {
        for (const child of currentNode.children) {
          const filteredChild = filterNode(child);
          if (filteredChild) {
            keptChildren.push(filteredChild);
          }
        }
      }
      
      if (!keepThisNode && keptChildren.length === 0) {
        return null;
      }
      
      const resultNode = cloneNode(currentNode, false);
      
      if (keptChildren.length > 0) {
        resultNode.children = keptChildren;
        keptChildren.forEach(child => child.parent = resultNode);
      }
      
      return resultNode;
    };
    
    return filterNode(node);
  } catch (err) {
    logger.error('Error in filter operation:', err);
    return cloneNode(node, true);
  }
}

/**
 * Reduce all nodes in the tree to a single value
 */
export function reduceNodeTree<T>(
  node: XNode,
  reducer: (accumulator: T, node: XNode) => T,
  initialValue: T
): T {
  let accumulator = initialValue;
  
  const traverse = (current: XNode) => {
    try {
      accumulator = reducer(accumulator, cloneNode(current, false));
    } catch (err) {
      logger.warn(`Error in reducer for node: ${current.name}`, {
        error: err instanceof Error ? err.message : String(err)
      });
    }
    
    if (current.children && current.children.length > 0) {
      for (const child of current.children) {
        traverse(child);
      }
    }
  };
  
  traverse(node);
  return accumulator;
}


