/**
 * Enhanced XMLUtil - Unified utilities for XML processing
 * Uses the consolidated XmlEntityHandler and NamespaceUtil
 */
import { XJXError, XmlToJsonError } from "../types/error-types";
import { DOMAdapter } from "../adapters/dom-adapter";
import { Configuration } from "../types/config-types";
import { NodeType } from "../types/dom-types";
import { ConfigProvider } from "../config/config-provider";
import { XmlEntityHandler } from "./xml-entity-handler";
import { NamespaceUtil } from "./namespace-util";

/**
 * Interface for XML validation result
 */
export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export class XmlUtil {
  private config: Configuration;
  private entityHandler: XmlEntityHandler;
  private namespaceUtil: NamespaceUtil;

  /**
   * Constructor for XMLUtil
   * @param config Configuration options
   */
  constructor(config: Configuration) {
    this.config = config;
    this.entityHandler = XmlEntityHandler.getInstance();
    this.namespaceUtil = NamespaceUtil.getInstance();
  }

  /**
   * Parse XML string to DOM document with unified entity handling
   * @param xmlString XML string to parse
   * @param contentType Content type (default: text/xml)
   * @returns Parsed DOM document
   */
  public parseXml(xmlString: string, contentType: string = 'text/xml'): Document {
    try {
      // Pre-process XML string to handle entity issues
      const preprocessedXml = this.entityHandler.preprocessXml(xmlString);
      
      // Parse using DOMAdapter
      const doc = DOMAdapter.parseFromString(preprocessedXml, contentType);
      
      // Check for parsing errors
      const errors = doc.getElementsByTagName("parsererror");
      if (errors.length > 0) {
        throw new XmlToJsonError(`XML parsing error: ${errors[0].textContent}`);
      }
      
      return doc;
    } catch (error) {
      throw new XmlToJsonError(
        `Failed to parse XML: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  /**
   * Serialize DOM to XML string with unified post-processing
   * @param node DOM node to serialize
   * @returns Serialized XML string
   */
  public serializeXml(node: Node): string {
    try {
      // Use DOMAdapter for serialization
      let xmlString = DOMAdapter.serializeToString(node);
      
      // Post-process to ensure consistent entity handling and clean up
      return this.entityHandler.postProcessXml(xmlString);
    } catch (error) {
      throw new XJXError(
        `Failed to serialize XML: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Improved XML pretty print function that preserves mixed content structure
   * @param xmlString XML string to format
   * @returns Formatted XML string
   */
  public prettyPrintXml(xmlString: string): string {
    const indent = this.config.outputOptions.indent;
    const INDENT = " ".repeat(indent);

    try {
      const doc = this.parseXml(xmlString);

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

            // Empty element - render as self-closing tag
            if (children.length === 0) {
              return `${pad}${openTag.replace(/>$/, " />")}\n`;
            }

            // Check for mixed content - important for whitespace handling
            const hasElementChildren = children.some(
              (child) => child.nodeType === DOMAdapter.NodeType.ELEMENT_NODE
            );

            const hasTextOrCDATA = children.some(
              (child) =>
                (child.nodeType === DOMAdapter.NodeType.TEXT_NODE &&
                  child.textContent?.trim()) ||
                child.nodeType === DOMAdapter.NodeType.CDATA_SECTION_NODE
            );

            // Handle mixed content differently to preserve structure
            if (hasElementChildren && hasTextOrCDATA) {
              // Mixed content - preserve structure by inlining (no extra indents or line breaks)
              let inner = "";
              for (const child of children) {
                // For elements in mixed content, we still want them indented properly
                if (child.nodeType === DOMAdapter.NodeType.ELEMENT_NODE) {
                  // Remove newlines from nested element serialization
                  const childSerialized = serializer(child, 0); // no indent for elements in mixed content
                  inner += childSerialized.trim(); // trim to remove newlines
                } else {
                  // For text and CDATA, just append directly
                  inner += serializeTextOrCDATA(child);
                }
              }
              return `${pad}${openTag}${inner}</${tagName}>\n`;
            }

            // Text-only content (with meaningful text, not just whitespace)
            if (!hasElementChildren && hasTextOrCDATA) {
              let inner = "";
              for (const child of children) {
                inner += serializeTextOrCDATA(child);
              }

              // Trim and normalize whitespace for text-only content
              // but only if preserveWhitespace is false
              if (!this.config.preserveWhitespace) {
                inner = inner.trim().replace(/\s+/g, " ");
              }

              if (inner) {
                return `${pad}${openTag}${inner}</${tagName}>\n`;
              }
            }

            // Empty or whitespace-only
            if (
              children.every(
                (child) =>
                  child.nodeType !== DOMAdapter.NodeType.ELEMENT_NODE &&
                  (!child.textContent || !child.textContent.trim())
              )
            ) {
              return `${pad}<${tagName}${
                attrs ? " " + attrs : ""
              }></${tagName}>\n`;
            }

            // Regular element with element children - pretty format
            const inner = children
              .map((child) => serializer(child, level + 1))
              .join("");
            return `${pad}${openTag}\n${inner}${pad}</${tagName}>\n`;
          }

          case DOMAdapter.NodeType.TEXT_NODE: {
            const text = node.textContent || "";
            // Skip whitespace-only text nodes in indented output unless preserveWhitespace is true
            const trimmed = text.trim();
            if (!trimmed && !this.config.preserveWhitespace) {
              return "";
            }

            // For text nodes, normalize whitespace according to configuration
            const normalized = this.config.preserveWhitespace
              ? text
              : trimmed.replace(/\s+/g, " ");

            return `${pad}${normalized}\n`;
          }

          case DOMAdapter.NodeType.CDATA_SECTION_NODE:
            // Always preserve CDATA content exactly as is
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

      // Helper function to serialize text or CDATA without adding indentation or newlines
      const serializeTextOrCDATA = (node: Node): string => {
        if (node.nodeType === DOMAdapter.NodeType.TEXT_NODE) {
          return node.textContent || "";
        } else if (node.nodeType === DOMAdapter.NodeType.CDATA_SECTION_NODE) {
          return `<![CDATA[${node.nodeValue}]]>`;
        }
        return "";
      };

      // Combine the XML declaration (if any) with the formatted body
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
  public validateXML(xmlString: string): ValidationResult {
    try {
      // Use the parseXml method which handles preprocessing
      this.parseXml(xmlString);
      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Add XML declaration to a string if missing or replace existing declaration
   * @param xmlString XML string
   * @returns XML string with declaration
   */
  public ensureXMLDeclaration(xmlString: string): string {
    const standardDecl = '<?xml version="1.0" encoding="UTF-8"?>\n';

    // Check if the XML string already has a declaration
    if (xmlString.trim().startsWith("<?xml")) {
      // Extract the current declaration
      const match = xmlString.match(/^<\?xml[^?]*\?>/);
      if (match) {
        // Replace it with our standard declaration
        return xmlString.replace(match[0], standardDecl.trim()) + "\n";
      }
    }

    // No declaration found, add one
    return standardDecl + xmlString;
  }

  /**
   * Delegate to XmlEntityHandler for consistency
   */
  public escapeXML(text: string): string {
    return this.entityHandler.escapeXML(text);
  }

  /**
   * Delegate to XmlEntityHandler for consistency
   */
  public unescapeXML(text: string): string {
    return this.entityHandler.unescapeXML(text);
  }

  /**
   * Delegate to XmlEntityHandler for consistency
   */
  public safeXmlText(text: string): string {
    return this.entityHandler.safeXmlText(text);
  }

  /**
   * Delegate to NamespaceUtil for consistency
   */
  public extractPrefix(qualifiedName: string): string | null {
    const result = this.namespaceUtil.parseQualifiedName(qualifiedName);
    return result.prefix;
  }

  /**
   * Delegate to NamespaceUtil for consistency
   */
  public extractLocalName(qualifiedName: string): string {
    const result = this.namespaceUtil.parseQualifiedName(qualifiedName);
    return result.localName;
  }

  /**
   * Delegate to NamespaceUtil for consistency
   */
  public createQualifiedName(prefix: string | null, localName: string): string {
    return this.namespaceUtil.createQualifiedName(prefix, localName);
  }

  /**
   * Normalize whitespace in text content based on configuration
   * @param text Text to normalize
   * @returns Normalized text
   */
  public normalizeTextContent(text: string): string {
    if (!this.config.preserveWhitespace) {
      // If preserveWhitespace is false, normalize the whitespace
      // This trims the text and collapses multiple whitespace to a single space
      return text.trim().replace(/\s+/g, " ");
    }
    return text;
  }
}