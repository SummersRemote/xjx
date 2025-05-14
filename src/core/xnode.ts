/**
 * XNode - Enhanced XML node class with metadata support
 * 
 * Represents an XML node in the XJX object model with rich instance methods
 * for manipulation and traversal, plus metadata capabilities.
 */
import { Common } from './common';
import { NodeType, DOM } from './dom';
import { logger, validate, ValidationError } from './error';

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
  
  // Metadata container for processing instructions and hints
  public metadata?: Record<string, any>;
  
  /**
   * Create a new XNode
   * @param name Node name
   * @param type Node type (from NodeType enum)
   */
  constructor(name: string, type: number = NodeType.ELEMENT_NODE) {
    try {
      // VALIDATION: Check for valid inputs
      validate(typeof name === "string", "Node name must be a string");
      validate(Number.isInteger(type), "Node type must be an integer");
      
      this.name = name;
      this.type = type;
      
      logger.debug('Created new XNode', { name, type });
    } catch (err) {
      if (err instanceof ValidationError) {
        logger.error('Failed to create XNode due to validation error', err);
        throw err;
      } else {
        logger.error('Failed to create XNode', err);
        throw err;
      }
    }
  }
  
  /**
   * Create an element node
   * @static factory method
   * @param name Element name
   * @returns New element node
   */
  public static createElement(name: string): XNode {
    try {
      // VALIDATION: Check for valid input
      validate(typeof name === "string", "Element name must be a string");
      
      const node = new XNode(name, NodeType.ELEMENT_NODE);
      
      logger.debug('Created element node', { name });
      return node;
    } catch (err) {
      if (err instanceof ValidationError) {
        logger.error('Failed to create element node due to validation error', err);
        throw err;
      } else {
        logger.error('Failed to create element node', err);
        throw err;
      }
    }
  }
  
  /**
   * Create a text node
   * @static factory method
   * @param value Text content
   * @returns New text node
   */
  public static createTextNode(value: string): XNode {
    try {
      // VALIDATION: Check for valid input
      validate(typeof value === "string", "Text value must be a string");
      
      const node = new XNode("#text", NodeType.TEXT_NODE);
      node.value = value;
      
      logger.debug('Created text node', { valueLength: value.length });
      return node;
    } catch (err) {
      if (err instanceof ValidationError) {
        logger.error('Failed to create text node due to validation error', err);
        throw err;
      } else {
        logger.error('Failed to create text node', err);
        throw err;
      }
    }
  }
  
  /**
   * Create a CDATA node
   * @static factory method
   * @param value CDATA content
   * @returns New CDATA node
   */
  public static createCDATANode(value: string): XNode {
    try {
      // VALIDATION: Check for valid input
      validate(typeof value === "string", "CDATA value must be a string");
      
      const node = new XNode("#cdata", NodeType.CDATA_SECTION_NODE);
      node.value = value;
      
      logger.debug('Created CDATA node', { valueLength: value.length });
      return node;
    } catch (err) {
      if (err instanceof ValidationError) {
        logger.error('Failed to create CDATA node due to validation error', err);
        throw err;
      } else {
        logger.error('Failed to create CDATA node', err);
        throw err;
      }
    }
  }
  
  /**
   * Create a comment node
   * @static factory method
   * @param value Comment content
   * @returns New comment node
   */
  public static createCommentNode(value: string): XNode {
    try {
      // VALIDATION: Check for valid input
      validate(typeof value === "string", "Comment value must be a string");
      
      const node = new XNode("#comment", NodeType.COMMENT_NODE);
      node.value = value;
      
      logger.debug('Created comment node', { valueLength: value.length });
      return node;
    } catch (err) {
      if (err instanceof ValidationError) {
        logger.error('Failed to create comment node due to validation error', err);
        throw err;
      } else {
        logger.error('Failed to create comment node', err);
        throw err;
      }
    }
  }
  
  /**
   * Create a processing instruction node
   * @static factory method
   * @param target Processing instruction target
   * @param data Processing instruction data
   * @returns New processing instruction node
   */
  public static createProcessingInstructionNode(target: string, data: string): XNode {
    try {
      // VALIDATION: Check for valid inputs
      validate(typeof target === "string", "Processing instruction target must be a string");
      validate(typeof data === "string", "Processing instruction data must be a string");
      
      const node = new XNode("#pi", NodeType.PROCESSING_INSTRUCTION_NODE);
      node.value = data;
      
      if (!node.attributes) {
        node.attributes = {};
      }
      node.attributes.target = target;
      
      logger.debug('Created processing instruction node', { 
        target, 
        dataLength: data.length 
      });
      
      return node;
    } catch (err) {
      if (err instanceof ValidationError) {
        logger.error('Failed to create processing instruction node due to validation error', err);
        throw err;
      } else {
        logger.error('Failed to create processing instruction node', err);
        throw err;
      }
    }
  }
  
  // --- Metadata Methods ---
  
  /**
   * Set metadata value
   * @param key Metadata key
   * @param value Metadata value
   * @returns This node for chaining
   */
  public setMetadata(key: string, value: any): XNode {
    try {
      // VALIDATION: Check for valid input
      validate(typeof key === "string", "Metadata key must be a string");
      
      if (!this.metadata) {
        this.metadata = {};
      }
      this.metadata[key] = value;
      
      logger.debug('Set metadata', { key, nodeName: this.name });
      return this; // For chaining
    } catch (err) {
      if (err instanceof ValidationError) {
        logger.error('Failed to set metadata due to validation error', err);
        throw err;
      } else {
        logger.error('Failed to set metadata', err);
        throw err;
      }
    }
  }
  
  /**
   * Get metadata value
   * @param key Metadata key
   * @param defaultValue Default value if metadata not found
   * @returns Metadata value or default value
   */
  public getMetadata<T>(key: string, defaultValue?: T): T | undefined {
    try {
      // VALIDATION: Check for valid input
      validate(typeof key === "string", "Metadata key must be a string");
      
      return (this.metadata && key in this.metadata) 
        ? this.metadata[key] as T 
        : defaultValue;
    } catch (err) {
      if (err instanceof ValidationError) {
        logger.error('Failed to get metadata due to validation error', err);
        throw err;
      } else {
        logger.error('Failed to get metadata', err);
        return defaultValue;
      }
    }
  }
  
  /**
   * Check if metadata key exists
   * @param key Metadata key
   * @returns True if metadata exists
   */
  public hasMetadata(key: string): boolean {
    try {
      // VALIDATION: Check for valid input
      validate(typeof key === "string", "Metadata key must be a string");
      
      return this.metadata !== undefined && key in this.metadata;
    } catch (err) {
      if (err instanceof ValidationError) {
        logger.error('Failed to check metadata due to validation error', err);
        throw err;
      } else {
        logger.error('Failed to check metadata', err);
        return false;
      }
    }
  }
  
  /**
   * Remove metadata
   * @param key Metadata key
   * @returns True if metadata was removed
   */
  public removeMetadata(key: string): boolean {
    try {
      // VALIDATION: Check for valid input
      validate(typeof key === "string", "Metadata key must be a string");
      
      if (!this.metadata || !(key in this.metadata)) {
        return false;
      }
      delete this.metadata[key];
      
      logger.debug('Removed metadata', { key, nodeName: this.name });
      return true;
    } catch (err) {
      if (err instanceof ValidationError) {
        logger.error('Failed to remove metadata due to validation error', err);
        throw err;
      } else {
        logger.error('Failed to remove metadata', err);
        return false;
      }
    }
  }
  
  /**
   * Set multiple metadata values
   * @param values Metadata key-value pairs
   * @returns This node for chaining
   */
  public setMetadataValues(values: Record<string, any>): XNode {
    try {
      // VALIDATION: Check for valid input
      validate(values !== null && typeof values === 'object', "Values must be an object");
      
      if (!this.metadata) {
        this.metadata = {};
      }
      Object.assign(this.metadata, values);
      
      logger.debug('Set multiple metadata values', { 
        keys: Object.keys(values),
        nodeName: this.name
      });
      
      return this; // For chaining
    } catch (err) {
      if (err instanceof ValidationError) {
        logger.error('Failed to set metadata values due to validation error', err);
        throw err;
      } else {
        logger.error('Failed to set metadata values', err);
        throw err;
      }
    }
  }
  
  /**
   * Clear all metadata
   * @returns This node for chaining
   */
  public clearMetadata(): XNode {
    try {
      this.metadata = undefined;
      
      logger.debug('Cleared all metadata', { nodeName: this.name });
      return this; // For chaining
    } catch (err) {
      logger.error('Failed to clear metadata', err);
      throw err;
    }
  }
  
  // --- Node Manipulation Methods ---
  
  /**
   * Add a child node
   * @instance method
   * @param child Child node to add
   * @returns This node for chaining
   */
  public addChild(child: XNode): XNode {
    try {
      // VALIDATION: Check for valid input
      validate(child instanceof XNode, "Child must be an XNode instance");
      
      if (!this.children) {
        this.children = [];
      }
      
      // Set parent reference
      child.parent = this;
      this.children.push(child);
      
      logger.debug('Added child node', { 
        parentName: this.name, 
        childName: child.name,
        childType: child.type,
        childIndex: this.children.length - 1
      });
      
      return this; // For chaining
    } catch (err) {
      if (err instanceof ValidationError) {
        logger.error('Failed to add child due to validation error', err);
        throw err;
      } else {
        logger.error('Failed to add child', err);
        throw err;
      }
    }
  }
  
  /**
   * Remove a child node
   * @instance method
   * @param child Child node to remove
   * @returns True if the child was found and removed
   */
  public removeChild(child: XNode): boolean {
    try {
      // VALIDATION: Check for valid input
      validate(child instanceof XNode, "Child must be an XNode instance");
      
      if (!this.children) return false;
      
      const index = this.children.indexOf(child);
      if (index === -1) return false;
      
      this.children.splice(index, 1);
      
      logger.debug('Removed child node', { 
        parentName: this.name, 
        childName: child.name,
        childIndex: index
      });
      
      return true;
    } catch (err) {
      if (err instanceof ValidationError) {
        logger.error('Failed to remove child due to validation error', err);
        throw err;
      } else {
        logger.error('Failed to remove child', err);
        return false;
      }
    }
  }
  
  /**
   * Set an attribute
   * @instance method
   * @param name Attribute name
   * @param value Attribute value
   * @returns This node for chaining
   */
  public setAttribute(name: string, value: any): XNode {
    try {
      // VALIDATION: Check for valid input
      validate(typeof name === "string", "Attribute name must be a string");
      
      if (!this.attributes) {
        this.attributes = {};
      }
      
      this.attributes[name] = value;
      
      logger.debug('Set attribute', { 
        nodeName: this.name, 
        attributeName: name
      });
      
      return this; // For chaining
    } catch (err) {
      if (err instanceof ValidationError) {
        logger.error('Failed to set attribute due to validation error', err);
        throw err;
      } else {
        logger.error('Failed to set attribute', err);
        throw err;
      }
    }
  }
  
  /**
   * Get an attribute value
   * @instance method
   * @param name Attribute name
   * @returns Attribute value or undefined if not found
   */
  public getAttribute(name: string): any {
    try {
      // VALIDATION: Check for valid input
      validate(typeof name === "string", "Attribute name must be a string");
      
      return this.attributes?.[name];
    } catch (err) {
      if (err instanceof ValidationError) {
        logger.error('Failed to get attribute due to validation error', err);
        throw err;
      } else {
        logger.error('Failed to get attribute', err);
        return undefined;
      }
    }
  }
  
  /**
   * Remove an attribute
   * @instance method
   * @param name Attribute name
   * @returns True if the attribute was found and removed
   */
  public removeAttribute(name: string): boolean {
    try {
      // VALIDATION: Check for valid input
      validate(typeof name === "string", "Attribute name must be a string");
      
      if (!this.attributes || !(name in this.attributes)) {
        return false;
      }
      
      delete this.attributes[name];
      
      logger.debug('Removed attribute', { 
        nodeName: this.name, 
        attributeName: name
      });
      
      return true;
    } catch (err) {
      if (err instanceof ValidationError) {
        logger.error('Failed to remove attribute due to validation error', err);
        throw err;
      } else {
        logger.error('Failed to remove attribute', err);
        return false;
      }
    }
  }
  
  /**
   * Add a namespace declaration
   * @instance method
   * @param prefix Namespace prefix (empty string for default namespace)
   * @param uri Namespace URI
   * @returns This node for chaining
   */
  public addNamespace(prefix: string, uri: string): XNode {
    try {
      // VALIDATION: Check for valid inputs
      validate(typeof prefix === "string", "Prefix must be a string");
      validate(typeof uri === "string", "URI must be a string");
      
      if (!this.namespaceDeclarations) {
        this.namespaceDeclarations = {};
      }
      
      this.namespaceDeclarations[prefix] = uri;
      
      if (prefix === '') {
        this.isDefaultNamespace = true;
      }
      
      logger.debug('Added namespace declaration', { 
        nodeName: this.name, 
        prefix: prefix || '(default)',
        uri
      });
      
      return this; // For chaining
    } catch (err) {
      if (err instanceof ValidationError) {
        logger.error('Failed to add namespace due to validation error', err);
        throw err;
      } else {
        logger.error('Failed to add namespace', err);
        throw err;
      }
    }
  }
  
  /**
   * Find the first child with the given name
   * @instance method
   * @param name Child name to find
   * @returns First matching child or undefined if none found
   */
  public findChild(name: string): XNode | undefined {
    try {
      // VALIDATION: Check for valid input
      validate(typeof name === "string", "Child name must be a string");
      
      return this.children?.find(child => child.name === name);
    } catch (err) {
      if (err instanceof ValidationError) {
        logger.error('Failed to find child due to validation error', err);
        throw err;
      } else {
        logger.error('Failed to find child', err);
        return undefined;
      }
    }
  }
  
  /**
   * Find all children with the given name
   * @instance method
   * @param name Child name to find
   * @returns Array of matching children (empty if none found)
   */
  public findChildren(name: string): XNode[] {
    try {
      // VALIDATION: Check for valid input
      validate(typeof name === "string", "Child name must be a string");
      
      if (!this.children) return [];
      return this.children.filter(child => child.name === name);
    } catch (err) {
      if (err instanceof ValidationError) {
        logger.error('Failed to find children due to validation error', err);
        throw err;
      } else {
        logger.error('Failed to find children', err);
        return [];
      }
    }
  }
  
  /**
   * Get qualified name (with prefix if available)
   * @instance method
   * @returns Qualified name
   */
  public getQualifiedName(): string {
    try {
      return this.prefix ? `${this.prefix}:${this.name}` : this.name;
    } catch (err) {
      logger.error('Failed to get qualified name', err);
      return this.name;
    }
  }
  
  /**
   * Get the node's text content (value or combined text from children)
   * @instance method
   * @returns Text content or empty string if none
   */
  public getTextContent(): string {
    try {
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
    } catch (err) {
      logger.error('Failed to get text content', err);
      return '';
    }
  }
  
  /**
   * Set the node's text content
   * @instance method
   * @param text New text content
   * @returns This node for chaining
   */
  public setTextContent(text: string): XNode {
    try {
      // VALIDATION: Check for valid input
      validate(typeof text === "string", "Text content must be a string");
      
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
        
        logger.debug('Set text content', { 
          nodeName: this.name, 
          textLength: text.length 
        });
        
        return this;
      }
      
      // For other node types, no action
      return this;
    } catch (err) {
      if (err instanceof ValidationError) {
        logger.error('Failed to set text content due to validation error', err);
        throw err;
      } else {
        logger.error('Failed to set text content', err);
        throw err;
      }
    }
  }
  
  /**
   * Clone this node with optional deep flag
   * @instance method
   * @param deep Whether to clone children recursively
   * @returns Cloned node
   */
  public clone(deep: boolean = false): XNode {
    try {
      if (deep) {
        // Deep clone using Common
        const clone = Common.deepClone(this) as XNode;
        
        // Fix parent references (should be null in a clone)
        const fixParents = (node: XNode) => {
          node.parent = undefined;
          node.children?.forEach(child => {
            child.parent = node;
            fixParents(child);
          });
        };
        
        fixParents(clone);
        
        logger.debug('Deep cloned node', { 
          nodeName: this.name, 
          childCount: this.children?.length || 0 
        });
        
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
        
        // Clone metadata if present
        if (this.metadata) {
          clone.metadata = { ...this.metadata };
        }
        
        clone.isDefaultNamespace = this.isDefaultNamespace;
        
        logger.debug('Shallow cloned node', { nodeName: this.name });
        
        return clone;
      }
    } catch (err) {
      logger.error('Failed to clone node', err);
      throw err;
    }
  }
  
  /**
   * Get this node's path from the root
   * @instance method
   * @returns Path string (e.g., "root.child.grandchild")
   */
  public getPath(): string {
    try {
      const parts: string[] = [];
      let current: XNode | undefined = this;
      
      while (current) {
        parts.unshift(current.name);
        current = current.parent;
      }
      
      return parts.join('.');
    } catch (err) {
      logger.error('Failed to get node path', err);
      throw err;
    }
  }
  
  /**
   * Check if this node has children
   * @instance method
   * @returns True if the node has children
   */
  public hasChildren(): boolean {
    try {
      return !!this.children && this.children.length > 0;
    } catch (err) {
      logger.error('Failed to check if node has children', err);
      return false;
    }
  }
  
  /**
   * Get the node type name for debugging
   * @instance method
   * @returns Human-readable node type
   */
  public getNodeTypeName(): string {
    try {
      return DOM.getNodeTypeName(this.type);
    } catch (err) {
      logger.error('Failed to get node type name', err);
      return `UNKNOWN_NODE_TYPE(${this.type})`;
    }
  }
  
  /**
   * Find a node by path
   * @instance method
   * @param path Path string (e.g., "child.grandchild")
   * @returns Found node or undefined if not found
   */
  public findByPath(path: string): XNode | undefined {
    try {
      // VALIDATION: Check for valid input
      validate(typeof path === "string", "Path must be a string");
      
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
    } catch (err) {
      if (err instanceof ValidationError) {
        logger.error('Failed to find by path due to validation error', err);
        throw err;
      } else {
        logger.error('Failed to find by path', err);
        return undefined;
      }
    }
  }
  
  /**
   * Append a text node to this node
   * @instance method
   * @param text Text content
   * @returns This node for chaining
   */
  public appendText(text: string): XNode {
    try {
      // VALIDATION: Check for valid input
      validate(typeof text === "string", "Text must be a string");
      
      return this.addChild(XNode.createTextNode(text));
    } catch (err) {
      if (err instanceof ValidationError) {
        logger.error('Failed to append text due to validation error', err);
        throw err;
      } else {
        logger.error('Failed to append text', err);
        throw err;
      }
    }
  }
  
  /**
   * Append a CDATA node to this node
   * @instance method
   * @param data CDATA content
   * @returns This node for chaining
   */
  public appendCDATA(data: string): XNode {
    try {
      // VALIDATION: Check for valid input
      validate(typeof data === "string", "CDATA must be a string");
      
      return this.addChild(XNode.createCDATANode(data));
    } catch (err) {
      if (err instanceof ValidationError) {
        logger.error('Failed to append CDATA due to validation error', err);
        throw err;
      } else {
        logger.error('Failed to append CDATA', err);
        throw err;
      }
    }
  }
  
  /**
   * Append a comment node to this node
   * @instance method
   * @param comment Comment content
   * @returns This node for chaining
   */
  public appendComment(comment: string): XNode {
    try {
      // VALIDATION: Check for valid input
      validate(typeof comment === "string", "Comment must be a string");
      
      return this.addChild(XNode.createCommentNode(comment));
    } catch (err) {
      if (err instanceof ValidationError) {
        logger.error('Failed to append comment due to validation error', err);
        throw err;
      } else {
        logger.error('Failed to append comment', err);
        throw err;
      }
    }
  }
  
  /**
   * Append a processing instruction node to this node
   * @instance method
   * @param target Processing instruction target
   * @param data Processing instruction data
   * @returns This node for chaining
   */
  public appendProcessingInstruction(target: string, data: string): XNode {
    try {
      // VALIDATION: Check for valid inputs
      validate(typeof target === "string", "Processing instruction target must be a string");
      validate(typeof data === "string", "Processing instruction data must be a string");
      
      return this.addChild(XNode.createProcessingInstructionNode(target, data));
    } catch (err) {
      if (err instanceof ValidationError) {
        logger.error('Failed to append processing instruction due to validation error', err);
        throw err;
      } else {
        logger.error('Failed to append processing instruction', err);
        throw err;
      }
    }
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
    try {
      // VALIDATION: Check for valid input
      validate(typeof predicate === "function", "Predicate must be a function");
      
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
    } catch (err) {
      if (err instanceof ValidationError) {
        logger.error('Failed to find node due to validation error', err);
        throw err;
      } else {
        logger.error('Failed to find node', err);
        return undefined;
      }
    }
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
    try {
      // VALIDATION: Check for valid input
      validate(typeof predicate === "function", "Predicate must be a function");
      
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
    } catch (err) {
      if (err instanceof ValidationError) {
        logger.error('Failed to find all nodes due to validation error', err);
        throw err;
      } else {
        logger.error('Failed to find all nodes', err);
        return [];
      }
    }
  }
}