/**
 * DOM operations with unified interface for browser and Node.js
 */
import { catchAndRelease, ErrorType, LogLevel } from './error';

/**
 * DOM node types as an enum for better type safety
 */
export enum NodeType {
  ELEMENT_NODE = 1,
  ATTRIBUTE_NODE = 2,
  TEXT_NODE = 3, 
  CDATA_SECTION_NODE = 4,
  PROCESSING_INSTRUCTION_NODE = 7,
  COMMENT_NODE = 8,
  DOCUMENT_NODE = 9
}

/**
 * DOM Window interface for compatibility
 */
interface DOMWindow {
  DOMParser: any;
  XMLSerializer: any;
  document: Document;
  close?: () => void; 
}

/**
 * JSDOM instance interface for compatibility
 */
interface JSDOMInstance {
  window: DOMWindow;
}

/**
 * DOM utilities for consistent DOM operations across environments
 */
export class DOM {
  
  static readonly NodeType = NodeType;

  // Environment-specific DOM implementation
  private static domParser: any;
  private static xmlSerializer: any;
  private static docImplementation: any;
  private static jsdomInstance: JSDOMInstance | null = null;
  
  /**
   * Static initialization block - sets up the DOM environment
   */
  static {
    try {
      if (typeof window === "undefined") {
        // Node.js environment - try JSDOM first
        try {
          const { JSDOM } = require("jsdom");
          DOM.jsdomInstance = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
            contentType: "text/xml",
          }) as JSDOMInstance;

          DOM.domParser = DOM.jsdomInstance.window.DOMParser;
          DOM.xmlSerializer = DOM.jsdomInstance.window.XMLSerializer;
          DOM.docImplementation = DOM.jsdomInstance.window.document.implementation;
        } catch (jsdomError) {
          // Fall back to xmldom if JSDOM isn't available
          try {
            const { DOMParser, XMLSerializer, DOMImplementation } = require('@xmldom/xmldom');
            DOM.domParser = DOMParser;
            DOM.xmlSerializer = XMLSerializer;
            const implementation = new DOMImplementation();
            DOM.docImplementation = implementation;
          } catch (xmldomError) {
            throw new Error("Node.js environment detected but neither 'jsdom' nor '@xmldom/xmldom' are available.");
          }
        }
      } else {
        // Browser environment
        if (!window.DOMParser) {
          throw new Error("DOMParser is not available in this environment");
        }

        if (!window.XMLSerializer) {
          throw new Error("XMLSerializer is not available in this environment");
        }

        DOM.domParser = window.DOMParser;
        DOM.xmlSerializer = window.XMLSerializer;
        DOM.docImplementation = document.implementation;
      }
    } catch (error) {
      throw catchAndRelease(error, "DOM environment initialization failed", {
        errorType: ErrorType.ENV
      });
    }
  }
  
  /**
   * Create a new DOM parser
   * @returns New DOM parser instance
   */
  static createParser(): any {
    try {
      return new DOM.domParser();
    } catch (error) {
      return catchAndRelease(error, 'Failed to create DOM parser', {
        errorType: ErrorType.ENV
      });
    }
  }
  
  /**
   * Create a new XML serializer
   * @returns New XML serializer instance
   */
  static createSerializer(): any {
    try {
      return new DOM.xmlSerializer();
    } catch (error) {
      return catchAndRelease(error, 'Failed to create XML serializer', {
        errorType: ErrorType.ENV
      });
    }
  }
  
  /**
   * Parse XML string to DOM document
   * @param xmlString XML string to parse
   * @param contentType Content type (default: text/xml)
   * @returns Parsed DOM document
   */
  static parseFromString(xmlString: string, contentType: string = 'text/xml'): Document {
    try {
      const parser = new DOM.domParser();
      return parser.parseFromString(xmlString, contentType);
    } catch (error) {
      return catchAndRelease(error, 'Failed to parse XML', {
        errorType: ErrorType.PARSE
      });
    }
  }
    
  /**
   * Serialize DOM node to XML string
   * @param node DOM node to serialize
   * @returns Serialized XML string
   */
  static serializeToString(node: Node): string {
    try {
      const serializer = new DOM.xmlSerializer();
      return serializer.serializeToString(node);
    } catch (error) {
      return catchAndRelease(error, 'Failed to serialize XML', {
        errorType: ErrorType.SERIALIZE
      });
    }
  }
    
  /**
   * Create a new XML document
   * @returns New document
   */
  static createDocument(): Document {
    try {
      // For browsers, create a document with a root element to avoid issues
      if (typeof window !== "undefined") {
        const parser = new DOM.domParser();
        return parser.parseFromString('<temp></temp>', 'text/xml');
      } else {
        return DOM.docImplementation.createDocument(null, null, null);
      }
    } catch (error) {
      return catchAndRelease(error, 'Failed to create document', {
        errorType: ErrorType.GENERAL
      });
    }
  }
    
  /**
   * Create a DOM element
   * @param tagName Tag name for the element
   * @returns New element
   */
  static createElement(tagName: string): Element {
    try {
      if (typeof window !== "undefined") {
        return document.createElement(tagName);
      } else {
        const doc = DOM.docImplementation.createDocument(null, null, null);
        return doc.createElement(tagName);
      }
    } catch (error) {
      return catchAndRelease(error, `Failed to create element: ${tagName}`, {
        errorType: ErrorType.GENERAL
      });
    }
  }
    
  /**
   * Create a namespaced DOM element
   * @param namespaceURI Namespace URI
   * @param qualifiedName Qualified name with optional prefix
   * @returns New element with namespace
   */
  static createElementNS(namespaceURI: string, qualifiedName: string): Element {
    try {
      if (typeof window !== "undefined") {
        return document.createElementNS(namespaceURI, qualifiedName);
      } else {
        const doc = DOM.docImplementation.createDocument(null, null, null);
        return doc.createElementNS(namespaceURI, qualifiedName);
      }
    } catch (error) {
      return catchAndRelease(error, `Failed to create element with namespace: ${qualifiedName}`, {
        errorType: ErrorType.GENERAL
      });
    }
  }
    
  /**
   * Create a text node
   * @param data Text content
   * @returns New text node
   */
  static createTextNode(data: string): Text {
    try {
      if (typeof window !== "undefined") {
        return document.createTextNode(data);
      } else {
        const doc = DOM.docImplementation.createDocument(null, null, null);
        return doc.createTextNode(data);
      }
    } catch (error) {
      return catchAndRelease(error, 'Failed to create text node', {
        errorType: ErrorType.GENERAL
      });
    }
  }
    
  /**
   * Create a CDATA section
   * @param data CDATA content
   * @returns New CDATA section
   */
  static createCDATASection(data: string): CDATASection {
    try {
      // For browser compatibility, use document.implementation to create CDATA
      if (typeof window !== "undefined") {
        const doc = document.implementation.createDocument(null, null, null);
        return doc.createCDATASection(data);
      } else {
        const doc = DOM.docImplementation.createDocument(null, null, null);
        return doc.createCDATASection(data);
      }
    } catch (error) {
      return catchAndRelease(error, 'Failed to create CDATA section', {
        errorType: ErrorType.GENERAL
      });
    }
  }
    
  /**
   * Create a comment node
   * @param data Comment content
   * @returns New comment node
   */
  static createComment(data: string): Comment {
    try {
      if (typeof window !== "undefined") {
        return document.createComment(data);
      } else {
        const doc = DOM.docImplementation.createDocument(null, null, null);
        return doc.createComment(data);
      }
    } catch (error) {
      return catchAndRelease(error, 'Failed to create comment', {
        errorType: ErrorType.GENERAL
      });
    }
  }
    
  /**
   * Create a processing instruction
   * @param target Processing instruction target
   * @param data Processing instruction data
   * @returns New processing instruction
   */
  static createProcessingInstruction(target: string, data: string): ProcessingInstruction {
    try {
      if (typeof window !== "undefined") {
        const doc = document.implementation.createDocument(null, null, null);
        return doc.createProcessingInstruction(target, data);
      } else {
        const doc = DOM.docImplementation.createDocument(null, null, null);
        return doc.createProcessingInstruction(target, data);
      }
    } catch (error) {
      return catchAndRelease(error, 'Failed to create processing instruction', {
        errorType: ErrorType.GENERAL
      });
    }
  }
    
  /**
   * Set a namespaced attribute on an element
   * @param element Target element
   * @param namespaceURI Namespace URI or null
   * @param qualifiedName Qualified name
   * @param value Attribute value
   */
  static setNamespacedAttribute(
    element: Element, 
    namespaceURI: string | null, 
    qualifiedName: string, 
    value: string
  ): void {
    try {
      if (namespaceURI) {
        element.setAttributeNS(namespaceURI, qualifiedName, value);
      } else {
        element.setAttribute(qualifiedName, value);
      }
    } catch (error) {
      catchAndRelease(error, `Failed to set attribute: ${qualifiedName}`, {
        errorType: ErrorType.GENERAL
      });
    }
  }
    
  /**
   * Check if an object is a DOM node
   * @param obj Object to check
   * @returns True if the object is a DOM node
   */
  static isNode(obj: any): boolean {
    try {
      return obj && typeof obj === 'object' && typeof obj.nodeType === 'number';
    } catch (error) {
      return catchAndRelease(error, 'Failed to check if object is a DOM node', {
        errorType: ErrorType.GENERAL,
        defaultValue: false
      });
    }
  }
    
  /**
   * Get DOM node type as string for debugging
   * @param nodeType Node type number
   * @returns Human-readable node type
   */
  static getNodeTypeName(nodeType: number): string {
    switch (nodeType) {
      case NodeType.ELEMENT_NODE: return 'ELEMENT_NODE';
      case NodeType.ATTRIBUTE_NODE: return 'ATTRIBUTE_NODE';
      case NodeType.TEXT_NODE: return 'TEXT_NODE';
      case NodeType.CDATA_SECTION_NODE: return 'CDATA_SECTION_NODE';
      case NodeType.PROCESSING_INSTRUCTION_NODE: return 'PROCESSING_INSTRUCTION_NODE';
      case NodeType.COMMENT_NODE: return 'COMMENT_NODE';
      case NodeType.DOCUMENT_NODE: return 'DOCUMENT_NODE';
      default: return `UNKNOWN_NODE_TYPE(${nodeType})`;
    }
  }
    
  /**
   * Get all node attributes as an object
   * @param node DOM element
   * @returns Object with attribute name-value pairs
   */
  static getNodeAttributes(node: Element): Record<string, string> {
    const result: Record<string, string> = {};
    for (let i = 0; i < node.attributes.length; i++) {
      const attr = node.attributes[i];
      result[attr.name] = attr.value;
    }
    return result;
  }
    
  /**
   * Cleanup method for releasing resources (mainly for JSDOM)
   */
  static cleanup(): void {
    if (DOM.jsdomInstance && typeof DOM.jsdomInstance.window.close === 'function') {
      DOM.jsdomInstance.window.close();
    }
  }
}