/**
 * Extension implementation for XML output methods - Updated for new hook system
 */
import { LoggerFactory } from "../core/logger";
const logger = LoggerFactory.create();

import { XJX } from "../XJX";
import { 
  convertXNodeToXmlWithHooks, 
  convertXNodeToXmlStringWithHooks,
  xnodeToXmlConverter,
  xnodeToXmlStringConverter 
} from "../converters/xnode-to-xml-converter";
import { transformXNodeWithHooks } from "../converters/xnode-transformer";
import { XNode } from "../core/xnode";
import { OutputHooks } from "../core/converter";
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
    
    // Apply legacy transforms if any are registered
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
    
    // Convert XNode to DOM with output hooks
    let doc: Document;
    if (hooks) {
      doc = convertXNodeToXmlWithHooks(nodeToConvert, this.config, hooks);
    } else {
      doc = xnodeToXmlConverter.convert(nodeToConvert, this.config);
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
    
    // Apply legacy transforms if any are registered
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
    
    // Convert XNode to XML string with output hooks
    let xmlString: string;
    if (hooks) {
      xmlString = convertXNodeToXmlStringWithHooks(nodeToConvert, this.config, hooks);
    } else {
      xmlString = xnodeToXmlStringConverter.convert(nodeToConvert, this.config);
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