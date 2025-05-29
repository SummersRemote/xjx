/**
 * Core functional API implementation
 *
 * This file implements the streamlined functional API for XJX:
 * - filter: Tree-walking filter that preserves document hierarchy
 * - map: Tree-walking transformation of every node
 * - reduce: Aggregate values from all nodes
 * - select: Collect matching nodes without hierarchy
 */
import { LoggerFactory } from "../core/logger";
const logger = LoggerFactory.create();

import { XJX } from "../XJX";
import { XNode, addChild } from "../core/xnode";
import { NonTerminalExtensionContext, TerminalExtensionContext } from "../core/extension";
import { validateInput } from "../core/converter";
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
    validateInput(typeof predicate === "function", "Predicate must be a function");
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
  transformer: (node: XNode) => XNode | null | undefined | void  // Allow undefined/void
): void {
  try {
    // API boundary validation
    validateInput(typeof transformer === "function", "Transformer must be a function");
    this.validateSource();

    logger.debug("Mapping document nodes");

    // Get the current document root
    const rootNode = this.xnode as XNode;

    // Create a wrapper that handles undefined returns gracefully
    const consistentTransformer = (node: XNode): XNode | null => {
      try {
        const result = transformer(node);
        
        // NEW: Handle undefined returns gracefully (keep original node)
        if (result === undefined) {
          // Undefined return - keep original (consistent with beforeFn/afterFn)
          return node;
        }
        
        // Existing logic for null and valid nodes
        if (result === null) {
          return null; // Explicit removal
        }
        
        if (result && typeof result === 'object' && typeof result.name === 'string') {
          return result as XNode; // Valid transformation
        }
        
        // NEW: Handle invalid return types gracefully
        if (result !== undefined && result !== null) {
          logger.warn(`Transformer returned invalid type for ${node.name}: ${typeof result}, keeping original`);
          return node;
        }
        
        return node; // Fallback
      } catch (error) {
        logger.warn(`Error in transformer for node ${node.name}:`, error);
        return node; // Keep original on error
      }
    };

    // Apply the consistent transformer
    const mappedRoot = mapNodeTree(rootNode, consistentTransformer);

    if (mappedRoot) {
      // Update the document with transformed results
      this.xnode = mappedRoot;
      logger.debug("Successfully transformed document", {
        rootName: mappedRoot.name
      });
    } else {
      // This shouldn't happen with our consistent transformer, but handle it
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
    validateInput(typeof reducer === "function", "Reducer must be a function");
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
    validateInput(typeof predicate === "function", "Predicate must be a function");
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