/**
 * JSON source adapter - JSON to Semantic XNode conversion
 */
import { LoggerFactory } from "../../core/logger";
const logger = LoggerFactory.create();

import { ProcessingError, ValidationError } from "../../core/error";
import { 
  XNode, 
  XNodeType,
  createCollection,
  createRecord, 
  createField,
  createValue,
  addChild
} from "../../core/xnode";
import { UnifiedConverter } from "../../core/pipeline";
import { PipelineContext } from "../../core/context";
import { NonTerminalExtensionContext } from "../../core/extension";
import { SourceHooks } from "../../core/hooks";
import { ClonePolicies } from "../../core/context";
import { JsonSourceConfiguration, DEFAULT_JSON_SOURCE_CONFIG } from "./config";
import { JsonValue, JsonObject, JsonArray, getJsonArrayItemName } from "./utils";

/**
 * Context for JSON to Semantic XNode conversion
 */
interface JsonConversionContext {
  config: JsonSourceConfiguration;
  parentPropertyName?: string;
  depth: number;
  preserveSemanticInfo?: boolean;
}

/**
 * Standard JSON to Semantic XNode converter
 */
export const jsonToXNodeConverter: UnifiedConverter<JsonValue, XNode> = {
  name: 'jsonToSemanticXNode',
  inputType: 'JsonValue',
  outputType: 'XNode',
  
  validate(json: JsonValue, context: PipelineContext): void {
    context.validateInput(json !== undefined, "JSON source cannot be undefined");
    validateJsonForSemantic(json);
  },
  
  execute(json: JsonValue, context: PipelineContext): XNode {
    logger.debug('Converting JSON to semantic XNode', {
      sourceType: Array.isArray(json) ? 'array' : typeof json
    });
    
    try {
      // Get JSON source config from pipeline context or use defaults
      const baseConfig = context.config.get();
      const jsonSourceConfig: JsonSourceConfiguration = {
        ...DEFAULT_JSON_SOURCE_CONFIG,
        ...(baseConfig as any).json?.source
      };
      
      // Create conversion context
      const conversionContext: JsonConversionContext = {
        config: jsonSourceConfig,
        depth: 0,
        preserveSemanticInfo: false
      };
      
      // Convert JSON value to semantic XNode using natural mapping
      const result = convertJsonValueToSemantic("root", json, conversionContext);
      
      // Apply empty value filtering if configured
      const filteredResult = filterEmptyValues(result, conversionContext.config);
      
      // Register result for tracking
      context.resources.registerXNode(filteredResult || result);
      
      logger.debug('Successfully converted JSON to semantic XNode', {
        rootNodeName: (filteredResult || result).name,
        rootNodeType: (filteredResult || result).type
      });
      
      return filteredResult || result;
      
    } catch (err) {
      throw new ProcessingError(`Failed to convert JSON to semantic XNode: ${err instanceof Error ? err.message : String(err)}`);
    }
  },
  
  onError(error: Error, json: JsonValue, context: PipelineContext): XNode | null {
    logger.error('JSON to semantic XNode conversion failed', { error });
    return null;
  }
};

/**
 * High-fidelity JSON to Semantic XNode converter
 */
export const jsonHiFiToXNodeConverter: UnifiedConverter<JsonValue, XNode> = {
  name: 'jsonHiFiToSemanticXNode',
  inputType: 'JsonValue',
  outputType: 'XNode',
  
  validate(json: JsonValue, context: PipelineContext): void {
    context.validateInput(json !== undefined, "JSON source cannot be undefined");
    
    // Additional validation for high-fidelity format
    if (typeof json === 'object' && json !== null && !Array.isArray(json)) {
      const obj = json as JsonObject;
      if (obj['#type'] && !Object.values(XNodeType).includes(obj['#type'] as XNodeType)) {
        throw new ValidationError(`Invalid semantic type in high-fidelity JSON: ${obj['#type']}`);
      }
    }
  },
  
  execute(json: JsonValue, context: PipelineContext): XNode {
    logger.debug('Converting high-fidelity JSON to semantic XNode', {
      sourceType: Array.isArray(json) ? 'array' : typeof json
    });
    
    try {
      // Check if input is high-fidelity format
      if (isHighFidelityJson(json)) {
        // Convert from high-fidelity format
        const result = convertHiFiJsonToSemantic(json as JsonObject);
        
        // Register result for tracking
        context.resources.registerXNode(result);
        
        logger.debug('Successfully converted high-fidelity JSON to semantic XNode', {
          rootNodeName: result.name,
          rootNodeType: result.type
        });
        
        return result;
      } else {
        // Fallback to standard conversion with semantic info preservation
        const baseConfig = context.config.get();
        const jsonSourceConfig: JsonSourceConfiguration = {
          ...DEFAULT_JSON_SOURCE_CONFIG,
          ...(baseConfig as any).json?.source
        };
        
        const conversionContext: JsonConversionContext = {
          config: jsonSourceConfig,
          depth: 0,
          preserveSemanticInfo: true
        };
        
        const result = convertJsonValueToSemantic("root", json, conversionContext);
        
        // Register result for tracking
        context.resources.registerXNode(result);
        
        logger.debug('Successfully converted standard JSON to semantic XNode with semantic info preserved', {
          rootNodeName: result.name,
          rootNodeType: result.type
        });
        
        return result;
      }
      
    } catch (err) {
      throw new ProcessingError(`Failed to convert high-fidelity JSON to semantic XNode: ${err instanceof Error ? err.message : String(err)}`);
    }
  },
  
  onError(error: Error, json: JsonValue, context: PipelineContext): XNode | null {
    logger.error('High-fidelity JSON to semantic XNode conversion failed', { error });
    return null;
  }
};

