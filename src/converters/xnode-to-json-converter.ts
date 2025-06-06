/**
 * Semantic XNode to JSON converter - Direct configuration property access
 * ConfigurationHelper removed for simplicity and consistency
 */
import { LoggerFactory } from "../core/logger";
const logger = LoggerFactory.create();

import { ProcessingError } from "../core/error";
import { XNode, XNodeType, getTextContent } from "../core/xnode";
import { Configuration } from "../core/config";
import { UnifiedConverter } from "../core/pipeline";
import { PipelineContext } from "../core/context";

/**
 * JSON output types
 */
type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
interface JsonObject { [key: string]: JsonValue }
type JsonArray = JsonValue[];

/**
 * Context for semantic XNode to JSON conversion
 * Direct configuration access instead of ConfigurationHelper
 */
interface JsonOutputContext {
  config: Configuration;
  preserveSemanticInfo: boolean;
  depth: number;
}

/**
 * Semantic XNode to JSON converter using direct configuration property access
 */
export const xnodeToJsonConverter: UnifiedConverter<XNode, JsonValue> = {
  name: 'semanticXNodeToJson',
  inputType: 'XNode',
  outputType: 'JsonValue',
  
  validate(node: XNode, context: PipelineContext): void {
    context.validateInput(!!node, "XNode cannot be null or undefined");
    context.validateInput(typeof node.name === 'string', "XNode must have a valid name");
  },
  
  execute(node: XNode, context: PipelineContext): JsonValue {
    logger.debug('Converting semantic XNode to JSON', {
      nodeName: node.name,
      nodeType: node.type
    });
    
    try {
      // Create conversion context with direct configuration access
      const outputContext: JsonOutputContext = {
        config: context.config.get(),
        preserveSemanticInfo: false, // Standard JSON output
        depth: 0
      };
      
      // Convert using semantic type mapping
      const result = convertSemanticNodeToJson(node, outputContext);
      
      logger.debug('Successfully converted semantic XNode to JSON', {
        resultType: typeof result,
        isArray: Array.isArray(result)
      });
      
      return result;
      
    } catch (err) {
      throw new ProcessingError(`Failed to convert semantic XNode to JSON: ${err instanceof Error ? err.message : String(err)}`);
    }
  },
  
  onError(error: Error, node: XNode, context: PipelineContext): JsonValue | null {
    logger.error('Semantic XNode to JSON conversion failed', { error, nodeName: node?.name });
    return null;
  }
};

/**
 * Convert semantic XNode to JSON using type-aware logic
 */
function convertSemanticNodeToJson(node: XNode, context: JsonOutputContext): JsonValue {
  const childContext = { ...context, depth: context.depth + 1 };
  
  switch (node.type) {
    case XNodeType.COLLECTION:
      return convertCollectionToJsonArray(node, childContext);
      
    case XNodeType.RECORD:
      return convertRecordToJsonObject(node, childContext);
      
    case XNodeType.FIELD:
    case XNodeType.VALUE:
      return convertPrimitiveToJsonValue(node, childContext);
      
    case XNodeType.ATTRIBUTES:
      // Attributes return their value (handled by parent record), convert undefined to null
      return node.value !== undefined ? node.value : null;
      
    case XNodeType.COMMENT:
      // Comments can be preserved as special objects or ignored
      if (context.config.preserveComments) {
        return { "#comment": node.value !== undefined ? node.value : null };
      }
      return null;
      
    case XNodeType.INSTRUCTION:
      // Instructions as special objects
      if (context.config.preserveInstructions) {
        return { [`#${node.name}`]: node.value !== undefined ? node.value : null };
      }
      return null;
      
    case XNodeType.DATA:
      // Raw data (like CDATA) as special objects or direct values
      if (context.preserveSemanticInfo) {
        return { [`#${node.name}`]: node.value !== undefined ? node.value : null };
      }
      return node.value !== undefined ? node.value : null;
      
    default:
      logger.warn('Unknown semantic node type in JSON conversion', {
        nodeType: node.type,
        nodeName: node.name
      });
      return node.value !== undefined ? node.value : null;
  }
}

/**
 * Convert COLLECTION node to JSON array
 */
function convertCollectionToJsonArray(node: XNode, context: JsonOutputContext): JsonArray {
  if (!node.children || node.children.length === 0) {
    return [];
  }
  
  // Convert each child item
  const array: JsonArray = [];
  
  for (const child of node.children) {
    const childValue = convertSemanticNodeToJson(child, context);
    
    // Skip null values if configured
    if (childValue !== null || context.config.json.emptyValueHandling !== 'remove') {
      array.push(childValue);
    }
  }
  
  logger.debug('Converted collection to JSON array', {
    collectionName: node.name,
    itemCount: array.length
  });
  
  return array;
}

/**
 * Convert primitive node (FIELD/VALUE) to JSON value
 */
function convertPrimitiveToJsonValue(node: XNode, context: JsonOutputContext): JsonValue {
  // If node has children, it's a complex field - convert to object
  if (node.children && node.children.length > 0) {
    return convertRecordToJsonObject(node, context);
  }
  
  // Return primitive value, converting undefined to null
  return node.value !== undefined ? node.value : null;
}

/**
 * Convert RECORD node to JSON object
 */
