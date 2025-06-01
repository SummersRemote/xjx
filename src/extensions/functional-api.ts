/**
 * Core functional API implementation - Updated for unified pipeline execution
 * CRITICAL: All legacy transform handling REMOVED
 */
import { LoggerFactory } from "../core/logger";
const logger = LoggerFactory.create();

import { XJX } from "../XJX";
import { XNode, addChild } from "../core/xnode";
import {
  NonTerminalExtensionContext,
  TerminalExtensionContext,
  BranchContext,
} from "../core/extension";
import { NodeHooks } from "../core/hooks";
import {
  Transform,
  createResultsContainer,
  collectNodesWithPaths,
  replaceNodeAtPath,
  removeNodeAtPath,
  getNodeAtPath,
  traverseTree,
  TreeVisitor,
  TraversalContext
} from "../core/functional";
import { ClonePolicies } from "../core/context";
import { PipelineStage } from "../core/pipeline";

/**
 * Return a new document with only nodes that match the predicate
 * NEW: Uses unified pipeline execution
 */
export function filter(
  this: NonTerminalExtensionContext,
  predicate: (node: XNode) => boolean,
  hooks?: NodeHooks
): void {
  try {
    this.pipeline.validateInput(
      typeof predicate === "function",
      "Predicate must be a function"
    );
    this.validateSource();

    logger.debug("Filtering document nodes using unified pipeline");

    // Create pipeline stage for filter operation
    const filterStage: PipelineStage<XNode, XNode> = {
      name: 'filter',
      
      execute: (node, context) => {
        const visitor: TreeVisitor<XNode | null> = {
          visit: (node, ctx) => {
            try {
              return predicate(node) ? context.cloneNode(node, ClonePolicies.TRANSFORM) : null;
            } catch (err) {
              logger.warn(`Error in predicate for node '${node.name}':`, err);
              return null;
            }
          },
          
          combineResults: (parent, children) => {
            const validChildren = children.filter(child => child !== null) as XNode[];
            
            if (parent && (validChildren.length > 0 || predicate(parent))) {
              const result = context.cloneNode(parent, { strategy: 'shallow', preserveParent: false });
              
              if (validChildren.length > 0) {
                result.children = validChildren;
                validChildren.forEach(child => child.parent = result);
              }
              
              return result;
            }
            
            return null;
          }
        };
        
        const result = traverseTree(node, visitor, {
          order: 'post',
          hooks,
          context
        });
        
        return result || createResultsContainer(
          getFragmentRootName(context.config.get())
        );
      }
    };

    // Execute using unified pipeline
    this.executeTransform(filterStage, hooks);

    logger.debug("Successfully filtered document using pipeline", {
      rootName: this.xnode?.name,
    });
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to filter document: ${String(err)}`);
  }
}

/**
 * Apply a transformation to every node in the document
 * NEW: Uses unified pipeline execution, transform is primary parameter
 */
export function map(
  this: NonTerminalExtensionContext,
  transform: Transform,
  hooks?: NodeHooks
): void {
  try {
    this.pipeline.validateInput(
      typeof transform === "function",
      "Transform must be a function"
    );
    this.validateSource();

    logger.debug("Mapping document nodes using unified pipeline", {
      hasNodeHooks: !!(
        hooks &&
        (hooks.beforeTransform || hooks.afterTransform)
      ),
    });

    // Create pipeline stage for map operation
    const mapStage: PipelineStage<XNode, XNode> = {
      name: 'map',
      
      execute: (node, context) => {
        const visitor: TreeVisitor<XNode> = {
          visit: (node, ctx) => {
            try {
              return transform(node);
            } catch (err) {
              logger.warn(`Error in transform for node '${node.name}':`, err);
              return node; // Return original on error
            }
          },
          
          combineResults: (parent, children) => {
            const result = { ...parent };
            if (children.length > 0) {
              result.children = children;
              children.forEach(child => child.parent = result);
            }
            return result;
          }
        };
        
        return traverseTree(node, visitor, {
          order: 'both',
          hooks,
          context
        });
      }
    };

    // Execute using unified pipeline
    this.executeTransform(mapStage, hooks);

    logger.debug("Successfully transformed document using pipeline", {
      rootName: this.xnode?.name,
    });
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to transform document: ${String(err)}`);
  }
}

/**
 * Accumulate a value by processing every node in the document
 * NEW: Uses unified traversal system
 */
