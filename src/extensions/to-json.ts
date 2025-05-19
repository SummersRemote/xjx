/**
 * Extension implementation for JSON output methods
 */
import { XJX } from "../XJX";
import { createXNodeToXjxJsonConverter } from "../converters/xnode-to-xjx-json-converter";
import { createXNodeToStandardJsonConverter } from "../converters/xnode-to-std-json-converter";
import { createXNodeTransformer } from "../converters/xnode-transformer";
import { FORMAT } from "../core/transform";
import { logger } from "../core/error";
import { XNode } from "../core/xnode";

/**
 * Implementation for converting to XJX JSON format
 */
export function implementToXjxJson(xjx: XJX): Record<string, any> {
  try {
    // API boundary validation is handled by the XJX class
    
    logger.debug('Starting toXjxJson conversion', {
      sourceFormat: xjx.sourceFormat,
      hasTransforms: xjx.transforms.length > 0
    });
    
    // Apply transformations if any are registered
    let nodeToConvert = xjx.xnode as XNode;
    
    if (xjx.transforms && xjx.transforms.length > 0) {
      const transformer = createXNodeTransformer(xjx.config);
      nodeToConvert = transformer.transform(nodeToConvert, xjx.transforms, FORMAT.JSON);
      
      logger.debug('Applied transforms to XNode', {
        transformCount: xjx.transforms.length,
        targetFormat: FORMAT.JSON
      });
    }
    
    // Convert XNode to XJX JSON
    const converter = createXNodeToXjxJsonConverter(xjx.config);
    const result = converter.convert(nodeToConvert);
    
    logger.debug('Successfully converted XNode to XJX JSON', {
      resultKeys: Object.keys(result).length
    });
    
    return result;
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to convert to XJX JSON: ${String(err)}`);
  }
}

/**
 * Implementation for converting to XJX JSON string
 */
export function implementToXjxJsonString(xjx: XJX): string {
  try {
    // API boundary validation is handled by the XJX class
    
    logger.debug('Starting toXjxJsonString conversion');
    
    // First get the JSON object using the toXjxJson method
    const jsonObject = implementToXjxJson(xjx);
    
    // Use the indent value from config
    const indent = xjx.config.converters.xml.options.indent;
    const result = JSON.stringify(jsonObject, null, indent);
    
    logger.debug('Successfully converted to XJX JSON string', {
      resultLength: result.length,
      indent
    });
    
    return result;
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to convert to XJX JSON string: ${String(err)}`);
  }
}

/**
 * Implementation for converting to standard JSON
 */
export function implementToStandardJson(xjx: XJX): any {
  try {
    // API boundary validation is handled by the XJX class
    
    logger.debug('Starting toStandardJson conversion');
    
    // Apply transformations if any are registered
    let nodeToConvert = xjx.xnode as XNode;
    
    if (xjx.transforms && xjx.transforms.length > 0) {
      const transformer = createXNodeTransformer(xjx.config);
      nodeToConvert = transformer.transform(nodeToConvert, xjx.transforms, FORMAT.JSON);
      
      logger.debug('Applied transforms to XNode', {
        transformCount: xjx.transforms.length,
        targetFormat: FORMAT.JSON
      });
    }
    
    // Convert XNode to standard JSON
    const converter = createXNodeToStandardJsonConverter(xjx.config);
    const result = converter.convert(nodeToConvert);
    
    logger.debug('Successfully converted XNode to standard JSON', {
      resultType: typeof result,
      isArray: Array.isArray(result)
    });
    
    return result;
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to convert to standard JSON: ${String(err)}`);
  }
}

/**
 * Implementation for converting to standard JSON string
 */
export function implementToStandardJsonString(xjx: XJX): string {
  try {
    // API boundary validation is handled by the XJX class
    
    logger.debug('Starting toStandardJsonString conversion');
    
    // First get the standard JSON object
    const jsonObject = implementToStandardJson(xjx);
    
    // Use the indent value from config
    const indent = xjx.config.converters.xml.options.indent;
    const result = JSON.stringify(jsonObject, null, indent);
    
    logger.debug('Successfully converted to standard JSON string', {
      resultLength: result.length,
      indent
    });
    
    return result;
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to convert to standard JSON string: ${String(err)}`);
  }
}

// Register the implementations with XJX
XJX.prototype.toXjxJson = function(): Record<string, any> {
  return implementToXjxJson(this);
};

XJX.prototype.toXjxJsonString = function(): string {
  return implementToXjxJsonString(this);
};

XJX.prototype.toStandardJson = function(): any {
  return implementToStandardJson(this);
};

XJX.prototype.toStandardJsonString = function(): string {
  return implementToStandardJsonString(this);
};