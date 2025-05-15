/**
 * json-extensions.ts
 * 
 * Comprehensive JSON parsing extensions for XJX
 * 
 * This file implements three different methods for JSON parsing:
 * - fromJson: Auto-detects format (XJX or standard)
 * - fromXjxJson: Enforces XJX format parsing
 * - fromObjJson: Enforces standard object parsing with direct conversion
 */
import { XJX } from "../../XJX";
import { DefaultXjxJsonToXNodeConverter } from "../../converters/xjx-json-to-xnode-converter";
import { DefaultStandardJsonToXNodeConverter } from "../../converters/std-json-to-xnode-converter";
import { FORMATS } from "../../core/transform";
import { logger, validate, ParseError, handleError, ErrorType } from "../../core/error";

// Type augmentation - add methods to XJX interface
declare module '../../XJX' {
  interface XJX {
    /**
     * Set JSON source for transformation with automatic format detection
     * Accepts both XJX-formatted JSON and standard JSON objects
     * @param source JSON object (XJX-formatted or standard)
     * @returns This instance for chaining
     */
    fromJson(source: Record<string, any>): XJX;

    /**
     * Set XJX-formatted JSON source for transformation
     * Only accepts objects in the XJX format
     * @param source XJX-formatted JSON object
     * @returns This instance for chaining
     */
    fromXjxJson(source: Record<string, any>): XJX;

    /**
     * Set standard JSON object as source for transformation
     * Converts standard object to XJX format automatically
     * @param source Standard JavaScript object or array
     * @returns This instance for chaining
     */
    fromObjJson(source: Record<string, any> | any[]): XJX;
  }
}

/**
 * Detect if an object is in XJX JSON format
 * This checks if the object has XJX-specific property structures
 * @param obj JSON object to check
 * @param propNames Property names from configuration
 * @returns true if the object is in XJX format
 */
function isXjxFormat(obj: Record<string, any>, propNames: Record<string, string>): boolean {
  try {
    // Empty object is not in XJX format
    if (Object.keys(obj).length === 0) return false;
    
    // Get the first root element
    const rootKey = Object.keys(obj)[0];
    const rootObj = obj[rootKey];
    
    // Not an object, not XJX format
    if (!rootObj || typeof rootObj !== 'object') return false;
    
    // Check for XJX-specific properties
    const hasXjxProps = 
      rootObj[propNames.value] !== undefined ||
      rootObj[propNames.children] !== undefined ||
      rootObj[propNames.attributes] !== undefined ||
      rootObj[propNames.namespace] !== undefined ||
      rootObj[propNames.prefix] !== undefined ||
      rootObj[propNames.cdata] !== undefined ||
      rootObj[propNames.comments] !== undefined ||
      rootObj[propNames.instruction] !== undefined;
    
    return hasXjxProps;
  } catch (err) {
    return handleError(err, "check XJX format", {
      data: { objectKeys: Object.keys(obj || {}) },
      fallback: false
    });
  }
}

/**
 * Set standard JSON object as source for transformation
 * Uses a dedicated converter to create XNode directly from standard JSON
 * @param source Standard JavaScript object or array
 */
function fromObjJson(this: XJX, source: Record<string, any> | any[]): void {
  try {
    // API boundary validation - validate parameters
    validate(source !== null && typeof source === 'object', "Object source must be an object or array");
    
    logger.debug('Setting standard object as source for transformation', {
      sourceType: Array.isArray(source) ? 'array' : 'object',
      rootKeys: Array.isArray(source) ? source.length : Object.keys(source).length
    });
    
    // Use the dedicated converter for standard JSON
    const converter = new DefaultStandardJsonToXNodeConverter(this.config);
    
    try {
      this.xnode = converter.convert(source);
    } catch (conversionError) {
      // Specific error handling for JSON conversion failures
      throw new ParseError("Failed to parse standard JSON source", source);
    }
    
    this.sourceFormat = FORMATS.JSON;
    
    logger.debug('Successfully set standard JSON source', {
      rootNodeName: this.xnode?.name,
      rootNodeType: this.xnode?.type
    });
  } catch (err) {
    // At API boundary, use handleError to ensure consistent error handling
    handleError(err, "parse standard JSON source", {
      data: { 
        sourceType: typeof source,
        isArray: Array.isArray(source),
        keyCount: Array.isArray(source) ? source.length : Object.keys(source || {}).length
      },
      errorType: ErrorType.PARSE
    });
  }
}

