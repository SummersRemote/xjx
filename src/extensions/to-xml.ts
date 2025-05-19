/**
 * Extension implementation for XML output methods
 */
import { XJX } from "../../XJX";
import { createXNodeToXmlConverter, createXNodeToXmlStringConverter } from "../../converters/xnode-to-xml-converter";
import { createXNodeTransformer } from "../../converters/xnode-transformer";
import { Format } from "../../core/transform";
import { logger, validate } from "../../core/error";
import { XNode } from "../../core/xnode";

/**
 * Implementation for converting to XML DOM
 */
export function implementToXml(xjx: XJX): Document {
  try {
    // API boundary validation is handled by the XJX class
    
    logger.debug('Starting toXml conversion', {
      sourceFormat: xjx.sourceFormat,
      hasTransforms: xjx.transforms.length > 0
    });
    
    // Apply transformations if any are registered
    let nodeToConvert = xjx.xnode as XNode;
    
    if (xjx.transforms && xjx.transforms.length > 0) {
      const transformer = createXNodeTransformer(xjx.config);
      nodeToConvert = transformer.transform(nodeToConvert, xjx.transforms, Format.XML);
      
      logger.debug('Applied transforms to XNode', {
        transformCount: xjx.transforms.length,
        targetFormat: Format.XML
      });
    }
    
    // Convert XNode to DOM
    const converter = createXNodeToXmlConverter(xjx.config);
    const doc = converter.convert(nodeToConvert);
    
    logger.debug('Successfully converted XNode to DOM', {
      documentElement: doc.documentElement?.nodeName
    });
    
    return doc;
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to convert to XML: ${String(err)}`);
  }
}

/**
 * Implementation for converting to XML string
 */
export function implementToXmlString(
  xjx: XJX, 
  options?: {
    prettyPrint?: boolean;
    indent?: number;
    declaration?: boolean;
  }
): string {
  try {
    // API boundary validation is handled by the XJX class
    
    logger.debug('Starting toXmlString conversion');
    
    // Apply transformations if any are registered
    let nodeToConvert = xjx.xnode as XNode;
    
    if (xjx.transforms && xjx.transforms.length > 0) {
      const transformer = createXNodeTransformer(xjx.config);
      nodeToConvert = transformer.transform(nodeToConvert, xjx.transforms, Format.XML);
      
      logger.debug('Applied transforms to XNode', {
        transformCount: xjx.transforms.length,
        targetFormat: Format.XML
      });
    }
    
    // Convert XNode to XML string
    const converter = createXNodeToXmlStringConverter(xjx.config, options);
    const xmlString = converter.convert(nodeToConvert);
    
    logger.debug('Successfully converted to XML string', {
      xmlLength: xmlString.length
    });
    
    return xmlString;
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to convert to XML string: ${String(err)}`);
  }
}

/**
 * Implementation for XNode transformer creation
 */
export function createXNodeTransformer(config: any): {
  transform: (node: XNode, transforms: any[], format: Format) => XNode;
} {
  return {
    transform(node: XNode, transforms: any[], format: Format): XNode {
      // Validate inputs
      validate(node !== null && typeof node === 'object', "Node must be an XNode instance");
      validate(Array.isArray(transforms), "Transforms must be an array");
      validate(typeof format === "string", "Format must be a string");
      
      // Process node based on format
      if (format === Format.XML) {
        // Process for XML output
        return processXNodeForXml(node, transforms);
      } else if (format === Format.JSON) {
        // Process for JSON output
        return processXNodeForJson(node, transforms);
      }
      
      // If format is not recognized, return node unchanged
      return node;
    }
  };
}

/**
 * Process XNode for XML output
 */
function processXNodeForXml(node: XNode, transforms: any[]): XNode {
  // For a complete implementation, this would apply transforms to the XNode
  // This is a simplified placeholder
  return node;
}

/**
 * Process XNode for JSON output
 */
function processXNodeForJson(node: XNode, transforms: any[]): XNode {
  // For a complete implementation, this would apply transforms to the XNode
  // This is a simplified placeholder
  return node;
}

// Register the implementations with XJX
XJX.prototype.toXml = function(): Document {
  return implementToXml(this);
};

XJX.prototype.toXmlString = function(options?: {
  prettyPrint?: boolean;
  indent?: number;
  declaration?: boolean;
}): string {
  return implementToXmlString(this, options);
};