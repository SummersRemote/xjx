/**
 * DOM Adapter for XMLToJSON
 * Provides a unified interface for DOM operations across different environments.
 */
import { isNode, isBrowser } from './helpers';
import { EnvironmentError } from './errors';

/**
 * Interface for DOM implementation
 */
export interface DOMImplementation {
  parser: any;
  serializer: any;
  document: any;
  createDocument: () => Document;
}

/**
 * Creates a DOM implementation based on the environment or provided implementation
 */
export class DOMAdapter {
  private _parser: any;
  private _serializer: any;
  private _document: any;
  private _implementation: any;
  private _jsdomInstance: any = null;

  /**
   * Create a new DOMAdapter
   * @param customImplementation Optional custom DOM implementation
   */
  constructor(customImplementation?: DOMImplementation) {
    if (customImplementation) {
      // Use custom implementation if provided
      this._parser = customImplementation.parser;
      this._serializer = customImplementation.serializer;
      this._document = customImplementation.document;
      this._implementation = {
        createDocument: customImplementation.createDocument
      };
    } else if (isBrowser()) {
      // Browser environment
      this._parser = new DOMParser();
      this._serializer = new XMLSerializer();
      this._document = document;
      this._implementation = document.implementation;
    } else if (isNode()) {
      // Try JSDOM first
      try {
        const { JSDOM } = require('jsdom');
        this._jsdomInstance = new JSDOM('');
        this._parser = new this._jsdomInstance.window.DOMParser();
        this._serializer = new this._jsdomInstance.window.XMLSerializer();
        this._document = this._jsdomInstance.window.document;
        this._implementation = this._jsdomInstance.window.document.implementation;
      } catch (jsdomError) {
        // Fall back to xmldom if JSDOM isn't available
        try {
          const { DOMParser, XMLSerializer, DOMImplementation } = require('@xmldom/xmldom');
          this._parser = new DOMParser();
          this._serializer = new XMLSerializer();
          this._implementation = new DOMImplementation();
          this._document = this._implementation.createDocument(null, null, null);
        } catch (xmldomError) {
          throw new EnvironmentError(
            "Node.js environment detected. Please install either 'jsdom' or '@xmldom/xmldom' package, or provide a custom DOM implementation."
          );
        }
      }
    } else {
      throw new EnvironmentError("Unsupported environment");
    }
  }

  /**
   * Get the DOMParser instance
   */
  get parser() {
    return this._parser;
  }

  /**
   * Get the XMLSerializer instance
   */
  get serializer() {
    return this._serializer;
  }

  /**
   * Get the Document instance
   */
  get document() {
    return this._document;
  }

  /**
   * Parse XML string to DOM
   * @param xmlString XML string to parse
   * @param mimeType MIME type for parsing (default: 'text/xml')
   * @returns Parsed Document
   */
  parseFromString(xmlString: string, mimeType: string = 'text/xml'): Document {
    try {
      return this._parser.parseFromString(xmlString, mimeType);
    } catch (error) {
      throw new Error(`XML parsing error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Serialize DOM to XML string
   * @param doc Document to serialize
   * @returns XML string
   */
  serializeToString(doc: Document): string {
    try {
      return this._serializer.serializeToString(doc);
    } catch (error) {
      throw new Error(`XML serialization error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Create a new empty XML document
   * @returns New Document
   */
  createDocument(): Document {
    return this._implementation.createDocument(null, null, null);
  }

  /**
   * Create a text node
   * @param data Text content
   * @returns Text node
   */
  createTextNode(data: string): Text {
    return this._document.createTextNode(data);
  }

  /**
   * Create a CDATA section
   * @param data CDATA content
   * @returns CDATASection node
   */
  createCDATASection(data: string): CDATASection {
    return this._document.createCDATASection(data);
  }

  /**
   * Create a comment node
   * @param data Comment content
   * @returns Comment node
   */
  createComment(data: string): Comment {
    return this._document.createComment(data);
  }

  /**
   * Create a processing instruction
   * @param target Target
   * @param data Processing instruction data
   * @returns ProcessingInstruction node
   */
  createProcessingInstruction(target: string, data: string): ProcessingInstruction {
    return this._document.createProcessingInstruction(target, data);
  }

  /**
   * Create an element
   * @param tagName Element tag name
   * @returns Element
   */
  createElement(tagName: string): Element {
    return this._document.createElement(tagName);
  }

  /**
   * Create an element with namespace
   * @param namespaceURI Namespace URI
   * @param qualifiedName Qualified name (with prefix)
   * @returns Element
   */
  createElementNS(namespaceURI: string, qualifiedName: string): Element {
    return this._document.createElementNS(namespaceURI, qualifiedName);
  }

  /**
   * Clean up any resources (especially for JSDOM)
   */
  cleanup(): void {
    if (this._jsdomInstance) {
      this._jsdomInstance.window.close();
    }
  }
}