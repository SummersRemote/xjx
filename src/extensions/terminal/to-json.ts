/**
 * Core extension that implements the fromXml method
 */
import { XJX } from "../../XJX";
import { DefaultXmlToXNodeConverter } from "../../converters/xml-to-xnode-converter";
import { FORMATS } from "../../core/transform";
import { NonTerminalExtensionContext } from "../../core/extension";
import { logger, validate, ParseError, ValidationError, handleError, ErrorType } from "../../core/error";

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
    // At API boundary, use handleError to ensure consistent error handling
    return handleError(err, "parse XML source", {
      data: { 
        sourceLength: source?.length,
        trimmedLength: source?.trim().length
      },
      errorType: ErrorType.PARSE,
      // Don't provide a fallback - we want this to fail if the source isn't valid
    });
  }
}

// Register the extension
XJX.registerNonTerminalExtension("fromXml", fromXml);