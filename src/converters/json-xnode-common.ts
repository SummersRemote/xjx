/**
 * Shared utilities and types for JSON and XNode conversion
 */
import { Configuration, createJsonConfig } from '../core/config';
import { NodeType } from '../core/dom';
import { logger } from '../core/error';
import { XNode, createElement, addChild, createTextNode, createCDATANode, createCommentNode, createProcessingInstructionNode } from '../core/xnode';
import { JsonProcessingContext, JsonOptions, JsonValue, JsonObject, FormatDetectionResult } from '../core/converter';
import { detectJsonFormat } from '../core/json-utils';

/**
 * Create a JSON processing context
 * @param config Base configuration
 * @param options User-provided options
 * @returns Processing context with effective configuration
 */
export function createProcessingContext(
  config: Configuration,
  options?: JsonOptions
): JsonProcessingContext {
  // Create effective configuration by merging with options
  const effectiveConfig = createJsonConfig(config, options);
  
  // Create context
  return {
    config: effectiveConfig,
    namespaceMap: {},
    path: [],
    depth: 0
  };
}

/**
 * Create child context for traversing hierarchy
 * @param context Parent context
 * @param name Element name
 * @returns Child context
 */
export function createChildContext(
  context: JsonProcessingContext,
  name: string
): JsonProcessingContext {
  return {
    config: context.config,
    namespaceMap: { ...context.namespaceMap },
    parentNode: context.parentNode,
    path: [...context.path, name],
    depth: context.depth + 1
  };
}

/**
 * Detect JSON format with config
 * @param json JSON value to analyze
 * @param config Configuration
 * @returns Format detection results
 */
export function detectFormat(json: JsonValue, config: Configuration): FormatDetectionResult {
  return detectJsonFormat(json, config);
}

/**
 * Process namespace declarations from a JSON object
 * @param obj Source JSON object
 * @param node Target XNode
 * @param config Configuration
 * @param context Processing context
 */
export function processNamespaces(
  obj: JsonObject,
  node: XNode,
  config: Configuration,
  context: JsonProcessingContext
): void {
  // Skip if not preserving namespaces
  if (!config.preserveNamespaces) {
    return;
  }

  const hasNamespaceProperty = obj[config.properties.namespace] !== undefined;
  const hasNamespaceAttributes = hasNamespaceDeclarations(obj, config);
  
  // Skip if no namespaces
  if (!hasNamespaceProperty && !hasNamespaceAttributes) {
    return;
  }
  
  // Initialize namespaces if needed
  if (hasNamespaceAttributes) {
    processNamespaceAttributes(obj, node, config, context);
  }
  
  // Process namespace property
  if (hasNamespaceProperty) {
    processNamespaceProperty(obj, node, config);
  }
  
  // Process prefix property
  if (obj[config.properties.prefix] !== undefined) {
    node.prefix = String(obj[config.properties.prefix]);
  }
}

/**
 * Check if object has namespace declarations
 * @param obj JSON object
 * @param config Configuration
 * @returns True if has namespace declarations
 */
function hasNamespaceDeclarations(obj: JsonObject, config: Configuration): boolean {
  // Check attributes for namespace declarations based on strategy
  const { attributeStrategy, prefixes } = config;
  
  switch (attributeStrategy) {
    case 'property':
      // Check for _attrs.xmlns or _attrs.xmlns:*
      const attrsKey = config.properties.attribute;
      const attrs = obj[attrsKey];
      if (attrs && typeof attrs === 'object' && !Array.isArray(attrs)) {
        return Object.keys(attrs as JsonObject).some(key => 
          key === 'xmlns' || key.startsWith('xmlns:')
        );
      }
      break;
      
    case 'prefix':
      // Check for @xmlns or @xmlns:*
      const prefix = prefixes.attribute;
      return Object.keys(obj).some(key => 
        (key === `${prefix}xmlns`) || key.startsWith(`${prefix}xmlns:`)
      );
      
    case 'merge':
      // Check for xmlns or xmlns:* directly
      return Object.keys(obj).some(key => 
        key === 'xmlns' || key.startsWith('xmlns:')
      );
  }
  
  return false;
}

/**
 * Process namespace declarations from attributes
 * @param obj Source JSON object
 * @param node Target XNode
 * @param config Configuration
 * @param context Processing context
 */
