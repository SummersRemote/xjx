/**
 * Node operations extensions for XJX
 * 
 * This file implements core node operation extensions:
 * - select: Find nodes in the document matching a predicate
 * - filter: Narrow down the current selection based on a predicate
 * - map: Transform each node in the current selection
 * - reduce: Aggregate nodes in the current selection into a single value
 * 
 * Plus axis-based navigation functions:
 * - children: Select direct child nodes
 * - descendants: Select all descendant nodes
 * - parent: Navigate to parent node
 * - ancestors: Navigate to ancestor nodes
 * - siblings: Select sibling nodes
 */
import { XJX } from "../XJX";
import { XNode, createElement, cloneNode, addChild } from "../core/xnode";
import { logger, validate, ValidationError } from "../core/error";
import { NonTerminalExtensionContext, TerminalExtensionContext } from "../core/extension";

/**
 * Create result node based on fragmentRoot parameter or configuration
 * @param context Extension context
 * @param fragmentRoot Optional fragmentRoot parameter (string or XNode)
 * @returns XNode for results container
 */
function createResultNode(
  context: NonTerminalExtensionContext,
  fragmentRoot?: string | XNode
): XNode {
  // Use parameter first, then config, then default
  const rootSpec = fragmentRoot !== undefined ? fragmentRoot : context.config.fragmentRoot;
  
  if (typeof rootSpec === 'string') {
    // Create a new element with the given name
    return createElement(rootSpec);
  } else if (rootSpec && typeof rootSpec === 'object') {
    // Clone the XNode to avoid mutation
    return cloneNode(rootSpec, true);
  } else {
    // Fallback default
    return createElement('results');
  }
}

