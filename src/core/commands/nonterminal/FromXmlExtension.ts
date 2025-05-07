/**
 * Core extension that implements the fromXml method
 */
import { XJX } from "../../XJX";
import { DefaultXmlToXNodeConverter } from "../../converters/xml-to-xnode-converter";
import { XJXError } from "../../types/error-types";
import { TransformDirection } from "../../types/transform-interfaces";
import { NonTerminalExtensionContext } from "../../types/extension-types";

/**
 * Set XML source for transformation
 * @param source XML string
 */
function fromXml(this: NonTerminalExtensionContext, source: string) {
  if (!source || typeof source !== 'string') {
    throw new XJXError('Invalid XML source: must be a non-empty string');
  }
  
  // Convert XML to XNode using the appropriate converter
  const converter = new DefaultXmlToXNodeConverter(this.config);
  this.xnode = converter.convert(source);
  this.direction = TransformDirection.XML_TO_JSON;
  
  return this;
}

// Register the extension
XJX.registerNonTerminalExtension("fromXml", fromXml);