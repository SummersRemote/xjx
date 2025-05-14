/**
 * Core extension that implements the toJsonString method
 */
import { XJX } from "../../XJX";
import { TerminalExtensionContext } from "../../core/extension";
import { DefaultXNodeTransformer } from "../../converters/xnode-transformer";
import { DefaultXNodeToJsonConverter } from "../../converters/xnode-to-json-converter";
import { FORMATS } from "../../core/transform";
import { XNode } from "../../core/xnode";
import { logger, validate, SerializeError } from "../../core/error";

/**
 * Convert current XNode to JSON string with formatting
 * @param indent Number of spaces for indentation (default: 2)
 * @returns Formatted JSON string
 */
function toJsonString(this: TerminalExtensionContext, indent: number = 2): string {
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
    // At API boundary, we wrap all errors to ensure consistent behavior
    if (err instanceof SerializeError) {
      logger.error('Failed to convert to JSON string', err);
      throw err;
    } else {
      const error = new SerializeError('Failed to convert to JSON string', {
        sourceFormat: this.sourceFormat,
        transformCount: this.transforms?.length || 0,
        indent
      });
      logger.error('Failed to convert to JSON string', error);
      throw error;
    }
  }
}

// Register the extension
XJX.registerTerminalExtension("toJsonString", toJsonString);