function convertRecordToJsonObject(node: XNode, context: JsonOutputContext): JsonValue {
  const obj: JsonObject = {};
  
  // Add attributes as properties if present
  if (node.attributes && node.attributes.length > 0) {
    addAttributesToJsonObject(obj, node.attributes, context);
  }
  
  // Add children as properties
  if (node.children && node.children.length > 0) {
    addChildrenToJsonObject(obj, node.children, context);
  }
  
  // If record has a direct value and no children, return the value
  if (node.value !== undefined && Object.keys(obj).length === 0) {
    return node.value;
  }
  
  // If record has both value and children, add value as special property
  if (node.value !== undefined && Object.keys(obj).length > 0) {
    obj['#value'] = node.value;
  }
  
  logger.debug('Converted record to JSON object', {
    recordName: node.name,
    propertyCount: Object.keys(obj).length
  });
  
  return obj;
}

/**
 * Add semantic attributes to JSON object
 */
function addAttributesToJsonObject(
  obj: JsonObject, 
  attributes: XNode[], 
  context: JsonOutputContext
): void {
  for (const attr of attributes) {
    if (attr.type === XNodeType.ATTRIBUTES) {
      // Add with @ prefix to distinguish from children
      const attrKey = `@${attr.name}`;
      obj[attrKey] = attr.value !== undefined ? attr.value : null;
      
      // Add namespace info if present and configured
      if (attr.ns && context.preserveSemanticInfo) {
        obj[`${attrKey}#ns`] = attr.ns;
      }
      
      if (attr.label && context.preserveSemanticInfo) {
        obj[`${attrKey}#label`] = attr.label;
      }
    }
  }
}

/**
 * Add child nodes to JSON object
 */
function addChildrenToJsonObject(
  obj: JsonObject, 
  children: XNode[], 
  context: JsonOutputContext
): void {
  // Group children by name to handle duplicates
  const childrenByName: Record<string, XNode[]> = {};
  
  for (const child of children) {
    if (!childrenByName[child.name]) {
      childrenByName[child.name] = [];
    }
    childrenByName[child.name].push(child);
  }
  
  // Process each group
  for (const [name, nodes] of Object.entries(childrenByName)) {
    if (nodes.length === 1) {
      // Single child - add directly
      const childValue = convertSemanticNodeToJson(nodes[0], context);
      
      if (childValue !== null || context.config.json.emptyValueHandling !== 'remove') {
        obj[name] = childValue;
      }
    } else {
      // Multiple children with same name - create array
      const arrayValues: JsonValue[] = [];
      
      for (const node of nodes) {
        const childValue = convertSemanticNodeToJson(node, context);
        
        if (childValue !== null || context.config.json.emptyValueHandling !== 'remove') {
          arrayValues.push(childValue);
        }
      }
      
      if (arrayValues.length > 0) {
        obj[name] = arrayValues;
      }
    }
  }
}

/**
 * High-fidelity semantic XNode to JSON converter (preserves semantic info)
 */
export const xnodeToJsonHiFiConverter: UnifiedConverter<XNode, JsonValue> = {
  name: 'semanticXNodeToJsonHiFi',
  inputType: 'XNode',
  outputType: 'JsonValue',
  
  validate(node: XNode, context: PipelineContext): void {
    context.validateInput(!!node, "XNode cannot be null or undefined");
    context.validateInput(typeof node.name === 'string', "XNode must have a valid name");
  },
  
  execute(node: XNode, context: PipelineContext): JsonValue {
    logger.debug('Converting semantic XNode to high-fidelity JSON', {
      nodeName: node.name,
      nodeType: node.type
    });
    
    try {
      // Create high-fidelity conversion context with direct configuration access
      const outputContext: JsonOutputContext = {
        config: context.config.get(),
        preserveSemanticInfo: true, // High-fidelity mode
        depth: 0
      };
      
      // Convert with semantic info preservation
      const result = convertSemanticNodeToHiFiJson(node, outputContext);
      
      logger.debug('Successfully converted semantic XNode to high-fidelity JSON', {
        resultType: typeof result
      });
      
      return result;
      
    } catch (err) {
      throw new ProcessingError(`Failed to convert semantic XNode to high-fidelity JSON: ${err instanceof Error ? err.message : String(err)}`);
    }
  },
  
  onError(error: Error, node: XNode, context: PipelineContext): JsonValue | null {
    logger.error('Semantic XNode to high-fidelity JSON conversion failed', { error, nodeName: node?.name });
    return null;
  }
};

/**
 * Convert semantic XNode to high-fidelity JSON with semantic info preserved
 */
function convertSemanticNodeToHiFiJson(node: XNode, context: JsonOutputContext): JsonValue {
  const result: JsonObject = {};
  
  // Add semantic type information
  result['#type'] = node.type;
  result['#name'] = node.name;
  
  // Add semantic properties if present
  if (node.id !== undefined) {
    result['#id'] = node.id;
  }
  
  if (node.ns !== undefined) {
    result['#ns'] = node.ns;
  }
  
  if (node.label !== undefined) {
    result['#label'] = node.label;
  }
  
  // Add value if present (convert undefined to null for JSON compatibility)
  if (node.value !== undefined) {
    result['#value'] = node.value;
  }
  
  // Add attributes if present
  if (node.attributes && node.attributes.length > 0) {
    result['#attributes'] = node.attributes.map(attr => ({
      '#type': attr.type,
      '#name': attr.name,
      '#value': attr.value !== undefined ? attr.value : null,
      ...(attr.ns && { '#ns': attr.ns }),
      ...(attr.label && { '#label': attr.label })
    }));
  }
  
  // Add children if present
  if (node.children && node.children.length > 0) {
    result['#children'] = node.children.map(child => 
      convertSemanticNodeToHiFiJson(child, { ...context, depth: context.depth + 1 })
    );
  }
  
  return result;
}