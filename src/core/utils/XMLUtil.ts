/**
 * XMLUtil - Utility functions for XML processing
 */
import { XMLToJSONError } from "../types/errors";
import { DOMAdapter } from "../DOMAdapter";

export class XMLUtil {
  /**
   * Pretty print an XML string
   * @param xmlString XML string to format
   * @param indent Number of spaces for indentation
   * @returns Formatted XML string
   */
  static prettyPrintXml(xmlString: string, indent: number = 2): string {
    const INDENT = " ".repeat(indent);

    try {
      const doc = DOMAdapter.parseFromString(xmlString, 'text/xml');

      const serializer = (node: Node, level = 0): string => {
        const pad = INDENT.repeat(level);

        switch (node.nodeType) {
          case DOMAdapter.nodeTypes.ELEMENT_NODE: {
            const el = node as Element;
            const tagName = el.tagName;
            const attrs = Array.from(el.attributes)
              .map((a) => `${a.name}="${a.value}"`)
              .join(" ");
            const openTag = attrs ? `<${tagName} ${attrs}>` : `<${tagName}>`;

            const children = Array.from(el.childNodes);
            if (children.length === 0) {
              return `${pad}${openTag.replace(/>$/, " />")}\n`;
            }

            // Single text node: print inline
            if (
              children.length === 1 &&
              children[0].nodeType === DOMAdapter.nodeTypes.TEXT_NODE &&
              children[0].textContent?.trim() !== ""
            ) {
              return `${pad}${openTag}${children[0].textContent}</${tagName}>\n`;
            }

            const inner = children
              .map((child) => serializer(child, level + 1))
              .join("");
            return `${pad}${openTag}\n${inner}${pad}</${tagName}>\n`;
          }

          case DOMAdapter.nodeTypes.TEXT_NODE: {
            const text = node.textContent?.trim();
            return text ? `${pad}${text}\n` : "";
          }

          case DOMAdapter.nodeTypes.CDATA_SECTION_NODE:
            return `${pad}<![CDATA[${node.nodeValue}]]>\n`;

          case DOMAdapter.nodeTypes.COMMENT_NODE:
            return `${pad}<!--${node.nodeValue}-->\n`;

          case DOMAdapter.nodeTypes.PROCESSING_INSTRUCTION_NODE:
            const pi = node as ProcessingInstruction;
            return `${pad}<?${pi.target} ${pi.data}?>\n`;

          case DOMAdapter.nodeTypes.DOCUMENT_NODE:
            return Array.from(node.childNodes)
              .map((child) => serializer(child, level))
              .join("");

          default:
            return "";
        }
      };

      return serializer(doc).trim();
    } catch (error) {
      throw new XMLToJSONError(`Failed to pretty print XML: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check if XML string is well-formed
   * @param xmlString XML string to validate
   * @returns Object with validation result and any error messages
   */
  static validateXML(xmlString: string): { isValid: boolean; message?: string } {
    try {
      const doc = DOMAdapter.parseFromString(xmlString, "text/xml");
      const errors = doc.getElementsByTagName("parsererror");
      if (errors.length > 0) {
        return { isValid: false, message: errors[0].textContent || "Unknown parsing error" };
      }
      return { isValid: true };
    } catch (error) {
      return { 
        isValid: false, 
        message: error instanceof Error ? error.message : String(error) 
      };
    }
  }

  /**
   * Add XML declaration to a string if missing
   * @param xmlString XML string
   * @returns XML string with declaration
   */
  static ensureXMLDeclaration(xmlString: string): string {
    if (!xmlString.trim().startsWith('<?xml')) {
      return '<?xml version="1.0" encoding="UTF-8"?>\n' + xmlString;
    }
    return xmlString;
  }

  /**
   * Escape special XML characters
   * @param text Text to escape
   * @returns Escaped text
   */
  static escapeXML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Unescape XML entities
   * @param text Text with XML entities
   * @returns Unescaped text
   */
  static unescapeXML(text: string): string {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");
  }

  /**
   * Extract the namespace prefix from a qualified name
   * @param qualifiedName Qualified name (e.g., "ns:element")
   * @returns Prefix or null if no prefix
   */
  static extractPrefix(qualifiedName: string): string | null {
    const colonIndex = qualifiedName.indexOf(':');
    return colonIndex > 0 ? qualifiedName.substring(0, colonIndex) : null;
  }

  /**
   * Extract the local name from a qualified name
   * @param qualifiedName Qualified name (e.g., "ns:element")
   * @returns Local name
   */
  static extractLocalName(qualifiedName: string): string {
    const colonIndex = qualifiedName.indexOf(':');
    return colonIndex > 0 ? qualifiedName.substring(colonIndex + 1) : qualifiedName;
  }

  /**
   * Create a qualified name from prefix and local name
   * @param prefix Namespace prefix (can be null)
   * @param localName Local name
   * @returns Qualified name
   */
  static createQualifiedName(prefix: string | null, localName: string): string {
    return prefix ? `${prefix}:${localName}` : localName;
  }
}