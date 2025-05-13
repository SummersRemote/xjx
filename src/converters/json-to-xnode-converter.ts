/**
 * JSON to XNode converter implementation
 * 
 * Converts JSON objects to XNode representation using the new static utilities.
 */
import { JsonToXNodeConverter } from './converter-interfaces';
import { Configuration } from '../core/config';
import { NodeType } from '../core/dom';
import { ErrorHandler } from '../core/error';
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
    this.config = config;
  }

  /**
   * Convert JSON object to XNode
   * @param json JSON object
   * @returns XNode representation
   */
  public convert(json: Record<string, any>): XNode {
    return ErrorHandler.try(
      () => {
        // Reset namespace map
        this.namespaceMap = {};
        
        // Validate JSON
        this.validateJsonObject(json);
        
        // Convert to XNode
        return this.jsonToXNode(json);
      },
      'Failed to convert JSON to XNode',
      'json-to-xml'
    );
  }

  /**
   * Convert JSON object to XNode
   * @param jsonObj JSON object
   * @param parentNode Optional parent node
   * @returns XNode representation
   * @private
   */
  private jsonToXNode(jsonObj: Record<string, any>, parentNode?: XNode): XNode {
    // Get the node name (first key in the object)
    const nodeName = Object.keys(jsonObj)[0];
    if (!nodeName) {
      throw new Error("Empty JSON object");
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

    return xnode;
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
  }

  /**
   * Process child nodes from JSON
   * @param children Children array from JSON
   * @param parentNode Parent XNode
   * @returns Array of XNode children
   * @private
   */
  private processChildren(children: any[], parentNode: XNode): XNode[] {
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
  }

  /**
   * Validate JSON object
   * @param jsonObj JSON object to validate
   * @throws Error if validation fails
   * @private
   */
  private validateJsonObject(jsonObj: Record<string, any>): void {
    ErrorHandler.validate(
      JSON.isValidObject(jsonObj),
      'Invalid JSON object: must be a non-array object',
      'json-to-xml'
    );
    
    ErrorHandler.validate(
      Object.keys(jsonObj).length === 1,
      'Invalid JSON object: must have exactly one root element',
      'json-to-xml'
    );
  }
}