/**
 * Fixed version of the axis-extensions.ts file
 * Specifically improving the children() operation to handle result structure better
 */
import { XJX } from "../XJX";
import { XNode, cloneNode, createElement, addChild } from "../core/xnode";
import { logger, validate } from "../core/error";
import { NonTerminalExtensionContext } from "../core/extension";
import { 
  findDescendants, 
  createResultNode,
  processResults,
  isResultsContainer
} from "./functional-utils";

/**
 * Improved implementation for selecting immediate children of the current node
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
    
    // Check if we have a results container with multiple items
    if (isResultsContainer(this, currentNode) && currentNode.children && currentNode.children.length > 0) {
      // This is a container with multiple items
      logger.debug('Processing results container with multiple items');
      
      // Create a new results container
      const resultsNode = createResultNode(this, fragmentRoot);
      let matchFound = false;
      
      // Process each child in the container
      currentNode.children.forEach(itemNode => {
        // Find child nodes matching the predicate
        const childMatches = (itemNode.children || []).filter(node => {
          try {
            return effectivePredicate(node);
          } catch (err) {
            logger.warn(`Error evaluating predicate on child node: ${node.name}`, { error: err });
            return false;
          }
        });
        
        if (childMatches.length > 0) {
          matchFound = true;
          
          // Add each match as a child of a clone of its parent
          const itemClone = cloneNode(itemNode, false); // Shallow clone
          itemClone.children = []; // Reset children
          
          // Add matching children to the cloned parent
          childMatches.forEach(match => {
            const matchClone = cloneNode(match, true);
            addChild(itemClone, matchClone);
          });
          
          // Add the cloned parent to the results
          addChild(resultsNode, itemClone);
        }
      });
      
      // If no matches found, create an empty results node
      if (!matchFound) {
        logger.debug('No matching children found in container items');
      }
      
      this.xnode = resultsNode;
    } else {
      // Regular node - process direct children
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
      // Modified to ensure proper structuring
      if (matches.length > 0) {
        const resultsNode = createResultNode(this, fragmentRoot);
        
        // Add matches as children
        matches.forEach(match => {
          const matchClone = cloneNode(match, true);
          addChild(resultsNode, matchClone);
        });
        
        this.xnode = resultsNode;
      } else {
        // No matches - create empty results node
        this.xnode = createResultNode(this, fragmentRoot);
      }
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
 * Improved implementation for navigating to the root node of the current selection
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
    
    // Store the original source format for potential reconstruction
    const sourceFormat = this.sourceFormat;
    
    // For XJX to work properly, we need to maintain access to the original document
    // The most reliable approach is to recreate the initial parsing step
    
    // Create a new XNode from scratch if we have access to the original source
    if (this.originalSource) {
      logger.debug('Recreating XNode from original source');
      
      // Re-parse the original source
      if (sourceFormat === FORMAT.XML && typeof this.originalSource === 'string') {
        // For XML source
        const xmlConverter = createXmlToXNodeConverter(this.config);
        this.xnode = xmlConverter.convert(this.originalSource);
      } else if (sourceFormat === FORMAT.JSON) {
        // For JSON source
        if (this.config.strategies.highFidelity) {
          const jsonConverter = createJsonHiFiToXNodeConverter(this.config);
          this.xnode = jsonConverter.convert(this.originalSource);
        } else {
          const jsonConverter = createJsonToXNodeConverter(this.config);
          this.xnode = jsonConverter.convert(this.originalSource);
        }
      }
      
      logger.debug('Successfully recreated XNode from original source');
    } else {
      // Fallback: Try to navigate to root by traversing up the parent chain
      logger.debug('Original source not available, trying to navigate via parent chain');
      
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
      
      // Navigate to the topmost parent
      let rootNode = currentNode;
      while (rootNode.parent) {
        rootNode = rootNode.parent;
      }
      
      // Create a deep clone of the root to avoid mutation
      this.xnode = cloneNode(rootNode, true);
      
      logger.debug('Successfully navigated to root node', {
        rootNodeName: this.xnode.name
      });
    }
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