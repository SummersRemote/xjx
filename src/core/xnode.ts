/**
 * XNode - Interface for XML node representation
 * 
 * Defines the structure for nodes in the XJX object model
 */
import { NodeType } from './dom';

/**
 * XNode interface representing an XML node in the object model
 */
export interface XNode {
  // Core node properties
  name: string;
  type: number;
  value?: any;
  attributes?: Record<string, any>;
  children?: XNode[];
  namespace?: string;
  prefix?: string;
  parent?: XNode;
  namespaceDeclarations?: Record<string, string>;
  isDefaultNamespace?: boolean;
  
  // Metadata container for processing instructions and hints
  metadata?: Record<string, any>;
}

/**
 * Create an element node
 * @param name Element name
 * @returns New element node
 */
export function createElement(name: string): XNode {
  return {
    name,
    type: NodeType.ELEMENT_NODE
  };
}

/**
 * Create a text node
 * @param value Text content
 * @returns New text node
 */
export function createTextNode(value: string): XNode {
  return {
    name: "#text",
    type: NodeType.TEXT_NODE,
    value
  };
}

/**
 * Create a CDATA node
 * @param value CDATA content
 * @returns New CDATA node
 */
export function createCDATANode(value: string): XNode {
  return {
    name: "#cdata",
    type: NodeType.CDATA_SECTION_NODE,
    value
  };
}

/**
 * Create a comment node
 * @param value Comment content
 * @returns New comment node
 */
export function createCommentNode(value: string): XNode {
  return {
    name: "#comment",
    type: NodeType.COMMENT_NODE,
    value
  };
}

/**
 * Create a processing instruction node
 * @param target Processing instruction target
 * @param data Processing instruction data
 * @returns New processing instruction node
 */
export function createProcessingInstructionNode(target: string, data: string): XNode {
  return {
    name: "#pi",
    type: NodeType.PROCESSING_INSTRUCTION_NODE,
    value: data,
    attributes: { target }
  };
}

/**
 * Clone an XNode with optional deep flag
 * @param node Node to clone
 * @param deep Whether to clone children recursively
 * @returns Cloned node
 */
export function cloneNode(node: XNode, deep: boolean = false): XNode {
  if (!deep) {
    // Shallow clone
    return {
      ...node,
      parent: undefined,
      children: undefined
    };
  }
  
  // Deep clone
  const clone: XNode = {
    ...node,
    parent: undefined
  };
  
  // Clone attributes if present
  if (node.attributes) {
    clone.attributes = { ...node.attributes };
  }
  
  // Clone namespace declarations if present
  if (node.namespaceDeclarations) {
    clone.namespaceDeclarations = { ...node.namespaceDeclarations };
  }
  
  // Clone metadata if present
  if (node.metadata) {
    clone.metadata = { ...node.metadata };
  }
  
  // Clone children if present
  if (node.children) {
    clone.children = node.children.map(child => {
      const childClone = cloneNode(child, true);
      childClone.parent = clone;
      return childClone;
    });
  }
  
  return clone;
}

/**
 * Add a child node to a parent node
 * @param parent Parent node
 * @param child Child node to add
 * @returns Updated parent node
 */
export function addChild(parent: XNode, child: XNode): XNode {
  if (!parent.children) {
    parent.children = [];
  }
  
  // Set parent reference
  child.parent = parent;
  parent.children.push(child);
  
  return parent;
}

/**
 * Set an attribute on a node
 * @param node Node to modify
 * @param name Attribute name
 * @param value Attribute value
 * @returns Updated node
 */
export function setAttribute(node: XNode, name: string, value: any): XNode {
  if (!node.attributes) {
    node.attributes = {};
  }
  
  node.attributes[name] = value;
  return node;
}

/**
 * Get the text content of a node
 * @param node Node to get text from
 * @returns Text content or empty string
 */
export function getTextContent(node: XNode): string {
  // For text and CDATA nodes, return value directly
  if (node.type === NodeType.TEXT_NODE || node.type === NodeType.CDATA_SECTION_NODE) {
    return node.value?.toString() || '';
  }
  
  // If node has a direct value, return it
  if (node.value !== undefined && !node.children) {
    return node.value.toString();
  }
  
  // If node has children, combine their text content
  if (node.children) {
    return node.children
      .filter(child => 
        child.type === NodeType.TEXT_NODE || 
        child.type === NodeType.CDATA_SECTION_NODE ||
        child.type === NodeType.ELEMENT_NODE
      )
      .map(child => getTextContent(child))
      .join('');
  }
  
  return '';
}

/**
 * Set the text content of a node
 * @param node Node to modify
 * @param text New text content
 * @returns Updated node
 */
export function setTextContent(node: XNode, text: string): XNode {
  // For text and CDATA nodes, set the value directly
  if (node.type === NodeType.TEXT_NODE || node.type === NodeType.CDATA_SECTION_NODE) {
    node.value = text;
    return node;
  }
  
  // For element nodes, replace all children with a single text node
  if (node.type === NodeType.ELEMENT_NODE) {
    const textNode = createTextNode(text);
    textNode.parent = node;
    node.children = [textNode];
    
    // Clear direct value if it exists
    delete node.value;
    
    return node;
  }
  
  return node;
}