/**
 * Core extension that implements the fromXml method
 */
import { XJX } from "../../XJX";
import { DefaultXmlToXNodeConverter } from "../../converters/xml-to-xnode-converter";
import { catchAndRelease, validate, ErrorType } from "../../core/error";
import { FORMATS } from "../../core/transform";
import { NonTerminalExtensionContext } from "../../core/extension";

/**
 * Set XML source for transformation
 * @param source XML string
 */
function fromXml(this: NonTerminalExtensionContext, source: string) {
  if (!source || typeof source !== 'string') {
    let msg = "Invalid XML source: must be a non-empty string"
    catchAndRelease(new Error(msg), msg, {
      errorType: ErrorType.VALIDATION,
    });
  }
  
  // Convert XML to XNode using the appropriate converter
  const converter = new DefaultXmlToXNodeConverter(this.config);
  this.xnode = converter.convert(source);
  this.sourceFormat = FORMATS.XML;
  
  return this;
}

// Register the extension
XJX.registerNonTerminalExtension("fromXml", fromXml);