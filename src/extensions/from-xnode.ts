/**
 * Extension implementation for XNode input methods
 */
import { LoggerFactory } from "../core/logger";
const logger = LoggerFactory.create();

import { XJX } from "../XJX";
import { XNode, createElement, addChild, cloneNode } from "../core/xnode";
import { NonTerminalExtensionContext } from "../core/extension";
import { validateInput, TransformHooks, applyTransformHooks } from "../core/converter";

/**
 * Implementation for setting XNode source
 */
export function fromXnode(
  this: NonTerminalExtensionContext, 
  input: XNode | XNode[],
  options?: TransformHooks
): void {
  try {
    // API boundary validation
    validateInput(input !== null && input !== undefined, "XNode input cannot be null or undefined");
    
    // Handle both single XNode and XNode array cases
    if (Array.isArray(input)) {
      validateInput(input.length > 0, "XNode array cannot be empty");
      
      logger.debug('Setting XNode array source for transformation', {
        nodeCount: input.length,
        hasTransformHooks: !!(options && (options.beforeTransform || options.transform || options.afterTransform))
      });
      
      // Create a wrapper element to contain all nodes
      let wrapper = createElement('xnodes');
      
      // Apply transform hooks to wrapper
      wrapper = applyTransformHooks(wrapper, options);
      
      // Add each input node as a child (clone to avoid mutation)
      input.forEach((node, index) => {
        validateInput(
          node && typeof node === 'object' && typeof node.name === 'string', 
          `XNode at index ${index} must be a valid XNode object`
        );
        
        // Clone the node to avoid mutating the original input
        let clonedNode = cloneNode(node, true);
        
        // Apply transform hooks to each cloned node
        clonedNode = applyTransformHooks(clonedNode, options);
        
        addChild(wrapper, clonedNode);
      });
      
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
        hasTransformHooks: !!(options && (options.beforeTransform || options.transform || options.afterTransform))
      });
      
      // Clone the node to avoid mutating the original input
      let clonedNode = cloneNode(input, true);
      
      // Apply transform hooks to the cloned node
      clonedNode = applyTransformHooks(clonedNode, options);
      
      this.xnode = clonedNode;
      
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