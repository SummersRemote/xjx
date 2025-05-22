import { XJX } from '../XJX';
import { createJsonHiFiToXNodeConverter } from '../converters/json-hifi-to-xnode-converter';
import { createJsonToXNodeConverter } from '../converters/json-std-to-xnode-converter';
import { FORMAT } from '../core/transform';
import { logger, ProcessingError, validate } from '../core/error';
import { NonTerminalExtensionContext } from '../core/extension';
import { JsonOptions, JsonValue, JsonObject } from '../core/converter';

/**
 * Detect if JSON is in high-fidelity HiFi format
 * @param json JSON to analyze
 * @param config Configuration containing property names to check for
 * @returns True if the JSON appears to be in high-fidelity HiFi format
 */
function isHighFidelityFormat(json: JsonValue, context: NonTerminalExtensionContext): boolean {
  // Must be an object
  if (typeof json !== 'object' || json === null || Array.isArray(json)) {
    return false;
  }
  
  const jsonObj = json as JsonObject;
  const rootKeys = Object.keys(jsonObj);
  
  // Must have at least one root key
  if (rootKeys.length === 0) {
    return false;
  }
  
  // Get the root element object
  const rootKey = rootKeys[0];
  const rootObj = jsonObj[rootKey];
  
  // Root element must be an object
  if (typeof rootObj !== 'object' || rootObj === null || Array.isArray(rootObj)) {
    return false;
  }
  
  const rootElementObj = rootObj as JsonObject;
  const { properties } = context.config;
  
  // Check for HiFi-specific properties
  const hasHiFiProperties = 
    rootElementObj[properties.value] !== undefined ||
    rootElementObj[properties.children] !== undefined ||
    rootElementObj[properties.attribute] !== undefined ||
    rootElementObj[properties.namespace] !== undefined ||
    rootElementObj[properties.prefix] !== undefined ||
    rootElementObj.namespaceDeclarations !== undefined;
    
  return hasHiFiProperties;
}


/**
 * Implementation for auto-detecting JSON format
 */
export function fromJson(
  this: NonTerminalExtensionContext, 
  json: JsonValue, 
  options?: JsonOptions
): void {
  try {
    // Validate input
    validate(json !== null && typeof json === 'object', "JSON source must be an object or array");
    
    // ✅ SIMPLE: Just check the configuration!
    const useHighFidelity = options?.highFidelity ?? this.config.strategies.highFidelity;
    
    logger.debug('Using JSON format based on configuration', {
      sourceType: Array.isArray(json) ? 'array' : 'object',
      highFidelity: useHighFidelity
    });
    
    // Create effective options
    const effectiveOptions = {
      ...options,
      highFidelity: useHighFidelity
    };
    
    if (useHighFidelity) {
      const converter = createJsonHiFiToXNodeConverter(this.config);
      this.xnode = converter.convert(json, effectiveOptions);
    } else {
      const converter = createJsonToXNodeConverter(this.config);
      this.xnode = converter.convert(json, effectiveOptions);
    }
    
    this.sourceFormat = FORMAT.JSON;
    
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