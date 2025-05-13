/**
 * Core extension that implements the toXml method
 */
import { XJX } from "../../XJX";
import { DefaultXNodeToXmlConverter } from "../../converters/xnode-to-xml-converter";
import { DefaultXNodeTransformer } from "../../converters/xnode-transformer";
import { TerminalExtensionContext } from "../../core/extension";
import { FORMATS } from "../../core/transform";
import { XNode } from "../../core/xnode";

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
      this.xnode! as XNode, 
      this.transforms, 
      // Use format identifier instead of direction
      FORMATS.XML
    );
  }
  
  // Convert XNode to XML
  const converter = new DefaultXNodeToXmlConverter(this.config);
  return converter.convert(this.xnode! as XNode);
}

// Register the extension
XJX.registerTerminalExtension("toXml", toXml);