/**
 * Extension implementation for XNode input methods
 */
import { XJX } from "../XJX";
import { FORMAT } from "../core/transform";
import { logger, validate } from "../core/error";
import { XNode, createElement, addChild, cloneNode } from "../core/xnode";
import { NonTerminalExtensionContext } from "../core/extension";

/**
 * Implementation for setting XNode source
 */
export function fromXnode(this: NonTerminalExtensionContext, input: XNode | XNode[]): void {
  try {
    // API boundary validation
    validate(input !== null && input !== undefined, "XNode input cannot be null or undefined");
    
    // Handle both single XNode and XNode array cases
    if (Array.isArray(input)) {
      validate(input.length > 0, "XNode array cannot be empty");
      
      logger.debug('Setting XNode array source for transformation', {
        nodeCount: input.length
      });
      
      // Create a wrapper element to contain all nodes
      const wrapper = createElement('xnodes');
      
      // Add each input node as a child (clone to avoid mutation)
      input.forEach((node, index) => {
        validate(
          node && typeof node === 'object' && typeof node.name === 'string', 
          `XNode at index ${index} must be a valid XNode object`
        );
        
        // Clone the node to avoid mutating the original input
        const clonedNode = cloneNode(node, true);
        addChild(wrapper, clonedNode);
      });
      
      this.xnode = wrapper;
      
      logger.debug('Successfully set XNode array source', {
        nodeCount: input.length,
        wrapperName: wrapper.name
      });
    } else {
      // Single XNode case
      validate(
        input && typeof input === 'object' && typeof input.name === 'string',
        "XNode input must be a valid XNode object"
      );
      
      logger.debug('Setting single XNode source for transformation', {
        nodeName: input.name,
        nodeType: input.type
      });
      
      // Clone the node to avoid mutating the original input
      this.xnode = cloneNode(input, true);
      
      logger.debug('Successfully set single XNode source', {
        rootNodeName: this.xnode.name,
        rootNodeType: this.xnode.type
      });
    }
    
    // Set the source format - XNode is format-independent but closer to XML semantically
    this.sourceFormat = FORMAT.XML;
    
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to set XNode source: ${String(err)}`);
  }
}

// Register the extension with XJX
XJX.registerNonTerminalExtension("fromXnode", fromXnode);