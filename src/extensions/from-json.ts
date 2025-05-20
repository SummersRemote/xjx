/**
 * Extension implementation for JSON-related source methods
 */
import { XJX } from "../XJX";
import { createJsonToXNodeConverter } from "../converters/json-to-xnode-converter";
import { FORMAT } from "../core/transform";
import { logger, ProcessingError, validate } from "../core/error";
import { JsonOptions, JsonValue } from "../core/converter";
import { safeParse } from "../core/json-utils";

/**
 * Implementation for setting JSON source
 */
export function implementFromJson(xjx: XJX, source: JsonValue, options?: JsonOptions): void {
  try {
    // Basic validation for logging
    validate(source !== null && typeof source === 'object', "JSON source must be an object or array");
    
    logger.debug('Setting JSON source for transformation', {
      sourceType: Array.isArray(source) ? 'array' : 'object',
      highFidelity: options?.highFidelity
    });
    
    // Create converter with the current configuration
    const converter = createJsonToXNodeConverter(xjx.config);
    
    try {
      // Convert JSON to XNode
      xjx.xnode = converter.convert(source, options);
    } catch (err) {
      // Specific error handling for JSON conversion failures
      throw new ProcessingError("Failed to parse JSON source", source);
    }
    
    // Set the source format
    xjx.sourceFormat = FORMAT.JSON;
    
    logger.debug('Successfully set JSON source', {
      rootNodeName: xjx.xnode?.name,
      rootNodeType: xjx.xnode?.type
    });
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to parse JSON source: ${String(err)}`);
  }
}

/**
 * Implementation for setting JSON string source
 */
export function implementFromJsonString(xjx: XJX, source: string, options?: JsonOptions): void {
  try {
    // Validate source
    validate(typeof source === 'string', "JSON string source must be a string");
    validate(source.trim().length > 0, "JSON string source cannot be empty");
    
    logger.debug('Parsing JSON string source', {
      sourceLength: source.length
    });
    
    // Parse JSON string
    const jsonValue = safeParse(source);
    
    if (jsonValue === null) {
      throw new ProcessingError("Failed to parse JSON string", source);
    }
    
    // Delegate to regular fromJson implementation
    implementFromJson(xjx, jsonValue, options);
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to parse JSON string source: ${String(err)}`);
  }
}

// Register the implementations with XJX
XJX.prototype.fromJson = function(source: JsonValue, options?: JsonOptions): XJX {
  implementFromJson(this, source, options);
  return this;
};

XJX.prototype.fromJsonString = function(source: string, options?: JsonOptions): XJX {
  implementFromJsonString(this, source, options);
  return this;
};