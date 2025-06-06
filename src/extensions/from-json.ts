/**
 * Extension implementation for fromJson method - Simplified with unified pipeline
 */
import { LoggerFactory } from "../core/logger";
const logger = LoggerFactory.create();

import { XJX } from '../XJX';
import { jsonHiFiToXNodeConverter } from '../converters/json-to-xnode-converter';
import { jsonToXNodeConverter } from '../converters/json-to-xnode-converter';
import { NonTerminalExtensionContext } from '../core/extension';
import { JsonValue } from '../core/converter';
import { SourceHooks } from "../core/hooks";

/**
 * Implementation for setting JSON source with unified pipeline execution
 */
export function fromJson(
  this: NonTerminalExtensionContext, 
  json: JsonValue,
  hooks?: SourceHooks<JsonValue>
): void {
  try {
    // FIXED: Use base configuration highFidelity instead of strategies.highFidelity
    const useHighFidelity = this.pipeline.config.get().highFidelity;
    
    logger.debug('Setting JSON source for transformation', {
      sourceType: Array.isArray(json) ? 'array' : 'object',
      highFidelity: useHighFidelity,
      hasSourceHooks: !!(hooks && (hooks.beforeTransform || hooks.afterTransform))
    });
    
    // Use unified pipeline with semantic JSON converter
    const converter = useHighFidelity ? jsonHiFiToXNodeConverter : jsonToXNodeConverter;
    this.executeSource(converter, json, hooks);
    
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