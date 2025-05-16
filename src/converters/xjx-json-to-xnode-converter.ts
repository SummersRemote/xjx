/**
 * JSON to XNode converter implementation
 * 
 * Converts XJX-formatted JSON objects to XNode representation with proper 
 * application of preservation settings.
 */
import { XjxJsonToXNodeConverter } from './converter-interfaces';
import { Config, Configuration } from '../core/config';
import { NodeType } from '../core/dom';
import { logger, validate, ParseError, handleError, ErrorType } from '../core/error';
import { JSON } from '../core/json';
import { XNode } from '../core/xnode';

/**
 * Converts XJX-formatted JSON objects to XNode representation
 */
export class DefaultXjxJsonToXNodeConverter implements XjxJsonToXNodeConverter {
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
      handleError(err, "initialize XJX JSON to XNode converter", {
        errorType: ErrorType.CONFIGURATION
      });
    }
  }

  /**
   * Convert XJX-formatted JSON object to XNode
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
      
      logger.debug('Starting XJX JSON to XNode conversion', {
        jsonKeys: Object.keys(json)
      });
      
      // Convert to XNode
      return this.jsonToXNode(json);
    } catch (err) {
      return handleError(err, 'convert XJX JSON to XNode', {
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
      const namingConfig = this.config.converters.xjxJson.naming;

      // Create base XNode
      const xnode = new XNode(nodeName, NodeType.ELEMENT_NODE);
      xnode.parent = parentNode;

      // Process namespace and prefix - only if preserving namespaces
      if (this.config.preserveNamespaces) {
        if (nodeData[namingConfig.namespace]) {
          xnode.namespace = nodeData[namingConfig.namespace];
        }

        if (nodeData[namingConfig.prefix]) {
          xnode.prefix = nodeData[namingConfig.prefix];
        }
      }

      // Process value - only if preserving text nodes
      if (this.config.preserveTextNodes && nodeData[namingConfig.value] !== undefined) {
        xnode.value = nodeData[namingConfig.value];
      }

      // Process attributes - only if preserving attributes or namespace declarations
      if ((this.config.preserveAttributes || this.config.preserveNamespaces) && 
          nodeData[namingConfig.attribute] && 
          Array.isArray(nodeData[namingConfig.attribute])) {
        
        const hasAttributes = this.config.preserveAttributes;
        const hasNamespaceDecls = this.config.preserveNamespaces && 
                                 this.hasNamespaceDeclarations(nodeData[namingConfig.attribute]);
        
        // Only create attributes object if needed
        if (hasAttributes || hasNamespaceDecls) {
          xnode.attributes = {};
        }
        
        if (hasNamespaceDecls) {
          const namespaceDecls: Record<string, string> = {};
          let hasNamespaces = false;

          // First process namespace declarations
          for (const attrObj of nodeData[namingConfig.attribute]) {
            const attrName = Object.keys(attrObj)[0];
            if (!attrName) continue;

            const attrData = attrObj[attrName];
            const attrValue = attrData[namingConfig.value];

            if (this.processNamespaceDeclaration(attrName, attrValue, namespaceDecls)) {
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
          for (const attrObj of nodeData[namingConfig.attribute]) {
            const attrName = Object.keys(attrObj)[0];
            if (!attrName) continue;

            // Skip xmlns attributes (handled separately)
            if (attrName === "xmlns" || attrName.startsWith("xmlns:")) continue;

            const attrData = attrObj[attrName];
            xnode.attributes[attrName] = attrData[namingConfig.value];
          }
        }
      }

      // Process children
      if (nodeData[namingConfig.children] && Array.isArray(nodeData[namingConfig.children])) {
        xnode.children = this.processChildren(nodeData[namingConfig.children], xnode);
        
        // If no children were processed (all filtered out), set to undefined
        if (xnode.children && xnode.children.length === 0) {
          xnode.children = undefined;
        }
      }

      logger.debug('Converted XJX JSON object to XNode', { 
        nodeName: xnode.name,
        hasChildren: !!xnode.children && xnode.children.length > 0,
        hasAttributes: xnode.attributes ? Object.keys(xnode.attributes).length > 0 : false
      });
      
      return xnode;
    } catch (err) {
      return handleError(err, 'convert XJX JSON object to XNode', {
        data: { 
          objectKeys: Object.keys(jsonObj || {}),
          parentNodeName: parentNode?.name
        },
        errorType: ErrorType.PARSE
      });
    }
  }

  /**
   * Check if attribute array contains namespace declarations
   * @param attributes Array of attributes
   * @returns True if namespace declarations exist
   */
  private hasNamespaceDeclarations(attributes: any[]): boolean {
    try {
      if (!Array.isArray(attributes)) return false;
      
      // const namingConfig = this.config.converters.xjxJson.naming;
      
      for (const attrObj of attributes) {
        const attrName = Object.keys(attrObj)[0];
        if (!attrName) continue;
        
        if (attrName === "xmlns" || attrName.startsWith("xmlns:")) {
          return true;
        }
      }
      
      return false;
    } catch (err) {
      return handleError(err, 'check for namespace declarations', {
        fallback: false
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
      const namingConfig = this.config.converters.xjxJson.naming;
      
      for (const child of children) {
        // Special node types
        if (this.processSpecialChild(child, result, parentNode, namingConfig)) {
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
   * @param namingConfig JSON naming configuration
   * @returns True if processed as special node
   * @private
   */
  private processSpecialChild(
    child: any, 
    result: XNode[], 
    parentNode: XNode, 
    namingConfig: any
  ): boolean {
    try {
      // Text node - only if preserving text nodes
      if (child[namingConfig.value] !== undefined && this.config.preserveTextNodes) {
        const textNode = XNode.createTextNode(child[namingConfig.value]);
        textNode.parent = parentNode;
        result.push(textNode);
        return true;
      }
      
      // CDATA section - only if preserving CDATA
      if (child[namingConfig.cdata] !== undefined && this.config.preserveCDATA) {
        const cdataNode = XNode.createCDATANode(child[namingConfig.cdata]);
        cdataNode.parent = parentNode;
        result.push(cdataNode);
        return true;
      }
      
      // Comment - only if preserving comments
      if (child[namingConfig.comment] !== undefined && this.config.preserveComments) {
        const commentNode = XNode.createCommentNode(child[namingConfig.comment]);
        commentNode.parent = parentNode;
        result.push(commentNode);
        return true;
      }
      
      // Processing instruction - only if preserving PIs
      if (child[namingConfig.processingInstr] !== undefined && this.config.preserveProcessingInstr) {
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