/**
 * Improved shared utility functions for the functional pipeline
 * 
 * This file contains common utility functions used by
 * both functional operations and axis navigation operations.
 */
import { XNode, createElement, cloneNode, addChild } from "../core/xnode";
import { NonTerminalExtensionContext } from "../core/extension";
import { logger } from "../core/error";

/**
 * Create result node based on fragmentRoot parameter or configuration
 * @param context Extension context
 * @param fragmentRoot Optional fragmentRoot parameter (string or XNode)
 * @returns XNode for results container
 */
export function createResultNode(
  context: NonTerminalExtensionContext,
  fragmentRoot?: string | XNode
): XNode {
  // Use parameter first, then config, then default
  const rootSpec = fragmentRoot !== undefined ? fragmentRoot : context.config.fragmentRoot;
  
  if (typeof rootSpec === 'string') {
    // Create a new element with the given name
    return createElement(rootSpec);
  } else if (rootSpec && typeof rootSpec === 'object') {
    // Clone the XNode to avoid mutation
    return cloneNode(rootSpec, true);
  } else {
    // Fallback default
    return createElement('results');
  }
}

/**
 * Check if current node is a results container from functional operations
 */
export function isResultsContainer(
  context: NonTerminalExtensionContext, 
  node: XNode
): boolean {
  const fragmentRootName = typeof context.config.fragmentRoot === 'string' ? 
    context.config.fragmentRoot : 'results';
  
  return node.name === fragmentRootName && 
        Array.isArray(node.children) && 
        node.children.length > 0;
}

/**
 * Traverse the node tree and find matching nodes
 * @param root Root node to start traversal from
 * @param predicate Function to test each node
 * @returns Array of matching nodes
 */
export function findMatchingNodes(root: XNode, predicate: (node: XNode) => boolean): XNode[] {
  const results: XNode[] = [];
  
  const traverse = (node: XNode) => {
    try {
      // Test the current node
      if (predicate(node)) {
        results.push(node);
      }
      
      // Recursively process children
      if (node.children && node.children.length > 0) {
        node.children.forEach(child => traverse(child));
      }
    } catch (err) {
      logger.warn(`Error evaluating predicate on node: ${node.name}`, { error: err });
    }
  };
  
  traverse(root);
  return results;
}

/**
 * Find descendant nodes that match a predicate
 * @param node Parent node to search within
 * @param predicate Function to test each descendant
 * @returns Array of matching nodes
 */
export function findDescendants(node: XNode, predicate: (node: XNode) => boolean): XNode[] {
  const results: XNode[] = [];
  
  const traverse = (current: XNode) => {
    if (current.children && current.children.length > 0) {
      current.children.forEach(child => {
        try {
          if (predicate(child)) {
            results.push(child);
          }
        } catch (err) {
          logger.warn(`Error evaluating predicate on node: ${child.name}`, { error: err });
        }
        
        // Continue traversing regardless of whether this node matched
        traverse(child);
      });
    }
  };
  
  traverse(node);
  return results;
}

/**
 * Improved process results function
 * If there are multiple results, wrap them in a container
 * If there is a single result, return it directly
 * If there are no results, return an empty container
 * 
 * @param context Extension context
 * @param matches Array of matching nodes
 * @param fragmentRoot Optional container element name or XNode
 * @returns Processed result node
 */
export function processResults(
  context: NonTerminalExtensionContext,
  matches: XNode[],
  fragmentRoot?: string | XNode
): XNode {
  // Create a container node regardless of match count
  const resultsNode = createResultNode(context, fragmentRoot);
  
  if (matches.length > 0) {
    // Check if we are dealing with a collection of elements with the same name
    // This helps structure the output better for JSON conversion
    const allSameName = matches.every(node => node.name === matches[0].name);
    
    if (allSameName) {
      // If all nodes have the same name, group them under that name
      // This produces nicer JSON like { "results": { "title": [...] } }
      
      // Add the nodes as children to the results node
      matches.forEach(node => {
        const clonedNode = cloneNode(node, true);
        addChild(resultsNode, clonedNode);
      });
      
    } else {
      // Mixed element names or other cases
      matches.forEach(node => {
        const clonedNode = cloneNode(node, true);
        addChild(resultsNode, clonedNode);
      });
    }
  }
  
  return resultsNode;
}

/**
 * Group matching nodes by name for better JSON representation
 * @param nodes Array of nodes to group
 * @returns Object with node names as keys and arrays of nodes as values
 */
export function groupNodesByName(nodes: XNode[]): Record<string, XNode[]> {
  const groups: Record<string, XNode[]> = {};
  
  nodes.forEach(node => {
    if (!groups[node.name]) {
      groups[node.name] = [];
    }
    groups[node.name].push(node);
  });
  
  return groups;
}