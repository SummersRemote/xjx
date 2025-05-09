/**
 * XNode - Enhanced XML node class with instance methods
 * 
 * Represents an XML node in the XJX object model with rich instance methods
 * for manipulation and traversal.
 */
import { NodeType } from '../types/dom-types';
import { CommonUtils } from '../utils/common-utils';
import { EntityUtils } from '../utils/entity-utils';
import { NamespaceUtils } from '../utils/namespace-utils';
import { ErrorUtils } from '../utils/error-utils';

/**
 * XNode class representing an XML node in the object model
 */
export class XNode {
  // Core node properties
  public name: string;
  public type: number;
  public value?: any;
  public attributes?: Record<string, any>;
  public children?: XNode[];
  public namespace?: string;
  public prefix?: string;
  public parent?: XNode;
  public namespaceDeclarations?: Record<string, string>;
  public isDefaultNamespace?: boolean;
  
  /**
   * Create a new XNode
   * @param name Node name
   * @param type Node type (from NodeType enum)
   */
  constructor(name: string, type: number = NodeType.ELEMENT_NODE) {
    this.name = name;
    this.type = type;
  }
  
  /**
   * Create an element node
   * @static factory method
   * @param name Element name
   * @returns New element node
   */
  public static createElement(name: string): XNode {
    return new XNode(name, NodeType.ELEMENT_NODE);
  }
  
  /**
   * Create a text node
   * @static factory method
   * @param value Text content
   * @returns New text node
   */
  public static createTextNode(value: string): XNode {
    const node = new XNode("#text", NodeType.TEXT_NODE);
    node.value = value;
    return node;
  }
  
  /**
   * Create a CDATA node
   * @static factory method
   * @param value CDATA content
   * @returns New CDATA node
   */
  public static createCDATANode(value: string): XNode {
    const node = new XNode("#cdata", NodeType.CDATA_SECTION_NODE);
    node.value = value;
    return node;
  }
  
  /**
   * Create a comment node
   * @static factory method
   * @param value Comment content
   * @returns New comment node
   */
  public static createCommentNode(value: string): XNode {
    const node = new XNode("#comment", NodeType.COMMENT_NODE);
    node.value = value;
    return node;
  }
  
  /**
   * Create a processing instruction node
   * @static factory method
   * @param target Processing instruction target
   * @param data Processing instruction data
   * @returns New processing instruction node
   */
  public static createProcessingInstructionNode(target: string, data: string): XNode {
    const node = new XNode("#pi", NodeType.PROCESSING_INSTRUCTION_NODE);
    node.value = data;
    
    if (!node.attributes) {
      node.attributes = {};
    }
    node.attributes.target = target;
    
    return node;
  }
  
  /**
   * Add a child node
   * @instance method
   * @param child Child node to add
   * @returns This node for chaining
   */
  public addChild(child: XNode): XNode {
    if (!this.children) {
      this.children = [];
    }
    
    // Set parent reference
    child.parent = this;
    this.children.push(child);
    
    return this; // For chaining
  }
  
  /**
   * Remove a child node
   * @instance method
   * @param child Child node to remove
   * @returns True if the child was found and removed
   */
  public removeChild(child: XNode): boolean {
    if (!this.children) return false;
    
    const index = this.children.indexOf(child);
    if (index === -1) return false;
    
    this.children.splice(index, 1);
    return true;
  }
  
  /**
   * Set an attribute
   * @instance method
   * @param name Attribute name
   * @param value Attribute value
   * @returns This node for chaining
   */
  public setAttribute(name: string, value: any): XNode {
    if (!this.attributes) {
      this.attributes = {};
    }
    
    this.attributes[name] = value;
    return this; // For chaining
  }
  
  /**
   * Get an attribute value
   * @instance method
   * @param name Attribute name
   * @returns Attribute value or undefined if not found
   */
  public getAttribute(name: string): any {
    return this.attributes?.[name];
  }
  
  /**
   * Remove an attribute
   * @instance method
   * @param name Attribute name
   * @returns True if the attribute was found and removed
   */
  public removeAttribute(name: string): boolean {
    if (!this.attributes || !(name in this.attributes)) {
      return false;
    }
    
    delete this.attributes[name];
    return true;
  }
  
