/**
 * Core extension that implements the toJsonString method
 */
import { XJX } from "../../XJX";
import { logger, validate, handleError, ErrorType } from "../../core/error";

// Type augmentation - add method to XJX interface
declare module '../../XJX' {
  interface XJX {
    /**
     * Convert current XNode to a JSON string
     * @returns Stringified JSON representation
     */
    toJsonString(): string;
  }
}

/**
 * Convert current XNode to a JSON string
 * @returns Stringified JSON representation
 */
function toJsonString(this: XJX): string {
  try {
    // Validate source is set (will be re-validated in toJson call)
    validate(this.xnode !== null, "No source set: call fromXml() or fromJson() before conversion");
    
    logger.debug('Starting toJsonString conversion');
    
    // First get the JSON object using the existing toJson method
    const jsonObject = this.toJson();
    
    // Use the indent value from config
    const indent = this.config.converters.xml.options.indent;
    const result = JSON.stringify(jsonObject, null, indent);
    
    logger.debug('Successfully converted to JSON string', {
      resultLength: result.length,
      indent
    });
    
    return result;
  } catch (err) {
    return handleError(err, "convert to JSON string", {
      data: {
        sourceFormat: this.sourceFormat,
        hasNode: this.xnode !== null
      },
      errorType: ErrorType.SERIALIZE,
      fallback: "{}" // Return empty JSON string as fallback
    });
  }
}

// Register the extension
XJX.registerTerminalExtension("toJsonString", toJsonString);