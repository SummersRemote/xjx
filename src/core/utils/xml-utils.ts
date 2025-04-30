/**
 * XMLUtil - Utility functions for XML processing with improved entity handling
 */
import { XJXError } from "../types/error-types";
import { DOMAdapter } from "../adapters/dom-adapter";
import { Configuration } from "../types/config-types";
import { NodeType } from "../types/dom-types";
import { escapeXML, unescapeXML, safeXmlText, containsSpecialChars } from "../utils/xml-escape-utils";

/**
 * Interface for XML validation result
 */
export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export class XmlUtil {
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
          case DOMAdapter.NodeType.ELEMENT_NODE: {
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
              children.length === 0 ||
              (children.length === 1 &&
                children[0].nodeType === DOMAdapter.NodeType.TEXT_NODE &&
                children[0].textContent?.trim() === "")
            ) {
              // Empty or whitespace-only
              return `${pad}<${tagName}${
                attrs ? " " + attrs : ""
              }></${tagName}>\n`;
            }

            const inner = children
              .map((child) => serializer(child, level + 1))
              .join("");
            return `${pad}${openTag}\n${inner}${pad}</${tagName}>\n`;
          }

          case DOMAdapter.NodeType.TEXT_NODE: {
            const text = node.textContent?.trim();
            return text ? `${pad}${text}\n` : "";
          }

          case DOMAdapter.NodeType.CDATA_SECTION_NODE:
            return `${pad}<![CDATA[${node.nodeValue}]]>\n`;

          case DOMAdapter.NodeType.COMMENT_NODE:
            return `${pad}<!--${node.nodeValue}-->\n`;

          case DOMAdapter.NodeType.PROCESSING_INSTRUCTION_NODE:
            const pi = node as ProcessingInstruction;
            return `${pad}<?${pi.target} ${pi.data}?>\n`;

          case DOMAdapter.NodeType.DOCUMENT_NODE:
            return Array.from(node.childNodes)
              .map((child) => serializer(child, level))
              .join("");

          default:
            return "";
        }
      };

      return serializer(doc).trim();
    } catch (error) {
      throw new XJXError(
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
  validateXML(xmlString: string): ValidationResult {
    try {
      // Attempt to preprocess XML string to catch common XML errors
      const preprocessedXml = this.preprocessForValidation(xmlString);
      
      const doc = DOMAdapter.parseFromString(preprocessedXml, "text/xml");
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
   * Preprocess XML string for validation to help users catch common errors
   * @param xmlString Original XML string
   * @returns Preprocessed XML string with common issues fixed
   */
  private preprocessForValidation(xmlString: string): string {
    // This is a simplified version of the preprocessing in XmlToJsonConverter
    // focused on handling basic entity escaping issues for validation
    let inCdata = false;
    let result = '';
    let i = 0;

    while (i < xmlString.length) {
      // Check for CDATA section start
      if (xmlString.substring(i, i + 9) === '<![CDATA[') {
        inCdata = true;
        result += '<![CDATA[';
        i += 9;
        continue;
      }
      
      // Check for CDATA section end
      if (inCdata && xmlString.substring(i, i + 3) === ']]>') {
        inCdata = false;
        result += ']]>';
        i += 3;
        continue;
      }
      
      // Handle special characters outside CDATA
      if (!inCdata) {
        const char = xmlString.charAt(i);
        if (char === '&') {
          // Check if this is already an entity reference
          if (xmlString.substring(i, i + 5) === '&amp;' ||
              xmlString.substring(i, i + 4) === '&lt;' ||
              xmlString.substring(i, i + 4) === '&gt;' ||
              xmlString.substring(i, i + 6) === '&quot;' ||
              xmlString.substring(i, i + 6) === '&apos;') {
            // Already an entity, leave it as is
            result += char;
          } else {
            // Not a valid entity reference, escape it
            result += '&amp;';
          }
        } else {
          result += char;
        }
      } else {
        // Inside CDATA, pass through unchanged
        result += xmlString.charAt(i);
      }
      
      i++;
    }
    
    return result;
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
    return escapeXML(text);
  }

  /**
   * Unescapes XML entities back to their character equivalents.
   * @param text Text with XML entities.
   * @returns Unescaped text.
   */
  unescapeXML(text: string): string {
    return unescapeXML(text);
  }

  /**
   * Safely processes text for XML inclusion, avoiding double-escaping
   * @param text Text to process
   * @returns Safely processed text
   */
  safeXmlText(text: string): string {
    return safeXmlText(text);
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