/**
 * XML namespace management utilities
 */
import { logger, validate, ParseError, ValidationError } from '../error';
import { XNode } from '../xnode';

/**
 * XML namespace utilities
 */
export class XmlNamespace {
  /**
   * Find namespace URI for a prefix by searching up the node hierarchy
   * @param node Starting node
   * @param prefix Namespace prefix to find
   * @param namespaceMap Optional global namespace map for fallback
   * @returns Namespace URI or undefined if not found
   */
  static findNamespaceForPrefix(
    node: XNode,
    prefix: string,
    namespaceMap?: Record<string, string>
  ): string | undefined {
    try {
      // VALIDATION: Check for valid input
      validate(node !== null && node !== undefined, "Node must be provided");
      validate(typeof prefix === "string", "Prefix must be a string");
      
      let current: XNode | undefined = node;

      // Walk up the parent chain looking for a matching namespace declaration
      while (current) {
        if (
          current.namespaceDeclarations &&
          current.namespaceDeclarations[prefix] !== undefined
        ) {
          return current.namespaceDeclarations[prefix];
        }
        current = current.parent;
      }

      // If not found in ancestry, try the global map as fallback
      return namespaceMap?.[prefix];
    } catch (err) {
      logger.error('Failed to find namespace for prefix', { prefix, err });
      throw err;
    }
  }

  /**
   * Create a qualified name from namespace prefix and local name
   * @param prefix Namespace prefix (can be null/undefined)
   * @param localName Local name
   * @returns Qualified name
   */
  static createQualifiedName(
    prefix: string | null | undefined,
    localName: string
  ): string {
    try {
      // VALIDATION: Check for valid local name
      validate(typeof localName === "string" && localName.length > 0, 
               "Local name must be a non-empty string");
      
      return prefix ? `${prefix}:${localName}` : localName;
    } catch (err) {
      logger.error('Failed to create qualified name', { prefix, localName, err });
      throw err;
    }
  }

  /**
   * Parse a qualified name into prefix and local name parts
   * @param qualifiedName Qualified name (e.g., "ns:element")
   * @returns Object with prefix and localName
   */
  static parseQualifiedName(qualifiedName: string): {
    prefix: string | null;
    localName: string;
  } {
    try {
      // VALIDATION: Check for valid input
      validate(typeof qualifiedName === "string", "Qualified name must be a string");
      
      const colonIndex = qualifiedName.indexOf(":");
      if (colonIndex > 0) {
        return {
          prefix: qualifiedName.substring(0, colonIndex),
          localName: qualifiedName.substring(colonIndex + 1),
        };
      }
      return {
        prefix: null,
        localName: qualifiedName,
      };
    } catch (err) {
      logger.error('Failed to parse qualified name', { qualifiedName, err });
      throw err;
    }
  }

  /**
   * Get namespace declarations from DOM Element
   * @param element DOM Element
   * @returns Map of prefixes to namespace URIs
   */
  static getNamespaceDeclarations(element: Element): Record<string, string> {
    try {
      // VALIDATION: Check for valid input
      validate(element !== null && element !== undefined, "Element must be provided");
      
      const result: Record<string, string> = {};

      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];

        if (attr.name === "xmlns") {
          // Default namespace
          result[""] = attr.value;
        } else if (attr.name.startsWith("xmlns:")) {
          // Prefixed namespace
          const prefix = attr.name.substring(6); // Remove 'xmlns:'
          result[prefix] = attr.value;
        }
      }

