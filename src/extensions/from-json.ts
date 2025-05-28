/**
 * Extension implementation for fromJson method
 */
import { XJX } from '../XJX';
import { jsonHiFiToXNodeConverter } from '../converters/json-hifi-to-xnode-converter';
import { jsonToXNodeConverter } from '../converters/json-std-to-xnode-converter';
import { logger, ProcessingError } from '../core/error';
import { NonTerminalExtensionContext } from '../core/extension';
import { JsonOptions, JsonValue, validateInput, NodeCallback } from '../core/converter';

/**
 * Implementation for auto-detecting JSON format
 */
export function fromJson(
  this: NonTerminalExtensionContext, 
  json: JsonValue, 
  options?: JsonOptions,
  beforeFn?: NodeCallback,
  afterFn?: NodeCallback
): void {
  try {
    // API boundary validation
    validateInput(json !== null && typeof json === 'object', "JSON source must be an object or array");
    
    // Determine format based on configuration or options
    const useHighFidelity = options?.highFidelity ?? this.config.strategies.highFidelity;
    
    logger.debug('Using JSON format based on configuration', {
      sourceType: Array.isArray(json) ? 'array' : 'object',
      highFidelity: useHighFidelity,
      hasCallbacks: !!(beforeFn || afterFn)
    });
    
    // Create effective options
    const effectiveOptions = {
      ...options,
      highFidelity: useHighFidelity
    };
    
    // Convert using appropriate converter
    if (useHighFidelity) {
      this.xnode = jsonHiFiToXNodeConverter.convert(json, this.config, effectiveOptions, beforeFn, afterFn);
    } else {
      this.xnode = jsonToXNodeConverter.convert(json, this.config, effectiveOptions, beforeFn, afterFn);
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