/**
 * Core extension that implements the toJsonString method
 */
import { XJX } from "../../XJX";
import { TerminalExtensionContext } from "../../core/extension";
import { DefaultXNodeTransformer } from "../../converters/xnode-transformer";
import { DefaultXNodeToJsonConverter } from "../../converters/xnode-to-json-converter";
import { FORMATS } from "../../core/transform";
import { XNode } from "../../core/xnode";

/**
 * Convert current XNode to JSON string with formatting
 * @param indent Number of spaces for indentation (default: 2)
 * @returns Formatted JSON string
 */
function toJsonString(this: TerminalExtensionContext, indent: number = 2): string {
  // Validate source is set
  this.validateSource();
  
  // Apply transformations if any are registered
  let xnode = this.xnode!;
  if (this.transforms && this.transforms.length > 0) {
    const transformer = new DefaultXNodeTransformer(this.config);
    xnode = transformer.transform(
      xnode as XNode,
      this.transforms, 
      // Use format identifier instead of direction
      FORMATS.JSON
    );
  }
  
  // Convert XNode to JSON
  const converter = new DefaultXNodeToJsonConverter(this.config);
  const jsonObject = converter.convert(xnode as XNode);
  
  // Return as formatted string
  return JSON.stringify(jsonObject, null, indent);
}

// Register the extension
XJX.registerTerminalExtension("toJsonString", toJsonString);