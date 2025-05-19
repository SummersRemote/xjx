/**
 * Core extension that implements the toXml and toXmlString methods
 */
import { XJX } from "../../XJX";
import { DefaultXNodeToXmlConverter } from "../../converters/xnode-to-xml-converter";
import { DefaultXNodeTransformer } from "../../converters/xnode-transformer";
import { FORMAT } from "../../core/transform";
import { XNode } from "../../core/xnode";
import { XmlSerializer } from "../../core/xml-utils";
import { logger, validate, handleError, ErrorType } from "../../core/error";

// Type augmentation - add methods to XJX interface
declare module '../../XJX' {
  interface XJX {
    /**
     * Convert current XNode to XML DOM
     * @returns DOM Document
     */
    toXml(): Document;

    /**
     * Convert current XNode to XML string
     * @param options Optional serialization options to override config
     * @returns XML string representation
     */
    toXmlString(options?: {
      prettyPrint?: boolean;
      indent?: number;
      declaration?: boolean;
    }): string;
  }
}

/**
 * Convert current XNode to XML DOM
 * @returns DOM Document
 */
function toXml(this: XJX): Document {
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
        FORMAT.XML
      );
      
      logger.debug('Applied transforms to XNode', {
        transformCount: this.transforms.length,
        targetFormat: FORMAT.XML
      });
    }
    
    // Convert XNode to DOM
    const converter = new DefaultXNodeToXmlConverter(this.config);
    // Use the createDomDocument method
    const doc = converter.createDomDocument(nodeToConvert);
    
    logger.debug('Successfully converted XNode to DOM', {
      documentElement: doc.documentElement?.nodeName
    });
    
    return doc;
  } catch (err) {
    // Create a minimal document as fallback
    const fallbackDoc = document.implementation.createDocument(null, "root", null);
    
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

/**
 * Convert current XNode to XML string
 * @param options Optional serialization options to override config
 * @returns XML string representation
 */
function toXmlString(this: XJX, options?: {
  prettyPrint?: boolean;
  indent?: number;
  declaration?: boolean;
}): string {
  try {
    // Validate source is set (will be re-validated in toXml call)
    validate(this.xnode !== null, "No source set: call fromXml() or fromJson() before conversion");
    
    logger.debug('Starting toXmlString conversion');
    
    // First get the DOM Document using the toXml method
    const doc = this.toXml();
    
    // Get config options, allowing overrides from the options parameter
    const prettyPrint = options?.prettyPrint !== undefined ? 
      options.prettyPrint : this.config.converters.xml.options.prettyPrint;
    
    const indent = options?.indent !== undefined ? 
      options.indent : this.config.converters.xml.options.indent;
    
    const declaration = options?.declaration !== undefined ? 
      options.declaration : this.config.converters.xml.options.declaration;
    
    // Serialize the document
    let xmlString = XmlSerializer.serialize(doc);
    
    // Apply pretty printing if enabled
    if (prettyPrint) {
      xmlString = XmlSerializer.prettyPrint(xmlString, indent);
    }
    
    // Add XML declaration if configured
    if (declaration) {
      xmlString = XmlSerializer.ensureXMLDeclaration(xmlString);
    }
    
    logger.debug('Successfully converted to XML string', {
      xmlLength: xmlString.length,
      prettyPrint,
      indent,
      declaration
    });
    
    return xmlString;
  } catch (err) {
    return handleError(err, "convert to XML string", {
      data: {
        sourceFormat: this.sourceFormat,
        hasNode: this.xnode !== null
      },
      errorType: ErrorType.SERIALIZE,
      fallback: "<root/>" // Return minimal XML as fallback
    });
  }
}

// Register the extensions
XJX.registerTerminalExtension("toXml", toXml);
XJX.registerTerminalExtension("toXmlString", toXmlString);