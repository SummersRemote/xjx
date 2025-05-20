/**
 * Extension implementation for XML output methods
 */
import { XJX } from "../XJX";
import { createXNodeToXmlConverter, createXNodeToXmlStringConverter } from "../converters/xnode-to-xml-converter";
import { transformXNode } from "../converters/xnode-transformer";
import { FORMAT } from "../core/transform";
import { logger } from "../core/error";
import { XNode } from "../core/xnode";

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
      nodeToConvert = transformXNode(nodeToConvert, xjx.transforms, FORMAT.XML, xjx.config);
      
      logger.debug('Applied transforms to XNode', {
        transformCount: xjx.transforms.length,
        targetFormat: FORMAT.XML
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
      nodeToConvert = transformXNode(nodeToConvert, xjx.transforms, FORMAT.XML, xjx.config);
      
      logger.debug('Applied transforms to XNode', {
        transformCount: xjx.transforms.length,
        targetFormat: FORMAT.XML
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