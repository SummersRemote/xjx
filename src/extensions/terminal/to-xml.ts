/**
 * Core extension that implements the enhanced toXml method
 * 
 * Returns a DOM Document with a toString method that honors config options
 */
import { XJX } from "../../XJX";
import { DefaultXNodeToXmlConverter } from "../../converters/xnode-to-xml-converter";
import { DefaultXNodeTransformer } from "../../converters/xnode-transformer";
import { FORMATS } from "../../core/transform";
import { XNode } from "../../core/xnode";
import { DOM } from "../../core/dom";
import { XmlSerializer } from "../../core/xml";
import { logger, validate, handleError, ErrorType } from "../../core/error";

// Type augmentation - add method to XJX interface
declare module '../../XJX' {
  interface XJX {
    /**
     * Convert current XNode to XML DOM
     * @returns Enhanced DOM Document with toString method
     */
    toXml(): EnhancedDocument;
  }
}

/**
 * Interface for enhanced Document with toString method
 */
export interface EnhancedDocument extends Document {
  /**
   * Convert Document to XML string
   * @param options Optional serialization options to override config
   * @returns XML string representation
   */
  toString(options?: {
    prettyPrint?: boolean;
    indent?: number;
    declaration?: boolean;
  }): string;
}

/**
 * Convert current XNode to XML DOM with toString capability
 * @returns Enhanced DOM Document
 */
function toXml(this: XJX): EnhancedDocument {
  try {
    // API boundary validation
    validate(this.xnode !== null, "No source set: call fromXml() or fromJson() before conversion");
    validate(this.sourceFormat !== null, "Source format must be set before conversion");
    
    logger.debug('Starting toXml conversion', {
      sourceFormat: this.sourceFormat,
      hasTransforms: this.transforms.length > 0
    });
    
    // First, validate source is set
    this.validateSource();
    
    // Apply transformations if any are registered
    let nodeToConvert = this.xnode as XNode;
    
    if (this.transforms && this.transforms.length > 0) {
      const transformer = new DefaultXNodeTransformer(this.config);
      nodeToConvert = transformer.transform(
        nodeToConvert, 
        this.transforms, 
        FORMATS.XML
      );
      
      logger.debug('Applied transforms to XNode', {
        transformCount: this.transforms.length,
        targetFormat: FORMATS.XML
      });
    }
    
    // Convert XNode to DOM
    const converter = new DefaultXNodeToXmlConverter(this.config);
    // Use the new createDomDocument method
    const doc = converter.createDomDocument(nodeToConvert);
    
    // Add toString method to the document
    const configRef = this.config; // Keep a reference to the config
    const enhancedDoc = doc as EnhancedDocument;
    
    enhancedDoc.toString = function(options?: {
      prettyPrint?: boolean;
      indent?: number;
      declaration?: boolean;
    }) {
      try {
        // Get config options, allowing overrides from the options parameter
        const prettyPrint = options?.prettyPrint !== undefined ? 
          options.prettyPrint : configRef.converters.xml.options.prettyPrint;
        
        const indent = options?.indent !== undefined ? 
          options.indent : configRef.converters.xml.options.indent;
        
        const declaration = options?.declaration !== undefined ? 
          options.declaration : configRef.converters.xml.options.declaration;
        
        // Serialize the document
        let xmlString = XmlSerializer.serialize(this);
        
        // Apply pretty printing if enabled
        if (prettyPrint) {
          xmlString = XmlSerializer.prettyPrint(xmlString, indent);
        }
        
        // Add XML declaration if configured
        if (declaration) {
          xmlString = XmlSerializer.ensureXMLDeclaration(xmlString);
        }
        
        return xmlString;
      } catch (err) {
        return handleError(err, "convert DOM to string", {
          errorType: ErrorType.SERIALIZE,
          fallback: "<root/>" // Return minimal XML as fallback
        });
      }
    };
    
    logger.debug('Successfully converted XNode to enhanced DOM', {
      documentElement: enhancedDoc.documentElement?.nodeName
    });
    
    return enhancedDoc;
  } catch (err) {
    // Create a minimal document with toString method as fallback
    const fallbackDoc = DOM.createDocument() as EnhancedDocument;
    
    fallbackDoc.toString = function() {
      return "<root/>";
    };
    
    return handleError(err, "convert to XML DOM", {
      data: {
        sourceFormat: this.sourceFormat,
        transformCount: this.transforms?.length || 0,
        hasNode: this.xnode !== null
      },
      errorType: ErrorType.SERIALIZE,
      fallback: fallbackDoc
    });
  }
}

// Register the extension
XJX.registerTerminalExtension("toXml", toXml);