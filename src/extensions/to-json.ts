/**
 * Extension implementation for JSON output methods - Updated for new hook system
 */
import { LoggerFactory } from "../core/logger";
const logger = LoggerFactory.create();

import { XJX } from '../XJX';
import { 
  convertXNodeToJsonHiFiWithHooks,
  xnodeToJsonHiFiConverter 
} from '../converters/xnode-to-json-hifi-converter';
import { 
  convertXNodeToJsonWithHooks,
  xnodeToJsonConverter 
} from '../converters/xnode-to-json-std-converter';
import { transformXNodeWithHooks } from '../converters/xnode-transformer';
import { XNode } from '../core/xnode';
import { JsonValue, OutputHooks } from '../core/converter';
import { TerminalExtensionContext } from '../core/extension';

/**
 * Implementation for converting to JSON with new hook system
 */
export function toJson(this: TerminalExtensionContext, hooks?: OutputHooks<JsonValue>): JsonValue {
  try {
    // Source validation is handled by the registration mechanism
    this.validateSource();
    
    // Use high-fidelity setting from config only
    const useHighFidelity = this.config.strategies.highFidelity;
  
    logger.debug('Starting JSON conversion', {
      hasTransforms: this.transforms.length > 0,
      highFidelity: useHighFidelity,
      hasOutputHooks: !!(hooks && (hooks.beforeTransform || hooks.afterTransform))
    });
    
    // Apply legacy transforms if any are registered
    let nodeToConvert = this.xnode as XNode;
    
    if (this.transforms && this.transforms.length > 0) {
      // For legacy transforms, compose them into a single transform
      const composedTransform = (value: any) => {
        return this.transforms.reduce((result, transform) => {
          try {
            return transform(result);
          } catch (err) {
            logger.warn('Error in legacy transform:', err);
            return result;
          }
        }, value);
      };
      
      nodeToConvert = transformXNodeWithHooks(nodeToConvert, composedTransform, undefined, this.config);
      
      logger.debug('Applied legacy transforms to XNode', {
        transformCount: this.transforms.length
      });
    }
    
    // Select and use the appropriate converter based on config
    let result: JsonValue;
    
    if (useHighFidelity) {
      // Use XNode to JSON HiFi converter with hooks
      if (hooks) {
        result = convertXNodeToJsonHiFiWithHooks(nodeToConvert, this.config, hooks);
      } else {
        result = xnodeToJsonHiFiConverter.convert(nodeToConvert, this.config);
      }
      
      logger.debug('Used XNode to JSON HiFi converter for high-fidelity JSON', {
        resultType: typeof result,
        isArray: Array.isArray(result)
      });
    } else {
      // Use standard XNode to JSON converter with hooks
      if (hooks) {
        result = convertXNodeToJsonWithHooks(nodeToConvert, this.config, hooks);
      } else {
        result = xnodeToJsonConverter.convert(nodeToConvert, this.config);
      }
      
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
 * Implementation for converting to JSON string with new hook system
 */
export function toJsonString(this: TerminalExtensionContext, hooks?: OutputHooks<string>): string {
  try {
    // Source validation is handled by the registration mechanism
    this.validateSource();
    
    logger.debug('Starting JSON string conversion');
    
    // Apply legacy transforms if any are registered
    let nodeToConvert = this.xnode as XNode;
    
    if (this.transforms && this.transforms.length > 0) {
      // For legacy transforms, compose them into a single transform
      const composedTransform = (value: any) => {
        return this.transforms.reduce((result, transform) => {
          try {
            return transform(result);
          } catch (err) {
            logger.warn('Error in legacy transform:', err);
            return result;
          }
        }, value);
      };
      
      nodeToConvert = transformXNodeWithHooks(nodeToConvert, composedTransform, undefined, this.config);
      
      logger.debug('Applied legacy transforms to XNode', {
        transformCount: this.transforms.length
      });
    }
    
    // Use high-fidelity setting from config
    const useHighFidelity = this.config.strategies.highFidelity;
    
    // First get the JSON using the converter method
    let jsonValue: JsonValue;
    
    if (useHighFidelity) {
      jsonValue = xnodeToJsonHiFiConverter.convert(nodeToConvert, this.config);
    } else {
      jsonValue = xnodeToJsonConverter.convert(nodeToConvert, this.config);
    }
    
    // Use the indent value from config only
    const indent = this.config.formatting.indent;
    
    // Stringify the JSON
    let result = JSON.stringify(jsonValue, null, indent);
    
    // Apply output hooks to the string result
    if (hooks) {
      // Apply beforeTransform hook to XNode (before conversion)
      let processedXNode = nodeToConvert;
      if (hooks.beforeTransform) {
        try {
          const beforeResult = hooks.beforeTransform(processedXNode);
          if (beforeResult && typeof beforeResult === 'object' && typeof beforeResult.name === 'string') {
            processedXNode = beforeResult;
            // Re-convert with modified XNode
            if (useHighFidelity) {
              jsonValue = xnodeToJsonHiFiConverter.convert(processedXNode, this.config);
            } else {
              jsonValue = xnodeToJsonConverter.convert(processedXNode, this.config);
            }
            result = JSON.stringify(jsonValue, null, indent);
          }
        } catch (err) {
          logger.warn(`Error in JSON string output beforeTransform: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
      
      // Apply afterTransform hook to final string
      if (hooks.afterTransform) {
        try {
          const afterResult = hooks.afterTransform(result);
          if (afterResult !== undefined && afterResult !== null) {
            result = afterResult;
          }
        } catch (err) {
          logger.warn(`Error in JSON string output afterTransform: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }
    
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