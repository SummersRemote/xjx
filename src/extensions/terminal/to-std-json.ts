/**
 * to-standard-json.ts
 * 
 * Extension for converting XNode to standard JavaScript objects
 */
import { XJX } from "../../XJX";
import { DefaultXNodeToStandardJsonConverter } from "../../converters/xnode-to-std-json-converter";
import { DefaultXNodeTransformer } from "../../converters/xnode-transformer";
import { FORMATS } from "../../core/transform";
import { XNode } from "../../core/xnode";
import { logger, validate, handleError, ErrorType } from "../../core/error";

// Type augmentation - add method to XJX interface
declare module '../../XJX' {
  interface XJX {
    /**
     * Convert current XNode to standard JavaScript object
     * This sacrifices round-trip fidelity for a more natural object structure
     * @returns Standard JavaScript object
     */
    toStandardJson(): any;
  }
}

/**
 * Convert current XNode to standard JavaScript object
 * @returns Standard JavaScript object
 */
function toStandardJson(this: XJX): any {
  try {
    // API boundary validation
    validate(this.xnode !== null, "No source set: call fromXml() or fromJson() before conversion");
    validate(this.sourceFormat !== null, "Source format must be set before conversion");
    
    logger.debug('Starting toStandardJson conversion');
    
    // First, validate source is set
    this.validateSource();
    
    // Apply transformations if any are registered
    let nodeToConvert = this.xnode as XNode;
    
    if (this.transforms && this.transforms.length > 0) {
      const transformer = new DefaultXNodeTransformer(this.config);
      nodeToConvert = transformer.transform(
        nodeToConvert, 
        this.transforms, 
        FORMATS.JSON // Use JSON as target format for transformations
      );
      
      logger.debug('Applied transforms to XNode', {
        transformCount: this.transforms.length,
        targetFormat: FORMATS.JSON
      });
    }
    
    // Create converter with the config
    const converter = new DefaultXNodeToStandardJsonConverter(this.config);
    
    // Convert XNode to standard JSON
    const result = converter.convert(nodeToConvert);
    
    logger.debug('Successfully converted XNode to standard JSON', {
      resultType: typeof result,
      isArray: Array.isArray(result)
    });
    
    return result;
  } catch (err) {
    return handleError(err, "convert to standard JSON", {
      data: { 
        hasXNode: !!this.xnode,
        sourceFormat: this.sourceFormat,
        transformCount: this.transforms?.length || 0
      },
      errorType: ErrorType.SERIALIZE,
      fallback: null // Return null as fallback
    });
  }
}

// Register the extension
XJX.registerTerminalExtension("toStandardJson", toStandardJson);