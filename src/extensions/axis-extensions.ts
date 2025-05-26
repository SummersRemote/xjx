/**
 * Axis navigation extensions for XJX
 * 
 * This file implements downward traversal and root navigation:
 * - children: Select direct child nodes
 * - descendants: Select all descendant nodes
 * - root: Navigate to the root node of the current selection
 */
import { XJX } from "../XJX";
import { XNode, cloneNode } from "../core/xnode";
import { logger, validate } from "../core/error";
import { NonTerminalExtensionContext } from "../core/extension";
import { 
  findDescendants, 
  createResultNode,
  processResults,
  isResultsContainer
} from "./functional-utils";

/**
 * Implementation for selecting immediate children of the current node
 * @param predicate Optional function to filter children (defaults to all children)
 * @param fragmentRoot Optional container element name or XNode
 * @returns this for chaining
 */
export function children(
  this: NonTerminalExtensionContext, 
  predicate?: (node: XNode) => boolean,
  fragmentRoot?: string | XNode
): void {
  try {
    // API boundary validation
    this.validateSource();
    
    // If predicate not provided, match all nodes
    const effectivePredicate = predicate || (() => true);
    validate(typeof effectivePredicate === 'function', "Predicate must be a function");
    
    logger.debug('Selecting children of current node');
    
    const currentNode = this.xnode as XNode;
    const childNodes = currentNode.children || [];
    
    // Filter the children using the predicate
    const matches = childNodes.filter(node => {
      try {
        return effectivePredicate(node);
      } catch (err) {
        logger.warn(`Error evaluating predicate on child node: ${node.name}`, { error: err });
        return false;
      }
    });
    
    logger.debug(`Found ${matches.length} matching children out of ${childNodes.length} total`);
    
    // Process results and set as current node
    this.xnode = processResults(this, matches, fragmentRoot);
    
    logger.debug('Children selection completed successfully');
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to select children: ${String(err)}`);
  }
}

/**
 * Implementation for selecting all descendant nodes of the current node
 * @param predicate Optional function to filter descendants (defaults to all descendants)
 * @param fragmentRoot Optional container element name or XNode
 * @returns this for chaining
 */
export function descendants(
  this: NonTerminalExtensionContext, 
  predicate?: (node: XNode) => boolean,
  fragmentRoot?: string | XNode
): void {
  try {
    // API boundary validation
    this.validateSource();
    
    // If predicate not provided, match all nodes
    const effectivePredicate = predicate || (() => true);
    validate(typeof effectivePredicate === 'function', "Predicate must be a function");
    
    logger.debug('Selecting descendants of current node');
    
    const currentNode = this.xnode as XNode;
    
    // Find all matching descendants
    const matches = findDescendants(currentNode, effectivePredicate);
    
    logger.debug(`Found ${matches.length} matching descendants`);
    
    // Process results and set as current node
    this.xnode = processResults(this, matches, fragmentRoot);
    
    logger.debug('Descendant selection completed successfully');
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to select descendants: ${String(err)}`);
  }
}

/**
 * Implementation for navigating to the root node of the current selection
 * @param fragmentRoot Optional container element name or XNode (ignored for root)
 * @returns this for chaining
 */
export function root(
  this: NonTerminalExtensionContext, 
  fragmentRoot?: string | XNode
): void {
  try {
    // API boundary validation
    this.validateSource();
    
    logger.debug('Navigating to root node');
    
    const currentNode = this.xnode as XNode;
    
    // If already at root level, do nothing
    if (!currentNode.parent) {
      logger.debug('Current node is already at the document root (no parent)');
      return;
    }
    
    // Check if we're in a selection results container
    if (isResultsContainer(this, currentNode)) {
      logger.debug('Current node is already a results container');
      return;
    }
    
    // Try to find the nearest results container as a parent
    let rootNode = currentNode;
    let foundResultsContainer = false;
    
    while (rootNode.parent) {
      if (isResultsContainer(this, rootNode.parent)) {
        rootNode = rootNode.parent;
        foundResultsContainer = true;
        break;
      }
      rootNode = rootNode.parent;
    }
    
    // Create a deep clone of the root to avoid mutation
    this.xnode = cloneNode(rootNode, true);
    
    logger.debug('Successfully navigated to root node', {
      rootNodeName: this.xnode.name,
      isResultsContainer: foundResultsContainer
    });
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to navigate to root: ${String(err)}`);
  }
}

// Register the axis navigation extensions with XJX
XJX.registerNonTerminalExtension("children", children);
XJX.registerNonTerminalExtension("descendants", descendants);
XJX.registerNonTerminalExtension("root", root);

// Optional: export individual functions for use in tests or other contexts
export { children as childrenNodes };
export { descendants as descendantsNodes };
export { root as rootNode };