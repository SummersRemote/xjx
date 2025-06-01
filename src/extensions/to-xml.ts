/**
 * Extension implementation for XML output methods - Simplified with unified pipeline
 * CRITICAL: All legacy transform handling REMOVED
 */
import { LoggerFactory } from "../core/logger";
const logger = LoggerFactory.create();

import { XJX } from "../XJX";
import { 
  xnodeToXmlConverter,
  xnodeToXmlStringConverter 
} from "../converters/xnode-to-xml-converter";
import { OutputHooks } from "../core/hooks";
import { TerminalExtensionContext } from "../core/extension";

/**
 * Implementation for converting to XML DOM with unified pipeline execution
 * NO LEGACY TRANSFORMS - All complexity moved to pipeline
 */
export function toXml(this: TerminalExtensionContext, hooks?: OutputHooks<Document>): Document {
  try {
    logger.debug('Starting XML DOM conversion', {
      hasOutputHooks: !!(hooks && (hooks.beforeTransform || hooks.afterTransform))
    });
    
    // NEW: Simple pipeline execution - all source validation, hook execution,
    // performance tracking, resource management, and logging handled by pipeline
    // NO LEGACY TRANSFORM APPLICATION
    const result = this.executeOutput(xnodeToXmlConverter, hooks);
    
    logger.debug('Successfully converted XNode to DOM', {
      documentElement: result.documentElement?.nodeName
    });
    
    return result;
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to convert to XML: ${String(err)}`);
  }
}

/**
 * Implementation for converting to XML string with unified pipeline execution
 * NO LEGACY TRANSFORMS - All complexity moved to pipeline
 */
export function toXmlString(this: TerminalExtensionContext, hooks?: OutputHooks<string>): string {
  try {
    logger.debug('Starting XML string conversion', {
      hasOutputHooks: !!(hooks && (hooks.beforeTransform || hooks.afterTransform))
    });
    
    // NEW: Simple pipeline execution - all source validation, hook execution,
    // performance tracking, resource management, and logging handled by pipeline
    // NO LEGACY TRANSFORM APPLICATION
    const result = this.executeOutput(xnodeToXmlStringConverter, hooks);
    
    logger.debug('Successfully converted to XML string', {
      xmlLength: result.length
    });
    
    return result;
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to convert to XML string: ${String(err)}`);
  }
}

// Register the extensions with XJX
XJX.registerTerminalExtension("toXml", toXml);
XJX.registerTerminalExtension("toXmlString", toXmlString);