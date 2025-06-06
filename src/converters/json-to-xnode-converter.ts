/**
 * JSON to Semantic XNode converter - Natural mapping to semantic types
 * Replaces artificial DOM mapping with direct semantic type mapping
 */
import { LoggerFactory } from "../core/logger";
const logger = LoggerFactory.create();

import { ProcessingError, ValidationError } from "../core/error";
import { 
  XNode, 
  XNodeType,
  createCollection,
  createRecord, 
  createField,
  createValue,
  addChild
} from "../core/xnode";
import { ConfigurationHelper } from "../core/config";
import { UnifiedConverter } from "../core/pipeline";
import { PipelineContext } from "../core/context";

/**
 * Context for JSON to Semantic XNode conversion
 */
interface JsonConversionContext {
  config: ConfigurationHelper;
  parentPropertyName?: string;
  depth: number;
}

/**
 * JSON value types for conversion
 */
type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
interface JsonObject { [key: string]: JsonValue }
type JsonArray = JsonValue[];

/**
 * JSON to Semantic XNode converter using natural type mapping
 */
export const jsonToXNodeConverter: UnifiedConverter<JsonValue, XNode> = {
  name: 'jsonToSemanticXNode',
  inputType: 'JsonValue',
  outputType: 'XNode',
  
  validate(json: JsonValue, context: PipelineContext): void {
    context.validateInput(json !== undefined, "JSON source cannot be undefined");
  },
  
  execute(json: JsonValue, context: PipelineContext): XNode {
    logger.debug('Converting JSON to semantic XNode', {
      sourceType: Array.isArray(json) ? 'array' : typeof json
    });
    
    try {
      // Create conversion context with configuration helper
      const conversionContext: JsonConversionContext = {
        config: new ConfigurationHelper(context.config.get()),
        depth: 0
      };
      
      // Convert JSON value to semantic XNode using natural mapping
      const result = convertJsonValueToSemantic("root", json, conversionContext);
      
      // Register result for tracking
      context.resources.registerXNode(result);
      
      logger.debug('Successfully converted JSON to semantic XNode', {
        rootNodeName: result.name,
        rootNodeType: result.type
      });
      
      return result;
      
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
  const jsonConfig = context.config.getJsonConfig();
  
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
 * Convert JSON array to COLLECTION node (natural mapping)
 */
function convertJsonArrayToCollection(
  name: string, 
  array: JsonArray, 
  context: JsonConversionContext
): XNode {
  const collection = createCollection(name);
  
  // Get item name for array elements
  const itemName = context.config.getJsonArrayItemName(context.parentPropertyName || name);
  
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
 * Convert JSON object to RECORD node (natural mapping)
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
  const jsonConfig = context.config.getJsonConfig();
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
  const jsonConfig = context.config.getJsonConfig();
  
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
export function filterEmptyValues(node: XNode, config: ConfigurationHelper): XNode | null {
  const jsonConfig = config.getJsonConfig();
  
  if (jsonConfig.emptyValueHandling === 'remove') {
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
export function validateJsonForSemantic(json: JsonValue): void {
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