/**
 * Extension implementation for JSON-related source methods
 */
import { XJX } from "../XJX";
import { createXjxJsonToXNodeConverter } from "../converters/xjx-json-to-xnode-converter";
import { createStandardJsonToXNodeConverter } from "../converters/std-json-to-xnode-converter";
import { FORMAT } from "../core/transform";
import { logger, ProcessingError, validate } from "../core/error";
import * as jsonUtils from "../core/json-utils";

/**
 * Implementation for setting JSON source with automatic format detection
 */
export function implementFromJson(xjx: XJX, source: Record<string, any>): void {
  try {
    // Basic validation for logging
    validate(source !== null && typeof source === 'object', "JSON source must be an object");
    
    logger.debug('Auto-detecting JSON format', {
      sourceType: Array.isArray(source) ? 'array' : 'object'
    });
    
    // Detect format and delegate to the appropriate method
    const isArray = Array.isArray(source);
    
    if (!isArray && Object.keys(source).length > 0) {
      // Get naming config from the configuration
      const namingConfig = xjx.config.converters.xjxJson.naming;
      const isXjx = jsonUtils.isXjxFormat(source, namingConfig);
      
      if (isXjx) {
        // Try XJX format first
        try {
          // Simply delegate to the specialized method
          implementFromXjxJson(xjx, source);
          return; // Early return to exit the function
        } catch (err) {
          // If it fails specifically due to format validation, fall back to object format
          if (err instanceof Error && err.message.includes("Source is not in XJX format")) {
            logger.debug('XJX format detection failed, falling back to standard object', {
              error: err.message
            });
            implementFromObjJson(xjx, source);
            return; // Early return to exit the function
          }
          throw err; // Re-throw other errors
        }
      }
    }
    
    // Default to object format for arrays or non-XJX objects
    implementFromObjJson(xjx, source);
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to auto-detect JSON format: ${String(err)}`);
  }
}

/**
 * Implementation for setting XJX-formatted JSON source
 */
export function implementFromXjxJson(xjx: XJX, source: Record<string, any>): void {
  try {
    // API boundary validation
    validate(source !== null && typeof source === 'object', "XJX JSON source must be an object");
    validate(!Array.isArray(source), "XJX JSON source cannot be an array");
    validate(Object.keys(source).length > 0, "XJX JSON source cannot be empty");
    
    // Get naming config from the configuration
    const namingConfig = xjx.config.converters.xjxJson.naming;
    
    // Validate that source is actually in XJX format
    const isXjx = jsonUtils.isXjxFormat(source, namingConfig);
    validate(isXjx, "Source is not in XJX format, use fromObjJson() instead");
    
    logger.debug('Setting XJX JSON source for transformation', {
      rootKeys: Object.keys(source)
    });
    
    // Create converter with the current configuration
    const converter = createXjxJsonToXNodeConverter(xjx.config);
    
    try {
      // Convert JSON to XNode
      xjx.xnode = converter.convert(source);
    } catch (err) {
      // Specific error handling for JSON conversion failures
      throw new ProcessingError("Failed to parse XJX JSON source", source);
    }
    
    // Set the source format
    xjx.sourceFormat = FORMAT.JSON;
    
    logger.debug('Successfully set XJX JSON source', {
      rootNodeName: xjx.xnode?.name,
      rootNodeType: xjx.xnode?.type
    });
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to parse XJX JSON source: ${String(err)}`);
  }
}

/**
 * Implementation for setting standard JSON object as source
 */
export function implementFromObjJson(xjx: XJX, source: Record<string, any> | any[]): void {
  try {
    // API boundary validation
    validate(source !== null && typeof source === 'object', "Object source must be an object or array");
    
    logger.debug('Setting standard object as source for transformation', {
      sourceType: Array.isArray(source) ? 'array' : 'object',
      rootKeys: Array.isArray(source) ? source.length : Object.keys(source).length
    });
    
    // Create converter with the current configuration
    const converter = createStandardJsonToXNodeConverter(xjx.config);
    
    try {
      // Convert standard JSON to XNode
      xjx.xnode = converter.convert(source);
    } catch (err) {
      // Specific error handling for JSON conversion failures
      throw new ProcessingError("Failed to parse standard JSON source", source);
    }
    
    // Set the source format
    xjx.sourceFormat = FORMAT.JSON;
    
    logger.debug('Successfully set standard JSON source', {
      rootNodeName: xjx.xnode?.name,
      rootNodeType: xjx.xnode?.type
    });
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to parse standard JSON source: ${String(err)}`);
  }
}

// Register the implementations with XJX
XJX.prototype.fromJson = function(source: Record<string, any>): XJX {
  implementFromJson(this, source);
  return this;
};

XJX.prototype.fromXjxJson = function(source: Record<string, any>): XJX {
  implementFromXjxJson(this, source);
  return this;
};

XJX.prototype.fromObjJson = function(source: Record<string, any> | any[]): XJX {
  implementFromObjJson(this, source);
  return this;
};