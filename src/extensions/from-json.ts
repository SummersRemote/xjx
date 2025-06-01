/**
 * Extension implementation for fromJson method - Updated for unified pipeline
 */
import { XJX } from '../XJX';
import { jsonHiFiToXNodeConverter } from '../converters/json-hifi-to-xnode-converter';
import { jsonToXNodeConverter } from '../converters/json-std-to-xnode-converter';
import { Pipeline } from '../core/pipeline';  // Import pipeline execution
import { NonTerminalExtensionContext } from '../core/extension';
import { JsonValue } from '../core/converter';
import { SourceHooks, validateInput } from "../core/hooks";

/**
 * Implementation for setting JSON source with unified pipeline
 */
export function fromJson(
  this: NonTerminalExtensionContext, 
  json: JsonValue,
  hooks?: SourceHooks<JsonValue>
): void {
  try {
    // API boundary validation - now using pipeline context
    this.pipeline.validateInput(json !== null && typeof json === 'object', "JSON source must be an object or array");
    
    // Determine format based on configuration
    const useHighFidelity = this.pipeline.config.get().strategies.highFidelity;
    
    logger.debug('Setting JSON source for transformation', {
      sourceType: Array.isArray(json) ? 'array' : 'object',
      highFidelity: useHighFidelity,
      hasSourceHooks: !!(hooks && (hooks.beforeTransform || hooks.afterTransform))
    });
    
    // OLD: 
    // if (useHighFidelity) {
    //   this.xnode = convertJsonHiFiWithHooks(json, this.config, hooks);
    // } else {
    //   this.xnode = convertJsonWithHooks(json, this.config, hooks);
    // }
    
    // NEW: Use unified pipeline execution
    if (useHighFidelity) {
      this.xnode = Pipeline.executeSource(jsonHiFiToXNodeConverter, json, this.pipeline, hooks);
    } else {
      this.xnode = Pipeline.executeSource(jsonToXNodeConverter, json, this.pipeline, hooks);
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