function processNamespaceAttributes(
  obj: JsonObject,
  node: XNode,
  config: Configuration,
  context: JsonProcessingContext
): void {
  const { attributeStrategy, prefixes } = config;
  const nsDeclarations: Record<string, string> = {};
  let hasNamespaces = false;
  
  switch (attributeStrategy) {
    case 'property':
      // Extract from _attrs property
      const attrsKey = config.properties.attribute;
      const attrs = obj[attrsKey];
      if (attrs && typeof attrs === 'object' && !Array.isArray(attrs)) {
        Object.entries(attrs as JsonObject).forEach(([key, value]) => {
          if (key === 'xmlns' || key.startsWith('xmlns:')) {
            const prefix = key === 'xmlns' ? '' : key.substring(6);
            nsDeclarations[prefix] = String(value);
            
            // Update namespace map
            context.namespaceMap[prefix] = String(value);
            hasNamespaces = true;
          }
        });
      }
      break;
      
    case 'prefix':
      // Extract from prefixed properties (@xmlns, @xmlns:*)
      const attrPrefix = prefixes.attribute;
      Object.entries(obj).forEach(([key, value]) => {
        if (key === `${attrPrefix}xmlns` || key.startsWith(`${attrPrefix}xmlns:`)) {
          const prefix = key === `${attrPrefix}xmlns` ? '' : key.substring(attrPrefix.length + 6);
          nsDeclarations[prefix] = String(value);
          
          // Update namespace map
          context.namespaceMap[prefix] = String(value);
          hasNamespaces = true;
        }
      });
      break;
      
    case 'merge':
      // Extract directly from properties
      Object.entries(obj).forEach(([key, value]) => {
        if (key === 'xmlns' || key.startsWith('xmlns:')) {
          const prefix = key === 'xmlns' ? '' : key.substring(6);
          nsDeclarations[prefix] = String(value);
          
          // Update namespace map
          context.namespaceMap[prefix] = String(value);
          hasNamespaces = true;
        }
      });
      break;
  }
  
  // Add namespace declarations to node
  if (hasNamespaces) {
    node.namespaceDeclarations = nsDeclarations;
    node.isDefaultNamespace = nsDeclarations[''] !== undefined;
  }
}

/**
 * Process namespace from the namespace property
 * @param obj Source JSON object
 * @param node Target XNode
 * @param config Configuration
 */
function processNamespaceProperty(
  obj: JsonObject,
  node: XNode,
  config: Configuration
): void {
  // Get namespace from property
  const nsValue = obj[config.properties.namespace];
  if (nsValue !== undefined && nsValue !== null) {
    node.namespace = String(nsValue);
  }
}

/**
 * Process attributes from a JSON object
 * @param obj Source JSON object
 * @param node Target XNode
 * @param config Configuration
 */
export function processAttributes(
  obj: JsonObject,
  node: XNode,
  config: Configuration
): void {
  // Skip if not preserving attributes
  if (!config.preserveAttributes) {
    return;
  }
  
  const { attributeStrategy, prefixes } = config;
  
  // Initialize attributes object if needed
  if (!node.attributes) {
    node.attributes = {};
  }
  
  switch (attributeStrategy) {
    case 'property':
      // Get from dedicated property
      const attrsKey = config.properties.attribute;
      const attrs = obj[attrsKey];
      if (attrs && typeof attrs === 'object' && !Array.isArray(attrs)) {
        Object.entries(attrs as JsonObject).forEach(([key, value]) => {
          // Skip xmlns attributes (handled by namespace processing)
          if (key === 'xmlns' || key.startsWith('xmlns:')) {
            return;
          }
          node.attributes![key] = value;
        });
      }
      break;
      
    case 'prefix':
      // Get from prefixed properties
      const attrPrefix = prefixes.attribute;
      Object.entries(obj).forEach(([key, value]) => {
        if (key.startsWith(attrPrefix)) {
          // Skip xmlns attributes (handled by namespace processing)
          if (key === `${attrPrefix}xmlns` || key.startsWith(`${attrPrefix}xmlns:`)) {
            return;
          }
          const attrName = key.substring(attrPrefix.length);
          node.attributes![attrName] = value;
        }
      });
      break;
      
    case 'merge':
      // In the merge strategy, we need to filter out known property keys
      // and anything that looks like a nested object/array (which would be a child element)
      const reservedProps = getReservedPropertyNames(config);
      Object.entries(obj).forEach(([key, value]) => {
        // Skip known property names
        if (reservedProps.includes(key)) {
          return;
        }
        
        // Skip xmlns attributes (handled by namespace processing)
        if (key === 'xmlns' || key.startsWith('xmlns:')) {
          return;
        }
        
        // Skip nested objects/arrays (child elements)
        if (value !== null && typeof value === 'object') {
          return;
        }
        
        // Simple value = attribute
        node.attributes![key] = value;
      });
      break;
  }
}

