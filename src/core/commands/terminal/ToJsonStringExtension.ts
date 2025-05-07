/**
 * Core extension that implements the toJsonString method
 */
import { XJX } from "../../XJX";
import { TerminalExtensionContext } from "../../types/extension-types";
import { DefaultXNodeTransformer } from "../../converters/xnode-transformer";
import { DefaultXNodeToJsonConverter } from "../../converters/xnode-to-json-converter";
import { TransformDirection } from "../../types/transform-interfaces";

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
      xnode,
      this.transforms, 
      // Always use XML_TO_JSON direction for output to JSON
      TransformDirection.XML_TO_JSON
    );
  }
  
  // Convert XNode to JSON
  const converter = new DefaultXNodeToJsonConverter(this.config);
  const jsonObject = converter.convert(xnode);
  
  // Return as formatted string
  return JSON.stringify(jsonObject, null, indent);
}

// Register the extension
XJX.registerTerminalExtension("toJsonString", toJsonString);