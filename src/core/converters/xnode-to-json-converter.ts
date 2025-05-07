/**
 * XNode to JSON converter implementation
 */
import { XNodeToJsonConverter } from './converter-interfaces';
import { Configuration, XNode } from '../types/transform-interfaces';
import { NodeType } from '../types/dom-types';
import { XJXError } from '../types/error-types';

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
    try {
      return this.xnodeToJson(node);
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

    // Clean empty properties in compact mode
    if (this.config.outputOptions.compact) {
      Object.keys(nodeObj).forEach((key) => {
        const value = nodeObj[key];
        if (
          value === undefined ||
          value === null ||
          (Array.isArray(value) && value.length === 0) ||
          (typeof value === "object" && Object.keys(value).length === 0)
        ) {
          delete nodeObj[key];
        }
      });
    }

    result[node.name] = nodeObj;
    return result;
  }
}