/**
 * Set XJX-formatted JSON source for transformation
 * Only accepts objects in the XJX format
 * @param source XJX-formatted JSON object
 */
function fromXjxJson(this: XJX, source: Record<string, any>): void {
  try {
    // API boundary validation - validate parameters
    validate(source !== null && typeof source === 'object', "XJX JSON source must be an object");
    validate(!Array.isArray(source), "XJX JSON source cannot be an array");
    validate(Object.keys(source).length > 0, "XJX JSON source cannot be empty");
    
    // Validate that source is actually in XJX format
    const isXjx = isXjxFormat(source, this.config.propNames);
    validate(isXjx, "Source is not in XJX format, use fromObjJson() instead");
    
    logger.debug('Setting XJX JSON source for transformation', {
      rootKeys: Object.keys(source)
    });
    
    // Convert XJX to XNode using the appropriate converter
    const converter = new DefaultXjxJsonToXNodeConverter(this.config);
    
    try {
      this.xnode = converter.convert(source);
    } catch (conversionError) {
      // Specific error handling for JSON conversion failures
      throw new ParseError("Failed to parse XJX JSON source", source);
    }
    
    this.sourceFormat = FORMATS.JSON;
    
    logger.debug('Successfully set XJX JSON source', {
      rootNodeName: this.xnode?.name,
      rootNodeType: this.xnode?.type
    });
  } catch (err) {
    // At API boundary, use handleError to ensure consistent error handling
    handleError(err, "parse XJX JSON source", {
      data: { 
        sourceType: typeof source,
        isArray: Array.isArray(source),
        keyCount: Object.keys(source || {}).length
      },
      errorType: ErrorType.PARSE
    });
  }
}

/**
 * Set JSON source for transformation with automatic format detection
 * Accepts both XJX-formatted JSON and standard JSON objects
 * @param source JSON object (XJX-formatted or standard)
 */
function fromJson(this: XJX, source: Record<string, any>): void {
  try {
    // Basic validation for logging
    if (source === null || typeof source !== 'object') {
      throw new Error("JSON source must be an object");
    }
    
    logger.debug('Auto-detecting JSON format', {
      sourceType: Array.isArray(source) ? 'array' : 'object'
    });
    
    // Detect format and delegate to the appropriate method
    const isArray = Array.isArray(source);
    
    if (!isArray && Object.keys(source).length > 0) {
      const isXjx = isXjxFormat(source, this.config.propNames);
      
      if (isXjx) {
        // Try XJX format first
        try {
          // Simply delegate to the specialized method
          this.fromXjxJson(source);
          return; // Early return to exit the function
        } catch (err) {
          // If it fails specifically due to format validation, fall back to object format
          if (err instanceof Error && err.message.includes("Source is not in XJX format")) {
            logger.debug('XJX format detection failed, falling back to standard object', {
              error: err.message
            });
            this.fromObjJson(source);
            return; // Early return to exit the function
          }
          throw err; // Re-throw other errors
        }
      }
    }
    
    // Default to object format for arrays or non-XJX objects
    this.fromObjJson(source);
    // No return statement needed here
  } catch (err) {
    // At API boundary, use handleError to ensure consistent error handling
    handleError(err, "auto-detect JSON format", {
      data: { 
        sourceType: typeof source,
        isArray: Array.isArray(source)
      },
      errorType: ErrorType.PARSE
    });
  }
}

// Register the extensions
XJX.registerNonTerminalExtension("fromJson", fromJson);
XJX.registerNonTerminalExtension("fromXjxJson", fromXjxJson);
XJX.registerNonTerminalExtension("fromObjJson", fromObjJson);
