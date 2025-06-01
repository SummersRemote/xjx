/**
 * Extension implementation for JSON output methods - Simplified with unified pipeline
 * CRITICAL: All legacy transform handling REMOVED
 */
import { LoggerFactory } from "../core/logger";
const logger = LoggerFactory.create();

import { XJX } from '../XJX';
import { XNode } from "../core/xnode";
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
    
    // Source validation handled by validateSource()
    this.validateSource();
    
    // Start with current XNode
    let nodeToConvert = this.xnode as XNode;
    
    // Apply beforeTransform hook to XNode (if hooks are provided)
    if (hooks?.beforeTransform) {
      try {
        const beforeResult = hooks.beforeTransform(nodeToConvert);
        if (beforeResult && typeof beforeResult === 'object' && typeof beforeResult.name === 'string') {
          nodeToConvert = beforeResult;
        }
      } catch (err) {
        logger.warn(`Error in JSON string beforeTransform: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    
    // Get JSON value using the converter directly (no hooks for intermediate step)
    const useHighFidelity = this.pipeline.config.get().strategies.highFidelity;
    const converter = useHighFidelity ? xnodeToJsonHiFiConverter : xnodeToJsonConverter;
    const jsonValue = this.executeOutput(converter); // No hooks passed here
    
    // Stringify the result
    let result = JSON.stringify(jsonValue, null, this.pipeline.config.get().formatting.indent);
    
    // Apply afterTransform hook to final string result
    if (hooks?.afterTransform) {
      try {
        const afterResult = hooks.afterTransform(result);
        if (afterResult !== undefined && afterResult !== null) {
          result = afterResult;
        }
      } catch (err) {
        logger.warn(`Error in JSON string afterTransform: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    
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