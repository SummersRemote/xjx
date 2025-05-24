/**
 * Node operations extensions for XJX
 * 
 * This file implements four core node operation extensions:
 * - select: Find nodes in the document matching a predicate
 * - filter: Narrow down the current selection based on a predicate
 * - map: Transform each node in the current selection
 * - reduce: Aggregate nodes in the current selection into a single value
 */
import { XJX } from "../XJX";
import { XNode, createElement, cloneNode, addChild } from "../core/xnode";
import { logger, validate } from "../core/error";
import { NonTerminalExtensionContext, TerminalExtensionContext } from "../core/extension";

/**
 * Implementation for selecting nodes from the document
 * @param predicate Function that determines if a node should be selected
 * @returns this for chaining
 */
export function select(this: NonTerminalExtensionContext, predicate: (node: XNode) => boolean): void {
  try {
    // API boundary validation
    validate(typeof predicate === 'function', "Predicate must be a function");
    this.validateSource();
    
    logger.debug('Selecting nodes using predicate function');
    
    // Find all matching nodes in the document
    const matches = findMatchingNodes(this.xnode as XNode, predicate);
    
    logger.debug(`Found ${matches.length} matching nodes`);
    
    if (matches.length > 0) {
      if (matches.length === 1) {
        // Single match - create a deep clone
        this.xnode = cloneNode(matches[0], true);
      } else {
        // Multiple matches - create parent with cloned matches
        const fragmentRoot = this.config.fragmentRoot || 'results';
        const resultsNode = createElement(fragmentRoot);
        
        // Add cloned nodes as children
        matches.forEach(node => {
          const clonedNode = cloneNode(node, true);
          addChild(resultsNode, clonedNode);
        });
        
        this.xnode = resultsNode;
      }
    } else {
      // No matches - create empty results node
      const fragmentRoot = this.config.fragmentRoot || 'results';
      this.xnode = createElement(fragmentRoot);
    }
    
    logger.debug('Selection completed successfully');
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to select nodes: ${String(err)}`);
  }
}

/**
 * Implementation for filtering the current selection
 * @param predicate Function that determines if a node should be kept
 * @returns this for chaining
 */
export function filter(this: NonTerminalExtensionContext, predicate: (node: XNode) => boolean): void {
  try {
    // API boundary validation
    validate(typeof predicate === 'function', "Predicate must be a function");
    this.validateSource();
    
    logger.debug('Filtering current node selection');
    
    const fragmentRoot = this.config.fragmentRoot || 'results';
    
    if (this.xnode && this.xnode.name === fragmentRoot && this.xnode.children) {
      // Filter children and create clones of matching nodes
      const filtered = this.xnode.children
        .filter(node => {
          try {
            return predicate(node);
          } catch (err) {
            logger.warn(`Error evaluating filter predicate on node: ${node.name}`, { error: err });
            return false;
          }
        })
        .map(node => cloneNode(node, true));
      
      logger.debug(`Filtered from ${this.xnode.children.length} to ${filtered.length} nodes`);
      
      // Create new results container
      const resultsNode = createElement(fragmentRoot);
      filtered.forEach(node => addChild(resultsNode, node));
      this.xnode = resultsNode;
    } else {
      // Single node - check if it matches
      let matches = false;
      
      try {
        matches = predicate(this.xnode as XNode);
      } catch (err) {
        logger.warn(`Error evaluating filter predicate on node: ${this.xnode?.name}`, { error: err });
      }
      
      if (matches) {
        // Create a deep clone if it matches
        this.xnode = cloneNode(this.xnode as XNode, true);
        logger.debug('Node matched filter criteria');
      } else {
        // Create empty results if it doesn't match
        this.xnode = createElement(fragmentRoot);
        logger.debug('Node did not match filter criteria, created empty results');
      }
    }
    
    logger.debug('Filtering completed successfully');
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to filter nodes: ${String(err)}`);
  }
}

/**
 * Implementation for transforming each node in the current selection
 * @param mapper Function that transforms a node into a new node
 * @returns this for chaining
 */
