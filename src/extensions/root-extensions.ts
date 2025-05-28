/**
 * Extension implementation for root manipulation
 */
import { XJX } from "../XJX";
import { XNode, createElement, addChild, cloneNode, createTextNode } from "../core/xnode";
import { logger } from "../core/error";
import { NonTerminalExtensionContext } from "../core/extension";
import { validateInput } from "../core/converter";

/**
 * Replace the current root element with a new one
 * 
 * @param root Either a name for a new root element or an existing XNode
 * @returns this for chaining
 */
export function withRoot(
  this: NonTerminalExtensionContext,
  root: string | XNode
): void {
  try {
    // API boundary validation
    validateInput(
      typeof root === "string" || (root !== null && typeof root === "object" && typeof (root as XNode).name === "string"),
      "Root must be either a string (element name) or an XNode object"
    );
    
    // Create or use the provided root element
    let newRoot: XNode;
    if (typeof root === "string") {
      // Create a new element with the provided name
      newRoot = createElement(root);
      logger.debug(`Created new root element with name: ${root}`);
    } else {
      // Use the provided XNode (clone it to avoid mutation)
      newRoot = cloneNode(root as XNode, false);
      logger.debug(`Using provided XNode as root: ${newRoot.name}`);
    }
    
    // Set the new root as the current node
    this.xnode = newRoot;
    
    logger.debug(`Successfully set new root element: ${newRoot.name}`);
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to set root element: ${String(err)}`);
  }
}

/**
 * Flatten the structure under the current root element
 * 
 * @param options Flattening options
 * @param options.selectChild Function that determines which child nodes to flatten
 * @param options.extractValues Whether to extract text values (true) or keep nodes intact (false)
 * @returns this for chaining
 */
export function flatten(
  this: NonTerminalExtensionContext,
  options: {
    selectChild?: (node: XNode) => boolean;
    extractValues?: boolean;
  } = {}
): void {
  try {
    // Default options
    const {
      selectChild = null,
      extractValues = true
    } = options;
    
    // Validate source
    this.validateSource();
    
    // Get the current root node
    const rootNode = this.xnode as XNode;
    
    // Process only if we have children
    if (rootNode.children && rootNode.children.length > 0) {
      // If we're processing specific child elements
      if (selectChild && typeof selectChild === 'function') {
        // Find matching children based on the selectChild function
        const targetNodes = rootNode.children.filter(child => {
          try {
            return selectChild(child);
          } catch (err) {
            logger.warn(`Error in selectChild predicate for node ${child.name}:`, err);
            return false;
          }
        });
        
        if (targetNodes.length > 0) {
          // Collect all grandchildren from the matching nodes
          let allGrandchildren: XNode[] = [];
          targetNodes.forEach(targetNode => {
            if (targetNode.children) {
              allGrandchildren = [...allGrandchildren, ...targetNode.children];
            }
          });
          
          // If we want to extract values
          if (extractValues && allGrandchildren.length > 0) {
            // Extract text values and create text nodes
            rootNode.children = allGrandchildren.map(child => {
              const textNode = createTextNode(child.value || '');
              textNode.parent = rootNode;
              return textNode;
            });
          } else {
            // Keep the nodes but reparent them
            rootNode.children = allGrandchildren;
            // Update parent references
            rootNode.children.forEach(child => child.parent = rootNode);
          }
        }
      } 
      // If no selectChild function specified, extract values from all direct children
      else if (extractValues) {
        // Extract text values from all children
        rootNode.children = rootNode.children.map(child => {
          const textNode = createTextNode(child.value || '');
          textNode.parent = rootNode;
          return textNode;
        });
      }
    }
    
    logger.debug(`Successfully flattened structure under ${rootNode.name}`);
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to flatten structure: ${String(err)}`);
  }
}

// Register the extensions with XJX
XJX.registerNonTerminalExtension("withRoot", withRoot);
XJX.registerNonTerminalExtension("flatten", flatten);