      logger.debug('Found namespace declarations', { count: Object.keys(result).length });
      return result;
    } catch (err) {
      logger.error('Failed to get namespace declarations', err);
      throw err;
    }
  }

  /**
   * Check if an element declares a default namespace
   * @param element DOM Element
   * @returns True if element has a default namespace declaration
   */
  static hasDefaultNamespace(element: Element): boolean {
    try {
      // VALIDATION: Check for valid input
      validate(element !== null && element !== undefined, "Element must be provided");
      
      return element.hasAttribute("xmlns");
    } catch (err) {
      logger.error('Failed to check for default namespace', err);
      throw err;
    }
  }

  /**
   * Add namespace declarations to a DOM element
   * @param element Target DOM element
   * @param declarations Namespace declarations to add
   */
  static addNamespaceDeclarations(
    element: Element,
    declarations: Record<string, string>
  ): void {
    try {
      // VALIDATION: Check for valid inputs
      validate(element !== null && element !== undefined, "Element must be provided");
      validate(declarations !== null && typeof declarations === "object", 
              "Declarations must be an object");
      
      for (const [prefix, uri] of Object.entries(declarations)) {
        if (prefix === "") {
          // Default namespace
          element.setAttribute("xmlns", uri);
        } else {
          // Prefixed namespace
          element.setAttributeNS(
            "http://www.w3.org/2000/xmlns/",
            `xmlns:${prefix}`,
            uri
          );
        }
      }
      
      logger.debug('Added namespace declarations', { 
        elementName: element.nodeName, 
        declarationCount: Object.keys(declarations).length 
      });
    } catch (err) {
      logger.error('Failed to add namespace declarations', { declarations, err });
      throw err;
    }
  }

  /**
   * Collect all namespace declarations from an XNode and its ancestors
   * @param node XNode to start from
   * @returns Combined namespace declarations
   */
  static collectNamespaceDeclarations(node: XNode): Record<string, string> {
    try {
      // VALIDATION: Check for valid input
      validate(node !== null && node !== undefined, "Node must be provided");
      
      const result: Record<string, string> = {};
      let current: XNode | undefined = node;

      // Walk up the parent chain and collect all namespace declarations
      while (current) {
        if (current.namespaceDeclarations) {
          for (const [prefix, uri] of Object.entries(
            current.namespaceDeclarations
          )) {
            // Only add if not already in result (child declarations take precedence)
            if (result[prefix] === undefined) {
              result[prefix] = uri;
            }
          }
        }
        current = current.parent;
      }

      logger.debug('Collected namespace declarations', { 
        nodeName: node.name, 
        declarationCount: Object.keys(result).length 
      });
      return result;
    } catch (err) {
      logger.error('Failed to collect namespace declarations', err);
      throw err;
    }
  }

  /**
   * Resolve a DOM Element's namespace and prefix
   * @param element DOM Element
   * @returns Object containing namespace URI and prefix
   */
  static resolveElementNamespace(element: Element): {
    namespace: string | null;
    prefix: string | null;
  } {
    try {
      // VALIDATION: Check for valid input
      validate(element !== null && element !== undefined, "Element must be provided");
      
      return {
        namespace: element.namespaceURI,
        prefix: element.prefix,
      };
    } catch (err) {
      logger.error('Failed to resolve element namespace', err);
      throw err;
    }
  }

  /**
   * Check if a qualified name has a namespace prefix
   * @param qualifiedName Qualified name to check
   * @returns True if the name has a prefix
   */
  static hasPrefix(qualifiedName: string): boolean {
    try {
      // VALIDATION: Check for valid input
      validate(typeof qualifiedName === "string", "Qualified name must be a string");
      
      return qualifiedName.indexOf(":") > 0;
    } catch (err) {
      logger.error('Failed to check if qualified name has prefix', err);
      throw err;
    }
  }

  /**
   * Get default namespace URI from a DOM Element
   * @param element DOM Element
   * @returns Default namespace URI or null if not defined
   */
  static getDefaultNamespace(element: Element): string | null {
    try {
      // VALIDATION: Check for valid input
      validate(element !== null && element !== undefined, "Element must be provided");
      
      return element.getAttribute("xmlns");
    } catch (err) {
      logger.error('Failed to get default namespace', err);
      throw err;
    }
  }

  /**
   * Create a namespace-aware DOM element
   * @param doc Document to create element in
   * @param qualifiedName Qualified name (with optional prefix)
   * @param namespace Namespace URI
   * @returns New element with proper namespace
   */
  static createElementNS(
    doc: Document,
    qualifiedName: string,
    namespace: string | null
  ): Element {
    try {
      // VALIDATION: Check for valid inputs
      validate(doc !== null && doc !== undefined, "Document must be provided");
      validate(typeof qualifiedName === "string" && qualifiedName.length > 0, 
              "Qualified name must be a non-empty string");
      
      if (namespace) {
        return doc.createElementNS(namespace, qualifiedName);
      } else {
        return doc.createElement(qualifiedName);
      }
    } catch (err) {
      const error = new ParseError(`Failed to create element: ${qualifiedName}`, { qualifiedName, namespace });
      logger.error('Failed to create element with namespace', error);
      throw error;
    }
  }
}