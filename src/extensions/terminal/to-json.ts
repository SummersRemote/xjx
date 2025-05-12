/**
 * Core extension that implements the toJson method
 */
import { XJX } from "../../XJX";
import { DefaultXNodeToJsonConverter } from "../../converters/xnode-to-json-converter";
import { DefaultXNodeTransformer } from "../../converters/xnode-transformer";
import { TerminalExtensionContext } from "../../core/types/extension-types";
import { FORMATS } from "../../core/types/transform-interfaces";
import { XNode } from "../../core/models/xnode";

/**
 * Convert current XNode to JSON object
 * @returns JSON object representation
 */
function toJson(this: TerminalExtensionContext): Record<string, any> {
  // Validate source is set
  this.validateSource();
  
  // Apply transformations if any are registered
  if (this.transforms && this.transforms.length > 0) {
    const transformer = new DefaultXNodeTransformer(this.config);
    this.xnode = transformer.transform(
      this.xnode! as XNode, 
      this.transforms, 
      // Use format identifier instead of direction
      FORMATS.JSON
    );
  }
  
  // Convert XNode to JSON
  const converter = new DefaultXNodeToJsonConverter(this.config);
  return converter.convert(this.xnode! as XNode);
}

// Register the extension
XJX.registerTerminalExtension("toJson", toJson);