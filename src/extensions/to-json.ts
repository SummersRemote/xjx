import { XJX } from '../XJX';
import { createXNodeToJsonHiFiConverter } from '../converters/xnode-to-json-hifi-converter';
import { createXNodeToJsonConverter } from '../converters/xnode-to-json-std-converter';
import { transformXNode } from '../converters/xnode-transformer';
import { FORMAT } from '../core/transform';
import { logger } from '../core/error';
import { XNode } from '../core/xnode';
import { JsonOptions, JsonValue } from '../core/converter';
import { TerminalExtensionContext } from '../core/extension';

/**
 * Implementation for converting to JSON using custom converters
 */
export function toJsonWithConverter(this: TerminalExtensionContext, options?: JsonOptions): JsonValue {
  try {
    // Source validation is handled by the registration mechanism
    

logger.debug("Config", options)

    // Determine whether to use high-fidelity mode
    console.debug("options.highFidelity (value):", options?.highFidelity);
    console.debug("typeof options.highFidelity:", typeof options?.highFidelity);
    console.debug("comparison result:", options?.highFidelity === true);
    const useHighFidelity = options?.highFidelity === true || this.config.strategies.highFidelity === true;
  
  console.debug("Who enabled highFidelity?", useHighFidelity);

  
    logger.debug('Starting toJsonWithConverter conversion', {
      sourceFormat: this.sourceFormat,
      hasTransforms: this.transforms.length > 0,
      highFidelity: useHighFidelity
    });
    
    // Apply transformations if any are registered
    let nodeToConvert = this.xnode as XNode;
    
    if (this.transforms && this.transforms.length > 0) {
      nodeToConvert = transformXNode(nodeToConvert, this.transforms, FORMAT.JSON, this.config);
      
      logger.debug('Applied transforms to XNode', {
        transformCount: this.transforms.length,
        targetFormat: FORMAT.JSON
      });
    }
    
    // Select and use the appropriate converter based on highFidelity option
    let result: JsonValue;
    
    if (useHighFidelity) {
      // Use XNode to JSON HiFi converter for high-fidelity format
      const converter = createXNodeToJsonHiFiConverter(this.config);
      result = converter.convert(nodeToConvert, options);
      
      logger.debug('Used XNode to JSON HiFi converter for high-fidelity JSON', {
        resultType: typeof result,
        isArray: Array.isArray(result)
      });
    } else {
      // Use standard XNode to JSON converter
      const converter = createXNodeToJsonConverter(this.config);
      result = converter.convert(nodeToConvert, options);
      
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
    throw new Error(`Failed to convert to JSON using custom converter: ${String(err)}`);
  }
}

/**
 * Implementation for converting to JSON string using custom converters
 */
export function toJsonStringWithConverter(
  this: TerminalExtensionContext, 
  options?: JsonOptions & { indent?: number }
): string {
  try {
    // Source validation is handled by the registration mechanism
    
    logger.debug('Starting toJsonStringWithConverter conversion');
    
    // First get the JSON using the custom converter method
    const jsonValue = toJsonWithConverter.call(this, options);
    
    // Use the indent value from options or config or default
    const indent = options?.indent ?? this.config.formatting.indent ?? 2;
    
    // Stringify the JSON
    const result = JSON.stringify(jsonValue, null, indent);
    
    logger.debug('Successfully converted to JSON string using custom converter', {
      resultLength: result.length,
      indent
    });
    
    return result;
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to convert to JSON string using custom converter: ${String(err)}`);
  }
}

// Register the extensions with XJX
XJX.registerTerminalExtension("toJson", toJsonWithConverter);
XJX.registerTerminalExtension("toJsonString", toJsonStringWithConverter);