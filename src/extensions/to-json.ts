/**
 * Extension implementation for JSON output methods - Updated for unified pipeline
 */
import { XJX } from '../XJX';
import { 
  xnodeToJsonHiFiConverter 
} from '../converters/xnode-to-json-hifi-converter';
import { 
  xnodeToJsonConverter 
} from '../converters/xnode-to-json-std-converter';
import { Pipeline } from '../core/pipeline';  // Import pipeline execution
import { XNode } from '../core/xnode';
import { JsonValue } from '../core/converter';
import { OutputHooks } from "../core/hooks";
import { TerminalExtensionContext } from '../core/extension';

/**
 * Implementation for converting to JSON with unified pipeline
 */
export function toJson(this: TerminalExtensionContext, hooks?: OutputHooks<JsonValue>): JsonValue {
  try {
    // Source validation is handled by the registration mechanism
    this.validateSource();
    
    // Use high-fidelity setting from config only
    const useHighFidelity = this.pipeline.config.get().strategies.highFidelity;
  
    logger.debug('Starting JSON conversion', {
      highFidelity: useHighFidelity,
      hasOutputHooks: !!(hooks && (hooks.beforeTransform || hooks.afterTransform))
    });
    
    // OLD: Complex legacy transform application + converter selection + hook wrapper calls
    // NEW: Simple pipeline execution with converter selection - no legacy transforms needed
    const converter = useHighFidelity ? xnodeToJsonHiFiConverter : xnodeToJsonConverter;
    const result = Pipeline.executeOutput(converter, this.xnode as XNode, this.pipeline, hooks);
    
    logger.debug('Successfully converted to JSON', {
      resultType: typeof result,
      isArray: Array.isArray(result),
      usedHighFidelity: useHighFidelity
    });
    
    return result;
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to convert to JSON: ${String(err)}`);
  }
}

// Register the extensions with XJX
XJX.registerTerminalExtension("toJson", toJson);
XJX.registerTerminalExtension("toJsonString", toJsonString);