export function reduce<T>(
  this: TerminalExtensionContext,
  initialValue: T,
  reducer: (accumulator: T, node: XNode) => T
): T {
  try {
    this.pipeline.validateInput(typeof reducer === "function", "Reducer must be a function");
    this.validateSource();

    logger.debug("Reducing document nodes using unified traversal");

    const rootNode = this.xnode as XNode;
    let accumulator = initialValue;

    const visitor: TreeVisitor<void> = {
      visit: (node, ctx) => {
        try {
          accumulator = reducer(accumulator, node);
        } catch (err) {
          logger.warn(`Error in reducer for node '${node.name}':`, err);
        }
      }
    };

    traverseTree(rootNode, visitor, {
      order: 'pre',
      context: this.pipeline
    });

    logger.debug("Successfully reduced document");
    return accumulator;
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to reduce document: ${String(err)}`);
  }
}

/**
 * Collect nodes that match a predicate without maintaining hierarchy
 * NEW: Uses unified traversal system
 */
export function select(
  this: NonTerminalExtensionContext,
  predicate: (node: XNode) => boolean
): void {
  try {
    this.pipeline.validateInput(
      typeof predicate === "function",
      "Predicate must be a function"
    );
    this.validateSource();

    logger.debug("Selecting document nodes using unified traversal");

    const rootNode = this.xnode as XNode;
    const selectedNodes: XNode[] = [];

    const visitor: TreeVisitor<void> = {
      visit: (node, ctx) => {
        try {
          if (predicate(node)) {
            const clonedNode = this.pipeline.cloneNode(node, ClonePolicies.TRANSFORM);
            selectedNodes.push(clonedNode);
          }
        } catch (err) {
          logger.warn(`Error in predicate for node '${node.name}':`, err);
        }
      }
    };

    traverseTree(rootNode, visitor, {
      order: 'pre',
      context: this.pipeline
    });

    const resultsContainer = createResultsContainer(
      getFragmentRootName(this.pipeline.config.get())
    );

    for (const node of selectedNodes) {
      addChild(resultsContainer, node);
    }

    this.xnode = resultsContainer;

    logger.debug("Successfully selected nodes using unified traversal", {
      count: selectedNodes.length,
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
 * NEW: Uses unified traversal and standardized cloning
 */
export function branch(
  this: NonTerminalExtensionContext,
  predicate: (node: XNode) => boolean
): void {
  try {
    this.pipeline.validateInput(
      typeof predicate === "function",
      "Predicate must be a function"
    );
    this.validateSource();

    logger.debug("Creating branch scope using unified traversal");

    const rootNode = this.xnode as XNode;

    // Collect all nodes that match the predicate with their paths
    const branchInfo = collectNodesWithPaths(rootNode, predicate, this.pipeline);

    if (branchInfo.nodes.length === 0) {
      // No nodes matched - create empty branch
      this.branchContext = {
        parentNodes: [rootNode],
        originalIndices: [],
        branchedNodes: [],
        nodePaths: [],
      };

      this.xnode = createResultsContainer(
        getFragmentRootName(this.pipeline.config.get())
      );
    } else {
      // Store branch context using standardized cloning
      this.branchContext = {
        parentNodes: [rootNode],
        originalIndices: branchInfo.indices,
        branchedNodes: branchInfo.nodes.map((node) => 
          this.pipeline.cloneNode(node, ClonePolicies.BRANCH)
        ),
        nodePaths: branchInfo.paths,
      };

      // Create results container with branched nodes
      const resultsContainer = createResultsContainer(
        getFragmentRootName(this.pipeline.config.get())
      );

      for (const node of branchInfo.nodes) {
        const clonedNode = this.pipeline.cloneNode(node, ClonePolicies.BRANCH);
        addChild(resultsContainer, clonedNode);
      }

      this.xnode = resultsContainer;
    }

    logger.debug("Successfully created branch using unified traversal", {
      branchedNodeCount: branchInfo.nodes?.length || 0,
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
 * NEW: Uses standardized cloning
 */
export function merge(this: NonTerminalExtensionContext): void {
  try {
    // If no active branch, this is a no-op
    if (!this.branchContext) {
      logger.debug("No active branch to merge - operation ignored");
      return;
    }

    logger.debug("Merging branch back to parent scope using standardized cloning");

    const { parentNodes, nodePaths } = this.branchContext;
    const parentNode = parentNodes[0];

    // Get current branch nodes (excluding the container)
    const currentBranchNodes = this.xnode?.children || [];

    // Create a deep clone of the parent using standardized pipeline cloning
    const mergedParent = this.pipeline.cloneNode(parentNode, ClonePolicies.BRANCH);

    // Replace each original node with its corresponding replacement
    // Process from deepest paths first to avoid index shifting issues
    const pathNodePairs = nodePaths
      .map((path, index) => ({
        path,
        node: currentBranchNodes[index] || null,
      }))
      .sort(
        (a, b) =>
          b.path.length - a.path.length ||
          b.path[b.path.length - 1] - a.path[a.path.length - 1]
      );

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

    logger.debug("Successfully merged branch using standardized operations", {
      replacementNodeCount: currentBranchNodes.length,
      originalNodeCount: nodePaths.length,
    });
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to merge branch: ${String(err)}`);
  }
}

/**
 * Helper function to safely get fragment root name from config
 */
function getFragmentRootName(config: any): string {
  const fragmentRoot = config.fragmentRoot;
  
  if (typeof fragmentRoot === "string") {
    return fragmentRoot;
  } else if (fragmentRoot && typeof fragmentRoot === 'object' && typeof fragmentRoot.name === 'string') {
    return fragmentRoot.name;
  } else {
    return "results";
  }
}

// Register the functions with XJX
XJX.registerNonTerminalExtension("filter", filter);
XJX.registerNonTerminalExtension("map", map);
XJX.registerTerminalExtension("reduce", reduce);
XJX.registerNonTerminalExtension("select", select);
XJX.registerNonTerminalExtension("branch", branch);
XJX.registerNonTerminalExtension("merge", merge);