/**
 * Extension implementation for JSON output methods
 */
import { XJX } from '../XJX';
import { xnodeToJsonHiFiConverter } from '../converters/xnode-to-json-hifi-converter';
import { xnodeToJsonConverter } from '../converters/xnode-to-json-std-converter';
import { transformXNode } from '../converters/xnode-transformer';
import { logger } from '../core/error';
import { XNode } from '../core/xnode';
import { JsonOptions, JsonValue } from '../core/converter';
import { TerminalExtensionContext } from '../core/extension';

/**
 * Implementation for converting to JSON using converters
 */
export function toJson(this: TerminalExtensionContext, options?: JsonOptions): JsonValue {
  try {
    // Source validation is handled by the registration mechanism
    
    const useHighFidelity = options?.highFidelity === true || this.config.strategies.highFidelity === true;
  
    logger.debug('Starting JSON conversion', {
      hasTransforms: this.transforms.length > 0,
      highFidelity: useHighFidelity
    });
    
    // Apply transformations if any are registered
    let nodeToConvert = this.xnode as XNode;
    
    if (this.transforms && this.transforms.length > 0) {
      nodeToConvert = transformXNode(nodeToConvert, this.transforms, this.config);
      
      logger.debug('Applied transforms to XNode', {
        transformCount: this.transforms.length
      });
    }
    
    // Select and use the appropriate converter based on highFidelity option
    let result: JsonValue;
    
    if (useHighFidelity) {
      // Use XNode to JSON HiFi converter for high-fidelity format
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
export function toJsonString(
  this: TerminalExtensionContext, 
  options?: JsonOptions & { indent?: number }
): string {
  try {
    // Source validation is handled by the registration mechanism
    
    logger.debug('Starting JSON string conversion');
    
    // First get the JSON using the converter method
    const jsonValue = toJson.call(this, options);
    
    // Use the indent value from options or config or default
    const indent = options?.indent ?? this.config.formatting.indent ?? 2;
    
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