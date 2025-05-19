/**
 * XJX JSON to XNode converter implementation
 */
import { Configuration } from '../core/config';
import { NodeType } from '../core/dom';
import { logger, ProcessingError } from '../core/error';
import { XNode, createElement, createTextNode, createCDATANode, createCommentNode, createProcessingInstructionNode, addChild } from '../core/xnode';
import { validateInput, Converter, createConverter } from '../core/converter';

// Context for JSON to XNode conversion
interface JsonToXNodeContext {
  namespaceMap: Record<string, string>;
  parentNode?: XNode;
}

/**
 * Create an XJX JSON to XNode converter
 * @param config Configuration for the converter
 * @returns Converter implementation
 */
export function createXjxJsonToXNodeConverter(config: Configuration): Converter<Record<string, any>, XNode> {
  return createConverter(config, (json: Record<string, any>, config: Configuration) => {
    // Validate input
    validateInput(json, "JSON source must be a valid object", 
                 input => input !== null && typeof input === 'object' && !Array.isArray(input));
    
    // Validate JSON structure
    validateJsonObject(json);
    
    try {
      logger.debug('Starting XJX JSON to XNode conversion', {
        jsonKeys: Object.keys(json)
      });
      
      // Create context with empty namespace map
      const context: JsonToXNodeContext = {
        namespaceMap: {},
        parentNode: undefined
      };
      
      // Convert JSON to XNode
      return convertJsonToXNode(json, config, context);
    } catch (err) {
      throw new ProcessingError(`Failed to convert XJX JSON to XNode: ${err instanceof Error ? err.message : String(err)}`);
    }
  });
}

/**
 * Validate JSON object structure
 * @param jsonObj JSON object to validate
 * @throws Error if validation fails
 */
function validateJsonObject(jsonObj: Record<string, any>): void {
  // Check for valid JSON object structure
  if (!jsonObj || typeof jsonObj !== 'object' || Array.isArray(jsonObj)) {
    throw new ProcessingError('Invalid JSON object: must be a non-array object', jsonObj);
  }
  
  if (Object.keys(jsonObj).length !== 1) {
    throw new ProcessingError('Invalid JSON object: must have exactly one root element', jsonObj);
  }
}

/**
 * Convert JSON object to XNode
 * @param jsonObj JSON object
 * @param config Configuration
 * @param context Conversion context
 * @returns XNode representation
 */
function convertJsonToXNode(
  jsonObj: Record<string, any>,
  config: Configuration,
  context: JsonToXNodeContext
): XNode {
  // Get the node name (first key in the object)
  const nodeName = Object.keys(jsonObj)[0];
  if (!nodeName) {
    throw new ProcessingError("Empty JSON object", jsonObj);
  }

  const nodeData = jsonObj[nodeName];
  const namingConfig = config.converters.xjxJson.naming;

  // Create base XNode
  const xnode = createElement(nodeName);
  xnode.parent = context.parentNode;

  // Process namespace and prefix - only if preserving namespaces
  if (config.preserveNamespaces) {
    if (nodeData[namingConfig.namespace]) {
      xnode.namespace = nodeData[namingConfig.namespace];
    }

    if (nodeData[namingConfig.prefix]) {
      xnode.prefix = nodeData[namingConfig.prefix];
    }
  }

  // Process value - only if preserving text nodes
  if (config.preserveTextNodes && nodeData[namingConfig.value] !== undefined) {
    xnode.value = nodeData[namingConfig.value];
  }

  // Process attributes and namespace declarations
  if ((config.preserveAttributes || config.preserveNamespaces) && 
      nodeData[namingConfig.attribute] && 
      Array.isArray(nodeData[namingConfig.attribute])) {
    
    processAttributes(
      xnode, 
      nodeData[namingConfig.attribute], 
      namingConfig, 
      config, 
      context
    );
  }

  // Process children
  if (nodeData[namingConfig.children] && Array.isArray(nodeData[namingConfig.children])) {
    processChildren(
      nodeData[namingConfig.children], 
      namingConfig,
      config, 
      xnode,
      context
    );
  }

  return xnode;
}

/**
 * Process attributes and namespace declarations
 * @param xnode Target XNode
 * @param attributes Attributes array from JSON 
 * @param namingConfig Naming configuration
 * @param config Main configuration
 * @param context Conversion context
 */