  /**
   * Add a namespace declaration
   * @instance method
   * @param prefix Namespace prefix (empty string for default namespace)
   * @param uri Namespace URI
   * @returns This node for chaining
   */
  public addNamespace(prefix: string, uri: string): XNode {
    if (!this.namespaceDeclarations) {
      this.namespaceDeclarations = {};
    }
    
    this.namespaceDeclarations[prefix] = uri;
    
    if (prefix === '') {
      this.isDefaultNamespace = true;
    }
    
    return this; // For chaining
  }
  
  /**
   * Find the first child with the given name
   * @instance method
   * @param name Child name to find
   * @returns First matching child or undefined if none found
   */
  public findChild(name: string): XNode | undefined {
    return this.children?.find(child => child.name === name);
  }
  
  /**
   * Find all children with the given name
   * @instance method
   * @param name Child name to find
   * @returns Array of matching children (empty if none found)
   */
  public findChildren(name: string): XNode[] {
    if (!this.children) return [];
    return this.children.filter(child => child.name === name);
  }
  
  /**
   * Get qualified name (with prefix if available)
   * @instance method
   * @returns Qualified name
   */
  public getQualifiedName(): string {
    return NamespaceUtils.createQualifiedName(this.prefix, this.name);
  }
  
  /**
   * Get the node's text content (value or combined text from children)
   * @instance method
   * @returns Text content or empty string if none
   */
  public getTextContent(): string {
    // If this is a text node, return its value
    if (this.type === NodeType.TEXT_NODE || this.type === NodeType.CDATA_SECTION_NODE) {
      return this.value?.toString() || '';
    }
    
    // If this has a direct value, return it
    if (this.value !== undefined && this.children === undefined) {
      return this.value.toString();
    }
    
    // If this has children, combine their text content
    if (this.children) {
      return this.children
        .filter(child => 
          child.type === NodeType.TEXT_NODE || 
          child.type === NodeType.CDATA_SECTION_NODE ||
          child.type === NodeType.ELEMENT_NODE
        )
        .map(child => child.getTextContent())
        .join('');
    }
    
    return '';
  }
  
  /**
   * Set the node's text content
   * @instance method
   * @param text New text content
   * @returns This node for chaining
   */
  public setTextContent(text: string): XNode {
    // For text and CDATA nodes, set the value directly
    if (this.type === NodeType.TEXT_NODE || this.type === NodeType.CDATA_SECTION_NODE) {
      this.value = text;
      return this;
    }
    
    // For element nodes, replace all children with a single text node
    if (this.type === NodeType.ELEMENT_NODE) {
      this.children = [XNode.createTextNode(text)];
      // Set parent reference
      this.children[0].parent = this;
      
      // Clear direct value if it exists
      delete this.value;
      
      return this;
    }
    
    // For other node types, no action
    return this;
  }
  
  /**
   * Clone this node with optional deep flag
   * @instance method
   * @param deep Whether to clone children recursively
   * @returns Cloned node
   */
  public clone(deep: boolean = false): XNode {
    if (deep) {
      // Deep clone using CommonUtils
      const clone = CommonUtils.deepClone(this) as XNode;
      
      // Fix parent references (should be null in a clone)
      const fixParents = (node: XNode) => {
        node.parent = undefined;
        node.children?.forEach(child => {
          child.parent = node;
          fixParents(child);
        });
      };
      
      fixParents(clone);
      return clone;
    } else {
      // Shallow clone
      const clone = new XNode(this.name, this.type);
      clone.value = this.value;
      clone.namespace = this.namespace;
      clone.prefix = this.prefix;
      
      // Clone attributes if present
      if (this.attributes) {
        clone.attributes = { ...this.attributes };
      }
      
      // Clone namespace declarations if present
      if (this.namespaceDeclarations) {
        clone.namespaceDeclarations = { ...this.namespaceDeclarations };
      }
      
      clone.isDefaultNamespace = this.isDefaultNamespace;
      
      return clone;
    }
  }
  
