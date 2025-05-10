/**
 * JSON to XNode converter implementation
 * 
 * Converts JSON objects to XNode representation using the context-sensitive format.
 */
import { JsonToXNodeConverter } from './converter-interfaces';
import { Configuration } from '../core/types/config-types';
import { NodeType } from '../core/types/dom-types';
import { ErrorUtils } from '../core/utils/error-utils';
import { JsonUtils } from '../core/utils/json-utils';
import { XNode } from '../core/models/xnode';

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
    return ErrorUtils.try(
      () => {
        // Reset namespace map
        this.namespaceMap = {};
        
        // Validate JSON
        this.validateJsonObject(json);
        
        // Convert JSON to XNode
        return this.jsonToXNode(json);
      },
      'Failed to convert JSON to XNode',
      'json-to-xml'
    );
  }

  /**
   * Convert JSON to XNode
   * @param json JSON object
   * @param parentNode Optional parent node
   * @returns XNode representation
   */
  private jsonToXNode(
    json: Record<string, any>, 
    parentNode?: XNode
  ): XNode {
    // Get the root element name (first property in the object)
    const elementName = Object.keys(json)[0];
    if (!elementName) {
      throw new Error("Empty JSON object");
    }
    
    // Handle special node types
    if (elementName === this.config.propNames.commentKey) {
      // Comment node
      const commentNode = XNode.createCommentNode(String(json[elementName]));
      commentNode.parent = parentNode;
      return commentNode;
    } else if (elementName.startsWith(this.config.propNames.processingInstrKey)) {
      // Processing instruction
      return this.createPiFromJson(elementName, json[elementName], parentNode);
    } else if (elementName === this.config.propNames.cdataKey) {
      // CDATA section
      const cdataNode = XNode.createCDATANode(String(json[elementName]));
      cdataNode.parent = parentNode;
      return cdataNode;
    } else if (elementName === "#text") {
      // Text node
      const textNode = XNode.createTextNode(String(json[elementName]));
      textNode.parent = parentNode;
      return textNode;
    }
    
    // Parse element name for possible namespace prefix
    let prefix: string | undefined;
    let localName: string = elementName;
    
    // Handle namespace prefix in element name
    if (this.config.preserveNamespaces && elementName.includes(':')) {
      const parts = elementName.split(':');
      prefix = parts[0];
      localName = parts[1];
    }
    
    // Get element value
    const elementValue = json[elementName];
    
    // Create element node
    const node = new XNode(localName, NodeType.ELEMENT_NODE);
    node.prefix = prefix;
    node.parent = parentNode;
    
    // Handle simple value cases
    if (elementValue === null || elementValue === undefined) {
      // Null or undefined becomes empty element
      return node;
    } else if (typeof elementValue === 'string' || 
               typeof elementValue === 'number' || 
               typeof elementValue === 'boolean') {
      // Simple scalar value becomes text content
      node.value = String(elementValue);
      return node;
    } else if (elementValue === '') {
      // Empty string (represents empty element)
      return node;
    }
    
    // Handle complex value (object)
    if (typeof elementValue === 'object') {
      // Process attributes if present
      if (elementValue[this.config.propNames.attributesKey]) {
        this.processAttributes(node, elementValue[this.config.propNames.attributesKey]);
      }
      
      // Handle different content types
      if (elementValue[this.config.propNames.textKey] !== undefined) {
        // Element with both attributes and text
        node.value = String(elementValue[this.config.propNames.textKey]);
      } else if (elementValue[this.config.propNames.contentKey]) {
        // Mixed content
        node.children = this.processMixedContent(
          elementValue[this.config.propNames.contentKey], 
          node
        );
      } else if (elementValue[this.config.propNames.cdataKey]) {
        // CDATA content
        const cdataNode = XNode.createCDATANode(
          String(elementValue[this.config.propNames.cdataKey])
        );
        cdataNode.parent = node;
        node.children = [cdataNode];
      } else {
        // Child elements and comments
        node.children = this.processChildren(elementValue, node);
      }
    }
    
    return node;
  }

  /**
   * Process attributes
   * @param node Target node
   * @param attributes Attributes object
   */
  private processAttributes(
    node: XNode, 
    attributes: Record<string, any>
  ): void {
    if (!attributes || typeof attributes !== 'object') {
      return;
    }
    
    // Initialize attributes if needed
    if (!node.attributes) {
      node.attributes = {};
    }
    
    // Process each attribute
    for (const [name, value] of Object.entries(attributes)) {
      // Handle namespace declarations
      if (this.config.preserveNamespaces && (name === 'xmlns' || name.startsWith('xmlns:'))) {
        this.processNamespaceDeclaration(node, name, String(value));
      } else {
        // Regular attribute
        node.attributes[name] = value;
      }
    }
  }

  /**
   * Process namespace declaration
   * @param node Target node
   * @param name Namespace attribute name (xmlns or xmlns:prefix)
   * @param value Namespace URI
   */
  private processNamespaceDeclaration(node: XNode, name: string, value: string): void {
    // Initialize namespace declarations if needed
    if (!node.namespaceDeclarations) {
      node.namespaceDeclarations = {};
    }
    
    if (name === 'xmlns') {
      // Default namespace
      node.namespaceDeclarations[''] = value;
      node.isDefaultNamespace = true;
      
      // Set node's namespace if no explicit prefix
      if (!node.prefix) {
        node.namespace = value;
      }
    } else if (name.startsWith('xmlns:')) {
      // Prefixed namespace
      const prefix = name.substring(6);
      node.namespaceDeclarations[prefix] = value;
      
      // If node has this prefix, set its namespace
      if (node.prefix === prefix) {
        node.namespace = value;
      }
    }
    
    // Add to global namespace map
    this.namespaceMap[name === 'xmlns' ? '' : name.substring(6)] = value;
  }

  /**
   * Process mixed content
   * @param content Mixed content array
   * @param parentNode Parent node
   * @returns Array of child nodes
   */
  private processMixedContent(
    content: any[],
    parentNode: XNode
  ): XNode[] {
    if (!Array.isArray(content)) {
      return [];
    }
    
    const children: XNode[] = [];
    
    for (const item of content) {
      if (item === null || item === undefined) {
        continue;
      }
      
      if (typeof item === 'string' || 
          typeof item === 'number' || 
          typeof item === 'boolean') {
        // Text node
        const textNode = XNode.createTextNode(String(item));
        textNode.parent = parentNode;
        children.push(textNode);
      } else if (typeof item === 'object') {
        // Element, CDATA, comment, or PI
        if (item[this.config.propNames.cdataKey]) {
          // CDATA section
          const cdataNode = XNode.createCDATANode(String(item[this.config.propNames.cdataKey]));
          cdataNode.parent = parentNode;
          children.push(cdataNode);
        } else if (item[this.config.propNames.commentKey]) {
          // Comment
          const commentNode = XNode.createCommentNode(String(item[this.config.propNames.commentKey]));
          commentNode.parent = parentNode;
          children.push(commentNode);
        } else {
          // Element node or processing instruction
          const childNode = this.jsonToXNode(item, parentNode);
          children.push(childNode);
        }
      }
    }
    
    return children;
  }

  /**
   * Process child elements
   * @param parent Parent element value
   * @param parentNode Parent node
   * @returns Array of child nodes
   */
  private processChildren(
    parent: Record<string, any>,
    parentNode: XNode
  ): XNode[] {
    const children: XNode[] = [];
    
    // Process each property that's not a special attribute
    for (const [key, value] of Object.entries(parent)) {
      // Skip special properties
      if (key === this.config.propNames.attributesKey || 
          key === this.config.propNames.textKey || 
          key === this.config.propNames.contentKey ||
          key === this.config.propNames.cdataKey) {
        continue;
      }
      
      // Handle comments
      if (key === this.config.propNames.commentKey) {
        if (this.config.preserveComments) {
          // Handle multiple comments
          if (Array.isArray(value)) {
            for (const comment of value) {
              const commentNode = XNode.createCommentNode(String(comment));
              commentNode.parent = parentNode;
              children.push(commentNode);
            }
          } else {
            const commentNode = XNode.createCommentNode(String(value));
            commentNode.parent = parentNode;
            children.push(commentNode);
          }
        }
        continue;
      }
      
      // Handle processing instructions
      if (key.startsWith(this.config.propNames.processingInstrKey)) {
        const piNode = this.createPiFromJson(key, value, parentNode);
        children.push(piNode);
        continue;
      }
      
      // Handle regular elements
      if (Array.isArray(value)) {
        // Array of elements with the same name
        for (const item of value) {
          const child = this.processChildElement(key, item, parentNode);
          if (child) {
            children.push(child);
          }
        }
      } else {
        // Single element
        const child = this.processChildElement(key, value, parentNode);
        if (child) {
          children.push(child);
        }
      }
    }
    
    return children;
  }

  /**
   * Process a single child element
   * @param name Element name
   * @param value Element value
   * @param parentNode Parent node
   * @returns Child node or null if invalid
   */
  private processChildElement(
    name: string,
    value: any,
    parentNode: XNode
  ): XNode | null {
    if (value === null || value === undefined) {
      return null;
    }
    
    // Create child with simple value
    if (typeof value === 'string' || 
        typeof value === 'number' || 
        typeof value === 'boolean' ||
        value === '') {
      // Parse name for namespace
      let prefix: string | undefined;
      let localName: string = name;
      
      if (this.config.preserveNamespaces && name.includes(':')) {
        const parts = name.split(':');
        prefix = parts[0];
        localName = parts[1];
      }
      
      // Create node
      const node = new XNode(localName, NodeType.ELEMENT_NODE);
      node.prefix = prefix;
      node.parent = parentNode;
      
      // Set namespace if we have it in our map
      if (prefix && this.namespaceMap[prefix]) {
        node.namespace = this.namespaceMap[prefix];
      }
      
      // Set value for non-empty elements
      if (value !== '') {
        node.value = String(value);
      }
      
      return node;
    }
    
    // Complex value (object)
    if (typeof value === 'object') {
      // Create element wrapper
      const wrapper: Record<string, any> = {};
      wrapper[name] = value;
      
      // Process with jsonToXNode
      return this.jsonToXNode(wrapper, parentNode);
    }
    
    return null;
  }

  /**
   * Create a processing instruction node
   * @param key Processing instruction key
   * @param value Processing instruction value
   * @param parentNode Parent node
   * @returns Processing instruction node
   */
  private createPiFromJson(
    key: string,
    value: any,
    parentNode?: XNode
  ): XNode {
    // Extract target from key
    const target = key.substring(this.config.propNames.processingInstrKey.length);
    
    // Build instruction data
    let data = '';
    if (value && value[this.config.propNames.attributesKey]) {
      const attrs = value[this.config.propNames.attributesKey];
      data = Object.entries(attrs)
        .map(([name, val]) => `${name}="${val}"`)
        .join(' ');
    }
    
    // Create node
    const piNode = XNode.createProcessingInstructionNode(target, data);
    piNode.parent = parentNode;
    
    return piNode;
  }

  /**
   * Validate JSON object
   * @param jsonObj JSON object to validate
   * @throws Error if validation fails
   */
  private validateJsonObject(jsonObj: Record<string, any>): void {
    ErrorUtils.validate(
      JsonUtils.isValidJsonObject(jsonObj),
      'Invalid JSON object: must be a non-array object',
      'json-to-xml'
    );
    
    ErrorUtils.validate(
      Object.keys(jsonObj).length === 1,
      'Invalid JSON object: must have exactly one root element',
      'json-to-xml'
    );
  }
}