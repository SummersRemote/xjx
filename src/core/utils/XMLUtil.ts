/**
 * XMLUtil - Utility functions for XML processing
 */
import { XMLToJSONError } from "../types/errors";
import { DOMAdapter } from "../DOMAdapter";
import { Configuration } from "../types/types";

export class XMLUtil {
  private config: Configuration;

  /**
   * Constructor for XMLUtil
   * @param config Configuration options
   */
  constructor(config: Configuration) {
    this.config = config;
  }

  /**
   * Pretty print an XML string
   * @param xmlString XML string to format
   * @returns Formatted XML string
   */
  prettyPrintXml(xmlString: string): string {
    const indent = this.config.outputOptions.indent;
    const INDENT = " ".repeat(indent);

    try {
      const doc = DOMAdapter.parseFromString(xmlString, "text/xml");

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
      throw new XMLToJSONError(
        `Failed to pretty print XML: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Check if XML string is well-formed
   * @param xmlString XML string to validate
   * @returns Object with validation result and any error messages
   */
  validateXML(xmlString: string): {
    isValid: boolean;
    message?: string;
  } {
    try {
      const doc = DOMAdapter.parseFromString(xmlString, "text/xml");
      const errors = doc.getElementsByTagName("parsererror");
      if (errors.length > 0) {
        return {
          isValid: false,
          message: errors[0].textContent || "Unknown parsing error",
        };
      }
      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Add XML declaration to a string if missing
   * @param xmlString XML string
   * @returns XML string with declaration
   */
  ensureXMLDeclaration(xmlString: string): string {
    if (!xmlString.trim().startsWith("<?xml")) {
      return '<?xml version="1.0" encoding="UTF-8"?>\n' + xmlString;
    }
    return xmlString;
  }

  /**
   * Escapes special characters in text for safe XML usage.
   * @param text Text to escape.
   * @returns Escaped XML string.
   */
  escapeXML(text: string): string {
    if (typeof text !== "string" || text.length === 0) {
      return "";
    }

    return text.replace(/[&<>"']/g, (char) => {
      switch (char) {
        case "&":
          return "&amp;";
        case "<":
          return "&lt;";
        case ">":
          return "&gt;";
        case '"':
          return "&quot;";
        case "'":
          return "&apos;";
        default:
          return char;
      }
    });
  }

  /**
   * Unescapes XML entities back to their character equivalents.
   * @param text Text with XML entities.
   * @returns Unescaped text.
   */
  unescapeXML(text: string): string {
    if (typeof text !== "string" || text.length === 0) {
      return "";
    }

    return text.replace(/&(amp|lt|gt|quot|apos);/g, (match, entity) => {
      switch (entity) {
        case "amp":
          return "&";
        case "lt":
          return "<";
        case "gt":
          return ">";
        case "quot":
          return '"';
        case "apos":
          return "'";
        default:
          return match;
      }
    });
  }

  /**
   * Extract the namespace prefix from a qualified name
   * @param qualifiedName Qualified name (e.g., "ns:element")
   * @returns Prefix or null if no prefix
   */
  extractPrefix(qualifiedName: string): string | null {
    const colonIndex = qualifiedName.indexOf(":");
    return colonIndex > 0 ? qualifiedName.substring(0, colonIndex) : null;
  }

  /**
   * Extract the local name from a qualified name
   * @param qualifiedName Qualified name (e.g., "ns:element")
   * @returns Local name
   */
  extractLocalName(qualifiedName: string): string {
    const colonIndex = qualifiedName.indexOf(":");
    return colonIndex > 0
      ? qualifiedName.substring(colonIndex + 1)
      : qualifiedName;
  }

  /**
   * Create a qualified name from prefix and local name
   * @param prefix Namespace prefix (can be null)
   * @param localName Local name
   * @returns Qualified name
   */
  createQualifiedName(prefix: string | null, localName: string): string {
    return prefix ? `${prefix}:${localName}` : localName;
  }
}