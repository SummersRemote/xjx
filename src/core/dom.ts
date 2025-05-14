/**
 * DOM operations with unified interface for browser and Node.js
 */
import { logger, validate, ValidationError, EnvironmentError, ParseError, SerializeError } from './error';

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
      logger.debug('Initializing DOM environment');
      
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
          
          logger.debug('Initialized DOM environment using JSDOM');
        } catch (jsdomError) {
          // Fall back to xmldom if JSDOM isn't available
          try {
            const { DOMParser, XMLSerializer, DOMImplementation } = require('@xmldom/xmldom');
            DOM.domParser = DOMParser;
            DOM.xmlSerializer = XMLSerializer;
            const implementation = new DOMImplementation();
            DOM.docImplementation = implementation;
            
            logger.debug('Initialized DOM environment using xmldom');
          } catch (xmldomError) {
            const error = new EnvironmentError("Node.js environment detected but neither 'jsdom' nor '@xmldom/xmldom' are available.");
            logger.error('DOM environment initialization failed', error);
            throw error;
          }
        }
      } else {
        // Browser environment
        if (!window.DOMParser) {
          const error = new EnvironmentError("DOMParser is not available in this environment");
          logger.error('DOM environment initialization failed', error);
          throw error;
        }

        if (!window.XMLSerializer) {
          const error = new EnvironmentError("XMLSerializer is not available in this environment");
          logger.error('DOM environment initialization failed', error);
          throw error;
        }

        DOM.domParser = window.DOMParser;
        DOM.xmlSerializer = window.XMLSerializer;
        DOM.docImplementation = document.implementation;
        
        logger.debug('Initialized DOM environment using browser APIs');
      }
    } catch (err) {
      if (err instanceof EnvironmentError) {
        logger.error('DOM environment initialization failed', err);
        throw err;
      } else {
        const error = new EnvironmentError("DOM environment initialization failed", err);
        logger.error('DOM environment initialization failed', error);
        throw error;
      }
    }
  }
  
  /**
   * Create a new DOM parser
   * @returns New DOM parser instance
   */
  static createParser(): any {
    try {
      validate(DOM.domParser !== undefined, "DOM parser is not initialized");
      
      const parser = new DOM.domParser();
      logger.debug('Created new DOM parser');
      return parser;
    } catch (err) {
      if (err instanceof ValidationError) {
        logger.error('Failed to create DOM parser', err);
        throw err;
      } else {
        const error = new EnvironmentError('Failed to create DOM parser', err);
        logger.error('Failed to create DOM parser', error);
        throw error;
      }
    }
  }
  
  /**
   * Create a new XML serializer
   * @returns New XML serializer instance
   */
  static createSerializer(): any {
    try {
      validate(DOM.xmlSerializer !== undefined, "XML serializer is not initialized");
      
      const serializer = new DOM.xmlSerializer();
      logger.debug('Created new XML serializer');
      return serializer;
    } catch (err) {
      if (err instanceof ValidationError) {
        logger.error('Failed to create XML serializer', err);
        throw err;
      } else {
        const error = new EnvironmentError('Failed to create XML serializer', err);
        logger.error('Failed to create XML serializer', error);
        throw error;
      }
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
      // VALIDATION: Check for valid inputs
      validate(typeof xmlString === "string", "XML string must be a string");
      validate(typeof contentType === "string", "Content type must be a string");
      validate(DOM.domParser !== undefined, "DOM parser is not initialized");
      
      const parser = new DOM.domParser();
      const doc = parser.parseFromString(xmlString, contentType);
      
      // Check for parsing errors
      const errors = doc.getElementsByTagName("parsererror");
      if (errors.length > 0) {
        const errorMessage = errors[0].textContent || "Unknown parse error";
        throw new ParseError(`XML parsing error: ${errorMessage}`, xmlString);
      }
      
      logger.debug('Successfully parsed XML string to DOM document', {
        rootElement: doc.documentElement?.nodeName
      });
      
      return doc;
    } catch (err) {
      if (err instanceof ValidationError || err instanceof ParseError) {
        logger.error('Failed to parse XML string', err);
        throw err;
      } else {
        const error = new ParseError('Failed to parse XML string', xmlString);
        logger.error('Failed to parse XML string', error);
        throw error;
      }
    }
  }
    
  /**
   * Serialize DOM node to XML string
   * @param node DOM node to serialize
   * @returns Serialized XML string
   */
  static serializeToString(node: Node): string {
    try {
      // VALIDATION: Check for valid input
      validate(node !== null && node !== undefined, "Node must be provided");
      validate(DOM.xmlSerializer !== undefined, "XML serializer is not initialized");
      
      const serializer = new DOM.xmlSerializer();
      const result = serializer.serializeToString(node);
      
      logger.debug('Successfully serialized DOM node to XML string', {
        nodeType: node.nodeType,
        resultLength: result.length
      });
      
      return result;
    } catch (err) {
      if (err instanceof ValidationError) {
        logger.error('Failed to serialize DOM node', err);
        throw err;
      } else {
        const error = new SerializeError('Failed to serialize DOM node', {
          nodeType: node.nodeType,
          nodeName: node.nodeName
        });
        logger.error('Failed to serialize DOM node', error);
        throw error;
      }
    }
  }
    
  /**
   * Create a new XML document
   * @returns New document
   */
  static createDocument(): Document {
    try {
      validate(DOM.docImplementation !== undefined, "Document implementation is not initialized");
      
      let doc: Document;
      
      // For browsers, create a document with a root element to avoid issues
      if (typeof window !== "undefined") {
        const parser = new DOM.domParser();
        doc = parser.parseFromString('<temp></temp>', 'text/xml');
      } else {
        doc = DOM.docImplementation.createDocument(null, null, null);
      }
      
      logger.debug('Created new XML document');
      return doc;
    } catch (err) {
      if (err instanceof ValidationError) {
        logger.error('Failed to create XML document', err);
        throw err;
      } else {
        const error = new EnvironmentError('Failed to create XML document', err);
        logger.error('Failed to create XML document', error);
        throw error;
      }
    }
  }
    
  /**
   * Create a DOM element
   * @param tagName Tag name for the element
   * @returns New element
   */
  static createElement(tagName: string): Element {
    try {
      // VALIDATION: Check for valid input
      validate(typeof tagName === "string", "Tag name must be a string");
      validate(tagName.length > 0, "Tag name cannot be empty");
      
      let element: Element;
      
      if (typeof window !== "undefined") {
        element = document.createElement(tagName);
      } else {
        validate(DOM.docImplementation !== undefined, "Document implementation is not initialized");
        const doc = DOM.docImplementation.createDocument(null, null, null);
        element = doc.createElement(tagName);
      }
      
      logger.debug('Created new DOM element', { tagName });
      return element;
    } catch (err) {
      if (err instanceof ValidationError) {
        logger.error('Failed to create DOM element', err);
        throw err;
      } else {
        const error = new EnvironmentError(`Failed to create element: ${tagName}`, err);
        logger.error('Failed to create DOM element', error);
        throw error;
      }
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
      // VALIDATION: Check for valid inputs
      validate(typeof namespaceURI === "string", "Namespace URI must be a string");
      validate(typeof qualifiedName === "string", "Qualified name must be a string");
      validate(qualifiedName.length > 0, "Qualified name cannot be empty");
      
      let element: Element;
      
      if (typeof window !== "undefined") {
        element = document.createElementNS(namespaceURI, qualifiedName);
      } else {
        validate(DOM.docImplementation !== undefined, "Document implementation is not initialized");
        const doc = DOM.docImplementation.createDocument(null, null, null);
        element = doc.createElementNS(namespaceURI, qualifiedName);
      }
      
      logger.debug('Created new namespaced DOM element', { 
        namespaceURI, 
        qualifiedName 
      });
      
      return element;
    } catch (err) {
      if (err instanceof ValidationError) {
        logger.error('Failed to create namespaced DOM element', err);
        throw err;
      } else {
        const error = new EnvironmentError(`Failed to create namespaced element: ${qualifiedName}`, err);
        logger.error('Failed to create namespaced DOM element', error);
        throw error;
      }
    }
  }
    
  /**
   * Create a text node
   * @param data Text content
   * @returns New text node
   */
  static createTextNode(data: string): Text {
    try {
      // VALIDATION: Check for valid input
      validate(typeof data === "string", "Text data must be a string");
      
      let textNode: Text;
      
      if (typeof window !== "undefined") {
        textNode = document.createTextNode(data);
      } else {
        validate(DOM.docImplementation !== undefined, "Document implementation is not initialized");
        const doc = DOM.docImplementation.createDocument(null, null, null);
        textNode = doc.createTextNode(data);
      }
      
      logger.debug('Created new text node', { dataLength: data.length });
      return textNode;
    } catch (err) {
      if (err instanceof ValidationError) {
        logger.error('Failed to create text node', err);
        throw err;
      } else {
        const error = new EnvironmentError('Failed to create text node', err);
        logger.error('Failed to create text node', error);
        throw error;
      }
    }
  }
    
  /**
   * Create a CDATA section
   * @param data CDATA content
   * @returns New CDATA section
   */
  static createCDATASection(data: string): CDATASection {
    try {
      // VALIDATION: Check for valid input
      validate(typeof data === "string", "CDATA data must be a string");
      
      let cdataSection: CDATASection;
      
      // For browser compatibility, use document.implementation to create CDATA
      if (typeof window !== "undefined") {
        validate(document.implementation !== undefined, "Document implementation is not available");
        const doc = document.implementation.createDocument(null, null, null);
        cdataSection = doc.createCDATASection(data);
      } else {
        validate(DOM.docImplementation !== undefined, "Document implementation is not initialized");
        const doc = DOM.docImplementation.createDocument(null, null, null);
        cdataSection = doc.createCDATASection(data);
      }
      
      logger.debug('Created new CDATA section', { dataLength: data.length });
      return cdataSection;
    } catch (err) {
      if (err instanceof ValidationError) {
        logger.error('Failed to create CDATA section', err);
        throw err;
      } else {
        const error = new EnvironmentError('Failed to create CDATA section', err);
        logger.error('Failed to create CDATA section', error);
        throw error;
      }
    }
  }
    
  /**
   * Create a comment node
   * @param data Comment content
   * @returns New comment node
   */
  static createComment(data: string): Comment {
    try {
      // VALIDATION: Check for valid input
      validate(typeof data === "string", "Comment data must be a string");
      
      let comment: Comment;
      
      if (typeof window !== "undefined") {
        comment = document.createComment(data);
      } else {
        validate(DOM.docImplementation !== undefined, "Document implementation is not initialized");
        const doc = DOM.docImplementation.createDocument(null, null, null);
        comment = doc.createComment(data);
      }
      
      logger.debug('Created new comment node', { dataLength: data.length });
      return comment;
    } catch (err) {
      if (err instanceof ValidationError) {
        logger.error('Failed to create comment node', err);
        throw err;
      } else {
        const error = new EnvironmentError('Failed to create comment node', err);
        logger.error('Failed to create comment node', error);
        throw error;
      }
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
      // VALIDATION: Check for valid inputs
      validate(typeof target === "string", "Processing instruction target must be a string");
      validate(target.length > 0, "Processing instruction target cannot be empty");
      validate(typeof data === "string", "Processing instruction data must be a string");
      
      let pi: ProcessingInstruction;
      
      if (typeof window !== "undefined") {
        validate(document.implementation !== undefined, "Document implementation is not available");
        const doc = document.implementation.createDocument(null, null, null);
        pi = doc.createProcessingInstruction(target, data);
      } else {
        validate(DOM.docImplementation !== undefined, "Document implementation is not initialized");
        const doc = DOM.docImplementation.createDocument(null, null, null);
        pi = doc.createProcessingInstruction(target, data);
      }
      
      logger.debug('Created new processing instruction', { 
        target, 
        dataLength: data.length 
      });
      
      return pi;
    } catch (err) {
      if (err instanceof ValidationError) {
        logger.error('Failed to create processing instruction', err);
        throw err;
      } else {
        const error = new EnvironmentError('Failed to create processing instruction', err);
        logger.error('Failed to create processing instruction', error);
        throw error;
      }
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
      // VALIDATION: Check for valid inputs
      validate(element !== null && element !== undefined, "Element must be provided");
      validate(typeof qualifiedName === "string", "Qualified name must be a string");
      validate(qualifiedName.length > 0, "Qualified name cannot be empty");
      validate(typeof value === "string", "Attribute value must be a string");
      
      if (namespaceURI) {
        element.setAttributeNS(namespaceURI, qualifiedName, value);
      } else {
        element.setAttribute(qualifiedName, value);
      }
      
      logger.debug('Set namespaced attribute on element', { 
        elementName: element.nodeName, 
        qualifiedName, 
        namespaceURI: namespaceURI || '(none)' 
      });
    } catch (err) {
      if (err instanceof ValidationError) {
        logger.error('Failed to set namespaced attribute', err);
        throw err;
      } else {
        const error = new EnvironmentError(`Failed to set attribute: ${qualifiedName}`, err);
        logger.error('Failed to set namespaced attribute', error);
        throw error;
      }
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
    } catch (err) {
      logger.error('Failed to check if object is a DOM node', err);
      return false;
    }
  }
    
  /**
   * Get DOM node type as string for debugging
   * @param nodeType Node type number
   * @returns Human-readable node type
   */
  static getNodeTypeName(nodeType: number): string {
    try {
      // VALIDATION: Check for valid input
      validate(Number.isInteger(nodeType), "Node type must be an integer");
      
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
    } catch (err) {
      if (err instanceof ValidationError) {
        logger.error('Failed to get node type name', err);
        throw err;
      }
      logger.error('Failed to get node type name', err);
      return `UNKNOWN_NODE_TYPE(${nodeType})`;
    }
  }
    
  /**
   * Get all node attributes as an object
   * @param node DOM element
   * @returns Object with attribute name-value pairs
   */
  static getNodeAttributes(node: Element): Record<string, string> {
    try {
      // VALIDATION: Check for valid input
      validate(node !== null && node !== undefined, "Node must be provided");
      validate(node.attributes !== undefined, "Node must have attributes property");
      
      const result: Record<string, string> = {};
      
      for (let i = 0; i < node.attributes.length; i++) {
        const attr = node.attributes[i];
        result[attr.name] = attr.value;
      }
      
      logger.debug('Retrieved node attributes', { 
        nodeName: node.nodeName, 
        attributeCount: Object.keys(result).length 
      });
      
      return result;
    } catch (err) {
      if (err instanceof ValidationError) {
        logger.error('Failed to get node attributes', err);
        throw err;
      } else {
        logger.error('Failed to get node attributes', err);
        return {};
      }
    }
  }
    
  /**
   * Cleanup method for releasing resources (mainly for JSDOM)
   */
  static cleanup(): void {
    try {
      if (DOM.jsdomInstance && typeof DOM.jsdomInstance.window.close === 'function') {
        DOM.jsdomInstance.window.close();
        logger.debug('Cleaned up JSDOM instance');
      }
    } catch (err) {
      logger.error('Failed to clean up DOM resources', err);
    }
  }
}