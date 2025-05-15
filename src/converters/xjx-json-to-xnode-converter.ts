/**
 * JSON to XNode converter implementation
 * 
 * Converts JSON objects to XNode representation using the new static utilities.
 */
import { JsonToXNodeConverter } from './converter-interfaces';
import { Config, Configuration } from '../core/config';
import { NodeType } from '../core/dom';
import { logger, validate, ParseError, handleError, ErrorType } from '../core/error';
import { JSON } from '../core/json';
import { XNode } from '../core/xnode';

/**
 * Converts JSON objects to XNode representation
 */
export class DefaultJsonToXNodeConverter implements JsonToXNodeConverter {
  private config: Configuration;
  private namespaceMap: Record<string, string> = {};

  /**
   * Create a new converter
   * @param config Configuration
   */
 constructor(config: Configuration) {
    // Initialize properties first to satisfy TypeScript
    this.config = config;
    this.namespaceMap = {};
    
    try {
      // Then validate and potentially update
      if (!Config.isValid(config)) {
        this.config = Config.createOrUpdate({}, config);
      }
    } catch (err) {
      // If validation/update fails, use default config
      this.config = Config.getDefault();
      handleError(err, "initialize XML to XNode converter", {
        errorType: ErrorType.CONFIGURATION
      });
    }
  }

  /**
   * Convert JSON object to XNode
   * @param json JSON object
   * @returns XNode representation
   */
  public convert(json: Record<string, any>): XNode {
    try {
      // VALIDATION: Check for valid input
      validate(JSON.isValidObject(json), "JSON source must be a valid object");
      
      // Reset namespace map
      this.namespaceMap = {};
      
      // Validate JSON
      this.validateJsonObject(json);
      
      logger.debug('Starting JSON to XNode conversion', {
        jsonKeys: Object.keys(json)
      });
      
      // Convert to XNode
      return this.jsonToXNode(json);
    } catch (err) {
      return handleError(err, 'convert JSON to XNode', {
        data: { jsonKeys: Object.keys(json || {}) },
        errorType: ErrorType.PARSE
      });
    }
  }

  /**
   * Convert JSON object to XNode
   * @param jsonObj JSON object
   * @param parentNode Optional parent node
   * @returns XNode representation
   * @private
   */
  private jsonToXNode(jsonObj: Record<string, any>, parentNode?: XNode): XNode {
    try {
      // Get the node name (first key in the object)
      const nodeName = Object.keys(jsonObj)[0];
      if (!nodeName) {
        throw new ParseError("Empty JSON object", jsonObj);
      }

      const nodeData = jsonObj[nodeName];

      // Create base XNode
      const xnode = new XNode(nodeName, NodeType.ELEMENT_NODE);
      xnode.parent = parentNode;

      // Process namespace and prefix
      const namespaceKey = this.config.propNames.namespace;
      const prefixKey = this.config.propNames.prefix;
      
      if (nodeData[namespaceKey] && this.config.preserveNamespaces) {
        xnode.namespace = nodeData[namespaceKey];
      }

      if (nodeData[prefixKey] && this.config.preserveNamespaces) {
        xnode.prefix = nodeData[prefixKey];
      }

      // Process value
      const valueKey = this.config.propNames.value;
      if (nodeData[valueKey] !== undefined) {
        xnode.value = nodeData[valueKey];
      }

      // Process attributes
      const attributesKey = this.config.propNames.attributes;
      if (this.config.preserveAttributes && 
          nodeData[attributesKey] && 
          Array.isArray(nodeData[attributesKey])) {
        
        xnode.attributes = {};
        const namespaceDecls: Record<string, string> = {};
        let hasNamespaceDecls = false;

        for (const attrObj of nodeData[attributesKey]) {
          const attrName = Object.keys(attrObj)[0];
          if (!attrName) continue;

          const attrData = attrObj[attrName];
          const attrValue = attrData[valueKey];

          if (this.processNamespaceDeclaration(attrName, attrValue, namespaceDecls)) {
            hasNamespaceDecls = true;
          } else {
            // Regular attribute
            xnode.attributes[attrName] = attrValue;
          }
        }

        // Add namespace declarations if any were found
        if (hasNamespaceDecls) {
          xnode.namespaceDeclarations = namespaceDecls;
        }
      }

      // Process children
      const childrenKey = this.config.propNames.children;
      if (nodeData[childrenKey] && Array.isArray(nodeData[childrenKey])) {
        xnode.children = this.processChildren(nodeData[childrenKey], xnode);
      }

      logger.debug('Converted JSON object to XNode', { 
        nodeName: xnode.name,
        hasChildren: !!xnode.children && xnode.children.length > 0,
        hasAttributes: xnode.attributes ? Object.keys(xnode.attributes).length > 0 : false
      });
      
      return xnode;
    } catch (err) {
      return handleError(err, 'convert JSON object to XNode', {
        data: { 
          objectKeys: Object.keys(jsonObj || {}),
          parentNodeName: parentNode?.name
        },
        errorType: ErrorType.PARSE
      });
    }
  }

