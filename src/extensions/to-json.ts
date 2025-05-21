/**
 * Extension implementation for JSON output methods
 */
import { XJX } from "../XJX";
import { createXNodeToJsonConverter } from "../converters/xnode-to-json-converter";
import { transformXNode } from "../converters/xnode-transformer";
import { FORMAT } from "../core/transform";
import { logger } from "../core/error";
import { XNode } from "../core/xnode";
import { JsonOptions, JsonValue } from "../core/converter";
import { safeStringify } from "../core/json-utils";
import { TerminalExtensionContext } from "../core/extension";

/**
 * Implementation for converting to JSON
 */
export function toJson(this: TerminalExtensionContext, options?: JsonOptions): JsonValue {
  try {
    // Source validation is handled by the registration mechanism
    
    logger.debug('Starting toJson conversion', {
      sourceFormat: this.sourceFormat,
      hasTransforms: this.transforms.length > 0,
      highFidelity: options?.highFidelity
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
    
    // Convert XNode to JSON
    const converter = createXNodeToJsonConverter(this.config);
    const result = converter.convert(nodeToConvert, options);
    
    logger.debug('Successfully converted XNode to JSON', {
      resultType: typeof result,
      isArray: Array.isArray(result)
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
 * Implementation for converting to JSON string
 */
export function toJsonString(this: TerminalExtensionContext, options?: JsonOptions & { indent?: number }): string {
  try {
    // Source validation is handled by the registration mechanism
    
    logger.debug('Starting toJsonString conversion');
    
    // First get the JSON using the toJson method
    const jsonValue = toJson.call(this, options);
    
    // Use the indent value from options or config
    const indent = options?.indent !== undefined ? 
      options.indent : 
      this.config.formatting.indent;
    
    // Stringify the JSON
    const result = safeStringify(jsonValue, indent);
    
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

// Register legacy JSON extensions for high-fidelity and standard JSON formats
export function toXjxJson(this: TerminalExtensionContext): Record<string, any> {
  logger.warn('toXjxJson() is deprecated, use toJson({ highFidelity: true }) instead');
  return toJson.call(this, { highFidelity: true }) as Record<string, any>;
}

export function toXjxJsonString(this: TerminalExtensionContext): string {
  logger.warn('toXjxJsonString() is deprecated, use toJsonString({ highFidelity: true }) instead');
  return toJsonString.call(this, { highFidelity: true });
}

export function toStandardJson(this: TerminalExtensionContext): any {
  logger.warn('toStandardJson() is deprecated, use toJson() instead');
  return toJson.call(this);
}

export function toStandardJsonString(this: TerminalExtensionContext): string {
  logger.warn('toStandardJsonString() is deprecated, use toJsonString() instead');
  return toJsonString.call(this);
}

// Register the extensions with XJX
XJX.registerTerminalExtension("toJson", toJson);
XJX.registerTerminalExtension("toJsonString", toJsonString);
XJX.registerTerminalExtension("toXjxJson", toXjxJson);
XJX.registerTerminalExtension("toXjxJsonString", toXjxJsonString);
XJX.registerTerminalExtension("toStandardJson", toStandardJson);
XJX.registerTerminalExtension("toStandardJsonString", toStandardJsonString);