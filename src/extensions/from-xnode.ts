/**
 * Extension implementation for XNode input methods - Updated for new hook system
 */
import { LoggerFactory } from "../core/logger";
const logger = LoggerFactory.create();

import { XJX } from "../XJX";
import { XNode, createElement, addChild, cloneNode } from "../core/xnode";
import { NonTerminalExtensionContext } from "../core/extension";
import { validateInput, SourceHooks } from "../core/converter";

/**
 * Implementation for setting XNode source with new hook system
 */
export function fromXnode(
  this: NonTerminalExtensionContext, 
  input: XNode | XNode[],
  hooks?: SourceHooks<XNode | XNode[]>
): void {
  try {
    // API boundary validation
    validateInput(input !== null && input !== undefined, "XNode input cannot be null or undefined");
    
    let processedInput = input;
    
    // Apply beforeTransform hook to raw input
    if (hooks?.beforeTransform) {
      try {
        const beforeResult = hooks.beforeTransform(processedInput);
        if (beforeResult !== undefined && beforeResult !== null) {
          processedInput = beforeResult;
        }
      } catch (err) {
        logger.warn(`Error in XNode source beforeTransform: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    
    // Handle both single XNode and XNode array cases
    let resultXNode: XNode;
    
    if (Array.isArray(processedInput)) {
      validateInput(processedInput.length > 0, "XNode array cannot be empty");
      
      logger.debug('Setting XNode array source for transformation', {
        nodeCount: processedInput.length,
        hasSourceHooks: !!(hooks && (hooks.beforeTransform || hooks.afterTransform))
      });
      
      // Create a wrapper element to contain all nodes
      resultXNode = createElement('xnodes');
      
      // Add each input node as a child (clone to avoid mutation)
      processedInput.forEach((node, index) => {
        validateInput(
          node && typeof node === 'object' && typeof node.name === 'string', 
          `XNode at index ${index} must be a valid XNode object`
        );
        
        // Clone the node to avoid mutating the original input
        const clonedNode = cloneNode(node, true);
        addChild(resultXNode, clonedNode);
      });
      
      logger.debug('Successfully processed XNode array source', {
        nodeCount: processedInput.length,
        wrapperName: resultXNode.name
      });
    } else {
      // Single XNode case
      validateInput(
        processedInput && typeof processedInput === 'object' && typeof processedInput.name === 'string',
        "XNode input must be a valid XNode object"
      );
      
      logger.debug('Setting single XNode source for transformation', {
        nodeName: processedInput.name,
        nodeType: processedInput.type,
        hasSourceHooks: !!(hooks && (hooks.beforeTransform || hooks.afterTransform))
      });
      
      // Clone the node to avoid mutating the original input
      resultXNode = cloneNode(processedInput, true);
      
      logger.debug('Successfully processed single XNode source', {
        rootNodeName: resultXNode.name,
        rootNodeType: resultXNode.type
      });
    }
    
    // Apply afterTransform hook to fully populated XNode
    if (hooks?.afterTransform) {
      try {
        const afterResult = hooks.afterTransform(resultXNode);
        if (afterResult && typeof afterResult === 'object' && typeof afterResult.name === 'string') {
          resultXNode = afterResult;
        }
      } catch (err) {
        logger.warn(`Error in XNode source afterTransform: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    
    this.xnode = resultXNode;
    
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to set XNode source: ${String(err)}`);
  }
}

// Register the extension with XJX
XJX.registerNonTerminalExtension("fromXnode", fromXnode);