  /**
   * Get this node's path from the root
   * @instance method
   * @returns Path string (e.g., "root.child.grandchild")
   */
  public getPath(): string {
    const parts: string[] = [];
    let current: XNode | undefined = this;
    
    while (current) {
      parts.unshift(current.name);
      current = current.parent;
    }
    
    return parts.join('.');
  }
  
  /**
   * Check if this node has children
   * @instance method
   * @returns True if the node has children
   */
  public hasChildren(): boolean {
    return !!this.children && this.children.length > 0;
  }
  
  /**
   * Get the node type name for debugging
   * @instance method
   * @returns Human-readable node type
   */
  public getNodeTypeName(): string {
    switch (this.type) {
      case NodeType.ELEMENT_NODE: return 'ELEMENT_NODE';
      case NodeType.TEXT_NODE: return 'TEXT_NODE';
      case NodeType.CDATA_SECTION_NODE: return 'CDATA_SECTION_NODE';
      case NodeType.PROCESSING_INSTRUCTION_NODE: return 'PROCESSING_INSTRUCTION_NODE';
      case NodeType.COMMENT_NODE: return 'COMMENT_NODE';
      case NodeType.DOCUMENT_NODE: return 'DOCUMENT_NODE';
      default: return `UNKNOWN_NODE_TYPE(${this.type})`;
    }
  }
  
  /**
   * Find a node by path
   * @instance method
   * @param path Path string (e.g., "child.grandchild")
   * @returns Found node or undefined if not found
   */
  public findByPath(path: string): XNode | undefined {
    if (!path) return this;
    
    const parts = path.split('.');
    let current: XNode = this;
    
    for (const part of parts) {
      if (!current.children) return undefined;
      
      const found = current.children.find(child => child.name === part);
      if (!found) return undefined;
      
      current = found;
    }
    
    return current;
  }
  
  /**
   * Append a text node to this node
   * @instance method
   * @param text Text content
   * @returns This node for chaining
   */
  public appendText(text: string): XNode {
    return this.addChild(XNode.createTextNode(text));
  }
  
  /**
   * Append a CDATA node to this node
   * @instance method
   * @param data CDATA content
   * @returns This node for chaining
   */
  public appendCDATA(data: string): XNode {
    return this.addChild(XNode.createCDATANode(data));
  }
  
  /**
   * Append a comment node to this node
   * @instance method
   * @param comment Comment content
   * @returns This node for chaining
   */
  public appendComment(comment: string): XNode {
    return this.addChild(XNode.createCommentNode(comment));
  }
  
  /**
   * Append a processing instruction node to this node
   * @instance method
   * @param target Processing instruction target
   * @param data Processing instruction data
   * @returns This node for chaining
   */
  public appendProcessingInstruction(target: string, data: string): XNode {
    return this.addChild(XNode.createProcessingInstructionNode(target, data));
  }

  /**
   * Find the first matching node using a predicate function
   * @param predicate Function that takes a node and returns true for a match
   * @param deep Whether to search recursively through children
   * @returns First matching node or undefined if none found
   */
  public find(
    predicate: (node: XNode) => boolean,
    deep: boolean = true
  ): XNode | undefined {
    // Check if this node matches
    if (predicate(this)) {
      return this;
    }
    
    // If no children or not searching deep, return undefined
    if (!this.children || !deep) {
      return undefined;
    }
    
    // Search through children
    for (const child of this.children) {
      const found = child.find(predicate, deep);
      if (found) {
        return found;
      }
    }
    
    return undefined;
  }

  /**
   * Find all matching nodes using a predicate function
   * @param predicate Function that takes a node and returns true for a match
   * @param deep Whether to search recursively through children
   * @returns Array of matching nodes (empty if none found)
   */
  public findAll(
    predicate: (node: XNode) => boolean,
    deep: boolean = true
  ): XNode[] {
    const results: XNode[] = [];
    
    // Check if this node matches
    if (predicate(this)) {
      results.push(this);
    }
    
    // If no children or not searching deep, return results
    if (!this.children || !deep) {
      return results;
    }
    
    // Search through children
    for (const child of this.children) {
      results.push(...child.findAll(predicate, deep));
    }
    
    return results;
  }
}