/**
 * XNode to JSON Standard converter implementation - Updated for new hook system
 */
import { LoggerFactory } from "../core/logger";
const logger = LoggerFactory.create();

import { Configuration } from '../core/config';
import { NodeType } from '../core/dom';
import { ProcessingError } from '../core/error';
import { XNode, getTextContent } from '../core/xnode';
import { 
  Converter,
  JsonValue, 
  JsonObject, 
  JsonArray,
  getElementName,
  getAttributeName
} from '../core/converter';
import {
  OutputHooks
} from "../core/hooks";
import { removeEmptyElements } from '../core/json-utils';

/**
 * XNode to JSON Standard converter
 */
export const xnodeToJsonConverter: Converter<XNode, JsonValue> = {
  convert(
    node: XNode, 
    config: Configuration
  ): JsonValue {
    logger.debug('Starting XNode to JSON conversion', {
      nodeName: node.name,
      nodeType: node.type
    });

    let result: JsonValue;

    // Handle non-element nodes
    if (node.type !== NodeType.ELEMENT_NODE) {
      result = processNonElementNode(node, config);
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
 * Convert XNode to JSON with output hooks - FIXED TIMING
 */
export function convertXNodeToJsonWithHooks(
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
      logger.warn(`Error in JSON output beforeTransform: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  
  // Convert to JSON
  let result = xnodeToJsonConverter.convert(processedXNode, config);
  
  // Apply afterTransform hook to final JSON
  if (hooks?.afterTransform) {
    try {
      const afterResult = hooks.afterTransform(result);
      if (afterResult !== undefined && afterResult !== null) {
        result = afterResult;
      }
    } catch (err) {
      logger.warn(`Error in JSON output afterTransform: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  
  return result;
}

/**
 * Process a non-element node
 */
function processNonElementNode(node: XNode, config: Configuration): JsonValue {
  switch (node.type) {
    case NodeType.TEXT_NODE:
      return config.preserveTextNodes ? node.value : null;
      
    case NodeType.CDATA_SECTION_NODE:
      return config.preserveCDATA ? node.value : null;
      
    case NodeType.COMMENT_NODE:
    case NodeType.PROCESSING_INSTRUCTION_NODE:
      // Typically not included in standard JSON
      return null;
      
    default:
      return null;
  }
}

/**
 * Process an element node
 */
function processElementNode(
  node: XNode, 
  config: Configuration
): JsonValue {
  const result: JsonObject = {};
  
  // Get the element name with prefix if configured
  const elementName = getElementName(node.name, node.prefix, config.preservePrefixedNames);
  
  // Process with either direct value or children
  if (hasOnlyTextContent(node)) {
    result[elementName] = processElementWithTextOnly(node, config);
  } else if (node.children && node.children.length > 0) {
    result[elementName] = processElementWithChildren(node, config);
  } else {
    // Empty element
    result[elementName] = processEmptyElement(node, config);
  }
  
  return result;
}

/**
 * Check if node has only text content
 */
function hasOnlyTextContent(node: XNode): boolean {
  // Check if node has a direct value
  if (node.value !== undefined) {
    return true;
  }
  
  // Check if node has only text children
  if (!node.children || node.children.length === 0) {
    return false;
  }
  
  return node.children.every(child => 
    child.type === NodeType.TEXT_NODE || child.type === NodeType.CDATA_SECTION_NODE
  );
}

/**
 * Process an element with only text content
 */
function processElementWithTextOnly(node: XNode, config: Configuration): JsonValue {
  // Get text content
  const text = node.value !== undefined ? node.value : getTextContent(node);
  
  // Get attributes
  const hasAttributes = node.attributes && Object.keys(node.attributes).length > 0 && config.preserveAttributes;
  
  // If no attributes and direct text strategy, return the text directly
  if (!hasAttributes && config.strategies.textStrategy === 'direct') {
    return text;
  }
  
  // Create object for element
  const result: JsonObject = {};
  
  // Add attributes based on strategy
  if (hasAttributes) {
    addAttributes(result, node, config);
  }
  
  // Add text content
  result[config.properties.value] = text;
  
  return result;
}

/**
 * Process an element with children
 */
function processElementWithChildren(
  node: XNode, 
  config: Configuration
): JsonObject {
  const result: JsonObject = {};
  
  // Add attributes if present and configured to preserve
  if (node.attributes && Object.keys(node.attributes).length > 0 && config.preserveAttributes) {
    addAttributes(result, node, config);
  }
  
  // Handle mixed content
  const textNodes = node.children?.filter(c => 
    c.type === NodeType.TEXT_NODE || c.type === NodeType.CDATA_SECTION_NODE
  ) || [];
  
  const elementNodes = node.children?.filter(c => c.type === NodeType.ELEMENT_NODE) || [];
  
  const hasMixedContent = textNodes.length > 0 && elementNodes.length > 0;
  
  // Process mixed content according to strategy
  if (hasMixedContent) {
    switch (config.strategies.mixedContentStrategy) {
      case 'preserve':
        // Add text nodes as a property
        if (textNodes.length > 0 && config.preserveTextNodes) {
          const combinedText = textNodes.map(t => t.value).join('');
          result[config.properties.value] = combinedText;
        }
        // Then add elements normally
        processChildElements(result, elementNodes, config);
        break;
        
      case 'merge':
        // Merge all text and element content into readable text
        if (config.preserveTextNodes) {
          const mergedText = extractAllTextContent(node.children || []);
          if (mergedText.trim()) {
            result[config.properties.value] = mergedText;
          }
        }
        break;
    }
  } else {
    // Not mixed content, process normally
    if (textNodes.length > 0 && config.preserveTextNodes) {
      const combinedText = textNodes.map(t => t.value).join('');
      result[config.properties.value] = combinedText;
    } else if (elementNodes.length > 0) {
      processChildElements(result, elementNodes, config);
    }
  }
  
  return result;
}

/**
 * Extract all text content from mixed nodes
 */
function extractAllTextContent(nodes: XNode[]): string {
  return nodes.map(node => {
    if (node.type === NodeType.TEXT_NODE || node.type === NodeType.CDATA_SECTION_NODE) {
      return node.value || '';
    } else if (node.type === NodeType.ELEMENT_NODE) {
      // For element nodes, get their direct value if present
      if (node.value !== undefined) {
        return String(node.value);
      }
      // Or recursively extract text from their children
      if (node.children && node.children.length > 0) {
        return extractAllTextContent(node.children);
      }
      return '';
    }
    return '';
  }).join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * Process an empty element
 */
function processEmptyElement(node: XNode, config: Configuration): JsonValue {
  // Handle attributes if present
  const hasAttributes = node.attributes && Object.keys(node.attributes).length > 0 && config.preserveAttributes;
  
  if (hasAttributes) {
    // If we have attributes, return an object with them
    const result: JsonObject = {};
    addAttributes(result, node, config);
    return result;
  }
  
  // No attributes, handle based on strategy
  switch (config.strategies.emptyElementStrategy) {
    case 'null':
      return null;
    case 'string':
      return '';
    case 'remove':
      // This will be handled by removeEmptyElements function
      return {};
    case 'object':
    default:
      return {};
  }
}

/**
 * Add attributes to a result object
 */
function addAttributes(result: JsonObject, node: XNode, config: Configuration): void {
  if (!node.attributes) return;
  
  const { properties, prefixes } = config;
  const { attributeStrategy } = config.strategies;

  switch (attributeStrategy) {
    case 'merge':
      // Add attributes directly to the element object
      Object.entries(node.attributes).forEach(([key, value]) => {
        const attrName = getAttributeName(key, config.preservePrefixedNames);
        result[attrName] = value;
      });
      break;
      
    case 'prefix':
      // Add attributes with a prefix
      const prefix = prefixes.attribute;
      Object.entries(node.attributes).forEach(([key, value]) => {
        const attrName = getAttributeName(key, config.preservePrefixedNames);
        result[prefix + attrName] = value;
      });
      break;
      
    case 'property':
      // Add attributes as a separate property
      const attrs: JsonObject = {};
      Object.entries(node.attributes).forEach(([key, value]) => {
        const attrName = getAttributeName(key, config.preservePrefixedNames);
        attrs[attrName] = value;
      });
      result[properties.attribute] = attrs;
      break;
  }
}

/**
 * Process child elements into a result object
 */
function processChildElements(
  result: JsonObject, 
  children: XNode[], 
  config: Configuration
): void {
  // Group children by element name
  const childrenByName: Record<string, XNode[]> = {};
  
  // Build the groupings - include prefix in the name if configured
  children.forEach(child => {
    const childName = getElementName(child.name, child.prefix, config.preservePrefixedNames);
      
    if (!childrenByName[childName]) {
      childrenByName[childName] = [];
    }
    childrenByName[childName].push(child);
  });
  
  // Process each group
  Object.entries(childrenByName).forEach(([name, nodes]) => {
    // Determine if this should be an array
    const forcedArray = config.arrays.forceArrays.includes(name);
    const multipleNodes = nodes.length > 1;
    const alwaysArray = config.strategies.arrayStrategy === 'always';
    const neverArray = config.strategies.arrayStrategy === 'never';
    
    const shouldBeArray = forcedArray || (multipleNodes && !neverArray) || alwaysArray;
    
    if (shouldBeArray) {
      // Create an array of values
      const values: JsonArray = nodes.map(node => {
        // Convert the node and extract its value
        const converted = xnodeToJsonConverter.convert(node, config) as JsonObject;
        const nodeName = getElementName(node.name, node.prefix, config.preservePrefixedNames);
        
        return converted[nodeName];
      });
      
      result[name] = values;
    } else {
      // Just use the last node (or only node)
      const node = nodes[nodes.length - 1];
      
      const converted = xnodeToJsonConverter.convert(node, config) as JsonObject;
      const nodeName = getElementName(node.name, node.prefix, config.preservePrefixedNames);
      
      result[name] = converted[nodeName];
    }
  });
}