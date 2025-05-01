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

interface EnvironmentInfo {
  isBrowser: boolean;
  isNode: boolean;
}

interface DOMImplementation {
  parser: any;
  serializer: any;
  docImpl: any;
  jsdomInstance?: JSDOMInstance;
}

/**
 * Detect the current environment (browser vs Node.js)
 */
function detectEnvironment(): EnvironmentInfo {
  const isBrowser = typeof window !== 'undefined' && !!window.document;
  return {
    isBrowser,
    isNode: !isBrowser
  };
}

/**
 * Initialize the appropriate DOM implementation for the current environment
 */
function initializeEnvironment(env: EnvironmentInfo): DOMImplementation {
  if (env.isBrowser) {
    // Browser environment
    if (!window.DOMParser) {
      throw new XJXError("DOMParser is not available in this environment");
    }
    if (!window.XMLSerializer) {
      throw new XJXError("XMLSerializer is not available in this environment");
    }

    return {
      parser: window.DOMParser,
      serializer: window.XMLSerializer,
      docImpl: document.implementation
    };
  } else {
    // Node.js environment - try JSDOM first, fall back to xmldom
    try {
      const { JSDOM } = require("jsdom");
      const jsdomInstance = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
        contentType: "text/xml",
      }) as JSDOMInstance;

      return {
        parser: jsdomInstance.window.DOMParser,
        serializer: jsdomInstance.window.XMLSerializer,
        docImpl: jsdomInstance.window.document.implementation,
        jsdomInstance
      };
    } catch (jsdomError) {
      try {
        const { DOMParser, XMLSerializer, DOMImplementation } = require('@xmldom/xmldom');
        const implementation = new DOMImplementation();
        
        return {
          parser: DOMParser,
          serializer: XMLSerializer,
          docImpl: implementation
        };
      } catch (xmldomError) {
        throw new XJXError(`Node.js environment detected but neither 'jsdom' nor '@xmldom/xmldom' are available.`);
      }
    }
  }
}

export const DOMAdapter = (() => {
  // Environment detection and initialization
  const env = detectEnvironment();
  const impl = initializeEnvironment(env);
  
  // Return the public API
  return {
    NodeType,
    
    parseFromString: (xmlString: string, contentType: string = 'text/xml') => {
      try {
        const parser = new impl.parser();
        return parser.parseFromString(xmlString, contentType);
      } catch (error) {
        throw new XJXError(`Failed to parse XML: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
    
    serializeToString: (node: Node) => {
      try {
        const serializer = new impl.serializer();
        return serializer.serializeToString(node);
      } catch (error) {
        throw new XJXError(`Failed to serialize XML: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
    
    createDocument: () => {
      try {
        // For browsers, create a document with a root element to avoid issues
        if (env.isBrowser) {
          const parser = new impl.parser();
          return parser.parseFromString('<temp></temp>', 'text/xml');
        } else {
          return impl.docImpl.createDocument(null, null, null);
        }
      } catch (error) {
        throw new XJXError(`Failed to create document: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
    
    createNode: (nodeType: NodeType, name?: string, value?: string): Node => {
      try {
        const doc = env.isBrowser ? document : impl.docImpl.createDocument(null, null, null);
        
        switch (nodeType) {
          case NodeType.ELEMENT_NODE:
            return doc.createElement(name || 'div');
            
          case NodeType.TEXT_NODE:
            return doc.createTextNode(value || '');
            
          case NodeType.CDATA_SECTION_NODE:
            // For browser compatibility, use document.implementation for CDATA
            const cdataDoc = env.isBrowser 
              ? document.implementation.createDocument(null, null, null)
              : doc;
            return cdataDoc.createCDATASection(value || '');
            
          case NodeType.COMMENT_NODE:
            return doc.createComment(value || '');
            
          case NodeType.PROCESSING_INSTRUCTION_NODE:
            return doc.createProcessingInstruction(name || 'xml', value || '');
            
          default:
            throw new XJXError(`Unsupported node type: ${nodeType}`);
        }
      } catch (error) {
        throw new XJXError(`Failed to create node: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
    
    createElement: (tagName: string): Element => {
      try {
        return DOMAdapter.createNode(NodeType.ELEMENT_NODE, tagName) as Element;
      } catch (error) {
        throw new XJXError(`Failed to create element: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
    
    createElementNS: (namespaceURI: string, qualifiedName: string): Element => {
      try {
        const doc = env.isBrowser ? document : impl.docImpl.createDocument(null, null, null);
        return doc.createElementNS(namespaceURI, qualifiedName);
      } catch (error) {
        throw new XJXError(`Failed to create element with namespace: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
    
    createTextNode: (data: string): Text => {
      return DOMAdapter.createNode(NodeType.TEXT_NODE, undefined, data) as Text;
    },
    
    createCDATASection: (data: string): CDATASection => {
      return DOMAdapter.createNode(NodeType.CDATA_SECTION_NODE, undefined, data) as CDATASection;
    },
    
    createComment: (data: string): Comment => {
      return DOMAdapter.createNode(NodeType.COMMENT_NODE, undefined, data) as Comment;
    },
    
    createProcessingInstruction: (target: string, data: string): ProcessingInstruction => {
      return DOMAdapter.createNode(NodeType.PROCESSING_INSTRUCTION_NODE, target, data) as ProcessingInstruction;
    },
    
    // Utility methods
    
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
    
    isNode: (obj: any): boolean => {
      return obj && typeof obj === 'object' && typeof obj.nodeType === 'number';
    },
    
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
      if (impl.jsdomInstance && typeof impl.jsdomInstance.window.close === 'function') {
        impl.jsdomInstance.window.close();
      }
    }
  };
})();