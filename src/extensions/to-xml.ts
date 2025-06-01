/**
 * Extension implementation for XML output methods - Updated for unified pipeline
 */
import { XJX } from "../XJX";
import { 
  xnodeToXmlConverter,
  xnodeToXmlStringConverter 
} from "../converters/xnode-to-xml-converter";
import { Pipeline } from "../core/pipeline";  // Import pipeline execution
import { XNode } from "../core/xnode";
import { OutputHooks } from "../core/hooks";
import { TerminalExtensionContext } from "../core/extension";

/**
 * Implementation for converting to XML DOM with unified pipeline
 */
export function toXml(this: TerminalExtensionContext, hooks?: OutputHooks<Document>): Document {
  try {
    // Source validation is handled by the registration mechanism
    this.validateSource();
    
    logger.debug('Starting XML DOM conversion', {
      hasOutputHooks: !!(hooks && (hooks.beforeTransform || hooks.afterTransform))
    });
    
    // OLD: Complex legacy transform application + convertXNodeToXmlWithHooks
    // NEW: Simple pipeline execution - no legacy transforms needed
    const result = Pipeline.executeOutput(xnodeToXmlConverter, this.xnode as XNode, this.pipeline, hooks);
    
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
 * Implementation for converting to XML string with unified pipeline
 */
export function toXmlString(this: TerminalExtensionContext, hooks?: OutputHooks<string>): string {
  try {
    // Source validation is handled by the registration mechanism
    this.validateSource();
    
    logger.debug('Starting XML string conversion', {
      hasOutputHooks: !!(hooks && (hooks.beforeTransform || hooks.afterTransform))
    });
    
    // OLD: Complex legacy transform application + convertXNodeToXmlStringWithHooks  
    // NEW: Simple pipeline execution - no legacy transforms needed
    const result = Pipeline.executeOutput(xnodeToXmlStringConverter, this.xnode as XNode, this.pipeline, hooks);
    
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