/**
 * Implementation for selecting nodes from the document
 * @param predicate Function that determines if a node should be selected
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
    validate(typeof predicate === 'function', "Predicate must be a function");
    this.validateSource();
    
    logger.debug('Selecting nodes using predicate function');
    
    // Find all matching nodes in the document
    const matches = findMatchingNodes(this.xnode as XNode, predicate);
    
    logger.debug(`Found ${matches.length} matching nodes`);
    
    if (matches.length > 0) {
      if (matches.length === 1) {
        // Single match - create a deep clone
        this.xnode = cloneNode(matches[0], true);
      } else {
        // Multiple matches - create parent with cloned matches
        const resultsNode = createResultNode(this, fragmentRoot);
        
        // Add cloned nodes as children
        matches.forEach(node => {
          const clonedNode = cloneNode(node, true);
          addChild(resultsNode, clonedNode);
        });
        
        this.xnode = resultsNode;
      }
    } else {
      // No matches - create empty results node
      this.xnode = createResultNode(this, fragmentRoot);
    }
    
    logger.debug('Selection completed successfully');
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to select nodes: ${String(err)}`);
  }
}

/**
 * Implementation for filtering the current selection
 * @param predicate Function that determines if a node should be kept
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
    validate(typeof predicate === 'function', "Predicate must be a function");
    this.validateSource();
    
    logger.debug('Filtering current node selection');
    
    // Get the current fragment root name
    const currentRoot = this.xnode ? this.xnode.name : '';
    const configRootName = typeof this.config.fragmentRoot === 'string' ? 
      this.config.fragmentRoot : 'results';
    
    // Check if current root matches the config fragment root
    const isFragmentRoot = currentRoot === configRootName;
    
    // Create result container node
    const resultsNode = createResultNode(this, fragmentRoot);
    
    if (this.xnode && isFragmentRoot && this.xnode.children) {
      // Filter children and create clones of matching nodes
      const filtered = this.xnode.children
        .filter(node => {
          try {
            return predicate(node);
          } catch (err) {
            logger.warn(`Error evaluating filter predicate on node: ${node.name}`, { error: err });
            return false;
          }
        })
        .map(node => cloneNode(node, true));
      
      logger.debug(`Filtered from ${this.xnode.children.length} to ${filtered.length} nodes`);
      
      // Add filtered nodes to result container
      filtered.forEach(node => addChild(resultsNode, node));
      this.xnode = resultsNode;
    } else {
      // Single node - check if it matches
      let matches = false;
      
      try {
        matches = predicate(this.xnode as XNode);
      } catch (err) {
        logger.warn(`Error evaluating filter predicate on node: ${this.xnode?.name}`, { error: err });
      }
      
      if (matches) {
        // Create a deep clone if it matches
        this.xnode = cloneNode(this.xnode as XNode, true);
        logger.debug('Node matched filter criteria');
      } else {
        // Create empty results if it doesn't match
        this.xnode = resultsNode;
        logger.debug('Node did not match filter criteria, created empty results');
      }
    }
    
    logger.debug('Filtering completed successfully');
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to filter nodes: ${String(err)}`);
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
    validate(typeof mapper === 'function', "Mapper must be a function");
    this.validateSource();
    
    logger.debug('Mapping current node selection');
    
    // Get the current fragment root name
    const currentRoot = this.xnode ? this.xnode.name : '';
    const configRootName = typeof this.config.fragmentRoot === 'string' ? 
      this.config.fragmentRoot : 'results';
    
    // Check if current root matches the config fragment root
    const isFragmentRoot = currentRoot === configRootName;
    
    if (this.xnode && isFragmentRoot && this.xnode.children) {
      // Map children to transformed nodes
      const mapped = this.xnode.children
        .map(node => {
          try {
            // Apply mapping function to a clone of the node
            const clonedNode = cloneNode(node, true);
            return mapper(clonedNode);
          } catch (err) {
            logger.warn(`Error applying mapper to node: ${node.name}`, { error: err });
            return cloneNode(node, true); // Return unchanged on error
          }
        })
        .filter(Boolean); // Remove any null/undefined results
      
      logger.debug(`Mapped ${this.xnode.children.length} nodes`);
      
      // Create new results container
      const resultsNode = createResultNode(this, fragmentRoot);
      mapped.forEach(node => addChild(resultsNode, node));
      this.xnode = resultsNode;
    } else {
      // Single node - apply mapper
      try {
        // Apply mapping function to a clone of the node
        const clonedNode = cloneNode(this.xnode as XNode, true);
        this.xnode = mapper(clonedNode);
        logger.debug('Successfully mapped single node');
      } catch (err) {
        logger.warn(`Error applying mapper to node: ${this.xnode?.name}`, { error: err });
        // Keep original node on error (already cloned)
      }
    }
    
    logger.debug('Mapping completed successfully');
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
    validate(typeof reducer === 'function', "Reducer must be a function");
    this.validateSource();
    
    logger.debug('Reducing current node selection');
    
    // Get the current fragment root name
    const currentRoot = this.xnode ? this.xnode.name : '';
    const configRootName = typeof this.config.fragmentRoot === 'string' ? 
      this.config.fragmentRoot : 'results';
    
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
          logger.warn(`Error applying reducer to node: ${node.name}`, { error: err });
          return acc; // Return unchanged accumulator on error
        }
      }, initialValue);
      
      logger.debug(`Reduced ${this.xnode.children.length} nodes to a single value`);
    } else {
      // Single node - apply reducer with index 0
      try {
        // Apply reducer function to a clone of the node
        const clonedNode = cloneNode(this.xnode as XNode, true);
        result = reducer(initialValue, clonedNode, 0);
        logger.debug('Successfully reduced single node');
      } catch (err) {
        logger.warn(`Error applying reducer to node: ${this.xnode?.name}`, { error: err });
        // Return initial value on error
      }
    }
    
    logger.debug('Reduction completed successfully');
    return result;
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to reduce nodes: ${String(err)}`);
  }
}

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
    
    if (matches.length > 0) {
      if (matches.length === 1) {
        // Single match - create a deep clone
        this.xnode = cloneNode(matches[0], true);
      } else {
        // Multiple matches - create parent with cloned matches
        const resultsNode = createResultNode(this, fragmentRoot);
        
        // Add cloned nodes as children
        matches.forEach(node => {
          const clonedNode = cloneNode(node, true);
          addChild(resultsNode, clonedNode);
        });
        
        this.xnode = resultsNode;
      }
    } else {
      // No matches - create empty results node
      this.xnode = createResultNode(this, fragmentRoot);
    }
    
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
    
    if (matches.length > 0) {
      if (matches.length === 1) {
        // Single match - create a deep clone
        this.xnode = cloneNode(matches[0], true);
      } else {
        // Multiple matches - create parent with cloned matches
        const resultsNode = createResultNode(this, fragmentRoot);
        
        // Add cloned nodes as children
        matches.forEach(node => {
          const clonedNode = cloneNode(node, true);
          addChild(resultsNode, clonedNode);
        });
        
        this.xnode = resultsNode;
      }
    } else {
      // No matches - create empty results node
      this.xnode = createResultNode(this, fragmentRoot);
    }
    
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
    
    if (matches.length > 0) {
      if (matches.length === 1) {
        // Single match - create a deep clone
        this.xnode = cloneNode(matches[0], true);
      } else {
        // Multiple matches - create parent with cloned matches
        const resultsNode = createResultNode(this, fragmentRoot);
        
        // Add cloned nodes as children
        matches.forEach(node => {
          const clonedNode = cloneNode(node, true);
          addChild(resultsNode, clonedNode);
        });
        
        this.xnode = resultsNode;
      }
    } else {
      // No matches - create empty results node
      this.xnode = createResultNode(this, fragmentRoot);
    }
    
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
    
    if (matches.length > 0) {
      if (matches.length === 1) {
        // Single match - create a deep clone
        this.xnode = cloneNode(matches[0], true);
      } else {
        // Multiple matches - create parent with cloned matches
        const resultsNode = createResultNode(this, fragmentRoot);
        
        // Add cloned nodes as children
        matches.forEach(node => {
          const clonedNode = cloneNode(node, true);
          addChild(resultsNode, clonedNode);
        });
        
        this.xnode = resultsNode;
      }
    } else {
      // No matches - create empty results node
      this.xnode = createResultNode(this, fragmentRoot);
    }
    
    logger.debug('Sibling selection completed successfully');
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to select siblings: ${String(err)}`);
  }
}

/**
 * Traverse the node tree and find matching nodes
 * @param root Root node to start traversal from
 * @param predicate Function to test each node
 * @returns Array of matching nodes
 */
