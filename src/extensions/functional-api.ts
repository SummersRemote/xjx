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

// Register the functions with XJX
XJX.registerNonTerminalExtension("filter", filter);
XJX.registerNonTerminalExtension("map", map);
XJX.registerTerminalExtension("reduce", reduce);
XJX.registerNonTerminalExtension("select", select);

// Export compose as a global utility
// export { compose };