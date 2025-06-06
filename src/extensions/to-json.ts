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
} from '../converters/xnode-to-json-converter';
import { 
  xnodeToJsonConverter 
} from '../converters/xnode-to-json-converter';
import { JsonValue } from '../core/converter';
import { OutputHooks } from "../core/hooks";
import { TerminalExtensionContext } from '../core/extension';

/**
 * Implementation for converting to JSON with unified pipeline execution
 * NO LEGACY TRANSFORMS - All complexity moved to pipeline
 */
export function toJson(this: TerminalExtensionContext, hooks?: OutputHooks<JsonValue>): JsonValue {
  try {
    // FIXED: Use base configuration highFidelity instead of strategies.highFidelity
    const useHighFidelity = this.pipeline.config.get().highFidelity;
  
    logger.debug('Starting JSON conversion', {
      highFidelity: useHighFidelity,
      hasOutputHooks: !!(hooks && (hooks.beforeTransform || hooks.afterTransform))
    });
    
    // Use unified pipeline with appropriate semantic JSON converter
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
 */
export function toJsonString(this: TerminalExtensionContext, hooks?: OutputHooks<string>): string {
  try {
    logger.debug('Starting JSON string conversion', {
      hasOutputHooks: !!(hooks && (hooks.beforeTransform || hooks.afterTransform))
    });
    
    this.validateSource();
    
    let nodeToConvert = this.xnode as XNode;
    
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
    
    // FIXED: Use base configuration highFidelity instead of strategies.highFidelity
    const useHighFidelity = this.pipeline.config.get().highFidelity;
    const converter = useHighFidelity ? xnodeToJsonHiFiConverter : xnodeToJsonConverter;
    const jsonValue = this.executeOutput(converter);
    
    let result = JSON.stringify(jsonValue, null, this.pipeline.config.get().formatting.indent);
    
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