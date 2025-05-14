/**
 * Core extension that implements the toJson method
 */
import { XJX } from "../../XJX";
import { DefaultXNodeToJsonConverter } from "../../converters/xnode-to-json-converter";
import { DefaultXNodeTransformer } from "../../converters/xnode-transformer";
import { TerminalExtensionContext } from "../../core/extension";
import { FORMATS } from "../../core/transform";
import { XNode } from "../../core/xnode";
import { logger, validate, SerializeError } from "../../core/error";

/**
 * Convert current XNode to JSON object
 * @returns JSON object representation
 */
function toJson(this: TerminalExtensionContext): Record<string, any> {
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
        // Use format identifier instead of direction
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
    // At API boundary, we wrap all errors to ensure consistent behavior
    if (err instanceof SerializeError) {
      logger.error('Failed to convert to JSON', err);
      throw err;
    } else {
      const error = new SerializeError('Failed to convert to JSON', {
        sourceFormat: this.sourceFormat,
        transformCount: this.transforms?.length || 0
      });
      logger.error('Failed to convert to JSON', error);
      throw error;
    }
  }
}

// Register the extension
XJX.registerTerminalExtension("toJson", toJson);