function findMatchingNodes(root: XNode, predicate: (node: XNode) => boolean): XNode[] {
  const results: XNode[] = [];
  
  const traverse = (node: XNode) => {
    try {
      // Test the current node
      if (predicate(node)) {
        results.push(node);
      }
      
      // Recursively process children
      if (node.children && node.children.length > 0) {
        node.children.forEach(child => traverse(child));
      }
    } catch (err) {
      logger.warn(`Error evaluating predicate on node: ${node.name}`, { error: err });
    }
  };
  
  traverse(root);
  return results;
}

/**
 * Find descendant nodes that match a predicate
 * @param node Parent node to search within
 * @param predicate Function to test each descendant
 * @returns Array of matching nodes
 */
function findDescendants(node: XNode, predicate: (node: XNode) => boolean): XNode[] {
  const results: XNode[] = [];
  
  const traverse = (current: XNode) => {
    if (current.children && current.children.length > 0) {
      current.children.forEach(child => {
        try {
          if (predicate(child)) {
            results.push(child);
          }
        } catch (err) {
          logger.warn(`Error evaluating predicate on node: ${child.name}`, { error: err });
        }
        
        // Continue traversing regardless of whether this node matched
        traverse(child);
      });
    }
  };
  
  traverse(node);
  return results;
}

// Register the extensions with XJX
XJX.registerNonTerminalExtension("select", select);
XJX.registerNonTerminalExtension("filter", filter);
XJX.registerNonTerminalExtension("map", map);
XJX.registerTerminalExtension("reduce", reduce);

// Register axis navigation extensions
XJX.registerNonTerminalExtension("children", children);
XJX.registerNonTerminalExtension("descendants", descendants);
XJX.registerNonTerminalExtension("parent", parent);
XJX.registerNonTerminalExtension("ancestors", ancestors);
XJX.registerNonTerminalExtension("siblings", siblings);

// Optional: export individual functions for use in tests or other contexts
export { select as selectNodes };
export { filter as filterNodes };
export { map as mapNodes };
export { reduce as reduceNodes };
export { children as childrenNodes };
export { descendants as descendantsNodes };
export { parent as parentNode };
export { ancestors as ancestorsNodes };
export { siblings as siblingsNodes };