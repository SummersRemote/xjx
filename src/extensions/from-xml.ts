/**
 * Extension implementation for fromXml method - Updated for new hook system
 */
import { LoggerFactory } from "../core/logger";
const logger = LoggerFactory.create();

import { XJX } from "../XJX";
import { convertXmlWithHooks } from "../converters/xml-to-xnode-converter";
import { ProcessingError } from "../core/error";
import { NonTerminalExtensionContext } from "../core/extension";
import { validateInput, SourceHooks } from "../core/converter";

/**
 * Implementation for setting XML source with new hook system
 */
export function fromXml(
  this: NonTerminalExtensionContext, 
  xml: string,
  hooks?: SourceHooks<string>
): void {
  try {
    // API boundary validation
    validateInput(typeof xml === "string", "XML source must be a string");
    validateInput(xml.trim().length > 0, "XML source cannot be empty");
    
    logger.debug('Setting XML source for transformation', {
      sourceLength: xml.length,
      hasSourceHooks: !!(hooks && (hooks.beforeTransform || hooks.afterTransform))
    });
    
    // Convert XML to XNode using the new hooks system
    try {
      this.xnode = convertXmlWithHooks(xml, this.config, hooks);
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