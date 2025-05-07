/**
 * Core extension that implements the toJson method
 */
import { XJX } from "../../XJX";
import { DefaultXNodeToJsonConverter } from "../../converters/xnode-to-json-converter";
import { DefaultXNodeTransformer } from "../../converters/xnode-transformer";
import { TerminalExtensionContext } from "../../types/extension-types";
import { TransformDirection } from "../../types/transform-interfaces";

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
      this.xnode!, 
      this.transforms, 
      // Always use XML_TO_JSON direction for output to JSON
      TransformDirection.XML_TO_JSON
    );
  }
  
  // Convert XNode to JSON
  const converter = new DefaultXNodeToJsonConverter(this.config);
  return converter.convert(this.xnode!);
}

// Register the extension
XJX.registerTerminalExtension("toJson", toJson);