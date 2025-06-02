/**
 * Extension implementation for fromXml method - Simplified with unified pipeline
 */
import { LoggerFactory } from "../core/logger";
const logger = LoggerFactory.create();

import { XJX } from "../XJX";
import { xmlToXNodeConverter } from "../converters/xml-to-xnode-converter";
import { NonTerminalExtensionContext } from "../core/extension";
import { SourceHooks } from "../core/hooks";

/**
 * Implementation for setting XML source with unified pipeline execution
 */
export function fromXml(
  this: NonTerminalExtensionContext, 
  xml: string,
  hooks?: SourceHooks<string>
): void {
  try {
    logger.debug('Setting XML source for transformation', {
      sourceLength: xml.length,
      hasSourceHooks: !!(hooks && (hooks.beforeTransform || hooks.afterTransform))
    });
    
    // NEW: Simple pipeline execution - all validation, hook execution, 
    // performance tracking, resource management, and logging handled by pipeline
    this.executeSource(xmlToXNodeConverter, xml, hooks);
    
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