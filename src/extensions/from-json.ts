/**
 * Extension implementation for fromJson method
 */
import { LoggerFactory } from "../core/logger";
const logger = LoggerFactory.create();

import { XJX } from '../XJX';
import { jsonHiFiToXNodeConverter } from '../converters/json-hifi-to-xnode-converter';
import { jsonToXNodeConverter } from '../converters/json-std-to-xnode-converter';
import { ProcessingError } from '../core/error';
import { NonTerminalExtensionContext } from '../core/extension';
import { TransformHooks, JsonValue, validateInput } from '../core/converter';

/**
 * Implementation for setting JSON source
 */
export function fromJson(
  this: NonTerminalExtensionContext, 
  json: JsonValue,
  options?: TransformHooks
): void {
  try {
    // API boundary validation
    validateInput(json !== null && typeof json === 'object', "JSON source must be an object or array");
    
    // Determine format based on configuration (no more options parameter)
    const useHighFidelity = this.config.strategies.highFidelity;
    
    logger.debug('Setting JSON source for transformation', {
      sourceType: Array.isArray(json) ? 'array' : 'object',
      highFidelity: useHighFidelity,
      hasTransformHooks: !!(options && (options.beforeTransform || options.transform || options.afterTransform))
    });
    
    // Convert using appropriate converter with transform hooks
    if (useHighFidelity) {
      this.xnode = jsonHiFiToXNodeConverter.convert(json, this.config, options);
    } else {
      this.xnode = jsonToXNodeConverter.convert(json, this.config, options);
    }
    
    logger.debug('Successfully set JSON source', {
      rootNodeName: this.xnode?.name,
      rootNodeType: this.xnode?.type,
      usedHighFidelity: useHighFidelity
    });
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to parse JSON source: ${String(err)}`);
  }
}

// Register the extension with XJX
XJX.registerNonTerminalExtension("fromJson", fromJson);