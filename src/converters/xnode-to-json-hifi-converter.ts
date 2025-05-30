/**
 * XNode to JSON HiFi converter implementation - Updated for new hook system
 */
import { LoggerFactory } from "../core/logger";
const logger = LoggerFactory.create();

import { Configuration } from '../core/config';
import { NodeType } from '../core/dom';
import { ProcessingError } from '../core/error';
import { XNode } from '../core/xnode';
import { 
  Converter, 
  OutputHooks,
  JsonValue, 
  JsonObject, 
  JsonArray,
  getElementName
} from '../core/converter';
import { removeEmptyElements } from '../core/json-utils';

/**
 * XNode to JSON HiFi converter
 */
export const xnodeToJsonHiFiConverter: Converter<XNode, JsonValue> = {
  convert(
    node: XNode, 
    config: Configuration
  ): JsonValue {
    logger.debug('Starting XNode to JSON HiFi conversion', {
      nodeName: node.name,
      nodeType: node.type
    });

    let result: JsonValue;

    // Process based on node type
    if (node.type !== NodeType.ELEMENT_NODE) {
      // Handle non-element nodes
      result = processSpecialNode(node, config);
    } else {
      // Process element node
      result = processElementNode(node, config);
    }

    // Apply remove empty elements strategy if configured
    if (config.strategies.emptyElementStrategy === 'remove') {
      const processedResult = removeEmptyElements(result, config);
      return processedResult === undefined ? {} : processedResult;
    }

    return result;
  }
};

/**
 * Convert XNode to JSON HiFi with output hooks - FIXED TIMING
 */
