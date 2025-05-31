/**
 * Core functional API implementation - Updated for new hook system
 *
 * This file implements the streamlined functional API for XJX with new hook architecture:
 * - filter: Tree-walking filter that preserves document hierarchy (no hooks)
 * - map: Tree-walking transformation with primary transform + optional before/after hooks
 * - reduce: Aggregate values from all nodes (no hooks - keep simple)
 * - select: Collect matching nodes without hierarchy (no hooks)
 */
import { LoggerFactory } from "../core/logger";
const logger = LoggerFactory.create();

import { XJX } from "../XJX";
import { XNode, addChild} from "../core/xnode";
import { NonTerminalExtensionContext, TerminalExtensionContext } from "../core/extension";
import { validateInput, NodeHooks } from "../core/hooks";
import { Transform, createResultsContainer, filterNodeHierarchy, reduceNodeTree, collectNodes } from "../core/functional";
import { transformXNodeWithHooks } from "../converters/xnode-transformer";

/**
 * Return a new document with only nodes that match the predicate
 * (no hooks - predicates are simple)
 */
export function filter(
  this: NonTerminalExtensionContext,
  predicate: (node: XNode) => boolean
): void {
  try {
    validateInput(typeof predicate === "function", "Predicate must be a function");
    this.validateSource();

    logger.debug("Filtering document nodes hierarchically");

    const rootNode = this.xnode as XNode;
    const filteredRoot = filterNodeHierarchy(rootNode, predicate);

    if (filteredRoot) {
      this.xnode = filteredRoot;
      logger.debug("Successfully filtered document", {
        rootName: filteredRoot.name
      });
    } else {
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
 * Apply a transformation to every node in the document
 * NEW: transform is primary parameter, hooks are optional
 */
export function map(
  this: NonTerminalExtensionContext,
  transform: Transform,
  hooks?: NodeHooks
): void {
  try {
    validateInput(typeof transform === "function", "Transform must be a function");
    this.validateSource();

    logger.debug("Mapping document nodes", {
      hasNodeHooks: !!(hooks && (hooks.beforeTransform || hooks.afterTransform))
    });

    const rootNode = this.xnode as XNode;
    
    // Use the integrated transformer with the new hook system
    const mappedRoot = transformXNodeWithHooks(rootNode, transform, hooks, this.config);

    if (mappedRoot) {
      this.xnode = mappedRoot;
      logger.debug("Successfully transformed document", {
        rootName: mappedRoot.name
      });
    } else {
      this.xnode = createResultsContainer(
        typeof this.config.fragmentRoot === 'string' 
          ? this.config.fragmentRoot 
          : 'results'
      );
      logger.debug("Transform removed all nodes from the document");
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
 * (no hooks - keep simple)
 */
export function reduce<T>(
  this: TerminalExtensionContext,
  initialValue: T,
  reducer: (accumulator: T, node: XNode) => T
): T {
  try {
    validateInput(typeof reducer === "function", "Reducer must be a function");
    this.validateSource();

    logger.debug("Reducing document nodes");

    const rootNode = this.xnode as XNode;
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
 * (no hooks - predicates are simple)
 */
export function select(
  this: NonTerminalExtensionContext,
  predicate: (node: XNode) => boolean
): void {
  try {
    validateInput(typeof predicate === "function", "Predicate must be a function");
    this.validateSource();

    logger.debug("Selecting document nodes");

    const rootNode = this.xnode as XNode;
    const selectedNodes = collectNodes(rootNode, predicate);

    const resultsContainer = createResultsContainer(
      typeof this.config.fragmentRoot === 'string' 
        ? this.config.fragmentRoot 
        : 'results'
    );

    for (const node of selectedNodes) {
      addChild(resultsContainer, node);
    }

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