/**
 * Extension implementation for XNode input methods
 */
import { LoggerFactory } from "../core/logger";
const logger = LoggerFactory.create();

import { XJX } from "../XJX";
import { XNode, createElement, addChild, cloneNode } from "../core/xnode";
import { NonTerminalExtensionContext } from "../core/extension";
import { validateInput, NodeCallback, applyNodeCallbacks } from "../core/converter";

/**
 * Implementation for setting XNode source
 */
export function fromXnode(
  this: NonTerminalExtensionContext, 
  input: XNode | XNode[],
  beforeFn?: NodeCallback,
  afterFn?: NodeCallback
): void {
  try {
    // API boundary validation
    validateInput(input !== null && input !== undefined, "XNode input cannot be null or undefined");
    
    // Handle both single XNode and XNode array cases
    if (Array.isArray(input)) {
      validateInput(input.length > 0, "XNode array cannot be empty");
      
      logger.debug('Setting XNode array source for transformation', {
        nodeCount: input.length,
        hasCallbacks: !!(beforeFn || afterFn)
      });
      
      // Create a wrapper element to contain all nodes
      const wrapper = createElement('xnodes');
      
      // Apply before callback to wrapper
      applyNodeCallbacks(wrapper, beforeFn);
      
      // Add each input node as a child (clone to avoid mutation)
      input.forEach((node, index) => {
        validateInput(
          node && typeof node === 'object' && typeof node.name === 'string', 
          `XNode at index ${index} must be a valid XNode object`
        );
        
        // Clone the node to avoid mutating the original input
        const clonedNode = cloneNode(node, true);
        
        // Apply callbacks to each cloned node
        applyNodeCallbacks(clonedNode, beforeFn, afterFn);
        
        addChild(wrapper, clonedNode);
      });
      
      // Apply after callback to wrapper
      applyNodeCallbacks(wrapper, undefined, afterFn);
      
      this.xnode = wrapper;
      
      logger.debug('Successfully set XNode array source', {
        nodeCount: input.length,
        wrapperName: wrapper.name
      });
    } else {
      // Single XNode case
      validateInput(
        input && typeof input === 'object' && typeof input.name === 'string',
        "XNode input must be a valid XNode object"
      );
      
      logger.debug('Setting single XNode source for transformation', {
        nodeName: input.name,
        nodeType: input.type,
        hasCallbacks: !!(beforeFn || afterFn)
      });
      
      // Clone the node to avoid mutating the original input
      this.xnode = cloneNode(input, true);
      
      // Apply callbacks to the cloned node
      applyNodeCallbacks(this.xnode, beforeFn, afterFn);
      
      logger.debug('Successfully set single XNode source', {
        rootNodeName: this.xnode.name,
        rootNodeType: this.xnode.type
      });
    }
    
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to set XNode source: ${String(err)}`);
  }
}

// Register the extension with XJX
XJX.registerNonTerminalExtension("fromXnode", fromXnode);