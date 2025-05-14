/**
 * Core extension that implements the toJson method
 */
import { XJX } from "../../XJX";
import { DefaultXNodeToJsonConverter } from "../../converters/xnode-to-json-converter";
import { DefaultXNodeTransformer } from "../../converters/xnode-transformer";
import { FORMATS } from "../../core/transform";
import { XNode } from "../../core/xnode";
import { logger, validate, SerializeError, handleError, ErrorType } from "../../core/error";

// Type augmentation - add method to XJX interface
declare module '../../XJX' {
  interface XJX {
    /**
     * Convert current XNode to JSON object
     * @returns JSON object representation
     */
    toJson(): Record<string, any>;
  }
}

/**
 * Convert current XNode to JSON object
 * @returns JSON object representation
 */
function toJson(this: XJX): Record<string, any> {
  try {
    // API boundary validation - make sure we have valid input state
    validate(this.xnode !== null, "No source set: call fromXml() or fromJson() before conversion");
    validate(this.sourceFormat !== null, "Source format must be set before conversion");
    
    logger.debug('Starting toJson conversion', {
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
        FORMATS.JSON
      );
      
      logger.debug('Applied transforms to XNode', {
        transformCount: this.transforms.length,
        targetFormat: FORMATS.JSON
      });
    }
    
    // Convert XNode to JSON
    const converter = new DefaultXNodeToJsonConverter(this.config);
    const result = converter.convert(nodeToConvert);
    
    logger.debug('Successfully converted XNode to JSON', {
      resultKeys: Object.keys(result).length
    });
    
    return result;
  } catch (err) {
    return handleError(err, "convert to JSON", {
      data: {
        sourceFormat: this.sourceFormat,
        transformCount: this.transforms?.length || 0,
        hasNode: this.xnode !== null
      },
      errorType: ErrorType.SERIALIZE,
      fallback: {} // Return empty object as fallback
    });
  }
}

// Register the extension
XJX.registerTerminalExtension("toJson", toJson);