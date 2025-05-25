/**
 * Extension implementation for XML output methods
 */
import { XJX } from "../XJX";
import { createXNodeToXmlConverter, createXNodeToXmlStringConverter, XmlSerializationOptions } from "../converters/xnode-to-xml-converter";
import { transformXNode } from "../converters/xnode-transformer";
import { FORMAT } from "../core/transform";
import { logger } from "../core/error";
import { XNode } from "../core/xnode";
import { TerminalExtensionContext } from "../core/extension";

/**
 * Implementation for converting to XML DOM
 */
export function toXml(this: TerminalExtensionContext): Document {
  try {
    // Source validation is handled by the registration mechanism
    
    logger.debug('Starting toXml conversion', {
      sourceFormat: this.sourceFormat,
      hasTransforms: this.transforms.length > 0
    });
    
    // Apply transformations if any are registered
    let nodeToConvert = this.xnode as XNode;
    
    if (this.transforms && this.transforms.length > 0) {
      nodeToConvert = transformXNode(nodeToConvert, this.transforms, this.config);
      
      logger.debug('Applied transforms to XNode', {
        transformCount: this.transforms.length,
        targetFormat: FORMAT.XML
      });
    }
    
    // Convert XNode to DOM
    const converter = createXNodeToXmlConverter(this.config);
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
export function toXmlString(
  this: TerminalExtensionContext, 
  options?: XmlSerializationOptions
): string {
  try {
    // Source validation is handled by the registration mechanism
    
    logger.debug('Starting toXmlString conversion');
    
    // Apply transformations if any are registered
    let nodeToConvert = this.xnode as XNode;
    
    if (this.transforms && this.transforms.length > 0) {
      nodeToConvert = transformXNode(nodeToConvert, this.transforms, this.config);
      
      logger.debug('Applied transforms to XNode', {
        transformCount: this.transforms.length,
        targetFormat: FORMAT.XML
      });
    }
    
    // Convert XNode to XML string
    const converter = createXNodeToXmlStringConverter(this.config);
    const xmlString = converter.convert(nodeToConvert, options);
    
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