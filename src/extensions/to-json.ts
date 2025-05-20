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

/**
 * Implementation for converting to JSON
 */
export function implementToJson(xjx: XJX, options?: JsonOptions): JsonValue {
  try {
    // API boundary validation is handled by the XJX class
    
    logger.debug('Starting toJson conversion', {
      sourceFormat: xjx.sourceFormat,
      hasTransforms: xjx.transforms.length > 0,
      highFidelity: options?.highFidelity
    });
    
    // Apply transformations if any are registered
    let nodeToConvert = xjx.xnode as XNode;
    
    if (xjx.transforms && xjx.transforms.length > 0) {
      nodeToConvert = transformXNode(nodeToConvert, xjx.transforms, FORMAT.JSON, xjx.config);
      
      logger.debug('Applied transforms to XNode', {
        transformCount: xjx.transforms.length,
        targetFormat: FORMAT.JSON
      });
    }
    
    // Convert XNode to JSON
    const converter = createXNodeToJsonConverter(xjx.config);
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
export function implementToJsonString(xjx: XJX, options?: JsonOptions & { indent?: number }): string {
  try {
    // API boundary validation is handled by the XJX class
    
    logger.debug('Starting toJsonString conversion');
    
    // First get the JSON using the toJson method
    const jsonValue = implementToJson(xjx, options);
    
    // Use the indent value from options or config
    const indent = options?.indent !== undefined ? 
      options.indent : 
      xjx.config.formatting.indent;
    
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

// Register the implementations with XJX
XJX.prototype.toJson = function(options?: JsonOptions): JsonValue {
  return implementToJson(this, options);
};

XJX.prototype.toJsonString = function(options?: JsonOptions & { indent?: number }): string {
  return implementToJsonString(this, options);
};