  /**
   * Process namespace declaration
   * @param attrName Attribute name
   * @param attrValue Attribute value
   * @param namespaceDecls Namespace declarations map
   * @returns True if processed as namespace declaration
   * @private
   */
  private processNamespaceDeclaration(
    attrName: string,
    attrValue: any,
    namespaceDecls: Record<string, string>
  ): boolean {
    try {
      // Check if this is a namespace declaration
      if (attrName === "xmlns") {
        // Default namespace
        namespaceDecls[""] = attrValue;
        
        // Add to global namespace map
        this.namespaceMap[""] = attrValue;
        return true;
      } else if (attrName.startsWith("xmlns:")) {
        // Prefixed namespace
        const prefix = attrName.substring(6);
        namespaceDecls[prefix] = attrValue;
        
        // Add to global namespace map
        this.namespaceMap[prefix] = attrValue;
        return true;
      }
      
      return false;
    } catch (err) {
      return handleError(err, 'process namespace declaration', {
        data: { attrName, attrValue },
        fallback: false
      });
    }
  }

  /**
   * Process child nodes from JSON
   * @param children Children array from JSON
   * @param parentNode Parent XNode
   * @returns Array of XNode children
   * @private
   */
  private processChildren(children: any[], parentNode: XNode): XNode[] {
    try {
      // VALIDATION: Check for valid input
      validate(Array.isArray(children), "Children must be an array");
      validate(parentNode instanceof XNode, "Parent node must be an XNode");
      
      const result: XNode[] = [];
      
      for (const child of children) {
        // Special node types
        if (this.processSpecialChild(child, result, parentNode)) {
          continue;
        }
        
        // Element node (recursively process)
        if (JSON.isValidObject(child) && !Array.isArray(child)) {
          result.push(this.jsonToXNode(child, parentNode));
        }
      }
      
      return result;
    } catch (err) {
      return handleError(err, 'process children', {
        data: { 
          childCount: children?.length,
          parentNodeName: parentNode?.name
        },
        fallback: []
      });
    }
  }

  /**
   * Process special child node types (text, CDATA, comment, PI)
   * @param child Child data from JSON
   * @param result Output children array
   * @param parentNode Parent XNode
   * @returns True if processed as special node
   * @private
   */
  private processSpecialChild(child: any, result: XNode[], parentNode: XNode): boolean {
    try {
      const valueKey = this.config.propNames.value;
      const cdataKey = this.config.propNames.cdata;
      const commentsKey = this.config.propNames.comments;
      const instructionKey = this.config.propNames.instruction;
      const targetKey = this.config.propNames.target;
      
      // Text node
      if (child[valueKey] !== undefined && this.config.preserveTextNodes) {
        const textNode = XNode.createTextNode(child[valueKey]);
        textNode.parent = parentNode;
        result.push(textNode);
        return true;
      }
      
      // CDATA section
      if (child[cdataKey] !== undefined && this.config.preserveCDATA) {
        const cdataNode = XNode.createCDATANode(child[cdataKey]);
        cdataNode.parent = parentNode;
        result.push(cdataNode);
        return true;
      }
      
      // Comment
      if (child[commentsKey] !== undefined && this.config.preserveComments) {
        const commentNode = XNode.createCommentNode(child[commentsKey]);
        commentNode.parent = parentNode;
        result.push(commentNode);
        return true;
      }
      
      // Processing instruction
      if (child[instructionKey] !== undefined && this.config.preserveProcessingInstr) {
        const piData = child[instructionKey];
        const target = piData[targetKey];
        const value = piData[valueKey] || "";
        
        if (target) {
          const piNode = XNode.createProcessingInstructionNode(target, value);
          piNode.parent = parentNode;
          result.push(piNode);
        }
        return true;
      }
      
      return false;
    } catch (err) {
      handleError(err, 'process special child', {
        data: { 
          childKeys: typeof child === 'object' ? Object.keys(child || {}) : null,
          parentNodeName: parentNode?.name
        },
        fallback: false
      });
      return false; // Continue processing even if this node fails
    }
  }

  /**
   * Validate JSON object
   * @param jsonObj JSON object to validate
   * @throws Error if validation fails
   * @private
   */
  private validateJsonObject(jsonObj: Record<string, any>): void {
    try {
      // VALIDATION: Check for valid JSON object structure
      validate(JSON.isValidObject(jsonObj), 'Invalid JSON object: must be a non-array object');
      validate(Object.keys(jsonObj).length === 1, 'Invalid JSON object: must have exactly one root element');
    } catch (err) {
      handleError(err, 'validate JSON object', {
        data: { jsonKeys: Object.keys(jsonObj || {}) },
        errorType: ErrorType.VALIDATION
      });
    }
  }
}