/**
 * Core extension that implements the fromXml method
 */
import { XJX } from "../../XJX";
import { DefaultXmlToXNodeConverter } from "../../converters/xml-to-xnode-converter";
import { FORMATS } from "../../core/transform";
import { NonTerminalExtensionContext } from "../../core/extension";
import { logger, validate, ParseError, ValidationError } from "../../core/error";

/**
 * Set XML source for transformation
 * @param source XML string
 */
function fromXml(this: NonTerminalExtensionContext, source: string) {
  try {
    // API boundary validation - validate parameters
    validate(typeof source === "string", "XML source must be a string");
    validate(source.trim().length > 0, "XML source cannot be empty");
    
    logger.debug('Setting XML source for transformation', {
      sourceLength: source.length
    });
    
    // Convert XML to XNode using the appropriate converter
    const converter = new DefaultXmlToXNodeConverter(this.config);
    
    try {
      this.xnode = converter.convert(source);
    } catch (conversionError) {
      // Specific error handling for XML conversion failures
      throw new ParseError("Failed to parse XML source", source);
    }
    
    this.sourceFormat = FORMATS.XML;
    
    logger.debug('Successfully set XML source', {
      rootNodeName: this.xnode?.name,
      rootNodeType: this.xnode?.type
    });
    
    return this;
  } catch (err) {
    // At API boundary, we handle different error types appropriately
    if (err instanceof ValidationError) {
      logger.error('Invalid XML source', err);
      throw err;
    } else if (err instanceof ParseError) {
      logger.error('Failed to parse XML source', err);
      throw err;
    } else {
      const error = new ParseError('Failed to set XML source', source);
      logger.error('Failed to set XML source', error);
      throw error;
    }
  }
}

// Register the extension
XJX.registerNonTerminalExtension("fromXml", fromXml);