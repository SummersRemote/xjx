/**
 * Extension implementation for fromXml method - Updated for unified pipeline
 */
import { LoggerFactory } from "../core/logger";
const logger = LoggerFactory.create();

import { XJX } from "../XJX";
import { xmlToXNodeConverter } from "../converters/xml-to-xnode-converter";  // Import unified converter
import { Pipeline } from "../core/pipeline";  // Import pipeline execution
import { NonTerminalExtensionContext } from "../core/extension";
import { validateInput, SourceHooks } from "../core/hooks";

/**
 * Implementation for setting XML source with unified pipeline
 */
export function fromXml(
  this: NonTerminalExtensionContext, 
  xml: string,
  hooks?: SourceHooks<string>
): void {
  try {
    // API boundary validation - now using pipeline context
    this.pipeline.validateInput(typeof xml === "string", "XML source must be a string");
    this.pipeline.validateInput(xml.trim().length > 0, "XML source cannot be empty");
    
    logger.debug('Setting XML source for transformation', {
      sourceLength: xml.length,
      hasSourceHooks: !!(hooks && (hooks.beforeTransform || hooks.afterTransform))
    });
    
    // OLD: this.xnode = convertXmlWithHooks(xml, this.config, hooks);
    // NEW: Use unified pipeline execution
    this.xnode = Pipeline.executeSource(xmlToXNodeConverter, xml, this.pipeline, hooks);
    
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