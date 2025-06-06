/**
 * Extension implementation for XNode input methods - Simplified with unified pipeline
 */
import { LoggerFactory } from "../core/logger";
const logger = LoggerFactory.create();

import { XJX } from "../XJX";
import { XNode, XNodeType, createCollection, addChild } from "../core/xnode";
import { NonTerminalExtensionContext } from "../core/extension";
import { SourceHooks } from "../core/hooks";
import { ClonePolicies } from "../core/context";

/**
 * Implementation for setting XNode source with unified pipeline context
 * Note: XNode doesn't need a converter since it's already the target format
 */
export function fromXnode(
  this: NonTerminalExtensionContext, 
  input: XNode | XNode[],
  hooks?: SourceHooks<XNode | XNode[]>
): void {
  try {
    this.pipeline.validateInput(input !== null && input !== undefined, "XNode input cannot be null or undefined");
    
    let processedInput = input;
    
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
    
    let resultXNode: XNode;
    
    if (Array.isArray(processedInput)) {
      this.pipeline.validateInput(processedInput.length > 0, "XNode array cannot be empty");
      
      logger.debug('Setting XNode array source for transformation', {
        nodeCount: processedInput.length,
        hasSourceHooks: !!(hooks && (hooks.beforeTransform || hooks.afterTransform))
      });
      
      // FIXED: Use createCollection instead of createElement
      resultXNode = createCollection('xnodes');
      
      processedInput.forEach((node, index) => {
        this.pipeline.validateInput(
          node && typeof node === 'object' && typeof node.name === 'string' && 
          Object.values(XNodeType).includes(node.type),
          `XNode at index ${index} must be a valid semantic XNode object`
        );
        
        const clonedNode = this.pipeline.cloneNode(node, ClonePolicies.BRANCH);
        addChild(resultXNode, clonedNode);
      });
      
      logger.debug('Successfully processed XNode array source', {
        nodeCount: processedInput.length,
        wrapperName: resultXNode.name,
        wrapperType: resultXNode.type
      });
    } else {
      this.pipeline.validateInput(
        processedInput && typeof processedInput === 'object' && 
        typeof processedInput.name === 'string' &&
        Object.values(XNodeType).includes(processedInput.type),
        "XNode input must be a valid semantic XNode object"
      );
      
      logger.debug('Setting single XNode source for transformation', {
        nodeName: processedInput.name,
        nodeType: processedInput.type,
        hasSourceHooks: !!(hooks && (hooks.beforeTransform || hooks.afterTransform))
      });
      
      resultXNode = this.pipeline.cloneNode(processedInput, ClonePolicies.BRANCH);
      
      logger.debug('Successfully processed single XNode source', {
        rootNodeName: resultXNode.name,
        rootNodeType: resultXNode.type
      });
    }
    
    if (hooks?.afterTransform) {
      try {
        const afterResult = hooks.afterTransform(resultXNode);
        if (afterResult && typeof afterResult === 'object' && 
            typeof afterResult.name === 'string' && 
            Object.values(XNodeType).includes(afterResult.type)) {
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