/**
 * XJX JSON to XNode converter implementation with hybrid OO-functional approach
 * 
 * Converts XJX-formatted JSON objects to XNode representation.
 */
import { XjxJsonToXNodeConverter } from './converter-interfaces';
import { BaseConverter } from '../core/converter';
import { NodeType } from '../core/dom';
import { logger, ParseError, handleError, ErrorType } from '../core/error';
import { JSON } from '../core/json';
import { XNode } from '../core/xnode';

/**
 * Converts XJX-formatted JSON objects to XNode representation
 */
export class DefaultXjxJsonToXNodeConverter extends BaseConverter<Record<string, any>, XNode> implements XjxJsonToXNodeConverter {
  /**
   * Convert XJX-formatted JSON object to XNode
   * @param json JSON object
   * @returns XNode representation
   */
  public convert(json: Record<string, any>): XNode {
    try {
      // Validate input
      this.validateInput(json, "JSON source must be a valid object", 
                         input => JSON.isValidObject(input));
      
      logger.debug('Starting XJX JSON to XNode conversion', {
        jsonKeys: Object.keys(json)
      });
      
      // Validate JSON structure
      validateJsonObject(json);
      
      // Create context with required fields for the functional core
      const conversionContext: JsonToXNodeContext = {
        namespaceMap: {},
        parentNode: undefined
      };
      
      // Use pure functional core
      return convertJsonToXNode(json, this.config, conversionContext);
    } catch (err) {
      return handleError(err, 'convert XJX JSON to XNode', {
        data: { jsonKeys: Object.keys(json || {}) },
        errorType: ErrorType.PARSE
      });
    }
  }
}

// ===== PURE FUNCTIONAL CORE =====

/**
 * Context interface for JSON to XNode conversion
 */
interface JsonToXNodeContext {
  namespaceMap: Record<string, string>;
  parentNode?: XNode;
}

/**
 * Validate JSON object structure - pure function
 * @param jsonObj JSON object to validate
 * @throws Error if validation fails
 */
export function validateJsonObject(jsonObj: Record<string, any>): void {
  // Check for valid JSON object structure
  if (!JSON.isValidObject(jsonObj)) {
    throw new ParseError('Invalid JSON object: must be a non-array object', jsonObj);
  }
  
  if (Object.keys(jsonObj).length !== 1) {
    throw new ParseError('Invalid JSON object: must have exactly one root element', jsonObj);
  }
}

/**
 * Convert JSON object to XNode - pure function
 * @param jsonObj JSON object
 * @param config Configuration
 * @param context Conversion context
 * @returns XNode representation
 */
export function convertJsonToXNode(
  jsonObj: Record<string, any>,
  config: any,
  context: JsonToXNodeContext
): XNode {
  // Get the node name (first key in the object)
  const nodeName = Object.keys(jsonObj)[0];
  if (!nodeName) {
    throw new ParseError("Empty JSON object", jsonObj);
  }

  const nodeData = jsonObj[nodeName];
  const namingConfig = config.converters.xjxJson.naming;

  // Create base XNode
  const xnode = new XNode(nodeName, NodeType.ELEMENT_NODE);
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
    const children = processChildren(
      nodeData[namingConfig.children], 
      namingConfig,
      config, 
      xnode,
      context
    );
    
    if (children.length > 0) {
      xnode.children = children;
    }
  }

  return xnode;
}

/**
 * Process attributes and namespace declarations - pure function
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
  config: any,
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
 * Check if attribute array contains namespace declarations - pure function
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
 * Process namespace declaration - pure function
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
 * Process child nodes from JSON - pure function
 * @param children Children array from JSON
 * @param namingConfig Naming configuration
 * @param config Main configuration
 * @param parentNode Parent XNode
 * @param context Conversion context
 * @returns Array of XNode children
 */
function processChildren(
  children: any[],
  namingConfig: any,
  config: any,
  parentNode: XNode,
  context: JsonToXNodeContext
): XNode[] {
  const result: XNode[] = [];
  
  for (const child of children) {
    // Process special node types
    if (processSpecialChild(child, namingConfig, config, parentNode, result)) {
      continue;
    }
    
    // Element node (recursively process)
    if (JSON.isValidObject(child) && !Array.isArray(child)) {
      // Create child context with parent reference
      const childContext: JsonToXNodeContext = {
        namespaceMap: { ...context.namespaceMap },
        parentNode
      };
      
      result.push(convertJsonToXNode(child, config, childContext));
    }
  }
  
  return result;
}

/**
 * Process special child node types (text, CDATA, comment, PI) - pure function
 * @param child Child data from JSON
 * @param namingConfig Naming configuration
 * @param config Main configuration
 * @param parentNode Parent XNode
 * @param result Output children array
 * @returns True if processed as special node
 */
function processSpecialChild(
  child: any, 
  namingConfig: any,
  config: any,
  parentNode: XNode,
  result: XNode[]
): boolean {
  // Text node - only if preserving text nodes
  if (child[namingConfig.value] !== undefined && config.preserveTextNodes) {
    const textNode = XNode.createTextNode(child[namingConfig.value]);
    textNode.parent = parentNode;
    result.push(textNode);
    return true;
  }
  
  // CDATA section - only if preserving CDATA
  if (child[namingConfig.cdata] !== undefined && config.preserveCDATA) {
    const cdataNode = XNode.createCDATANode(child[namingConfig.cdata]);
    cdataNode.parent = parentNode;
    result.push(cdataNode);
    return true;
  }
  
  // Comment - only if preserving comments
  if (child[namingConfig.comment] !== undefined && config.preserveComments) {
    const commentNode = XNode.createCommentNode(child[namingConfig.comment]);
    commentNode.parent = parentNode;
    result.push(commentNode);
    return true;
  }
  
  // Processing instruction - only if preserving PIs
  if (child[namingConfig.processingInstr] !== undefined && config.preserveProcessingInstr) {
    const piData = child[namingConfig.processingInstr];
    const target = piData[namingConfig.target];
    const value = piData[namingConfig.value] || "";
    
    if (target) {
      const piNode = XNode.createProcessingInstructionNode(target, value);
      piNode.parent = parentNode;
      result.push(piNode);
    }
    return true;
  }
  
  return false;
}