/**
 * Get array of reserved property names from config
 * @param config Configuration
 * @returns Array of reserved property names
 */
function getReservedPropertyNames(config: Configuration): string[] {
  const { properties } = config;
  
  // Core property names
  return [
    properties.text,
    properties.attribute,
    properties.value,
    properties.namespace,
    properties.prefix,
    properties.cdata,
    properties.comment,
    properties.processingInstr,
    properties.target,
    properties.children
  ];
}

/**
 * Process text content from a JSON object
 * @param obj Source JSON object
 * @param node Target XNode
 * @param config Configuration
 * @returns True if text was processed
 */
export function processTextContent(
  obj: JsonObject,
  node: XNode,
  config: Configuration
): boolean {
  // Skip if not preserving text nodes
  if (!config.preserveTextNodes) {
    return false;
  }
  
  const { textStrategy, properties } = config;
  let textValue: any;
  
  // Get text based on strategy
  if (textStrategy === 'property') {
    // Get from dedicated property
    textValue = obj[properties.text];
  } else if (obj[properties.value] !== undefined) {
    // For the high-fidelity format, value property takes precedence
    textValue = obj[properties.value];
  } else if (typeof obj === 'object' && Object.keys(obj).length === 0) {
    // Empty object handling based on emptyElementStrategy
    switch (config.emptyElementStrategy) {
      case 'null':
        textValue = null;
        break;
      case 'string':
        textValue = '';
        break;
      case 'object':
      default:
        // Leave empty
        return false;
    }
  }
  
  // Set value if found
  if (textValue !== undefined) {
    node.value = textValue;
    return true;
  }
  
  return false;
}

/**
 * Sanitize an XML node name
 * @param name Name to sanitize
 * @returns Sanitized name
 */
export function sanitizeNodeName(name: string): string {
  // XML element names must start with a letter or underscore
  // and can only contain letters, digits, hyphens, underscores, and periods
  
  // Replace invalid start character
  let result = name.trim();
  if (!/^[a-zA-Z_]/.test(result)) {
    result = 'n_' + result;
  }
  
  // Replace invalid characters
  result = result.replace(/[^\w\-\.]/g, '_');
  
  return result || 'node'; // Default if empty after sanitization
}

/**
 * Create an element node from a name
 * @param name Element name
 * @returns XNode element
 */
export function createElementNode(name: string): XNode {
  return createElement(sanitizeNodeName(name));
}

/**
 * Process a special node type (text, CDATA, comment, PI)
 * @param obj Source JSON object
 * @param config Configuration
 * @returns XNode or null if not a special node
 */
export function processSpecialNode(
  obj: JsonObject,
  config: Configuration
): XNode | null {
  const { properties } = config;
  
  // Text node
  if (obj[properties.value] !== undefined && config.preserveTextNodes) {
    return createTextNode(String(obj[properties.value]));
  }
  
  // CDATA section
  if (obj[properties.cdata] !== undefined && config.preserveCDATA) {
    return createCDATANode(String(obj[properties.cdata]));
  }
  
  // Comment
  if (obj[properties.comment] !== undefined && config.preserveComments) {
    return createCommentNode(String(obj[properties.comment]));
  }
  
  // Processing instruction
  if (obj[properties.processingInstr] !== undefined && config.preserveProcessingInstr) {
    const piObj = obj[properties.processingInstr];
    if (piObj && typeof piObj === 'object' && !Array.isArray(piObj)) {
      const piData = piObj as JsonObject;
      const target = piData[properties.target];
      const value = piData[properties.value] || '';
      
      if (target) {
        return createProcessingInstructionNode(String(target), String(value));
      }
    }
  }
  
  return null;
}

/**
 * Get the item name for an array based on configuration
 * @param parentName Parent element name
 * @param config Configuration
 * @returns Item name
 */
export function getArrayItemName(parentName: string, config: Configuration): string {
  // Check custom item names first
  if (config.arrays.itemNames[parentName]) {
    return config.arrays.itemNames[parentName];
  }
  
  // Use default
  return config.arrays.defaultItemName;
}