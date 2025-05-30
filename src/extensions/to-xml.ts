/**
 * Extension implementation for XML output methods - Updated for new hook system
 */
import { LoggerFactory } from "../core/logger";
const logger = LoggerFactory.create();

import { XJX } from "../XJX";
import { xnodeToXmlConverter, xnodeToXmlStringConverter } from "../converters/xnode-to-xml-converter";
import { transformXNode } from "../converters/xnode-transformer";
import { XNode } from "../core/xnode";
import { OutputHooks, applyOutputHooks } from "../core/converter";
import { TerminalExtensionContext } from "../core/extension";

/**
 * Implementation for converting to XML DOM with new hook system
 */
export function toXml(this: TerminalExtensionContext, hooks?: OutputHooks<Document>): Document {
  try {
    // Source validation is handled by the registration mechanism
    this.validateSource();
    
    logger.debug('Starting XML DOM conversion', {
      hasTransforms: this.transforms.length > 0,
      hasOutputHooks: !!(hooks && (hooks.beforeTransform || hooks.afterTransform))
    });
    
    // Apply transformations if any are registered
    let nodeToConvert = this.xnode as XNode;
    
    if (this.transforms && this.transforms.length > 0) {
      nodeToConvert = transformXNode(nodeToConvert, this.transforms, this.config);
      
      logger.debug('Applied transforms to XNode', {
        transformCount: this.transforms.length
      });
    }
    
    // Convert XNode to DOM
    let doc = xnodeToXmlConverter.convert(nodeToConvert, this.config);
    
    // Apply output hooks
    if (hooks) {
      const { xnode: processedXNode, output: processedOutput } = applyOutputHooks(nodeToConvert, doc, hooks);
      doc = processedOutput;
    }
    
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
 * Implementation for converting to XML string with new hook system
 */
export function toXmlString(this: TerminalExtensionContext, hooks?: OutputHooks<string>): string {
  try {
    // Source validation is handled by the registration mechanism
    this.validateSource();
    
    logger.debug('Starting XML string conversion', {
      hasOutputHooks: !!(hooks && (hooks.beforeTransform || hooks.afterTransform))
    });
    
    // Apply transformations if any are registered
    let nodeToConvert = this.xnode as XNode;
    
    if (this.transforms && this.transforms.length > 0) {
      nodeToConvert = transformXNode(nodeToConvert, this.transforms, this.config);
      
      logger.debug('Applied transforms to XNode', {
        transformCount: this.transforms.length
      });
    }
    
    // Convert XNode to XML string
    let xmlString = xnodeToXmlStringConverter.convert(nodeToConvert, this.config);
    
    // Apply output hooks
    if (hooks) {
      const { xnode: processedXNode, output: processedOutput } = applyOutputHooks(nodeToConvert, xmlString, hooks);
      xmlString = processedOutput;
    }
    
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