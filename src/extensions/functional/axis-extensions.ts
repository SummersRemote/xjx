/**
 * Axis navigation extensions for XJX
 * 
 * This file implements all axis navigation extensions:
 * - children: Select direct child nodes
 * - descendants: Select all descendant nodes
 * - parent: Navigate to parent node
 * - ancestors: Navigate to ancestor nodes
 * - siblings: Select sibling nodes
 */
import { XJX } from "../../XJX";
import { XNode, cloneNode } from "../../core/xnode";
import { logger, validate, ValidationError } from "../../core/error";
import { NonTerminalExtensionContext } from "../../core/extension";
import { 
  findDescendants, 
  createResultNode,
  processResults 
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
 * Implementation for navigating to the parent node of the current node
 * @returns this for chaining
 */
export function parent(this: NonTerminalExtensionContext): void {
  try {
    // API boundary validation
    this.validateSource();
    
    logger.debug('Navigating to parent node');
    
    const currentNode = this.xnode as XNode;
    
    // Check if parent exists
    if (currentNode.parent) {
      // Create a deep clone of the parent to avoid mutation
      this.xnode = cloneNode(currentNode.parent, true);
      logger.debug('Successfully navigated to parent node');
    } else {
      // No parent - throw error
      throw new ValidationError('Current node has no parent');
    }
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to navigate to parent: ${String(err)}`);
  }
}

/**
 * Implementation for selecting ancestor nodes of the current node
 * @param predicate Optional function to filter ancestors (defaults to all ancestors)
 * @param fragmentRoot Optional container element name or XNode
 * @returns this for chaining
 */
export function ancestors(
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
    
    logger.debug('Selecting ancestors of current node');
    
    const currentNode = this.xnode as XNode;
    
    // Find all matching ancestors
    const matches: XNode[] = [];
    let ancestor = currentNode.parent;
    
    while (ancestor) {
      try {
        if (effectivePredicate(ancestor)) {
          matches.push(ancestor);
        }
      } catch (err) {
        logger.warn(`Error evaluating predicate on ancestor node: ${ancestor.name}`, { error: err });
      }
      
      // Move up to next ancestor
      ancestor = ancestor.parent;
    }
    
    logger.debug(`Found ${matches.length} matching ancestors`);
    
    // Process results and set as current node
    this.xnode = processResults(this, matches, fragmentRoot);
    
    logger.debug('Ancestor selection completed successfully');
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to select ancestors: ${String(err)}`);
  }
}

/**
 * Implementation for selecting sibling nodes of the current node
 * @param predicate Optional function to filter siblings (defaults to all siblings)
 * @param fragmentRoot Optional container element name or XNode
 * @returns this for chaining
 */
export function siblings(
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
    
    logger.debug('Selecting siblings of current node');
    
    const currentNode = this.xnode as XNode;
    
    // Get siblings from parent
    if (!currentNode.parent || !currentNode.parent.children) {
      // No parent or no siblings
      logger.debug('Current node has no parent or parent has no children');
      this.xnode = createResultNode(this, fragmentRoot);
      return;
    }
    
    // Get siblings excluding the current node
    const siblings = currentNode.parent.children.filter(node => node !== currentNode);
    
    // Filter siblings using predicate
    const matches = siblings.filter(node => {
      try {
        return effectivePredicate(node);
      } catch (err) {
        logger.warn(`Error evaluating predicate on sibling node: ${node.name}`, { error: err });
        return false;
      }
    });
    
    logger.debug(`Found ${matches.length} matching siblings out of ${siblings.length} total`);
    
    // Process results and set as current node
    this.xnode = processResults(this, matches, fragmentRoot);
    
    logger.debug('Sibling selection completed successfully');
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to select siblings: ${String(err)}`);
  }
}

// Register the axis navigation extensions with XJX
XJX.registerNonTerminalExtension("children", children);
XJX.registerNonTerminalExtension("descendants", descendants);
XJX.registerNonTerminalExtension("parent", parent);
XJX.registerNonTerminalExtension("ancestors", ancestors);
XJX.registerNonTerminalExtension("siblings", siblings);

// Optional: export individual functions for use in tests or other contexts
export { children as childrenNodes };
export { descendants as descendantsNodes };
export { parent as parentNode };
export { ancestors as ancestorsNodes };
export { siblings as siblingsNodes };