function processAttributes(
  xnode: XNode,
  attributes: any[],
  namingConfig: any,
  config: Configuration,
  context: JsonToXNodeContext
): void {
  const hasAttributes = config.preserveAttributes;
  const hasNamespaceDecls = config.preserveNamespaces && 
                           hasNamespaceDeclarations(attributes);
  
  // Only create attributes object if needed
  if (hasAttributes || hasNamespaceDecls) {
    xnode.attributes = {};
  }
  
  if (hasNamespaceDecls) {
    const namespaceDecls: Record<string, string> = {};
    let hasNamespaces = false;

    // First process namespace declarations
    for (const attrObj of attributes) {
      const attrName = Object.keys(attrObj)[0];
      if (!attrName) continue;

      const attrData = attrObj[attrName];
      const attrValue = attrData[namingConfig.value];

      if (processNamespaceDeclaration(attrName, attrValue, namespaceDecls, context.namespaceMap)) {
        hasNamespaces = true;
      }
    }

    // Add namespace declarations if any were found
    if (hasNamespaces) {
      xnode.namespaceDeclarations = namespaceDecls;
    }
  }
  
  // Then process regular attributes if preserving
  if (hasAttributes && xnode.attributes) {
    for (const attrObj of attributes) {
      const attrName = Object.keys(attrObj)[0];
      if (!attrName) continue;

      // Skip xmlns attributes (handled separately)
      if (attrName === "xmlns" || attrName.startsWith("xmlns:")) continue;

      const attrData = attrObj[attrName];
      xnode.attributes[attrName] = attrData[namingConfig.value];
    }
  }
}

/**
 * Check if attribute array contains namespace declarations
 * @param attributes Array of attributes
 * @returns True if namespace declarations exist
 */
function hasNamespaceDeclarations(attributes: any[]): boolean {
  if (!Array.isArray(attributes)) return false;
  
  for (const attrObj of attributes) {
    const attrName = Object.keys(attrObj)[0];
    if (!attrName) continue;
    
    if (attrName === "xmlns" || attrName.startsWith("xmlns:")) {
      return true;
    }
  }
  
  return false;
}

/**
 * Process namespace declaration
 * @param attrName Attribute name
 * @param attrValue Attribute value
 * @param namespaceDecls Namespace declarations map
 * @param globalNamespaceMap Global namespace map
 * @returns True if processed as namespace declaration
 */
function processNamespaceDeclaration(
  attrName: string,
  attrValue: any,
  namespaceDecls: Record<string, string>,
  globalNamespaceMap: Record<string, string>
): boolean {
  // Check if this is a namespace declaration
  if (attrName === "xmlns") {
    // Default namespace
    namespaceDecls[""] = attrValue;
    
    // Add to global namespace map
    globalNamespaceMap[""] = attrValue;
    return true;
  } else if (attrName.startsWith("xmlns:")) {
    // Prefixed namespace
    const prefix = attrName.substring(6);
    namespaceDecls[prefix] = attrValue;
    
    // Add to global namespace map
    globalNamespaceMap[prefix] = attrValue;
    return true;
  }
  
  return false;
}

/**
 * Process child nodes from JSON
 * @param children Children array from JSON
 * @param namingConfig Naming configuration
 * @param config Main configuration
 * @param parentNode Parent XNode
 * @param context Conversion context
 */
function processChildren(
  children: any[],
  namingConfig: any,
  config: Configuration,
  parentNode: XNode,
  context: JsonToXNodeContext
): void {
  for (const child of children) {
    // Process special node types
    if (processSpecialChild(child, namingConfig, config, parentNode, context)) {
      continue;
    }
    
    // Element node (recursively process)
    if (typeof child === 'object' && !Array.isArray(child)) {
      // Create child context with parent reference
      const childContext: JsonToXNodeContext = {
        namespaceMap: { ...context.namespaceMap },
        parentNode
      };
      
      const childNode = convertJsonToXNode(child, config, childContext);
      addChild(parentNode, childNode);
    }
  }
}

/**
 * Process special child node types (text, CDATA, comment, PI)
 * @param child Child data from JSON
 * @param namingConfig Naming configuration
 * @param config Configuration
 * @param parentNode Parent XNode
 * @param context Conversion context
 * @returns True if processed as special node
 */
function processSpecialChild(
  child: any, 
  namingConfig: any,
  config: Configuration,
  parentNode: XNode,
  context: JsonToXNodeContext
): boolean {
  // Text node - only if preserving text nodes
  if (child[namingConfig.value] !== undefined && config.preserveTextNodes) {
    const textNode = createTextNode(child[namingConfig.value]);
    addChild(parentNode, textNode);
    return true;
  }
  
  // CDATA section - only if preserving CDATA
  if (child[namingConfig.cdata] !== undefined && config.preserveCDATA) {
    const cdataNode = createCDATANode(child[namingConfig.cdata]);
    addChild(parentNode, cdataNode);
    return true;
  }
  
  // Comment - only if preserving comments
  if (child[namingConfig.comment] !== undefined && config.preserveComments) {
    const commentNode = createCommentNode(child[namingConfig.comment]);
    addChild(parentNode, commentNode);
    return true;
  }
  
  // Processing instruction - only if preserving PIs
  if (child[namingConfig.processingInstr] !== undefined && config.preserveProcessingInstr) {
    const piData = child[namingConfig.processingInstr];
    const target = piData[namingConfig.target];
    const value = piData[namingConfig.value] || "";
    
    if (target) {
      const piNode = createProcessingInstructionNode(target, value);
      addChild(parentNode, piNode);
    }
    return true;
  }
  
  return false;
}