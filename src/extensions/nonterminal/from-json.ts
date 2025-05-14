/**
 * Core extension that implements the fromJson method
 */
import { XJX } from "../../XJX";
import { DefaultJsonToXNodeConverter } from "../../converters/json-to-xnode-converter";
import { FORMATS } from "../../core/transform";
import { NonTerminalExtensionContext } from "../../core/extension";
import { logger, validate, ParseError, ValidationError, handleError, ErrorType } from "../../core/error";
import { JSON } from "../../core/json";

/**
 * Set JSON source for transformation
 * @param source JSON object
 */
function fromJson(this: NonTerminalExtensionContext, source: Record<string, any>) {
  try {
    // API boundary validation - validate parameters
    validate(source !== null && typeof source === 'object', "JSON source must be an object");
    validate(!Array.isArray(source), "JSON source cannot be an array");
    validate(Object.keys(source).length > 0, "JSON source cannot be empty");
    
    logger.debug('Setting JSON source for transformation', {
      rootKeys: Object.keys(source)
    });
    
    // Convert JSON to XNode using the appropriate converter
    const converter = new DefaultJsonToXNodeConverter(this.config);
    
    try {
      this.xnode = converter.convert(source);
    } catch (conversionError) {
      // Specific error handling for JSON conversion failures
      throw new ParseError("Failed to parse JSON source", source);
    }
    
    this.sourceFormat = FORMATS.JSON;
    
    logger.debug('Successfully set JSON source', {
      rootNodeName: this.xnode?.name,
      rootNodeType: this.xnode?.type
    });
    
    return this;
  } catch (err) {
    // At API boundary, use handleError to ensure consistent error handling
    return handleError(err, "parse JSON source", {
      data: { 
        sourceType: typeof source,
        isArray: Array.isArray(source),
        keyCount: Object.keys(source || {}).length
      },
      errorType: ErrorType.PARSE,
      // Don't provide a fallback - we want this to fail if the source isn't valid
    });
  }
}

// Register the extension
XJX.registerNonTerminalExtension("fromJson", fromJson);