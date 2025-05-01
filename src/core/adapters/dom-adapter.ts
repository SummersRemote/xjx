/**
 * DOM Environment provider with unified interface for browser and Node.js
 */
import { XJXError } from '../types/error-types';
import { NodeType } from '../types/dom-types';

interface DOMWindow {
  DOMParser: any;
  XMLSerializer: any;
  document: Document;
  close?: () => void; 
}

interface JSDOMInstance {
  window: DOMWindow;
}

export const DOMAdapter = (() => {
  // Environment-specific DOM implementation
  let domParser: any;
  let xmlSerializer: any;
  let docImplementation: any;
  let jsdomInstance: JSDOMInstance | null = null;

  try {
    if (typeof window === "undefined") {
      // Node.js environment - try JSDOM first
      try {
        const { JSDOM } = require("jsdom");
        jsdomInstance = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
          contentType: "text/xml",
        }) as JSDOMInstance;

        domParser = jsdomInstance.window.DOMParser;
        xmlSerializer = jsdomInstance.window.XMLSerializer;
        docImplementation = jsdomInstance.window.document.implementation;
      } catch (jsdomError) {
        // Fall back to xmldom if JSDOM isn't available
        try {
          const { DOMParser, XMLSerializer, DOMImplementation } = require('@xmldom/xmldom');
          domParser = DOMParser;
          xmlSerializer = XMLSerializer;
          const implementation = new DOMImplementation();
          docImplementation = implementation;
        } catch (xmldomError) {
          throw new XJXError(`Node.js environment detected but neither 'jsdom' nor '@xmldom/xmldom' are available.`);
        }
      }
    } else {
      // Browser environment
      if (!window.DOMParser) {
        throw new XJXError("DOMParser is not available in this environment");
      }

      if (!window.XMLSerializer) {
        throw new XJXError("XMLSerializer is not available in this environment");
      }

      domParser = window.DOMParser;
      xmlSerializer = window.XMLSerializer;
      docImplementation = document.implementation;
    }
  } catch (error) {
    throw new XJXError(`DOM environment initialization failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  return {
    createParser: () => {
      try {
        return new domParser();
      } catch (error) {
        throw new XJXError(`Failed to create DOM parser: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
    
    createSerializer: () => {
      try {
        return new xmlSerializer();
      } catch (error) {
        throw new XJXError(`Failed to create XML serializer: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
    
    NodeType,
    
    parseFromString: (xmlString: string, contentType: string = 'text/xml') => {
      try {
        const parser = new domParser();
        return parser.parseFromString(xmlString, contentType);
      } catch (error) {
        throw new XJXError(`Failed to parse XML: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
    
    serializeToString: (node: Node) => {
      try {
        const serializer = new xmlSerializer();
        return serializer.serializeToString(node);
      } catch (error) {
        throw new XJXError(`Failed to serialize XML: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
    
    createDocument: () => {
      try {
        // For browsers, create a document with a root element to avoid issues
        if (typeof window !== "undefined") {
          const parser = new domParser();
          return parser.parseFromString('<temp></temp>', 'text/xml');
        } else {
          return docImplementation.createDocument(null, null, null);
        }
      } catch (error) {
        throw new XJXError(`Failed to create document: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
    
    createElement: (tagName: string) => {
      try {
        if (typeof window !== "undefined") {
          return document.createElement(tagName);
        } else {
          const doc = docImplementation.createDocument(null, null, null);
          return doc.createElement(tagName);
        }
      } catch (error) {
        throw new XJXError(`Failed to create element: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
    
    createElementNS: (namespaceURI: string, qualifiedName: string) => {
      try {
        if (typeof window !== "undefined") {
          return document.createElementNS(namespaceURI, qualifiedName);
        } else {
          const doc = docImplementation.createDocument(null, null, null);
          return doc.createElementNS(namespaceURI, qualifiedName);
        }
      } catch (error) {
        throw new XJXError(`Failed to create element with namespace: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
    
    createTextNode: (data: string) => {
      try {
        if (typeof window !== "undefined") {
          return document.createTextNode(data);
        } else {
          const doc = docImplementation.createDocument(null, null, null);
          return doc.createTextNode(data);
        }
      } catch (error) {
        throw new XJXError(`Failed to create text node: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
    
    createCDATASection: (data: string) => {
      try {
        // For browser compatibility, use document.implementation to create CDATA
        if (typeof window !== "undefined") {
          const doc = document.implementation.createDocument(null, null, null);
          return doc.createCDATASection(data);
        } else {
          const doc = docImplementation.createDocument(null, null, null);
          return doc.createCDATASection(data);
        }
      } catch (error) {
        throw new XJXError(`Failed to create CDATA section: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
    
    createComment: (data: string) => {
      try {
        if (typeof window !== "undefined") {
          return document.createComment(data);
        } else {
          const doc = docImplementation.createDocument(null, null, null);
          return doc.createComment(data);
        }
      } catch (error) {
        throw new XJXError(`Failed to create comment: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
    
    createProcessingInstruction: (target: string, data: string) => {
      try {
        if (typeof window !== "undefined") {
          const doc = document.implementation.createDocument(null, null, null);
          return doc.createProcessingInstruction(target, data);
        } else {
          const doc = docImplementation.createDocument(null, null, null);
          return doc.createProcessingInstruction(target, data);
        }
      } catch (error) {
        throw new XJXError(`Failed to create processing instruction: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
    
    // Helper methods
    
    /**
     * Creates a proper namespace qualified attribute
     */
    setNamespacedAttribute: (element: Element, namespaceURI: string | null, qualifiedName: string, value: string): void => {
      try {
        if (namespaceURI) {
          element.setAttributeNS(namespaceURI, qualifiedName, value);
        } else {
          element.setAttribute(qualifiedName, value);
        }
      } catch (error) {
        throw new XJXError(`Failed to set attribute: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
    
    /**
     * Check if an object is a DOM node
     */
    isNode: (obj: any): boolean => {
      try {
        return obj && typeof obj === 'object' && typeof obj.nodeType === 'number';
      } catch (error) {
        return false;
      }
    },
    
    /**
     * Get DOM node type as string for debugging
     */
    getNodeTypeName: (nodeType: number): string => {
      switch (nodeType) {
        case NodeType.ELEMENT_NODE: return 'ELEMENT_NODE';
        case NodeType.TEXT_NODE: return 'TEXT_NODE';
        case NodeType.CDATA_SECTION_NODE: return 'CDATA_SECTION_NODE';
        case NodeType.COMMENT_NODE: return 'COMMENT_NODE';
        case NodeType.PROCESSING_INSTRUCTION_NODE: return 'PROCESSING_INSTRUCTION_NODE';
        default: return `UNKNOWN_NODE_TYPE(${nodeType})`;
      }
    },
    
    /**
     * Get all node attributes as an object
     */
    getNodeAttributes: (node: Element): Record<string, string> => {
      const result: Record<string, string> = {};
      for (let i = 0; i < node.attributes.length; i++) {
        const attr = node.attributes[i];
        result[attr.name] = attr.value;
      }
      return result;
    },
    
    // Cleanup method (mainly for JSDOM)
    cleanup: () => {
      if (jsdomInstance && typeof jsdomInstance.window.close === 'function') {
        jsdomInstance.window.close();
      }
    }
  };
})();