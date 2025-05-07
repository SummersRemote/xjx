/**
 * Core extension that implements the toXml method
 */
import { XJX } from "../../XJX";
import { DefaultXNodeToXmlConverter } from "../../converters/xnode-to-xml-converter";
import { DefaultXNodeTransformer } from "../../converters/xnode-transformer";
import { TerminalExtensionContext } from "../../types/extension-types";
import { TransformDirection } from "../../types/transform-interfaces";

/**
 * Convert current XNode to XML string
 * @returns XML string representation
 */
function toXml(this: TerminalExtensionContext): string {
  // Validate source is set
  this.validateSource();
  
  // Apply transformations if any are registered
  if (this.transforms && this.transforms.length > 0) {
    const transformer = new DefaultXNodeTransformer(this.config);
    this.xnode = transformer.transform(
      this.xnode!, 
      this.transforms, 
      // Always use JSON_TO_XML direction for output to XML
      TransformDirection.JSON_TO_XML
    );
  }
  
  // Convert XNode to XML
  const converter = new DefaultXNodeToXmlConverter(this.config);
  return converter.convert(this.xnode!);
}

// Register the extension
XJX.registerTerminalExtension("toXml", toXml);