export function convertXNodeToJsonHiFiWithHooks(
  node: XNode,
  config: Configuration,
  hooks?: OutputHooks<JsonValue>
): JsonValue {
  let processedXNode = node;
  
  // Apply beforeTransform hook to XNode
  if (hooks?.beforeTransform) {
    try {
      const beforeResult = hooks.beforeTransform(processedXNode);
      if (beforeResult && typeof beforeResult === 'object' && typeof beforeResult.name === 'string') {
        processedXNode = beforeResult;
      }
    } catch (err) {
      logger.warn(`Error in JSON HiFi output beforeTransform: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  
  // Convert to JSON HiFi
  let result = xnodeToJsonHiFiConverter.convert(processedXNode, config);
  
  // Apply afterTransform hook to final JSON
  if (hooks?.afterTransform) {
    try {
      const afterResult = hooks.afterTransform(result);
      if (afterResult !== undefined && afterResult !== null) {
        result = afterResult;
      }
    } catch (err) {
      logger.warn(`Error in JSON HiFi output afterTransform: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  
  return result;
}

/**
 * Process special node types (text, CDATA, comment, PI)
 */
function processSpecialNode(node: XNode, config: Configuration): JsonValue {
  const { properties } = config;
  
  switch (node.type) {
    case NodeType.TEXT_NODE:
      if (config.preserveTextNodes) {
        return { [properties.value]: node.value };
      }
      break;
      
    case NodeType.CDATA_SECTION_NODE:
      if (config.preserveCDATA) {
        return { [properties.cdata]: node.value };
      }
      break;
      
    case NodeType.COMMENT_NODE:
      if (config.preserveComments) {
        return { [properties.comment]: node.value };
      }
      break;
      
    case NodeType.PROCESSING_INSTRUCTION_NODE:
      if (config.preserveProcessingInstr && node.attributes?.target) {
        const piObj: JsonObject = {
          [properties.target]: node.attributes.target
        };
        
        if (node.value !== undefined) {
          piObj[properties.value] = node.value;
        }
        
        return { [properties.processingInstr]: piObj };
      }
      break;
  }
  
  // Default for unknown or filtered node types
  return null;
}

/**
 * Process element node
 */
function processElementNode(
  node: XNode, 
  config: Configuration
): JsonValue {
  const result: JsonObject = {};
  const nodeObj: JsonObject = {};
  const { properties } = config;
  
  // Add namespace and prefix if present
  if (node.namespace && config.preserveNamespaces) {
    nodeObj[properties.namespace] = node.namespace;
  }

  if (node.prefix && config.preserveNamespaces) {
    nodeObj[properties.prefix] = node.prefix;
  }

  // Process attributes
  if (node.attributes && Object.keys(node.attributes).length > 0 && config.preserveAttributes) {
    nodeObj[properties.attribute] = processAttributes(node, config);
  }

  // Process namespace declarations
  if (node.namespaceDeclarations && Object.keys(node.namespaceDeclarations).length > 0 && 
      config.preserveNamespaces) {
    nodeObj.namespaceDeclarations = { ...node.namespaceDeclarations };
    
    // Flag if this is a default namespace
    if (node.isDefaultNamespace) {
      nodeObj.isDefaultNamespace = true;
    }
  }

  // Process value or children
  if (node.value !== undefined && config.preserveTextNodes) {
    nodeObj[properties.value] = node.value;
  } else if (node.children && node.children.length > 0) {
    // Process children
    const children = processChildren(node.children, config);
    if (children.length > 0) {
      nodeObj[properties.children] = children;
    }
  }
  
  // Add metadata if present
  if (node.metadata && Object.keys(node.metadata).length > 0) {
    nodeObj.metadata = { ...node.metadata };
  }
  
  // Create root object with node name - handle prefixed names if configured
  const elementName = getElementName(node.name, node.prefix, config.preservePrefixedNames);
  
  result[elementName] = nodeObj;
  
  return result;
}

/**
 * Process attributes
 */
function processAttributes(node: XNode, config: Configuration): JsonArray {
  const attrs: JsonArray = [];
  const { properties } = config;

  // Process regular attributes
  for (const [name, value] of Object.entries(node.attributes || {})) {
    // Skip xmlns attributes if not preserving namespaces or if handled elsewhere
    if (name === "xmlns" || name.startsWith("xmlns:")) {
      continue; // Namespace declarations are handled separately
    }
    
    // Create attribute object
    const attrObj: JsonObject = {};
    
    let finalAttrName = name;
    
    // Handle attributes with namespaces/prefixes
    if (name.includes(':') && config.preserveNamespaces) {
      const [prefix, localName] = name.split(':');
      
      // Determine the attribute name to use based on preservePrefixedNames
      finalAttrName = config.preservePrefixedNames ? name : localName;
      
      // Find namespace URI for this prefix if available
      let namespaceURI = null;
      if (node.namespaceDeclarations) {
        namespaceURI = node.namespaceDeclarations[prefix];
      }
      
      // Create attribute with namespace info
      const attrValue: JsonObject = { 
        [properties.value]: value,
        [properties.prefix]: prefix
      };
      
      // Add namespace URI if available
      if (namespaceURI) {
        attrValue[properties.namespace] = namespaceURI;
      }
      
      attrObj[finalAttrName] = attrValue;
    } else {
      // Regular attribute or prefixed attribute without namespace preservation
      if (name.includes(':') && !config.preservePrefixedNames) {
        // Strip prefix if preservePrefixedNames is false
        const parts = name.split(':');
        finalAttrName = parts[parts.length - 1];
      }
      
      attrObj[finalAttrName] = { [properties.value]: value };
    }
    
    attrs.push(attrObj);
  }

  return attrs;
}

/**
 * Process child nodes
 */
function processChildren(
  children: XNode[], 
  config: Configuration
): JsonArray {
  const result: JsonArray = [];
  
  // Process each child in order to preserve mixed content
  for (const child of children) {
    const processedChild = processChild(child, config);
    if (processedChild !== null) {
      result.push(processedChild);
    }
  }
  
  return result;
}

/**
 * Process individual child node
 */
function processChild(
  child: XNode, 
  config: Configuration
): JsonValue {
  let result: JsonValue = null;

  switch (child.type) {
    case NodeType.TEXT_NODE:
      if (config.preserveTextNodes) {
        result = processSpecialNode(child, config);
      }
      break;
      
    case NodeType.CDATA_SECTION_NODE:
      if (config.preserveCDATA) {
        result = processSpecialNode(child, config);
      }
      break;
      
    case NodeType.COMMENT_NODE:
      if (config.preserveComments) {
        result = processSpecialNode(child, config);
      }
      break;
      
    case NodeType.PROCESSING_INSTRUCTION_NODE:
      if (config.preserveProcessingInstr) {
        result = processSpecialNode(child, config);
      }
      break;
      
    case NodeType.ELEMENT_NODE:
      // Recursively process element nodes
      result = processElementNode(child, config);
      break;
  }

  return result;
}