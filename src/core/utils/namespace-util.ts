/**
 * Namespace utility for XML-JSON transformations
 * 
 * Centralizes all namespace resolution logic to ensure consistent handling 
 * of namespaces throughout the library.
 */
import { XNode } from '../types/transform-types';

export class NamespaceUtil {
  // Singleton instance created immediately
  private static readonly instance = new NamespaceUtil();
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): NamespaceUtil {
    return NamespaceUtil.instance;
  }
  
  /**
   * Private constructor (singleton pattern)
   */
  private constructor() {
    // Private constructor to prevent direct instantiation
  }
  
  /**
   * Find namespace URI for a prefix by searching up the node hierarchy
   * @param node Starting node
   * @param prefix Namespace prefix to find
   * @param namespaceMap Optional global namespace map for fallback
   * @returns Namespace URI or undefined if not found
   */
  public findNamespaceForPrefix(
    node: XNode,
    prefix: string,
    namespaceMap?: Record<string, string>
  ): string | undefined {
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
  }
  
  /**
   * Create a qualified name from namespace prefix and local name
   * @param prefix Namespace prefix (can be null/undefined)
   * @param localName Local name
   * @returns Qualified name
   */
  public createQualifiedName(prefix: string | null | undefined, localName: string): string {
    return prefix ? `${prefix}:${localName}` : localName;
  }
  
  /**
   * Parse a qualified name into prefix and local name parts
   * @param qualifiedName Qualified name (e.g., "ns:element")
   * @returns Object with prefix and localName
   */
  public parseQualifiedName(qualifiedName: string): { prefix: string | null, localName: string } {
    const colonIndex = qualifiedName.indexOf(':');
    if (colonIndex > 0) {
      return {
        prefix: qualifiedName.substring(0, colonIndex),
        localName: qualifiedName.substring(colonIndex + 1)
      };
    }
    return {
      prefix: null,
      localName: qualifiedName
    };
  }
  
  /**
   * Get namespace declarations from DOM Element
   * @param element DOM Element
   * @returns Map of prefixes to namespace URIs
   */
  public getNamespaceDeclarations(element: Element): Record<string, string> {
    const result: Record<string, string> = {};
    
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      
      if (attr.name === 'xmlns') {
        // Default namespace
        result[''] = attr.value;
      } else if (attr.name.startsWith('xmlns:')) {
        // Prefixed namespace
        const prefix = attr.name.substring(6); // Remove 'xmlns:'
        result[prefix] = attr.value;
      }
    }
    
    return result;
  }
  
  /**
   * Check if an element declares a default namespace
   * @param element DOM Element
   * @returns True if element has a default namespace declaration
   */
  public hasDefaultNamespace(element: Element): boolean {
    return element.hasAttribute('xmlns');
  }
  
  /**
   * Add namespace declarations to a DOM element
   * @param element Target DOM element
   * @param declarations Namespace declarations to add
   */
  public addNamespaceDeclarations(element: Element, declarations: Record<string, string>): void {
    for (const [prefix, uri] of Object.entries(declarations)) {
      if (prefix === '') {
        // Default namespace
        element.setAttribute('xmlns', uri);
      } else {
        // Prefixed namespace
        element.setAttributeNS(
          'http://www.w3.org/2000/xmlns/',
          `xmlns:${prefix}`,
          uri
        );
      }
    }
  }
  
  /**
   * Collect all namespace declarations from an XNode and its ancestors
   * @param node XNode to start from
   * @returns Combined namespace declarations
   */
  public collectNamespaceDeclarations(node: XNode): Record<string, string> {
    const result: Record<string, string> = {};
    let current: XNode | undefined = node;
    
    // Walk up the parent chain and collect all namespace declarations
    while (current) {
      if (current.namespaceDeclarations) {
        for (const [prefix, uri] of Object.entries(current.namespaceDeclarations)) {
          // Only add if not already in result (child declarations take precedence)
          if (result[prefix] === undefined) {
            result[prefix] = uri;
          }
        }
      }
      current = current.parent;
    }
    
    return result;
  }
  
  /**
   * Resolve a DOM Element's namespace and prefix
   * @param element DOM Element
   * @returns Object containing namespace URI and prefix
   */
  public resolveElementNamespace(element: Element): { namespace: string | null, prefix: string | null } {
    return {
      namespace: element.namespaceURI,
      prefix: element.prefix
    };
  }
}