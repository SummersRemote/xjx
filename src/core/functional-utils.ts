/**
 * Common utilities for functional operations
 * 
 * This file contains shared functions for tree traversal and result handling
 * used by the functional API methods.
 */
import { XNode, createElement, addChild, cloneNode } from './xnode';
import { logger } from './error';

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

/**
 * Walk the tree and collect nodes that match a predicate
 * @param node Root node to start traversal
 * @param predicate Function to test each node
 * @returns Array of matching nodes
 */
export function collectNodes(
  node: XNode, 
  predicate: (node: XNode) => boolean
): XNode[] {
  const results: XNode[] = [];
  
  walkTree(node, (current) => {
    try {
      if (predicate(current)) {
        // Clone the node to avoid mutations
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
 * Improved filter implementation that properly handles negations
 * @param node Root node to filter
 * @param predicate Function that determines if a node should be kept
 * @returns New filtered node tree or null if no matches
 */
export function filterNodeHierarchy(
  node: XNode,
  predicate: (node: XNode) => boolean
): XNode | null {
  try {
    // Function to recursively filter the tree
    const filterNode = (currentNode: XNode): XNode | null => {
      // Check if this node matches the predicate
      let keepThisNode: boolean;
      
      try {
        keepThisNode = predicate(currentNode);
      } catch (err) {
        logger.warn(`Error in filter predicate for node ${currentNode.name}:`, err);
        keepThisNode = false;
      }
      
      // Process children first (if any)
      const keptChildren: XNode[] = [];
      
      if (currentNode.children && currentNode.children.length > 0) {
        for (const child of currentNode.children) {
          const filteredChild = filterNode(child);
          if (filteredChild) {
            keptChildren.push(filteredChild);
          }
        }
      }
      
      // If this node doesn't match the predicate and has no children that match,
      // remove it entirely
      if (!keepThisNode && keptChildren.length === 0) {
        return null;
      }
      
      // Create a new node for the result
      const resultNode = cloneNode(currentNode, false);
      
      // If we have kept children, add them
      if (keptChildren.length > 0) {
        resultNode.children = keptChildren;
        // Set parent references
        keptChildren.forEach(child => child.parent = resultNode);
      }
      
      return resultNode;
    };
    
    // Start the filtering process from the root
    return filterNode(node);
  } catch (err) {
    logger.error('Error in filter operation:', err);
    // Return a clone of the original on critical error to avoid mutation
    return cloneNode(node, true);
  }
}

/**
 * Apply a transformer function to every node in the tree
 * @param node Root node to transform
 * @param transformer Function to transform each node
 * @returns New transformed node tree
 */
export function mapNodeTree(
  node: XNode,
  transformer: (node: XNode) => XNode | null
): XNode | null {
  try {
    // Apply transformer to current node
    const transformedNode = transformer(cloneNode(node, false));
    
    // If transformer returned null, skip this node
    if (!transformedNode) {
      return null;
    }
    
    // Process children
    if (node.children && node.children.length > 0) {
      transformedNode.children = [];
      
      for (const child of node.children) {
        const transformedChild = mapNodeTree(child, transformer);
        if (transformedChild) {
          transformedChild.parent = transformedNode;
          transformedNode.children.push(transformedChild);
        }
      }
    }
    
    return transformedNode;
  } catch (err) {
    logger.warn(`Error in mapper for node: ${node.name}`, {
      error: err instanceof Error ? err.message : String(err)
    });
    
    // Return a clone of the original node on error
    return cloneNode(node, true);
  }
}

/**
 * Reduce all nodes in the tree to a single value
 * @param node Root node to process
 * @param reducer Function to accumulate values
 * @param initialValue Initial accumulator value
 * @returns Final accumulated value
 */
export function reduceNodeTree<T>(
  node: XNode,
  reducer: (accumulator: T, node: XNode) => T,
  initialValue: T
): T {
  let accumulator = initialValue;
  
  // Process node in pre-order traversal
  const traverse = (current: XNode) => {
    try {
      // Update accumulator with current node
      accumulator = reducer(accumulator, cloneNode(current, false));
    } catch (err) {
      logger.warn(`Error in reducer for node: ${current.name}`, {
        error: err instanceof Error ? err.message : String(err)
      });
    }
    
    // Process children
    if (current.children && current.children.length > 0) {
      for (const child of current.children) {
        traverse(child);
      }
    }
  };
  
  traverse(node);
  return accumulator;
}