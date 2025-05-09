/**
 * XNode to JSON converter implementation
 * 
 * Converts XNode to JSON object using the new static utilities.
 */
import { XNodeToJsonConverter } from './converter-interfaces';
import { Configuration } from '../core/types/config-types';
import {
  JSONValue,
  JSONObject,
  JSONArray,
  XMLJSONNode,
  XMLJSONElement,
} from "../core/types/json-types";
import { NodeType } from '../core/types/dom-types';
import { ErrorUtils } from '../core/utils/error-utils';
import { JsonUtils } from '../core/utils/json-utils';
import { XNode } from '../core/models/xnode';

/**
 * Converts XNode to JSON object
 */
export class DefaultXNodeToJsonConverter implements XNodeToJsonConverter {
  private config: Configuration;

  /**
   * Create a new converter
   * @param config Configuration
   */
  constructor(config: Configuration) {
    this.config = config;
  }

  /**
   * Convert XNode to JSON object
   * @param node XNode representation
   * @returns JSON object
   */
  public convert(node: XNode): Record<string, any> {
    return ErrorUtils.try(
      () => {
        // First perform the basic conversion
        let jsonResult = this.xnodeToJson(node);
        
        // Apply compact mode if configured
        if (this.config.outputOptions.compact) {
          const compactedJson = JsonUtils.compactJson(jsonResult);
          
          // If compaction returns undefined (completely empty), return an empty object
          if (compactedJson === undefined) {
            return {};
          }
          
          jsonResult = compactedJson as Record<string, any>;
        }
        
        return jsonResult;
      },
      'Failed to convert XNode to JSON',
      'xml-to-json'
    );
  }

  /**
   * Convert XNode to JSON object
   * @param node XNode to convert
   * @returns JSON object
   */
  private xnodeToJson(node: XNode): Record<string, any> {
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
            if (this.config.preserveCDATA) {
              children.push({ [this.config.propNames.cdata]: child.value });
            }
            break;

          case NodeType.COMMENT_NODE:
            if (this.config.preserveComments) {
              children.push({ [this.config.propNames.comments]: child.value });
            }
            break;

          case NodeType.PROCESSING_INSTRUCTION_NODE:
            if (this.config.preserveProcessingInstr) {
              children.push({
                [this.config.propNames.instruction]: {
                  [this.config.propNames.target]: child.attributes?.target,
                  [this.config.propNames.value]: child.value,
                },
              });
            }
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

    result[node.name] = nodeObj;
    return result;
  }
}