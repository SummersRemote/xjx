/**
 * DOM - Static utility for DOM operations with unified interface for browser and Node.js
 * 
 * Provides a consistent DOM API across different environments, handling the necessary
 * abstractions and adapter logic to work in both browser and Node.js environments.
 */
import { ErrorHandler } from './error-utils';
import { NodeType } from '../types/dom-types';

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
 * Static DOM adapter utilities
 */
export class DOM {
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
            throw ErrorHandler.environment(
              "Node.js environment detected but neither 'jsdom' nor '@xmldom/xmldom' are available."
            );
          }
        }
      } else {
        // Browser environment
        if (!window.DOMParser) {
          throw ErrorHandler.environment("DOMParser is not available in this environment");
        }

        if (!window.XMLSerializer) {
          throw ErrorHandler.environment("XMLSerializer is not available in this environment");
        }

        DOM.domParser = window.DOMParser;
        DOM.xmlSerializer = window.XMLSerializer;
        DOM.docImplementation = document.implementation;
      }
    } catch (error) {
      throw ErrorHandler.environment("DOM environment initialization failed", error);
    }
  }

  /**
   * Expose NodeType enum for convenience
   */
  public static readonly NodeType = NodeType;
  
  /**
   * Create a new DOM parser
   * @returns New DOM parser instance
   */
  public static createParser(): any {
    return ErrorHandler.try(
      () => new DOM.domParser(),
      'Failed to create DOM parser',
      'environment'
    );
  }
  
  /**
   * Create a new XML serializer
   * @returns New XML serializer instance
   */
  public static createSerializer(): any {
    return ErrorHandler.try(
      () => new DOM.xmlSerializer(),
      'Failed to create XML serializer',
      'environment'
    );
  }
  
  /**
   * Parse XML string to DOM document
   * @param xmlString XML string to parse
   * @param contentType Content type (default: text/xml)
   * @returns Parsed DOM document
   */
  public static parseFromString(xmlString: string, contentType: string = 'text/xml'): Document {
    return ErrorHandler.try(
      () => {
        const parser = new DOM.domParser();
        return parser.parseFromString(xmlString, contentType);
      },
      'Failed to parse XML',
      'xml-to-json'
    );
  }
    
  /**
   * Serialize DOM node to XML string
   * @param node DOM node to serialize
   * @returns Serialized XML string
   */
  public static serializeToString(node: Node): string {
    return ErrorHandler.try(
      () => {
        const serializer = new DOM.xmlSerializer();
        return serializer.serializeToString(node);
      },
      'Failed to serialize XML',
      'json-to-xml'
    );
  }
    
  /**
   * Create a new XML document
   * @returns New document
   */
  public static createDocument(): Document {
    return ErrorHandler.try(
      () => {
        // For browsers, create a document with a root element to avoid issues
        if (typeof window !== "undefined") {
          const parser = new DOM.domParser();
          return parser.parseFromString('<temp></temp>', 'text/xml');
        } else {
          return DOM.docImplementation.createDocument(null, null, null);
        }
      },
      'Failed to create document',
      'general'
    );
  }
    
  /**
   * Create a DOM element
   * @param tagName Tag name for the element
   * @returns New element
   */
  public static createElement(tagName: string): Element {
    return ErrorHandler.try(
      () => {
        if (typeof window !== "undefined") {
          return document.createElement(tagName);
        } else {
          const doc = DOM.docImplementation.createDocument(null, null, null);
          return doc.createElement(tagName);
        }
      },
      `Failed to create element: ${tagName}`,
      'general'
    );
  }
    
  /**
   * Create a namespaced DOM element
   * @param namespaceURI Namespace URI
   * @param qualifiedName Qualified name with optional prefix
   * @returns New element with namespace
   */
  public static createElementNS(namespaceURI: string, qualifiedName: string): Element {
    return ErrorHandler.try(
      () => {
        if (typeof window !== "undefined") {
          return document.createElementNS(namespaceURI, qualifiedName);
        } else {
          const doc = DOM.docImplementation.createDocument(null, null, null);
          return doc.createElementNS(namespaceURI, qualifiedName);
        }
      },
      `Failed to create element with namespace: ${qualifiedName}`,
      'general'
    );
  }
    
  /**
   * Create a text node
   * @param data Text content
   * @returns New text node
   */
  public static createTextNode(data: string): Text {
    return ErrorHandler.try(
      () => {
        if (typeof window !== "undefined") {
          return document.createTextNode(data);
        } else {
          const doc = DOM.docImplementation.createDocument(null, null, null);
          return doc.createTextNode(data);
        }
      },
      'Failed to create text node',
      'general'
    );
  }
    
  /**
   * Create a CDATA section
   * @param data CDATA content
   * @returns New CDATA section
   */
  public static createCDATASection(data: string): CDATASection {
    return ErrorHandler.try(
      () => {
        // For browser compatibility, use document.implementation to create CDATA
        if (typeof window !== "undefined") {
          const doc = document.implementation.createDocument(null, null, null);
          return doc.createCDATASection(data);
        } else {
          const doc = DOM.docImplementation.createDocument(null, null, null);
          return doc.createCDATASection(data);
        }
      },
      'Failed to create CDATA section',
      'general'
    );
  }
    
  /**
   * Create a comment node
   * @param data Comment content
   * @returns New comment node
   */
  public static createComment(data: string): Comment {
    return ErrorHandler.try(
      () => {
        if (typeof window !== "undefined") {
          return document.createComment(data);
        } else {
          const doc = DOM.docImplementation.createDocument(null, null, null);
          return doc.createComment(data);
        }
      },
      'Failed to create comment',
      'general'
    );
  }
    
  /**
   * Create a processing instruction
   * @param target Processing instruction target
   * @param data Processing instruction data
   * @returns New processing instruction
   */
  public static createProcessingInstruction(target: string, data: string): ProcessingInstruction {
    return ErrorHandler.try(
      () => {
        if (typeof window !== "undefined") {
          const doc = document.implementation.createDocument(null, null, null);
          return doc.createProcessingInstruction(target, data);
        } else {
          const doc = DOM.docImplementation.createDocument(null, null, null);
          return doc.createProcessingInstruction(target, data);
        }
      },
      'Failed to create processing instruction',
      'general'
    );
  }
    
  /**
   * Set a namespaced attribute on an element
   * @param element Target element
   * @param namespaceURI Namespace URI or null
   * @param qualifiedName Qualified name
   * @param value Attribute value
   */
  public static setNamespacedAttribute(
    element: Element, 
    namespaceURI: string | null, 
    qualifiedName: string, 
    value: string
  ): void {
    ErrorHandler.try(
      () => {
        if (namespaceURI) {
          element.setAttributeNS(namespaceURI, qualifiedName, value);
        } else {
          element.setAttribute(qualifiedName, value);
        }
      },
      `Failed to set attribute: ${qualifiedName}`,
      'general'
    );
  }
    
  /**
   * Check if an object is a DOM node
   * @param obj Object to check
   * @returns True if the object is a DOM node
   */
  public static isNode(obj: any): boolean {
    try {
      return obj && typeof obj === 'object' && typeof obj.nodeType === 'number';
    } catch (error) {
      return false;
    }
  }
    
  /**
   * Get DOM node type as string for debugging
   * @param nodeType Node type number
   * @returns Human-readable node type
   */
  public static getNodeTypeName(nodeType: number): string {
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
  public static getNodeAttributes(node: Element): Record<string, string> {
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
  public static cleanup(): void {
    if (DOM.jsdomInstance && typeof DOM.jsdomInstance.window.close === 'function') {
      DOM.jsdomInstance.window.close();
    }
  }
}