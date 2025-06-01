/**
 * Core functional API implementation
 *
 */
import { LoggerFactory } from "../core/logger";
const logger = LoggerFactory.create();

import { XJX } from "../XJX";
import { XNode, addChild, cloneNode } from "../core/xnode";
import { NonTerminalExtensionContext, TerminalExtensionContext, BranchContext } from "../core/extension";
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

/**
 * Create an isolated scope containing nodes matching the predicate
 */
export function branch(
  this: NonTerminalExtensionContext,
  predicate: (node: XNode) => boolean
): void {
  try {
    validateInput(typeof predicate === "function", "Predicate must be a function");
    this.validateSource();

    logger.debug("Creating branch scope");

    const rootNode = this.xnode as XNode;
    
    // Collect all nodes that match the predicate with their paths
    const branchInfo = collectNodesWithPaths(rootNode, predicate);
    
    if (branchInfo.nodes.length === 0) {
      // No nodes matched - create empty branch
      this.branchContext = {
        parentNodes: [rootNode],
        originalIndices: [],
        branchedNodes: [],
        nodePaths: []
      };
      
      this.xnode = createResultsContainer(
        typeof this.config.fragmentRoot === 'string' 
          ? this.config.fragmentRoot 
          : 'results'
      );
    } else {
      // Store branch context
      this.branchContext = {
        parentNodes: [rootNode],
        originalIndices: branchInfo.indices,
        branchedNodes: branchInfo.nodes.map(node => cloneNode(node, true)),
        nodePaths: branchInfo.paths
      };
      
      // Create results container with branched nodes
      const resultsContainer = createResultsContainer(
        typeof this.config.fragmentRoot === 'string' 
          ? this.config.fragmentRoot 
          : 'results'
      );
      
      for (const node of branchInfo.nodes) {
        const clonedNode = cloneNode(node, true);
        addChild(resultsContainer, clonedNode);
      }
      
      this.xnode = resultsContainer;
    }

    logger.debug("Successfully created branch", {
      branchedNodeCount: branchInfo.nodes?.length || 0
    });
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to create branch: ${String(err)}`);
  }
}

/**
 * Merge the current branch back into the parent scope
 */
export function merge(this: NonTerminalExtensionContext): void {
  try {
    // If no active branch, this is a no-op
    if (!this.branchContext) {
      logger.debug("No active branch to merge - operation ignored");
      return;
    }

    logger.debug("Merging branch back to parent scope");

    const { parentNodes, nodePaths } = this.branchContext;
    const parentNode = parentNodes[0];
    
    // Get current branch nodes (excluding the container)
    const currentBranchNodes = this.xnode?.children || [];
    
    // Create a deep clone of the parent to avoid mutation
    const mergedParent = cloneNode(parentNode, true);
    
    // Replace each original node with its corresponding replacement
    // Process from deepest paths first to avoid index shifting issues
    const pathNodePairs = nodePaths.map((path, index) => ({
      path,
      node: currentBranchNodes[index] || null
    })).sort((a, b) => b.path.length - a.path.length || b.path[b.path.length - 1] - a.path[a.path.length - 1]);
    
    for (const { path, node } of pathNodePairs) {
      if (node && path.length > 0) {
        replaceNodeAtPath(mergedParent, node, path);
      } else if (!node && path.length > 0) {
        // Node was removed (filtered out), remove original
        removeNodeAtPath(mergedParent, path);
      }
    }
    
    // Clear branch context and restore parent
    this.branchContext = null;
    this.xnode = mergedParent;

    logger.debug("Successfully merged branch", {
      replacementNodeCount: currentBranchNodes.length,
      originalNodeCount: nodePaths.length
    });
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to merge branch: ${String(err)}`);
  }
}

/**
 * Collect nodes matching predicate along with their paths in the tree
 */
function collectNodesWithPaths(
  root: XNode,
  predicate: (node: XNode) => boolean
): { nodes: XNode[], indices: number[], paths: number[][] } {
  const results: XNode[] = [];
  const indices: number[] = [];
  const paths: number[][] = [];
  
  function traverse(node: XNode, path: number[] = []): void {
    try {
      if (predicate(node)) {
        results.push(node);
        indices.push(results.length - 1);
        paths.push([...path]);
      }
    } catch (err) {
      logger.warn(`Error evaluating predicate on node: ${node.name}`, {
        error: err instanceof Error ? err.message : String(err)
      });
    }
    
    if (node.children) {
      node.children.forEach((child, index) => {
        traverse(child, [...path, index]);
      });
    }
  }
  
  traverse(root);
  
  return { nodes: results, indices, paths };
}

/**
 * Replace a single node at a specific path in the tree
 */
function replaceNodeAtPath(root: XNode, replacementNode: XNode, path: number[]): void {
  if (path.length === 0) return; // Can't replace root
  
  const parentPath = path.slice(0, -1);
  const nodeIndex = path[path.length - 1];
  
  const parent = getNodeAtPath(root, parentPath);
  if (parent?.children && nodeIndex < parent.children.length) {
    // Set correct parent reference
    replacementNode.parent = parent;
    // Replace the node at this position
    parent.children[nodeIndex] = replacementNode;
  }
}

/**
 * Remove a single node at a specific path in the tree
 */
function removeNodeAtPath(root: XNode, path: number[]): void {
  if (path.length === 0) return; // Can't remove root
  
  const parentPath = path.slice(0, -1);
  const nodeIndex = path[path.length - 1];
  
  const parent = getNodeAtPath(root, parentPath);
  if (parent?.children && nodeIndex < parent.children.length) {
    parent.children.splice(nodeIndex, 1);
  }
}

/**
 * Get a node at a specific path in the tree
 */
function getNodeAtPath(root: XNode, path: number[]): XNode | null {
  let current = root;
  
  for (const index of path) {
    if (!current.children || index >= current.children.length) {
      return null;
    }
    current = current.children[index];
  }
  
  return current;
}

// Register the functions with XJX
XJX.registerNonTerminalExtension("filter", filter);
XJX.registerNonTerminalExtension("map", map);
XJX.registerTerminalExtension("reduce", reduce);
XJX.registerNonTerminalExtension("select", select);
XJX.registerNonTerminalExtension("branch", branch);
XJX.registerNonTerminalExtension("merge", merge);