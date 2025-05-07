/**
 * Core extension that implements the fromJson method
 */
import { XJX } from "../../XJX";
import { DefaultJsonToXNodeConverter } from "../../converters/json-to-xnode-converter";
import { XJXError } from "../../types/error-types";
import { TransformDirection } from "../../types/transform-interfaces";
import { NonTerminalExtensionContext } from "../../types/extension-types";

/**
 * Set JSON source for transformation
 * @param source JSON object
 */
function fromJson(this: NonTerminalExtensionContext, source: Record<string, any>) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    throw new XJXError('Invalid JSON source: must be a non-empty object');
  }
  
  // Convert JSON to XNode using the appropriate converter
  const converter = new DefaultJsonToXNodeConverter(this.config);
  this.xnode = converter.convert(source);
  this.direction = TransformDirection.JSON_TO_XML;
  
  return this;
}

// Register the extension
XJX.registerNonTerminalExtension("fromJson", fromJson);