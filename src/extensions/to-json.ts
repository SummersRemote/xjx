/**
 * Extension implementation for JSON output methods
 */
import { LoggerFactory } from "../core/logger";
const logger = LoggerFactory.create();

import { XJX } from '../XJX';
import { xnodeToJsonHiFiConverter } from '../converters/xnode-to-json-hifi-converter';
import { xnodeToJsonConverter } from '../converters/xnode-to-json-std-converter';
import { transformXNode } from '../converters/xnode-transformer';
import { XNode } from '../core/xnode';
import { JsonValue, TransformHooks } from '../core/converter';
import { TerminalExtensionContext } from '../core/extension';

/**
 * Implementation for converting to JSON
 */
export function toJson(this: TerminalExtensionContext, options?: TransformHooks): JsonValue {
  try {
    // Source validation is handled by the registration mechanism
    this.validateSource();
    
    // Use high-fidelity setting from config only
    const useHighFidelity = this.config.strategies.highFidelity;
  
    logger.debug('Starting JSON conversion', {
      hasTransforms: this.transforms.length > 0,
      highFidelity: useHighFidelity,
      hasTransformHooks: !!(options && (options.beforeTransform || options.transform || options.afterTransform))
    });
    
    // Apply transformations if any are registered
    let nodeToConvert = this.xnode as XNode;
    
    if (this.transforms && this.transforms.length > 0) {
      nodeToConvert = transformXNode(nodeToConvert, this.transforms, this.config);
      
      logger.debug('Applied transforms to XNode', {
        transformCount: this.transforms.length
      });
    }
    
    // Select and use the appropriate converter based on config
    let result: JsonValue;
    
    if (useHighFidelity) {
      // Use XNode to JSON HiFi converter
      result = xnodeToJsonHiFiConverter.convert(nodeToConvert, this.config, options);
      
      logger.debug('Used XNode to JSON HiFi converter for high-fidelity JSON', {
        resultType: typeof result,
        isArray: Array.isArray(result)
      });
    } else {
      // Use standard XNode to JSON converter
      result = xnodeToJsonConverter.convert(nodeToConvert, this.config, options);
      
      logger.debug('Used XNode to standard JSON converter', {
        resultType: typeof result,
        isArray: Array.isArray(result)
      });
    }
    
    return result;
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to convert to JSON: ${String(err)}`);
  }
}

/**
 * Implementation for converting to JSON string
 */
export function toJsonString(this: TerminalExtensionContext, options?: TransformHooks): string {
  try {
    // Source validation is handled by the registration mechanism
    this.validateSource();
    
    logger.debug('Starting JSON string conversion');
    
    // First get the JSON using the converter method
    const jsonValue = toJson.call(this, options);
    
    // Use the indent value from config only
    const indent = this.config.formatting.indent;
    
    // Stringify the JSON
    const result = JSON.stringify(jsonValue, null, indent);
    
    logger.debug('Successfully converted to JSON string', {
      resultLength: result.length,
      indent
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