/**
 * fromJson extension implementation
 */
export function fromJson(
  this: NonTerminalExtensionContext, 
  json: any,
  hooks?: SourceHooks<any>
): void {
  try {
    // Check for high-fidelity mode in base config
    const baseConfig = this.pipeline.config.get();
    const useHighFidelity = (baseConfig as any).highFidelity || false;
    
    logger.debug('Setting JSON source with semantic XNode converter', {
      sourceType: Array.isArray(json) ? 'array' : typeof json,
      highFidelity: useHighFidelity,
      hasSourceHooks: !!(hooks && (hooks.beforeTransform || hooks.afterTransform))
    });
    
    // Choose converter based on configuration
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

// --- Helper Functions ---

/**
 * Convert JSON value to semantic XNode using natural type mapping
 */
function convertJsonValueToSemantic(
  name: string, 
  value: JsonValue, 
  context: JsonConversionContext
): XNode {
  // Handle null values based on configuration
  if (value === null) {
    return handleNullValue(name, context);
  }
  
  // Arrays become COLLECTION nodes (natural mapping)
  if (Array.isArray(value)) {
    return convertJsonArrayToCollection(name, value, context);
  }
  
  // Objects become RECORD nodes (natural mapping)
  if (typeof value === 'object') {
    return convertJsonObjectToRecord(name, value as JsonObject, context);
  }
  
  // Primitives become VALUE nodes
  return createValue(name, value as string | number | boolean);
}

/**
 * Handle null values based on configuration
 */
function handleNullValue(name: string, context: JsonConversionContext): XNode {
  const jsonConfig = context.config;
  
  switch (jsonConfig.emptyValueHandling) {
    case 'null':
      return createValue(name, null);
    case 'undefined':
      return createField(name, undefined);
    case 'remove':
      // Return empty field that can be filtered out later
      return createField(name, null);
    default:
      return createValue(name, null);
  }
}

/**
 * Convert JSON array to COLLECTION node
 */
function convertJsonArrayToCollection(
  name: string, 
  array: JsonArray, 
  context: JsonConversionContext
): XNode {
  const collection = createCollection(name);
  
  // Get item name for array elements
  const itemName = getJsonArrayItemName(context.config, context.parentPropertyName || name);
  
  // Create child context
  const childContext: JsonConversionContext = {
    ...context,
    depth: context.depth + 1,
    parentPropertyName: name
  };
  
  // Convert each array item
  array.forEach((item, index) => {
    const indexedItemName = shouldIndexArrayItems(array) ? `${itemName}_${index}` : itemName;
    const childNode = convertJsonValueToSemantic(indexedItemName, item, childContext);
    
    // Convert VALUE nodes to FIELD nodes for array items if configured
    if (childNode.type === XNodeType.VALUE && shouldPromoteToField(context)) {
      childNode.type = XNodeType.FIELD;
    }
    
    addChild(collection, childNode);
  });
  
  logger.debug('Converted JSON array to collection', {
    arrayName: name,
    itemCount: array.length,
    itemName
  });
  
  return collection;
}

/**
 * Convert JSON object to RECORD node
 */
function convertJsonObjectToRecord(
  name: string, 
  obj: JsonObject, 
  context: JsonConversionContext
): XNode {
  const record = createRecord(name);
  
  // Create child context
  const childContext: JsonConversionContext = {
    ...context,
    depth: context.depth + 1
  };
  
  // Convert each object property
  Object.entries(obj).forEach(([key, value]) => {
    // Set parent property name for array item naming
    childContext.parentPropertyName = key;
    
    const childNode = convertJsonValueToSemantic(key, value, childContext);
    
    // Apply fieldVsValue strategy for object properties
    const finalChildNode = applyFieldValueStrategy(childNode, value, context);
    
    addChild(record, finalChildNode);
  });
  
  logger.debug('Converted JSON object to record', {
    objectName: name,
    propertyCount: Object.keys(obj).length
  });
  
  return record;
}

/**
 * Check if JSON is in high-fidelity format
 */
function isHighFidelityJson(json: JsonValue): boolean {
  return typeof json === 'object' && 
         json !== null && 
         !Array.isArray(json) && 
         typeof (json as JsonObject)['#type'] === 'string' &&
         typeof (json as JsonObject)['#name'] === 'string';
}

/**
 * Convert high-fidelity JSON to semantic XNode
 */
function convertHiFiJsonToSemantic(hifiJson: JsonObject): XNode {
  const node: XNode = {
    type: hifiJson['#type'] as XNodeType,
    name: hifiJson['#name'] as string
  };
  
  // Add optional semantic properties
  if (hifiJson['#id'] !== undefined) {
    node.id = hifiJson['#id'] as string;
  }
  
  if (hifiJson['#ns'] !== undefined) {
    node.ns = hifiJson['#ns'] as string;
  }
  
  if (hifiJson['#label'] !== undefined) {
    node.label = hifiJson['#label'] as string;
  }
  
  if (hifiJson['#value'] !== undefined) {
    node.value = hifiJson['#value'] as string | number | boolean | null;
  }
  
  // Convert attributes if present
  if (hifiJson['#attributes'] && Array.isArray(hifiJson['#attributes'])) {
    node.attributes = (hifiJson['#attributes'] as JsonObject[]).map(attr => 
      convertHiFiJsonToSemantic(attr)
    );
  }
  
  // Convert children if present
  if (hifiJson['#children'] && Array.isArray(hifiJson['#children'])) {
    node.children = (hifiJson['#children'] as JsonObject[]).map(child => {
      const childNode = convertHiFiJsonToSemantic(child);
      childNode.parent = node;
      return childNode;
    });
  }
  
  return node;
}

/**
 * Determine if array items should be indexed
 */
function shouldIndexArrayItems(array: JsonArray): boolean {
  // Index if array contains primitives mixed with objects/arrays
  const types = new Set(array.map(item => {
    if (item === null) return 'null';
    if (Array.isArray(item)) return 'array';
    return typeof item;
  }));
  
  return types.size > 1;
}

/**
 * Determine if VALUE should be promoted to FIELD for array items
 */
function shouldPromoteToField(context: JsonConversionContext): boolean {
  const jsonConfig = context.config;
  return jsonConfig.fieldVsValue === 'field' || 
         (jsonConfig.fieldVsValue === 'auto' && context.depth > 1);
}

/**
 * Apply field vs value strategy for object properties
 */
function applyFieldValueStrategy(
  node: XNode, 
  originalValue: JsonValue, 
  context: JsonConversionContext
): XNode {
  const jsonConfig = context.config;
  
  // Only applies to VALUE nodes that are object properties
  if (node.type !== XNodeType.VALUE) {
    return node;
  }
  
  switch (jsonConfig.fieldVsValue) {
    case 'field':
      // Always convert VALUE to FIELD for object properties
      node.type = XNodeType.FIELD;
      break;
      
    case 'value':
      // Keep as VALUE
      break;
      
    case 'auto':
      // Convert to FIELD if the value is a simple primitive in an object
      if (typeof originalValue !== 'object') {
        node.type = XNodeType.FIELD;
      }
      break;
  }
  
  return node;
}

/**
 * Filter out empty values based on configuration
 */
function filterEmptyValues(node: XNode, config: JsonSourceConfiguration): XNode | null {
  if (config.emptyValueHandling === 'remove') {
    // Remove nodes with null values
    if (node.value === null || node.value === undefined) {
      return null;
    }
    
    // Recursively filter children
    if (node.children) {
      const filteredChildren = node.children
        .map(child => filterEmptyValues(child, config))
        .filter(child => child !== null) as XNode[];
      
      node.children = filteredChildren;
      
      // If container node has no children after filtering, consider removing it
      if (filteredChildren.length === 0 && 
          (node.type === XNodeType.COLLECTION || node.type === XNodeType.RECORD)) {
        return null;
      }
    }
  }
  
  return node;
}

/**
 * Validate JSON structure for semantic conversion
 */
function validateJsonForSemantic(json: JsonValue): void {
  if (json === undefined) {
    throw new ValidationError("JSON value cannot be undefined");
  }
  
  // Check for circular references in objects
  if (typeof json === 'object' && json !== null) {
    const seen = new WeakSet();
    
    function checkCircular(obj: any): void {
      if (typeof obj === 'object' && obj !== null) {
        if (seen.has(obj)) {
          throw new ValidationError("JSON contains circular references");
        }
        seen.add(obj);
        
        if (Array.isArray(obj)) {
          obj.forEach(item => checkCircular(item));
        } else {
          Object.values(obj).forEach(value => checkCircular(value));
        }
        
        seen.delete(obj);
      }
    }
    
    checkCircular(json);
  }
}

/**
 * Get semantic type for JSON value (utility for debugging)
 */
export function getSemanticTypeForJsonValue(value: JsonValue): XNodeType {
  if (value === null) {
    return XNodeType.VALUE;
  }
  
  if (Array.isArray(value)) {
    return XNodeType.COLLECTION;
  }
  
  if (typeof value === 'object') {
    return XNodeType.RECORD;
  }
  
  return XNodeType.VALUE;
}