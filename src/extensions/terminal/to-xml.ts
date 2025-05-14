/**
 * Core extension that implements the toXml method
 */
import { XJX } from "../../XJX";
import { DefaultXNodeToXmlConverter } from "../../converters/xnode-to-xml-converter";
import { DefaultXNodeTransformer } from "../../converters/xnode-transformer";
import { TerminalExtensionContext } from "../../core/extension";
import { FORMATS } from "../../core/transform";
import { XNode } from "../../core/xnode";
import { logger, validate, SerializeError, handleError, ErrorType } from "../../core/error";

/**
 * Convert current XNode to XML string
 * @returns XML string representation
 */
function toXml(this: TerminalExtensionContext): string {
  try {
    // API boundary validation - make sure we have valid input state
    validate(this.xnode !== null, "No source set: call fromXml() or fromJson() before conversion");
    validate(this.sourceFormat !== null, "Source format must be set before conversion");
    
    logger.debug('Starting toXml conversion', {
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
        FORMATS.XML
      );
      
      logger.debug('Applied transforms to XNode', {
        transformCount: this.transforms.length,
        targetFormat: FORMATS.XML
      });
    }
    
    // Convert XNode to XML
    const converter = new DefaultXNodeToXmlConverter(this.config);
    const result = converter.convert(nodeToConvert);
    
    logger.debug('Successfully converted XNode to XML', {
      resultLength: result.length
    });
    
    return result;
  } catch (err) {
    return handleError(err, "convert to XML", {
      data: {
        sourceFormat: this.sourceFormat,
        transformCount: this.transforms?.length || 0,
        hasNode: this.xnode !== null
      },
      errorType: ErrorType.SERIALIZE
    });
  }
}

// Register the extension
XJX.registerTerminalExtension("toXml", toXml);