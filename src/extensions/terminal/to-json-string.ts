/**
 * Core extension that implements the toJsonString method
 */
import { XJX } from "../../XJX";
import { DefaultXNodeTransformer } from "../../converters/xnode-transformer";
import { DefaultXNodeToJsonConverter } from "../../converters/xnode-to-json-converter";
import { FORMATS } from "../../core/transform";
import { XNode } from "../../core/xnode";
import { logger, validate, SerializeError, handleError, ErrorType } from "../../core/error";

// Type augmentation - add method to XJX interface
declare module '../../XJX' {
  interface XJX {
    /**
     * Convert current XNode to JSON string with formatting
     * @param indent Number of spaces for indentation (default: 2)
     * @returns Formatted JSON string
     */
    toJsonString(indent?: number): string;
  }
}

/**
 * Convert current XNode to JSON string with formatting
 * @param indent Number of spaces for indentation (default: 2)
 * @returns Formatted JSON string
 */
function toJsonString(this: XJX, indent: number = 2): string {
  try {
    // API boundary validation - validate parameters
    validate(Number.isInteger(indent) && indent >= 0, "Indent must be a non-negative integer");
    validate(this.xnode !== null, "No source set: call fromXml() or fromJson() before conversion");
    validate(this.sourceFormat !== null, "Source format must be set before conversion");
    
    logger.debug('Starting toJsonString conversion', {
      sourceFormat: this.sourceFormat,
      hasTransforms: this.transforms.length > 0,
      indent
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
    const jsonObject = converter.convert(nodeToConvert);
    
    // Return as formatted string
    const result = JSON.stringify(jsonObject, null, indent);
    
    logger.debug('Successfully converted XNode to JSON string', {
      resultLength: result.length
    });
    
    return result;
  } catch (err) {
    return handleError(err, "convert to JSON string", {
      data: {
        sourceFormat: this.sourceFormat,
        transformCount: this.transforms?.length || 0,
        indent,
        hasNode: this.xnode !== null
      },
      errorType: ErrorType.SERIALIZE,
      fallback: "{}" // Return empty object JSON string as fallback
    });
  }
}

// Register the extension
XJX.registerTerminalExtension("toJsonString", toJsonString);