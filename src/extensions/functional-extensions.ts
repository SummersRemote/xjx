/**
 * Core functional operations for XJX
 *
 * This file implements the core functional operations:
 * - select: Find nodes in the document matching a predicate
 * - filter: Narrow down the current selection based on a predicate
 * - map: Transform each node in the current selection
 * - reduce: Aggregate nodes in the current selection into a single value
 */
import { XJX } from "../XJX";
import { XNode, cloneNode, addChild } from "../core/xnode";
import { logger, validate, ValidationError } from "../core/error";
import {
  NonTerminalExtensionContext,
  TerminalExtensionContext,
} from "../core/extension";
import {
  findMatchingNodes,
  isResultsContainer,
  createResultNode,
  processResults,
} from "./functional-utils";

/**
 * Select nodes that match a predicate while preserving document structure.
 * Keeps nodes that match the predicate and their ancestors to maintain hierarchy.
 *
 * @param predicate Function that determines if a node should be kept
 * @param fragmentRoot Optional container element name or XNode
 * @returns this for chaining
 */
export function select(
  this: NonTerminalExtensionContext,
  predicate: (node: XNode) => boolean,
  fragmentRoot?: string | XNode
): void {
  try {
    // API boundary validation
    validate(typeof predicate === "function", "Predicate must be a function");
    this.validateSource();

    logger.debug("Selecting document nodes hierarchically");

    // Clone the current document to avoid modifying the original
    const rootNode = cloneNode(this.xnode as XNode, true);

    // Track whether any node matches the predicate
    let hasMatches = false;

    // Track which nodes should be kept (to preserve ancestors of matching nodes)
    const nodesToKeep = new WeakSet<XNode>();

    // First pass: Identify all nodes that match the predicate and their ancestors
    const markMatchingNodes = (node: XNode): boolean => {
      let nodeMatches = false;

      // Check if this node matches the predicate
      try {
        nodeMatches = predicate(node);
      } catch (err) {
        logger.warn(`Error evaluating predicate on node: ${node.name}`, {
          error: err,
        });
        nodeMatches = false;
      }

      // If this node matches, mark it, all its ancestors, AND all its descendants
      if (nodeMatches) {
        hasMatches = true;

        // Mark this node
        nodesToKeep.add(node);

        // Mark all ancestors
        let current = node.parent;
        while (current) {
          nodesToKeep.add(current);
          current = current.parent;
        }

        // Mark all descendants (new code)
        const markDescendants = (n: XNode) => {
          if (n.children) {
            for (const child of n.children) {
              nodesToKeep.add(child);
              markDescendants(child);
            }
          }
        };
        markDescendants(node);
      }

      // Process children
      if (node.children) {
        for (const child of node.children) {
          const childMatches = markMatchingNodes(child);

          // If any child matches, this node and its ancestors should be kept
          if (childMatches) {
            nodeMatches = true;
            nodesToKeep.add(node);

            // Mark all ancestors
            let current = node.parent;
            while (current) {
              nodesToKeep.add(current);
              current = current.parent;
            }
          }
        }
      }

      return nodeMatches;
    }

    // Second pass: Prune nodes that should not be kept
    const pruneUnmarkedNodes = (node: XNode): void => {
      // Remove children that aren't in the nodesToKeep set
      if (node.children && node.children.length > 0) {
        // First prune each child's descendants
        for (const child of node.children) {
          pruneUnmarkedNodes(child);
        }

        // Then filter the children array
        node.children = node.children.filter((child) => nodesToKeep.has(child));
      }
    };

    // Run both passes
    markMatchingNodes(rootNode);
    pruneUnmarkedNodes(rootNode);

    // If no matches found, create an empty results container
    if (!hasMatches) {
      logger.debug("No nodes matched the select predicate");
      this.xnode = createResultNode(this, fragmentRoot);
    } else {
      // Otherwise use the filtered tree
      logger.debug("Successfully selected nodes hierarchically");
      this.xnode = rootNode;
    }
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to select nodes hierarchically: ${String(err)}`);
  }
}

/**
 * Filter out nodes that match a predicate while preserving document structure.
 * Removes nodes that match the predicate while keeping other nodes.
 *
 * @param predicate Function that determines if a node should be removed
 * @param fragmentRoot Optional container element name or XNode
 * @returns this for chaining
 */
export function filter(
  this: NonTerminalExtensionContext,
  predicate: (node: XNode) => boolean,
  fragmentRoot?: string | XNode
): void {
  try {
    // API boundary validation
    validate(typeof predicate === "function", "Predicate must be a function");
    this.validateSource();

    logger.debug("Filtering document nodes hierarchically");

    // Clone the current document to avoid modifying the original
    const rootNode = cloneNode(this.xnode as XNode, true);

    // Track whether any node matches the predicate
    let hasMatches = false;

    // Track which nodes should be removed
    const nodesToRemove = new WeakSet<XNode>();

    // First pass: Identify nodes that match the predicate and should be removed
    const markNodesToRemove = (node: XNode): boolean => {
      let nodeMatches = false;
      let allChildrenRemoved = true;

      // Process children first (bottom-up)
      if (node.children && node.children.length > 0) {
        for (const child of node.children) {
          const childMatches = markNodesToRemove(child);

          if (childMatches) {
            // If child matches predicate, mark it for removal
            nodesToRemove.add(child);
            hasMatches = true;
          } else {
            // At least one child not removed
            allChildrenRemoved = false;
          }
        }
      } else {
        // Leaf node, no children to consider
        allChildrenRemoved = false;
      }

      // Now check if this node matches the predicate
      try {
        nodeMatches = predicate(node);
      } catch (err) {
        logger.warn(`Error evaluating predicate on node: ${node.name}`, {
          error: err,
        });
        nodeMatches = false;
      }

      // Return true if this node matches or if all its children were removed
      // Note: We don't mark the node for removal here, just return the match status
      return nodeMatches || allChildrenRemoved;
    };

    // Second pass: Remove the marked nodes
    const removeMarkedNodes = (node: XNode): void => {
      // Remove children that are marked for removal
      if (node.children && node.children.length > 0) {
        // First recursively process each child's descendants
        for (const child of node.children) {
          if (!nodesToRemove.has(child)) {
            removeMarkedNodes(child);
          }
        }

        // Then filter the children array to remove marked nodes
        node.children = node.children.filter(
          (child) => !nodesToRemove.has(child)
        );
      }
    };

    // Run both passes (note: don't remove the root node)
    markNodesToRemove(rootNode);
    removeMarkedNodes(rootNode);

    // If every node was removed, create an empty results container
    if (
      nodesToRemove.has(rootNode) ||
      (rootNode.children && rootNode.children.length === 0)
    ) {
      logger.debug("All nodes were filtered out");
      this.xnode = createResultNode(this, fragmentRoot);
    } else {
      // Otherwise use the filtered tree
      logger.debug("Successfully filtered nodes hierarchically");
      this.xnode = rootNode;
    }
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to filter nodes hierarchically: ${String(err)}`);
  }
}

