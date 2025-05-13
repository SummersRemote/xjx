/**
 * Core extension that implements the fromJson method
 */
import { XJX } from "../../XJX";
import { DefaultJsonToXNodeConverter } from "../../converters/json-to-xnode-converter";
import { XJXError } from "../../core/error";
import { FORMATS } from "../../core/transform";
import { NonTerminalExtensionContext } from "../../core/extension";

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
  this.sourceFormat = FORMATS.JSON;
  
  return this;
}

// Register the extension
XJX.registerNonTerminalExtension("fromJson", fromJson);