export function map(this: NonTerminalExtensionContext, mapper: (node: XNode) => XNode): void {
  try {
    // API boundary validation
    validate(typeof mapper === 'function', "Mapper must be a function");
    this.validateSource();
    
    logger.debug('Mapping current node selection');
    
    const fragmentRoot = this.config.fragmentRoot || 'results';
    
    if (this.xnode && this.xnode.name === fragmentRoot && this.xnode.children) {
      // Map children to transformed nodes
      const mapped = this.xnode.children
        .map(node => {
          try {
            // Apply mapping function to a clone of the node
            const clonedNode = cloneNode(node, true);
            return mapper(clonedNode);
          } catch (err) {
            logger.warn(`Error applying mapper to node: ${node.name}`, { error: err });
            return cloneNode(node, true); // Return unchanged on error
          }
        })
        .filter(Boolean); // Remove any null/undefined results
      
      logger.debug(`Mapped ${this.xnode.children.length} nodes`);
      
      // Create new results container
      const resultsNode = createElement(fragmentRoot);
      mapped.forEach(node => addChild(resultsNode, node));
      this.xnode = resultsNode;
    } else {
      // Single node - apply mapper
      try {
        // Apply mapping function to a clone of the node
        const clonedNode = cloneNode(this.xnode as XNode, true);
        this.xnode = mapper(clonedNode);
        logger.debug('Successfully mapped single node');
      } catch (err) {
        logger.warn(`Error applying mapper to node: ${this.xnode?.name}`, { error: err });
        // Keep original node on error (already cloned)
      }
    }
    
    logger.debug('Mapping completed successfully');
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to map nodes: ${String(err)}`);
  }
}

/**
 * Implementation for reducing the current selection to a single value
 * @param reducer Function that accumulates a result from each node
 * @param initialValue Initial value for the accumulator
 * @returns The final accumulated value
 */
export function reduce<T>(this: TerminalExtensionContext, reducer: (accumulator: T, node: XNode, index: number) => T, initialValue: T): T {
  try {
    // API boundary validation
    validate(typeof reducer === 'function', "Reducer must be a function");
    this.validateSource();
    
    logger.debug('Reducing current node selection');
    
    const fragmentRoot = this.config.fragmentRoot || 'results';
    let result = initialValue;
    
    if (this.xnode && this.xnode.name === fragmentRoot && this.xnode.children) {
      // Reduce children to a single value
      result = this.xnode.children.reduce((acc, node, index) => {
        try {
          // Apply reducer function to a clone of the node to prevent mutation
          const clonedNode = cloneNode(node, true);
          return reducer(acc, clonedNode, index);
        } catch (err) {
          logger.warn(`Error applying reducer to node: ${node.name}`, { error: err });
          return acc; // Return unchanged accumulator on error
        }
      }, initialValue);
      
      logger.debug(`Reduced ${this.xnode.children.length} nodes to a single value`);
    } else {
      // Single node - apply reducer with index 0
      try {
        // Apply reducer function to a clone of the node
        const clonedNode = cloneNode(this.xnode as XNode, true);
        result = reducer(initialValue, clonedNode, 0);
        logger.debug('Successfully reduced single node');
      } catch (err) {
        logger.warn(`Error applying reducer to node: ${this.xnode?.name}`, { error: err });
        // Return initial value on error
      }
    }
    
    logger.debug('Reduction completed successfully');
    return result;
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to reduce nodes: ${String(err)}`);
  }
}

/**
 * Traverse the node tree and find matching nodes
 * @param root Root node to start traversal from
 * @param predicate Function to test each node
 * @returns Array of matching nodes
 */
function findMatchingNodes(root: XNode, predicate: (node: XNode) => boolean): XNode[] {
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

// Register the extensions with XJX
XJX.registerNonTerminalExtension("select", select);
XJX.registerNonTerminalExtension("filter", filter);
XJX.registerNonTerminalExtension("map", map);
XJX.registerTerminalExtension("reduce", reduce);

// Optional: export individual functions for use in tests or other contexts
export { select as selectNodes };
export { filter as filterNodes };
export { map as mapNodes };
export { reduce as reduceNodes };