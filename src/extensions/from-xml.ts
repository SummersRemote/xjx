/**
 * Extension implementation for fromXml method
 */
import { LoggerFactory } from "../core/logger";
const logger = LoggerFactory.create();

import { XJX } from "../XJX";
import { xmlToXNodeConverter } from "../converters/xml-to-xnode-converter";
import { ProcessingError } from "../core/error";
import { NonTerminalExtensionContext } from "../core/extension";
import { validateInput, NodeCallback } from "../core/converter";

/**
 * Implementation for setting XML source
 */
export function fromXml(
  this: NonTerminalExtensionContext, 
  xml: string,
  beforeFn?: NodeCallback,
  afterFn?: NodeCallback
): void {
  try {
    // API boundary validation
    validateInput(typeof xml === "string", "XML source must be a string");
    validateInput(xml.trim().length > 0, "XML source cannot be empty");
    
    logger.debug('Setting XML source for transformation', {
      sourceLength: xml.length,
      hasCallbacks: !!(beforeFn || afterFn)
    });
    
    // Convert XML to XNode using the converter with functional callbacks
    try {
      this.xnode = xmlToXNodeConverter.convert(xml, this.config, undefined, beforeFn, afterFn);
    } catch (err) {
      // Specific error handling for XML conversion failures
      throw new ProcessingError("Failed to parse XML source", xml);
    }
    
    logger.debug('Successfully set XML source', {
      rootNodeName: this.xnode?.name,
      rootNodeType: this.xnode?.type
    });
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to parse XML source: ${String(err)}`);
  }
}

// Register the extension with XJX
XJX.registerNonTerminalExtension("fromXml", fromXml);