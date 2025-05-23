/**
 * Extension implementation for XNode output methods
 */
import { XJX } from "../XJX";
import { transformXNode } from "../converters/xnode-transformer";
import { FORMAT } from "../core/transform";
import { logger } from "../core/error";
import { XNode, cloneNode } from "../core/xnode";
import { TerminalExtensionContext } from "../core/extension";

/**
 * Implementation for converting to XNode array
 */
export function toXnode(this: TerminalExtensionContext): XNode[] {
  try {
    // Source validation is handled by the registration mechanism
    this.validateSource();
    
    logger.debug('Starting toXnode conversion', {
      sourceFormat: this.sourceFormat,
      hasTransforms: this.transforms.length > 0
    });
    
    // Apply transformations if any are registered
    let nodeToConvert = this.xnode as XNode;
    
    if (this.transforms && this.transforms.length > 0) {
      // Clone the node before applying transforms to avoid modifying the original
      const clonedNode = cloneNode(nodeToConvert, true);
      nodeToConvert = transformXNode(clonedNode, this.transforms, FORMAT.XML, this.config);
      
      logger.debug('Applied transforms to XNode', {
        transformCount: this.transforms.length,
        targetFormat: FORMAT.XML
      });
    }
    
    // Always return an array - this enables consistent query processing
    const result = [nodeToConvert];
    
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