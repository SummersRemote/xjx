/**
 * to-standard-json.ts
 * 
 * Extension for converting XNode to standard JavaScript objects
 */
import { XJX } from "../../XJX";
import { DefaultXNodeToStandardJsonConverter } from "../../converters/xnode-to-std-json-converter";
import { logger, handleError, ErrorType } from "../../core/error";

// Type augmentation - add method to XJX interface
declare module '../../XJX' {
  interface XJX {
    /**
     * Convert current XNode to standard JavaScript object
     * This sacrifices round-trip fidelity for a more natural object structure
     * @param options Options for controlling the conversion process
     * @returns Standard JavaScript object
     */
    toStandardJson(): any;
  }
}

/**
 * Convert current XNode to standard JavaScript object
 * @param options Options for controlling the conversion process
 * @returns Standard JavaScript object
 */
function toStandardJson(this: XJX): any {
  try {
    // API boundary validation
    this.validateSource();
    
    logger.debug('Starting toStandardJson conversion');
    
    // Create converter with the new config
    const converter = new DefaultXNodeToStandardJsonConverter(this.config);
    
    // Convert XNode to standard JSON
    const result = converter.convert(this.xnode!);
    
    logger.debug('Successfully converted XNode to standard JSON', {
      resultType: typeof result,
      isArray: Array.isArray(result)
    });
    
    return result;
  } catch (err) {
    return handleError(err, "convert to standard JSON", {
      data: { 
        hasXNode: !!this.xnode,
        sourceFormat: this.sourceFormat 
      },
      errorType: ErrorType.SERIALIZE,
      fallback: null // Return null as fallback
    });
  }
}

// Register the extension
XJX.registerTerminalExtension("toStandardJson", toStandardJson);