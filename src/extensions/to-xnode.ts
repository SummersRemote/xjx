/**
 * Extension implementation for XNode output methods - Simplified with unified pipeline
 * CRITICAL: All legacy transform handling REMOVED
 */
import { LoggerFactory } from "../core/logger";
const logger = LoggerFactory.create();

import { XJX } from "../XJX";
import { XNode } from "../core/xnode";
import { OutputHooks } from "../core/hooks";
import { TerminalExtensionContext } from "../core/extension";
import { ClonePolicies } from "../core/context";

/**
 * Implementation for converting to XNode array with unified pipeline context
 * NO LEGACY TRANSFORMS - All complexity removed, direct cloning with pipeline context
 */
export function toXnode(this: TerminalExtensionContext, hooks?: OutputHooks<XNode[]>): XNode[] {
  try {
    // Source validation handled by validateSource()
    this.validateSource();
    
    logger.debug('Starting toXnode conversion', {
      hasOutputHooks: !!(hooks && (hooks.beforeTransform || hooks.afterTransform))
    });
    
    // Start with current XNode - NO LEGACY TRANSFORMS APPLIED
    let nodeToConvert = this.xnode as XNode;
    
    // Apply output hooks using pipeline context
    let processedXNode = nodeToConvert;
    
    // Apply beforeTransform hook to XNode
    if (hooks?.beforeTransform) {
      try {
        const beforeResult = hooks.beforeTransform(processedXNode);
        if (beforeResult && typeof beforeResult === 'object' && typeof beforeResult.name === 'string') {
          processedXNode = beforeResult;
        }
      } catch (err) {
        logger.warn(`Error in XNode output beforeTransform: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    
    // Clone the node using standardized pipeline cloning for output
    const clonedNode = this.pipeline.cloneNode(processedXNode, ClonePolicies.OUTPUT);
    
    // Always return an array - this enables consistent query processing
    let result = [clonedNode];
    
    // Apply afterTransform hook to final array
    if (hooks?.afterTransform) {
      try {
        const afterResult = hooks.afterTransform(result);
        if (afterResult !== undefined && afterResult !== null) {
          result = afterResult;
        }
      } catch (err) {
        logger.warn(`Error in XNode output afterTransform: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    
    logger.debug('Successfully converted to XNode array', {
      nodeCount: result.length,
      rootNodeName: result[0]?.name
    });
    
    return result;
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to convert to XNode array: ${String(err)}`);
  }
}

// Register the extension with XJX
XJX.registerTerminalExtension("toXnode", toXnode);