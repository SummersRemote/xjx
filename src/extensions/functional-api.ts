/**
 * Core functional API implementation
 *
 * This file implements the streamlined functional API for XJX:
 * - filter: Tree-walking filter that preserves document hierarchy
 * - map: Tree-walking transformation of every node
 * - reduce: Aggregate values from all nodes
 * - select: Collect matching nodes without hierarchy
 * - get: Retrieve a specific node by index
 */
import { XJX } from "../XJX";
import { XNode, createElement, cloneNode, addChild } from "../core/xnode";
import { logger, validate, ValidationError } from "../core/error";
import { NonTerminalExtensionContext, TerminalExtensionContext } from "../core/extension";
import {
  createResultsContainer,
  filterNodeHierarchy,
  mapNodeTree,
  reduceNodeTree,
  collectNodes
} from "../core/functional-utils";

/**
 * Return a new document with only nodes that match the predicate
 * (and their ancestors to maintain structure)
 *
 * @param predicate Function that determines if a node should be kept
 * @returns this for chaining
 */
export function filter(
  this: NonTerminalExtensionContext,
  predicate: (node: XNode) => boolean
): void {
  try {
    // API boundary validation
    validate(typeof predicate === "function", "Predicate must be a function");
    this.validateSource();

    logger.debug("Filtering document nodes hierarchically");

    // Get the current document root
    const rootNode = this.xnode as XNode;

    // Apply filter to get a new filtered document
    const filteredRoot = filterNodeHierarchy(rootNode, predicate);

    if (filteredRoot) {
      // Update the document with filtered results
      this.xnode = filteredRoot;
      logger.debug("Successfully filtered document", {
        rootName: filteredRoot.name
      });
    } else {
      // Create an empty results container if nothing matched
      this.xnode = createResultsContainer(
        typeof this.config.fragmentRoot === 'string' 
          ? this.config.fragmentRoot 
          : 'results'
      );
      logger.debug("No nodes matched the filter predicate");
    }
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to filter document: ${String(err)}`);
  }
}

/**
 * Apply a transformation function to every node in the document
 *
 * @param transformer Function to transform each node
 * @returns this for chaining
 */
export function map(
  this: NonTerminalExtensionContext,
  transformer: (node: XNode) => XNode | null
): void {
  try {
    // API boundary validation
    validate(typeof transformer === "function", "Transformer must be a function");
    this.validateSource();

    logger.debug("Mapping document nodes");

    // Get the current document root
    const rootNode = this.xnode as XNode;

    // Apply transformer to get a new document
    const mappedRoot = mapNodeTree(rootNode, transformer);

    if (mappedRoot) {
      // Update the document with transformed results
      this.xnode = mappedRoot;
      logger.debug("Successfully transformed document", {
        rootName: mappedRoot.name
      });
    } else {
      // Create an empty results container if transformer removed all nodes
      this.xnode = createResultsContainer(
        typeof this.config.fragmentRoot === 'string' 
          ? this.config.fragmentRoot 
          : 'results'
      );
      logger.debug("Transformer removed all nodes from the document");
    }
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to transform document: ${String(err)}`);
  }
}

/**
 * Accumulate a value by processing every node in the document
 *
 * @param reducer Function that accumulates a result from each node
 * @param initialValue Initial value for the accumulator
 * @returns The final accumulated value
 */
export function reduce<T>(
  this: TerminalExtensionContext,
  reducer: (accumulator: T, node: XNode) => T,
  initialValue: T
): T {
  try {
    // API boundary validation
    validate(typeof reducer === "function", "Reducer must be a function");
    this.validateSource();

    logger.debug("Reducing document nodes");

    // Get the current document root
    const rootNode = this.xnode as XNode;

    // Apply reducer to all nodes in the tree
    const result = reduceNodeTree(rootNode, reducer, initialValue);

    logger.debug("Successfully reduced document");
    
    return result;
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to reduce document: ${String(err)}`);
  }
}

/**
 * Combine multiple functions into a single function
 * Functions are applied in sequence from left to right
 *
 * @param functions Functions to compose
 * @returns A new function that applies the composition
 */
export function compose<T>(...functions: Array<(value: T) => T>): (value: T) => T {
  return (value: T): T => {
    return functions.reduce((result, func) => {
      try {
        return func(result);
      } catch (err) {
        logger.warn('Error in composed function', { 
          error: err instanceof Error ? err.message : String(err)
        });
        return result; // Return previous result on error
      }
    }, value);
  };
}

/**
 * Collect nodes that match a predicate without maintaining hierarchy
 *
 * @param predicate Function that determines if a node should be included
 * @returns this for chaining
 */
export function select(
  this: NonTerminalExtensionContext,
  predicate: (node: XNode) => boolean
): void {
  try {
    // API boundary validation
    validate(typeof predicate === "function", "Predicate must be a function");
    this.validateSource();

    logger.debug("Selecting document nodes");

    // Get the current document root
    const rootNode = this.xnode as XNode;

    // Collect matching nodes
    const selectedNodes = collectNodes(rootNode, predicate);

    // Create a container for the results
    const resultsContainer = createResultsContainer(
      typeof this.config.fragmentRoot === 'string' 
        ? this.config.fragmentRoot 
        : 'results'
    );

    // Add selected nodes to container
    for (const node of selectedNodes) {
      addChild(resultsContainer, node);
    }

    // Update the document
    this.xnode = resultsContainer;

    logger.debug("Successfully selected nodes", {
      count: selectedNodes.length
    });
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to select nodes: ${String(err)}`);
  }
}

