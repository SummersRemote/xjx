/**
 * Extension implementation for JSON output methods - Simplified with unified pipeline
 * CRITICAL: All legacy transform handling REMOVED
 */
import { LoggerFactory } from "../core/logger";
const logger = LoggerFactory.create();

import { XJX } from '../XJX';
import { 
  xnodeToJsonHiFiConverter 
} from '../converters/xnode-to-json-hifi-converter';
import { 
  xnodeToJsonConverter 
} from '../converters/xnode-to-json-std-converter';
import { JsonValue } from '../core/converter';
import { OutputHooks } from "../core/hooks";
import { TerminalExtensionContext } from '../core/extension';

/**
 * Implementation for converting to JSON with unified pipeline execution
 * NO LEGACY TRANSFORMS - All complexity moved to pipeline
 */
export function toJson(this: TerminalExtensionContext, hooks?: OutputHooks<JsonValue>): JsonValue {
  try {
    // Use high-fidelity setting from config only
    const useHighFidelity = this.pipeline.config.get().strategies.highFidelity;
  
    logger.debug('Starting JSON conversion', {
      highFidelity: useHighFidelity,
      hasOutputHooks: !!(hooks && (hooks.beforeTransform || hooks.afterTransform))
    });
    
    // NEW: Simple pipeline execution with converter selection
    // NO LEGACY TRANSFORM APPLICATION - pipeline handles everything
    const converter = useHighFidelity ? xnodeToJsonHiFiConverter : xnodeToJsonConverter;
    const result = this.executeOutput(converter, hooks);
    
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

/**
 * Implementation for converting to JSON string with unified pipeline execution  
 * NO LEGACY TRANSFORMS - All complexity moved to pipeline
 */
export function toJsonString(this: TerminalExtensionContext, hooks?: OutputHooks<string>): string {
  try {
    logger.debug('Starting JSON string conversion', {
      hasOutputHooks: !!(hooks && (hooks.beforeTransform || hooks.afterTransform))
    });
    
    // First convert to JSON value using the same logic as toJson()
    // Use high-fidelity setting from config only
    const useHighFidelity = this.pipeline.config.get().strategies.highFidelity;
    
    // Get JSON value using the converter directly (avoid circular call to this.toJson)
    const converter = useHighFidelity ? xnodeToJsonHiFiConverter : xnodeToJsonConverter;
    const jsonValue = this.executeOutput(converter, hooks);
    
    // Then stringify the result
    const result = JSON.stringify(jsonValue, null, this.pipeline.config.get().formatting.indent);
    
    logger.debug('Successfully converted to JSON string', {
      jsonLength: result.length
    });
    
    return result;
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to convert to JSON string: ${String(err)}`);
  }
}

// Register the extensions with XJX
XJX.registerTerminalExtension("toJson", toJson);
XJX.registerTerminalExtension("toJsonString", toJsonString);