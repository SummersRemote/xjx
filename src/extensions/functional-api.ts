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
import { XNode, addChild, createElement, cloneNode } from "../core/xnode";
import { NonTerminalExtensionContext, TerminalExtensionContext } from "../core/extension";
import { validateInput, NodeHooks } from "../core/converter";
import { Transform } from "../core/functional";
import { transformXNodeWithHooks } from "../converters/xnode-transformer";

/**
 * Create a container node for results
 */
function createResultsContainer(rootName: string = 'results'): XNode {
  return createElement(rootName);
}

/**
 * Walk the tree and apply a visitor function to each node
 */
function walkTree<T>(
  node: XNode, 
  visitor: (node: XNode, context?: any) => T,
  context?: any
): T {
  try {
    const result = visitor(node, context);
    
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
 */
function collectNodes(
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
function filterNodeHierarchy(
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
function reduceNodeTree<T>(
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