/**
 * XNode to JSON converter implementation
 */
import { XNodeToJsonConverter } from './converter-interfaces';
import { Configuration, NodeModel } from '../types/transform-interfaces';
import {
  JSONValue,
  JSONObject,
  JSONArray,
  XMLJSONNode,
  XMLJSONElement,
} from "../types/json-types";
import { NodeType } from '../types/dom-types';
import { XJXError } from '../types/error-types';
import { JsonUtil } from '../utils/json-utils';

/**
 * Converts XNode to JSON object
 */
export class DefaultXNodeToJsonConverter implements XNodeToJsonConverter {
  private config: Configuration;
  private jsonUtil: JsonUtil;

  /**
   * Create a new converter
   * @param config Configuration
   */
  constructor(config: Configuration) {
    this.config = config;
    this.jsonUtil = new JsonUtil(config);
  }

  /**
   * Convert XNode to JSON object
   * @param node XNode representation
   * @returns JSON object
   */
  public convert(node: NodeModel): Record<string, any> {
    try {
      // First perform the basic conversion
      let jsonResult = this.xnodeToJson(node);
      
      // Apply compact mode if configured
      if (this.config.outputOptions.compact) {
        const compactedJson = this.jsonUtil.compactJson(jsonResult);
        
        // If compaction returns undefined (completely empty), return an empty object
        if (compactedJson === undefined) {
          return {};
        }
        
        jsonResult = compactedJson as Record<string, any>;
      }
      
      return jsonResult;
    } catch (error) {
      throw new XJXError(
        `Failed to convert XNode to JSON: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Convert XNode to JSON object
   * @param node XNode to convert
   * @returns JSON object
   */
  private xnodeToJson(node: NodeModel): Record<string, any> {
    const result: Record<string, any> = {};
    const nodeObj: Record<string, any> = {};

    // Add namespace and prefix if present
    if (node.namespace && this.config.preserveNamespaces) {
      nodeObj[this.config.propNames.namespace] = node.namespace;
    }

    if (node.prefix && this.config.preserveNamespaces) {
      nodeObj[this.config.propNames.prefix] = node.prefix;
    }

    // Add value if present
    if (node.value !== undefined && this.config.preserveTextNodes) {
      nodeObj[this.config.propNames.value] = node.value;
    }

    // Add attributes
    if (
      this.config.preserveAttributes &&
      node.attributes &&
      Object.keys(node.attributes).length > 0
    ) {
      const attrs: Array<Record<string, any>> = [];

      // Add regular attributes
      for (const [name, value] of Object.entries(node.attributes)) {
        const attrObj: Record<string, any> = {
          [name]: { [this.config.propNames.value]: value },
        };
        attrs.push(attrObj);
      }

      // Add namespace declarations
      if (node.namespaceDeclarations && this.config.preserveNamespaces) {
        for (const [prefix, uri] of Object.entries(
          node.namespaceDeclarations
        )) {
          const attrName = prefix === "" ? "xmlns" : `xmlns:${prefix}`;
          const attrObj: Record<string, any> = {
            [attrName]: { [this.config.propNames.value]: uri },
          };
          attrs.push(attrObj);
        }
      }

      if (attrs.length > 0) {
        nodeObj[this.config.propNames.attributes] = attrs;
      }
    }

    // Add children
    if (node.children && node.children.length > 0) {
      const children: Array<Record<string, any>> = [];

      for (const child of node.children) {
        switch (child.type) {
          case NodeType.TEXT_NODE:
            if (this.config.preserveTextNodes) {
              children.push({ [this.config.propNames.value]: child.value });
            }
            break;

          case NodeType.CDATA_SECTION_NODE:
            children.push({ [this.config.propNames.cdata]: child.value });
            break;

          case NodeType.COMMENT_NODE:
            children.push({ [this.config.propNames.comments]: child.value });
            break;

          case NodeType.PROCESSING_INSTRUCTION_NODE:
            children.push({
              [this.config.propNames.instruction]: {
                [this.config.propNames.target]: child.attributes?.target,
                [this.config.propNames.value]: child.value,
              },
            });
            break;

          case NodeType.ELEMENT_NODE:
            children.push(this.xnodeToJson(child));
            break;
        }
      }

      if (children.length > 0) {
        nodeObj[this.config.propNames.children] = children;
      }
    }

    // Remove the ineffective compaction code that was here
    // It will be handled in the convert method instead

    result[node.name] = nodeObj;
    return result;
  }
}