/**
 * XNode to JSON converter implementation
 * 
 * Converts XNode to JSON object using the new static utilities.
 */
import { XNodeToJsonConverter } from './converter-interfaces';
import { Config, Configuration } from '../core/config';
import { NodeType } from '../core/dom';
import { logger, validate, SerializeError, handleError, ErrorType } from '../core/error';
import { JSON } from '../core/json';
import { XNode } from '../core/xnode';

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
    // Initialize properties first to satisfy TypeScript
    this.config = config;
    
    try {
      // Then validate and potentially update
      if (!Config.isValid(config)) {
        this.config = Config.createOrUpdate({}, config);
      }
    } catch (err) {
      // If validation/update fails, use default config
      this.config = Config.getDefault();
      handleError(err, "initialize XNode to JSON converter", {
        errorType: ErrorType.CONFIGURATION
      });
    }
  }

  /**
   * Convert XNode to JSON object
   * @param node XNode representation
   * @returns JSON object
   */
  public convert(node: XNode): Record<string, any> {
    try {
      // VALIDATION: Check for valid input
      validate(node instanceof XNode, "Node must be an XNode instance");
      
      logger.debug('Starting XNode to JSON conversion', { 
        nodeName: node.name, 
        nodeType: node.type 
      });
      
      // First perform the basic conversion
      let jsonResult = this.xnodeToJson(node);
      
      // Apply compact mode if configured
      if (this.config.outputOptions.compact) {
        const compactedJson = JSON.compact(jsonResult);
        
        // If compaction returns undefined (completely empty), return an empty object
        if (compactedJson === undefined) {
          return {};
        }
        
        jsonResult = compactedJson as Record<string, any>;
      }
      
      logger.debug('Successfully converted XNode to JSON', { 
        jsonKeys: Object.keys(jsonResult).length 
      });
      
      return jsonResult;
    } catch (err) {
      return handleError(err, 'convert XNode to JSON', {
        data: { 
          nodeName: node?.name,
          nodeType: node?.type
        },
        errorType: ErrorType.SERIALIZE,
        fallback: {} // Return empty object as fallback
      });
    }
  }

  /**
   * Convert XNode to JSON object
   * @param node XNode to convert
   * @returns JSON object
   */
  private xnodeToJson(node: XNode): Record<string, any> {
    try {
      // VALIDATION: Check for valid input
      validate(node instanceof XNode, "Node must be an XNode instance");
      
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
    } catch (err) {
      return handleError(err, 'convert XNode to JSON structure', {
        data: {
          nodeName: node?.name,
          nodeType: node?.type
        },
        errorType: ErrorType.SERIALIZE,
        fallback: { [node?.name || 'node']: {} } // Return minimal object as fallback
      });
    }
  }
}