/**
 * Implementation for transforming each node in the current selection
 * @param mapper Function that transforms a node into a new node
 * @param fragmentRoot Optional container element name or XNode
 * @returns this for chaining
 */
export function map(
  this: NonTerminalExtensionContext,
  mapper: (node: XNode) => XNode,
  fragmentRoot?: string | XNode
): void {
  try {
    // API boundary validation
    validate(typeof mapper === "function", "Mapper must be a function");
    this.validateSource();

    logger.debug("Mapping current node selection");

    // Get the current fragment root name
    const currentRoot = this.xnode ? this.xnode.name : "";
    const configRootName =
      typeof this.config.fragmentRoot === "string"
        ? this.config.fragmentRoot
        : "results";

    // Check if current root matches the config fragment root
    const isFragmentRoot = currentRoot === configRootName;

    if (this.xnode && isFragmentRoot && this.xnode.children) {
      // Map children to transformed nodes
      const mapped = this.xnode.children
        .map((node) => {
          try {
            // Apply mapping function to a clone of the node
            const clonedNode = cloneNode(node, true);
            return mapper(clonedNode);
          } catch (err) {
            logger.warn(`Error applying mapper to node: ${node.name}`, {
              error: err,
            });
            return cloneNode(node, true); // Return unchanged on error
          }
        })
        .filter(Boolean); // Remove any null/undefined results

      logger.debug(`Mapped ${this.xnode.children.length} nodes`);

      // Create new results container
      const resultsNode = createResultNode(this, fragmentRoot);
      mapped.forEach((node) => addChild(resultsNode, node));
      this.xnode = resultsNode;
    } else {
      // Single node - apply mapper
      try {
        // Apply mapping function to a clone of the node
        const clonedNode = cloneNode(this.xnode as XNode, true);
        this.xnode = mapper(clonedNode);
        logger.debug("Successfully mapped single node");
      } catch (err) {
        logger.warn(`Error applying mapper to node: ${this.xnode?.name}`, {
          error: err,
        });
        // Keep original node on error (already cloned)
      }
    }

    logger.debug("Mapping completed successfully");
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
 * @param fragmentRoot Optional container element name or XNode (ignored for reduce)
 * @returns The final accumulated value
 */
export function reduce<T>(
  this: TerminalExtensionContext,
  reducer: (accumulator: T, node: XNode, index: number) => T,
  initialValue: T,
  fragmentRoot?: string | XNode // Included for API consistency
): T {
  try {
    // API boundary validation
    validate(typeof reducer === "function", "Reducer must be a function");
    this.validateSource();

    logger.debug("Reducing current node selection");

    // Get the current fragment root name
    const currentRoot = this.xnode ? this.xnode.name : "";
    const configRootName =
      typeof this.config.fragmentRoot === "string"
        ? this.config.fragmentRoot
        : "results";

    // Check if current root matches the config fragment root
    const isFragmentRoot = currentRoot === configRootName;

    let result = initialValue;

    if (this.xnode && isFragmentRoot && this.xnode.children) {
      // Reduce children to a single value
      result = this.xnode.children.reduce((acc, node, index) => {
        try {
          // Apply reducer function to a clone of the node to prevent mutation
          const clonedNode = cloneNode(node, true);
          return reducer(acc, clonedNode, index);
        } catch (err) {
          logger.warn(`Error applying reducer to node: ${node.name}`, {
            error: err,
          });
          return acc; // Return unchanged accumulator on error
        }
      }, initialValue);

      logger.debug(
        `Reduced ${this.xnode.children.length} nodes to a single value`
      );
    } else {
      // Single node - apply reducer with index 0
      try {
        // Apply reducer function to a clone of the node
        const clonedNode = cloneNode(this.xnode as XNode, true);
        result = reducer(initialValue, clonedNode, 0);
        logger.debug("Successfully reduced single node");
      } catch (err) {
        logger.warn(`Error applying reducer to node: ${this.xnode?.name}`, {
          error: err,
        });
        // Return initial value on error
      }
    }

    logger.debug("Reduction completed successfully");
    return result;
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to reduce nodes: ${String(err)}`);
  }
}

/**
 * Get a specific node by index from the current selection.
 *
 * @param index Index of the node to get (0-based)
 * @param unwrap Whether to unwrap the node from its container (default: true)
 * @returns this for chaining
 */
export function get(
  this: NonTerminalExtensionContext,
  index: number = 0,
  unwrap: boolean = true
): void {
  try {
    // API boundary validation
    this.validateSource();
    validate(typeof index === "number", "Index must be a number");
    validate(index >= 0, "Index must be non-negative");

    const currentNode = this.xnode as XNode;

    // If current node doesn't have children, throw an error
    if (!currentNode.children || currentNode.children.length === 0) {
      throw new ValidationError("No children found when calling get()");
    }

    // Check if index is in bounds
    if (index >= currentNode.children.length) {
      throw new ValidationError(
        `Index ${index} out of bounds (0-${currentNode.children.length - 1})`
      );
    }

    logger.debug(`Getting node at index ${index}`, {
      unwrap,
      childCount: currentNode.children.length,
    });

    if (unwrap) {
      // Replace current node with the specified child (deep clone)
      this.xnode = cloneNode(currentNode.children[index], true);
      logger.debug("Unwrapped node from container", {
        nodeName: this.xnode.name,
      });
    } else {
      // Create a new container with only the specified child
      const resultsNode = createResultNode(this);
      const childClone = cloneNode(currentNode.children[index], true);
      addChild(resultsNode, childClone);
      this.xnode = resultsNode;
      logger.debug("Kept node in container", {
        containerName: resultsNode.name,
        childName: childClone.name,
      });
    }
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to get node at index: ${String(err)}`);
  }
}

// Register the core functional extensions with XJX
XJX.registerNonTerminalExtension("select", select);
XJX.registerNonTerminalExtension("filter", filter);
XJX.registerNonTerminalExtension("map", map);
XJX.registerTerminalExtension("reduce", reduce);
XJX.registerNonTerminalExtension("get", get);

// Optional: export individual functions for use in tests or other contexts
export { select as selectNodes };
export { filter as filterNodes };
export { map as mapNodes };
export { reduce as reduceNodes };
export { get as getNode };
