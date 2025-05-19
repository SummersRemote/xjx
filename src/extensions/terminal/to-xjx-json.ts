/**
 * Core extension that implements the toXjxJson and toXjxJsonString methods
 */
import { XJX } from "../../XJX";
import { DefaultXNodeToJsonConverter } from "../../converters/xnode-to-xjx-json-converter";
import { DefaultXNodeTransformer } from "../../converters/xnode-transformer";
import { FORMAT } from "../../core/transform";
import { XNode } from "../../core/xnode";
import { logger, validate, handleError, ErrorType } from "../../core/error";

// Type augmentation - add methods to XJX interface
declare module '../../XJX' {
  interface XJX {
    /**
     * Convert current XNode to XJX formatted JSON object
     * @returns XJX JSON object representation
     */
    toXjxJson(): Record<string, any>;

    /**
     * Convert current XNode to a XJX JSON string
     * @returns Stringified XJX JSON representation
     */
    toXjxJsonString(): string;
  }
}

/**
 * Convert current XNode to XJX formatted JSON object
 * @returns XJX JSON object representation
 */
function toXjxJson(this: XJX): Record<string, any> {
  try {
    // API boundary validation - make sure we have valid input state
    validate(this.xnode !== null, "No source set: call fromXml() or fromJson() before conversion");
    validate(this.sourceFormat !== null, "Source format must be set before conversion");
    
    logger.debug('Starting toXjxJson conversion', {
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
        FORMAT.JSON
      );
      
      logger.debug('Applied transforms to XNode', {
        transformCount: this.transforms.length,
        targetFormat: FORMAT.JSON
      });
    }
    
    // Convert XNode to JSON
    const converter = new DefaultXNodeToJsonConverter(this.config);
    const result = converter.convert(nodeToConvert);
    
    logger.debug('Successfully converted XNode to XJX JSON', {
      resultKeys: Object.keys(result).length
    });
    
    return result;
  } catch (err) {
    return handleError(err, "convert to XJX JSON", {
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

/**
 * Convert current XNode to a XJX JSON string
 * @returns Stringified XJX JSON representation
 */
function toXjxJsonString(this: XJX): string {
  try {
    // Validate source is set (will be re-validated in toXjxJson call)
    validate(this.xnode !== null, "No source set: call fromXml() or fromJson() before conversion");
    
    logger.debug('Starting toXjxJsonString conversion');
    
    // First get the JSON object using the toXjxJson method
    const jsonObject = this.toXjxJson();
    
    // Use the indent value from config
    const indent = this.config.converters.xml.options.indent;
    const result = JSON.stringify(jsonObject, null, indent);
    
    logger.debug('Successfully converted to XJX JSON string', {
      resultLength: result.length,
      indent
    });
    
    return result;
  } catch (err) {
    return handleError(err, "convert to XJX JSON string", {
      data: {
        sourceFormat: this.sourceFormat,
        hasNode: this.xnode !== null
      },
      errorType: ErrorType.SERIALIZE,
      fallback: "{}" // Return empty JSON string as fallback
    });
  }
}

// Register the extensions
XJX.registerTerminalExtension("toXjxJson", toXjxJson);
XJX.registerTerminalExtension("toXjxJsonString", toXjxJsonString);