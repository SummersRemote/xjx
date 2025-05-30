/**
 * Extension implementation for XNode output methods - Updated for new hook system
 */
import { LoggerFactory } from "../core/logger";
const logger = LoggerFactory.create();

import { XJX } from "../XJX";
import { transformXNodeWithHooks } from "../converters/xnode-transformer";
import { XNode, cloneNode } from "../core/xnode";
import { OutputHooks } from "../core/converter";
import { TerminalExtensionContext } from "../core/extension";

/**
 * Implementation for converting to XNode array with new hook system
 */
export function toXnode(this: TerminalExtensionContext, hooks?: OutputHooks<XNode[]>): XNode[] {
  try {
    // Source validation is handled by the registration mechanism
    this.validateSource();
    
    logger.debug('Starting toXnode conversion', {
      hasTransforms: this.transforms.length > 0,
      hasOutputHooks: !!(hooks && (hooks.beforeTransform || hooks.afterTransform))
    });
    
    // Apply legacy transformations if any are registered
    let nodeToConvert = this.xnode as XNode;
    
    if (this.transforms && this.transforms.length > 0) {
      // For legacy transforms, compose them into a single transform
      const composedTransform = (value: any) => {
        return this.transforms.reduce((result, transform) => {
          try {
            return transform(result);
          } catch (err) {
            logger.warn('Error in legacy transform:', err);
            return result;
          }
        }, value);
      };
      
      nodeToConvert = transformXNodeWithHooks(nodeToConvert, composedTransform, undefined, this.config);
      
      logger.debug('Applied legacy transforms to XNode', {
        transformCount: this.transforms.length
      });
    }
    
    // Apply output hooks
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
    
    // Always return an array - this enables consistent query processing
    let result = [processedXNode];
    
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