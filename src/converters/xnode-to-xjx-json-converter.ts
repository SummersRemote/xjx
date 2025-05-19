/**
 * XNode to XJX JSON converter implementation
 */
import { Configuration } from '../core/config';
import { NodeType } from '../core/dom';
import { logger, ProcessingError } from '../core/error';
import * as jsonUtils from '../core/json-utils';
import { XNode } from '../core/xnode';
import { validateInput, Converter, createConverter } from '../core/converter';

/**
 * Create an XNode to XJX JSON converter
 * @param config Configuration for the converter
 * @returns Converter implementation
 */
export function createXNodeToXjxJsonConverter(config: Configuration): Converter<XNode, Record<string, any>> {
  return createConverter(config, (node: XNode, config: Configuration) => {
    // Validate input
    validateInput(node, "Node must be an XNode instance", 
                  input => input !== null && typeof input === 'object');
    
    try {
      logger.debug('Starting XNode to XJX JSON conversion', { 
        nodeName: node.name, 
        nodeType: node.type 
      });
      
      // Convert XNode to XJX JSON
      let jsonResult = convertXNodeToJson(node, config);
      
      // Apply compact mode if configured
      if (config.converters.xjxJson.options.compact) {
        const compactedJson = jsonUtils.compact(jsonResult);
        
        // If compaction returns undefined (completely empty), return an empty object
        if (compactedJson === undefined) {
          return {};
        }
        
        jsonResult = compactedJson as Record<string, any>;
      }
      
      logger.debug('Successfully converted XNode to XJX JSON', { 
        jsonKeys: Object.keys(jsonResult).length 
      });
      
      return jsonResult;
    } catch (err) {
      throw new ProcessingError(`Failed to convert XNode to XJX JSON: ${err instanceof Error ? err.message : String(err)}`);
    }
  });
}

/**
 * Convert XNode to XJX JSON object
 * @param node XNode to convert
 * @param config Configuration
 * @returns XJX JSON object
 */
function convertXNodeToJson(node: XNode, config: Configuration): Record<string, any> {
  const result: Record<string, any> = {};
  const nodeObj: Record<string, any> = {};
  
  const namingConfig = config.converters.xjxJson.naming;

  // Add namespace and prefix if present in the XNode
  if (node.namespace) {
    nodeObj[namingConfig.namespace] = node.namespace;
  }

  if (node.prefix) {
    nodeObj[namingConfig.prefix] = node.prefix;
  }

  // Add value if present in the XNode
  if (node.value !== undefined) {
    nodeObj[namingConfig.value] = node.value;
  }

  // Add attributes if present in the XNode
  if (node.attributes && Object.keys(node.attributes).length > 0) {
    const attrs = processAttributes(node, namingConfig);
    
    if (attrs.length > 0) {
      nodeObj[namingConfig.attribute] = attrs;
    }
  }

  // Add children if present in the XNode
  if (node.children && node.children.length > 0) {
    const children = processChildren(node.children, namingConfig, config);
    
    if (children.length > 0) {
      nodeObj[namingConfig.children] = children;
    }
  }

  result[node.name] = nodeObj;
  return result;
}

/**
 * Process attributes and namespace declarations
 * @param node XNode with attributes
 * @param namingConfig Naming configuration
 * @returns Array of attribute objects
 */
function processAttributes(
  node: XNode,
  namingConfig: any
): Array<Record<string, any>> {
  const attrs: Array<Record<string, any>> = [];

  // Add regular attributes
  for (const [name, value] of Object.entries(node.attributes || {})) {
    // Skip xmlns attributes, they'll be handled separately
    if (name === "xmlns" || name.startsWith("xmlns:")) continue;
    
    const attrObj: Record<string, any> = {
      [name]: { [namingConfig.value]: value },
    };
    attrs.push(attrObj);
  }

  // Add namespace declarations if present in the XNode
  if (node.namespaceDeclarations) {
    for (const [prefix, uri] of Object.entries(
      node.namespaceDeclarations
    )) {
      const attrName = prefix === "" ? "xmlns" : `xmlns:${prefix}`;
      const attrObj: Record<string, any> = {
        [attrName]: { [namingConfig.value]: uri },
      };
      attrs.push(attrObj);
    }
  }

  return attrs;
}

/**
 * Process child nodes
 * @param children XNode children array
 * @param namingConfig Naming configuration
 * @param config Main configuration
 * @returns Array of child JSON objects
 */
function processChildren(
  children: XNode[],
  namingConfig: any,
  config: Configuration
): Array<Record<string, any>> {
  const result: Array<Record<string, any>> = [];

  for (const child of children) {
    switch (child.type) {
      case NodeType.TEXT_NODE:
        result.push({ [namingConfig.value]: child.value });
        break;

      case NodeType.CDATA_SECTION_NODE:
        result.push({ [namingConfig.cdata]: child.value });
        break;

      case NodeType.COMMENT_NODE:
        result.push({ [namingConfig.comment]: child.value });
        break;

      case NodeType.PROCESSING_INSTRUCTION_NODE:
        result.push({
          [namingConfig.processingInstr]: {
            [namingConfig.target]: child.attributes?.target,
            [namingConfig.value]: child.value,
          },
        });
        break;

      case NodeType.ELEMENT_NODE:
        // Recursively convert element nodes
        result.push(convertXNodeToJson(child, config));
        break;
    }
  }

  return result;
}