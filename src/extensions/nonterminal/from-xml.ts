/**
 * Core extension that implements the fromXml method
 */
import { XJX } from "../../XJX";
import { DefaultXmlToXNodeConverter } from "../../converters/xml-to-xnode-converter";
import { FORMATS } from "../../core/transform";
import { logger, validate, ParseError, handleError, ErrorType } from "../../core/error";

// Type augmentation - add method to XJX interface
declare module '../../XJX' {
  interface XJX {
    /**
     * Set XML source for transformation
     * @param xml XML string
     * @returns This instance for chaining
     */
    fromXml(xml: string): XJX;
  }
}

/**
 * Implementation that sets XML source
 */
function fromXml(this: XJX, xml: string): void {
  try {
    // API boundary validation - validate parameters
    validate(typeof xml === "string", "XML source must be a string");
    validate(xml.trim().length > 0, "XML source cannot be empty");
    
    logger.debug('Setting XML source for transformation', {
      sourceLength: xml.length
    });
    
    // Convert XML to XNode using the appropriate converter
    const converter = new DefaultXmlToXNodeConverter(this.config);
    
    try {
      this.xnode = converter.convert(xml);
    } catch (conversionError) {
      // Specific error handling for XML conversion failures
      throw new ParseError("Failed to parse XML source", xml);
    }
    
    this.sourceFormat = FORMATS.XML;
    
    logger.debug('Successfully set XML source', {
      rootNodeName: this.xnode?.name,
      rootNodeType: this.xnode?.type
    });
  } catch (err) {
    // At API boundary, use handleError to ensure consistent error handling
    handleError(err, "parse XML source", {
      data: { 
        sourceLength: xml?.length,
        trimmedLength: xml?.trim().length
      },
      errorType: ErrorType.PARSE
    });
  }
}

// Register the extension
XJX.registerNonTerminalExtension("fromXml", fromXml);