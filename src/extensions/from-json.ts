/**
 * Extension implementation for fromJson method - Updated for new hook system
 */
import { LoggerFactory } from "../core/logger";
const logger = LoggerFactory.create();

import { XJX } from '../XJX';
import { convertJsonHiFiWithHooks } from '../converters/json-hifi-to-xnode-converter';
import { convertJsonWithHooks } from '../converters/json-std-to-xnode-converter';
import { ProcessingError } from '../core/error';
import { NonTerminalExtensionContext } from '../core/extension';
import { JsonValue } from '../core/converter';
import { SourceHooks, validateInput } from "../core/hooks";

/**
 * Implementation for setting JSON source with new hook system
 */
export function fromJson(
  this: NonTerminalExtensionContext, 
  json: JsonValue,
  hooks?: SourceHooks<JsonValue>
): void {
  try {
    // API boundary validation
    validateInput(json !== null && typeof json === 'object', "JSON source must be an object or array");
    
    // Determine format based on configuration
    const useHighFidelity = this.config.strategies.highFidelity;
    
    logger.debug('Setting JSON source for transformation', {
      sourceType: Array.isArray(json) ? 'array' : 'object',
      highFidelity: useHighFidelity,
      hasSourceHooks: !!(hooks && (hooks.beforeTransform || hooks.afterTransform))
    });
    
    // Convert using appropriate converter with source hooks
    if (useHighFidelity) {
      this.xnode = convertJsonHiFiWithHooks(json, this.config, hooks);
    } else {
      this.xnode = convertJsonWithHooks(json, this.config, hooks);
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