/**
 * Slice selected nodes using Python-like array slicing syntax
 * 
 * @param start Starting index (inclusive, default: 0)
 * @param end Ending index (exclusive, default: length)
 * @param step Step value (default: 1)
 * @returns this for chaining
 */
export function slice(
  this: NonTerminalExtensionContext,
  start?: number,
  end?: number,
  step: number = 1
): void {
  try {
    // API boundary validation
    this.validateSource();
    validate(step !== 0, "Step cannot be zero");
    
    // Get the current node
    const currentNode = this.xnode as XNode;
    
    // Handle different cases based on current node structure
    if (!currentNode.children || currentNode.children.length === 0) {
      throw new ValidationError("Current node has no children");
    }
    
    const children = currentNode.children;
    const length = children.length;
    
    // Handle Python-like negative indices and defaults
    const normalizedStart = start !== undefined ? (start < 0 ? length + start : start) : 0;
    const normalizedEnd = end !== undefined ? (end < 0 ? length + end : end) : length;
    
    // Determine indices to include based on start, end, and step
    const indices: number[] = [];
    
    if (step > 0) {
      // Forward direction
      for (let i = normalizedStart; i < normalizedEnd; i += step) {
        if (i >= 0 && i < length) {
          indices.push(i);
        }
      }
    } else {
      // Reverse direction
      for (let i = normalizedStart; i > normalizedEnd; i += step) {
        if (i >= 0 && i < length) {
          indices.push(i);
        }
      }
    }
    
    // Create a container for the results
    const container = createResultsContainer(
      typeof this.config.fragmentRoot === 'string' 
        ? this.config.fragmentRoot 
        : 'results'
    );
    
    // Add selected nodes to container
    for (const index of indices) {
      addChild(container, cloneNode(children[index], true));
    }
    
    // Set the container as the new current node
    this.xnode = container;
    
    logger.debug("Successfully sliced nodes", {
      start: normalizedStart,
      end: normalizedEnd,
      step,
      resultCount: indices.length
    });
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to slice nodes: ${String(err)}`);
  }
}

/**
 * Unwrap the container and promote its children
 * If there's a single child, that child becomes the new root
 * If there are multiple children, their common name becomes the new root
 * 
 * @returns this for chaining
 */
export function unwrap(
  this: NonTerminalExtensionContext
): void {
  try {
    // API boundary validation
    this.validateSource();
    
    // Get the current node
    const currentNode = this.xnode as XNode;
    
    if (!currentNode.children || currentNode.children.length === 0) {
      // Nothing to unwrap
      logger.debug("No children to unwrap");
      return;
    }
    
    // Single child case: promote the child
    if (currentNode.children.length === 1) {
      this.xnode = cloneNode(currentNode.children[0], true);
      logger.debug("Unwrapped single child node", {
        nodeName: this.xnode.name
      });
      return;
    }
    
    // Multiple children case: check if they all have the same name
    const firstChildName = currentNode.children[0].name;
    const allSameName = currentNode.children.every(child => child.name === firstChildName);
    
    if (allSameName) {
      // Create a new container with the common name
      const container = createElement(firstChildName);
      
      // Add all children to this container
      for (const child of currentNode.children) {
        addChild(container, cloneNode(child, true));
      }
      
      this.xnode = container;
      logger.debug("Unwrapped multiple children with same name", {
        nodeName: firstChildName,
        childCount: currentNode.children.length
      });
    } else {
      // Mixed children - can't unwrap cleanly
      logger.warn("Cannot unwrap mixed children with different names");
      throw new ValidationError(
        "Cannot unwrap container with mixed child types. All children must have the same name."
      );
    }
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to unwrap nodes: ${String(err)}`);
  }
}

// Register the functions with XJX
XJX.registerNonTerminalExtension("filter", filter);
XJX.registerNonTerminalExtension("map", map);
XJX.registerTerminalExtension("reduce", reduce);
XJX.registerNonTerminalExtension("select", select);
XJX.registerNonTerminalExtension("slice", slice);
XJX.registerNonTerminalExtension("unwrap", unwrap);

// Export compose as a global utility
// export { compose };