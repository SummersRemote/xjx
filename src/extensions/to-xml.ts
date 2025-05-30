/**
 * Extension implementation for XML output methods
 */
import { LoggerFactory } from "../core/logger";
const logger = LoggerFactory.create();

import { XJX } from "../XJX";
import { xnodeToXmlConverter, xnodeToXmlStringConverter, XmlSerializationOptions } from "../converters/xnode-to-xml-converter";
import { transformXNode } from "../converters/xnode-transformer";
import { XNode } from "../core/xnode";
import { TerminalExtensionContext } from "../core/extension";

/**
 * Implementation for converting to XML DOM
 */
export function toXml(this: TerminalExtensionContext): Document {
  try {
    // Source validation is handled by the registration mechanism
    
    logger.debug('Starting XML DOM conversion', {
      hasTransforms: this.transforms.length > 0
    });
    
    // Apply transformations if any are registered
    let nodeToConvert = this.xnode as XNode;
    
    if (this.transforms && this.transforms.length > 0) {
      nodeToConvert = transformXNode(nodeToConvert, this.transforms, this.config);
      
      logger.debug('Applied transforms to XNode', {
        transformCount: this.transforms.length
      });
    }
    
    // Convert XNode to DOM (no callbacks needed for output operations)
    const doc = xnodeToXmlConverter.convert(nodeToConvert, this.config);
    
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
export function toXmlString(
  this: TerminalExtensionContext, 
  options?: XmlSerializationOptions
): string {
  try {
    // Source validation is handled by the registration mechanism
    
    logger.debug('Starting XML string conversion');
    
    // Apply transformations if any are registered
    let nodeToConvert = this.xnode as XNode;
    
    if (this.transforms && this.transforms.length > 0) {
      nodeToConvert = transformXNode(nodeToConvert, this.transforms, this.config);
      
      logger.debug('Applied transforms to XNode', {
        transformCount: this.transforms.length
      });
    }
    
    // Convert XNode to XML string (no callbacks needed for output operations)
    const xmlString = xnodeToXmlStringConverter.convert(nodeToConvert, this.config, options);
    
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

// Register the extensions with XJX
XJX.registerTerminalExtension("toXml", toXml);
XJX.registerTerminalExtension("toXmlString", toXmlString);