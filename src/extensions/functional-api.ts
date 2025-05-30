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
import { XNode, addChild, createElement, cloneNode } from "../core/xnode";
import { NonTerminalExtensionContext, TerminalExtensionContext } from "../core/extension";
import { validateInput, TransformHooks } from "../core/converter";
/**
 * Create a container node for results
 * @param rootName Name for the container element
 * @returns A new container node
 */
function createResultsContainer(rootName: string = 'results'): XNode {
  return createElement(rootName);
}

/**
 * Walk the tree and apply a visitor function to each node
 * @param node Root node to start traversal
 * @param visitor Function to apply to each node
 * @param context Optional context passed to the visitor
 * @returns The result from the root node visitor
 */
function walkTree<T>(
  node: XNode, 
  visitor: (node: XNode, context?: any) => T,
  context?: any
): T {
  try {
    // Apply visitor to current node
    const result = visitor(node, context);
    
    // Recursively visit children
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
 * @param node Root node to start traversal
 * @param predicate Function to test each node
 * @returns Array of matching nodes
 */
function collectNodes(
  node: XNode, 
  predicate: (node: XNode) => boolean
): XNode[] {
  const results: XNode[] = [];
  
  walkTree(node, (current) => {
    try {
      if (predicate(current)) {
        // Clone the node to avoid mutations
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
 * Improved filter implementation that properly handles negations
 * @param node Root node to filter
 * @param predicate Function that determines if a node should be kept
 * @returns New filtered node tree or null if no matches
 */
function filterNodeHierarchy(
  node: XNode,
  predicate: (node: XNode) => boolean
): XNode | null {
  try {
    // Function to recursively filter the tree
    const filterNode = (currentNode: XNode): XNode | null => {
      // Check if this node matches the predicate
      let keepThisNode: boolean;
      
      try {
        keepThisNode = predicate(currentNode);
      } catch (err) {
        logger.warn(`Error in filter predicate for node ${currentNode.name}:`, err);
        keepThisNode = false;
      }
      
      // Process children first (if any)
      const keptChildren: XNode[] = [];
      
      if (currentNode.children && currentNode.children.length > 0) {
        for (const child of currentNode.children) {
          const filteredChild = filterNode(child);
          if (filteredChild) {
            keptChildren.push(filteredChild);
          }
        }
      }
      
      // If this node doesn't match the predicate and has no children that match,
      // remove it entirely
      if (!keepThisNode && keptChildren.length === 0) {
        return null;
      }
      
      // Create a new node for the result
      const resultNode = cloneNode(currentNode, false);
      
      // If we have kept children, add them
      if (keptChildren.length > 0) {
        resultNode.children = keptChildren;
        // Set parent references
        keptChildren.forEach(child => child.parent = resultNode);
      }
      
      return resultNode;
    };
    
    // Start the filtering process from the root
    return filterNode(node);
  } catch (err) {
    logger.error('Error in filter operation:', err);
    // Return a clone of the original on critical error to avoid mutation
    return cloneNode(node, true);
  }
}

/**
 * Apply a transformer function to every node in the tree
 * @param node Root node to transform
 * @param transformer Function to transform each node
 * @returns New transformed node tree
 */
function mapNodeTree(
  node: XNode,
  transformer: (node: XNode) => XNode | null
): XNode | null {
  try {
    // Apply transformer to current node
    const transformedNode = transformer(cloneNode(node, false));
    
    // If transformer returned null, skip this node
    if (!transformedNode) {
      return null;
    }
    
    // Process children
    if (node.children && node.children.length > 0) {
      transformedNode.children = [];
      
      for (const child of node.children) {
        const transformedChild = mapNodeTree(child, transformer);
        if (transformedChild) {
          transformedChild.parent = transformedNode;
          transformedNode.children.push(transformedChild);
        }
      }
    }
    
    return transformedNode;
  } catch (err) {
    logger.warn(`Error in mapper for node: ${node.name}`, {
      error: err instanceof Error ? err.message : String(err)
    });
    
    // Return a clone of the original node on error
    return cloneNode(node, true);
  }
}

/**
 * Reduce all nodes in the tree to a single value
 * @param node Root node to process
 * @param reducer Function to accumulate values
 * @param initialValue Initial accumulator value
 * @returns Final accumulated value
 */
function reduceNodeTree<T>(
  node: XNode,
  reducer: (accumulator: T, node: XNode) => T,
  initialValue: T
): T {
  let accumulator = initialValue;
  
  // Process node in pre-order traversal
  const traverse = (current: XNode) => {
    try {
      // Update accumulator with current node
      accumulator = reducer(accumulator, cloneNode(current, false));
    } catch (err) {
      logger.warn(`Error in reducer for node: ${current.name}`, {
        error: err instanceof Error ? err.message : String(err)
      });
    }
    
    // Process children
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
 * Apply a transformation to every node in the document
 *
 * @param options Transform hooks - uses options.transform as the main transformer
 * @returns this for chaining
 */
export function map(
  this: NonTerminalExtensionContext,
  options?: TransformHooks
): void {
  try {
    // API boundary validation
    this.validateSource();

    logger.debug("Mapping document nodes", {
      hasTransformHooks: !!(options && (options.beforeTransform || options.transform || options.afterTransform))
    });

    // Get the current document root
    const rootNode = this.xnode as XNode;

    // Create a wrapper that applies all transform hooks
    const consistentTransformer = (node: XNode): XNode | null => {
      try {
        let processedNode = node;
        
        // Apply beforeTransform
        if (options?.beforeTransform) {
          const beforeResult = options.beforeTransform(processedNode);
          if (beforeResult && typeof beforeResult === 'object' && typeof beforeResult.name === 'string') {
            processedNode = beforeResult;
          }
        }
        
        // Apply main transform
        if (options?.transform) {
          const transformResult = options.transform(processedNode);
          if (transformResult === null) {
            return null; // Explicit removal
          }
          if (transformResult && typeof transformResult === 'object' && typeof transformResult.name === 'string') {
            processedNode = transformResult;
          }
        }
        
        // Apply afterTransform
        if (options?.afterTransform) {
          const afterResult = options.afterTransform(processedNode);
          if (afterResult && typeof afterResult === 'object' && typeof afterResult.name === 'string') {
            processedNode = afterResult;
          }
        }
        
        return processedNode;
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
 * @param initialValue Initial value for the accumulator
 * @param options Transform hooks - uses options.transform as the reducer function
 * @returns The final accumulated value
 */
export function reduce<T>(
  this: TerminalExtensionContext,
  initialValue: T,
  options?: TransformHooks
): T {
  try {
    // API boundary validation
    this.validateSource();

    logger.debug("Reducing document nodes", {
      hasTransformHooks: !!(options && (options.beforeTransform || options.transform || options.afterTransform))
    });

    // Get the current document root
    const rootNode = this.xnode as XNode;

    // Create a reducer that applies transform hooks
    const reducer = (accumulator: T, node: XNode): T => {
      try {
        let processedNode = node;
        
        // Apply beforeTransform
        if (options?.beforeTransform) {
          const beforeResult = options.beforeTransform(processedNode);
          if (beforeResult && typeof beforeResult === 'object' && typeof beforeResult.name === 'string') {
            processedNode = beforeResult;
          }
        }
        
        // Apply main transform (this should be the reducer logic)
        if (options?.transform) {
          // The transform function in reduce context should accept (accumulator, node) and return new accumulator
          const transformResult = (options.transform as any)(accumulator, processedNode);
          return transformResult;
        }
        
        // Default behavior if no transform provided - just count nodes
        return (accumulator as any) + 1;
      } catch (error) {
        logger.warn(`Error in reducer for node ${node.name}:`, error);
        return accumulator; // Keep accumulator unchanged on error
      }
    };

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