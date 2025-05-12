/**
 * XmlUtils - Static utility for XML operations
 * 
 * Centralized XML processing utilities for the XJX library.
 * Updated to use simplified configuration.
 */
import { Configuration } from '../types/config-types';
import { ValidationResult } from '../types/transform-interfaces';
import { ErrorUtils } from './error-utils';
import { EntityUtils } from './entity-utils';
import { DomUtils } from './dom-utils';
import { NamespaceUtils } from './namespace-utils';
import { NodeType } from '../types/dom-types';
import { ConfigManager } from '../config/config-manager';

export class XmlUtils {
  /**
   * Parse XML string to DOM document
   * @param xmlString XML string to parse
   * @param config Optional configuration
   * @param contentType Content type (default: text/xml)
   * @returns Parsed DOM document
   */
  public static parseXml(
    xmlString: string, 
    config?: Configuration, 
    contentType: string = 'text/xml'
  ): Document {
    return ErrorUtils.try(
      () => {
        // Pre-process XML string to handle entity issues
        const preprocessedXml = EntityUtils.preprocessXml(xmlString);
        
        // Parse using DomUtils
        const doc = DomUtils.parseFromString(preprocessedXml, contentType);
        
        // Check for parsing errors
        const errors = doc.getElementsByTagName("parsererror");
        if (errors.length > 0) {
          throw new Error(`XML parsing error: ${errors[0].textContent}`);
        }
        
        return doc;
      },
      'Failed to parse XML',
      'xml-to-json'
    );
  }
  
  /**
   * Serialize DOM to XML string
   * @param node DOM node to serialize
   * @returns Serialized XML string
   */
  public static serializeXml(node: Node): string {
    return ErrorUtils.try(
      () => {
        // Use DomUtils for serialization
        let xmlString = DomUtils.serializeToString(node);
        
        // Post-process to ensure consistent entity handling and clean up
        return EntityUtils.postProcessXml(xmlString);
      },
      'Failed to serialize XML',
      'general'
    );
  }

  /**
   * Improved XML pretty print function that preserves mixed content structure
   * @param xmlString XML string to format
   * @param indent Number of spaces for indentation (default: 2)
   * @returns Formatted XML string
   */
  public static prettyPrintXml(xmlString: string, indent: number = 2): string {
    const INDENT = " ".repeat(indent);
    // Use default config for formatting preferences
    const defaultConfig = ConfigManager.getDefaultConfig();

    return ErrorUtils.try(
      () => {
        const doc = XmlUtils.parseXml(xmlString);

        const serializer = (node: Node, level = 0): string => {
          const pad = INDENT.repeat(level);

          switch (node.nodeType) {
            case DomUtils.NodeType.ELEMENT_NODE: {
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
                (child) => child.nodeType === DomUtils.NodeType.ELEMENT_NODE
              );

              const hasTextOrCDATA = children.some(
                (child) =>
                  (child.nodeType === DomUtils.NodeType.TEXT_NODE &&
                    child.textContent?.trim()) ||
                  child.nodeType === DomUtils.NodeType.CDATA_SECTION_NODE
              );

              // Handle mixed content differently to preserve structure
              if (hasElementChildren && hasTextOrCDATA) {
                // Mixed content - preserve structure by inlining
                let inner = "";
                for (const child of children) {
                  // For elements in mixed content, we still want them indented properly
                  if (child.nodeType === DomUtils.NodeType.ELEMENT_NODE) {
                    // Remove newlines from nested element serialization
                    const childSerialized = serializer(child, 0);
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
                if (!defaultConfig.preserveWhitespace) {
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
                    child.nodeType !== DomUtils.NodeType.ELEMENT_NODE &&
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

            case DomUtils.NodeType.TEXT_NODE: {
              const text = node.textContent || "";
              // Skip whitespace-only text nodes in indented output unless preserveWhitespace is true
              const trimmed = text.trim();
              if (!trimmed && !defaultConfig.preserveWhitespace) {
                return "";
              }

              // For text nodes, normalize whitespace according to configuration
              const normalized = defaultConfig.preserveWhitespace
                ? text
                : trimmed.replace(/\s+/g, " ");

              return `${pad}${normalized}\n`;
            }

            case DomUtils.NodeType.CDATA_SECTION_NODE:
              // Always preserve CDATA content exactly as is
              return `${pad}<![CDATA[${node.nodeValue}]]>\n`;

            case DomUtils.NodeType.COMMENT_NODE:
              return `${pad}<!--${node.nodeValue}-->\n`;

            case DomUtils.NodeType.PROCESSING_INSTRUCTION_NODE:
              const pi = node as ProcessingInstruction;
              return `${pad}<?${pi.target} ${pi.data}?>\n`;

            case DomUtils.NodeType.DOCUMENT_NODE:
              return Array.from(node.childNodes)
                .map((child) => serializer(child, level))
                .join("");

            default:
              return "";
          }
        };

        // Helper function to serialize text or CDATA without adding indentation or newlines
        const serializeTextOrCDATA = (node: Node): string => {
          if (node.nodeType === DomUtils.NodeType.TEXT_NODE) {
            return node.textContent || "";
          } else if (node.nodeType === DomUtils.NodeType.CDATA_SECTION_NODE) {
            return `<![CDATA[${node.nodeValue}]]>`;
          }
          return "";
        };

        // Combine the XML declaration (if any) with the formatted body
        return serializer(doc).trim();
      },
      'Failed to pretty print XML',
      'general'
    );
  }

  /**
   * Check if XML string is well-formed
   * @param xmlString XML string to validate
   * @returns Object with validation result and any error messages
   */
  public static validateXML(xmlString: string): ValidationResult {
    try {
      // Use the parseXml method which handles preprocessing
      XmlUtils.parseXml(xmlString);
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
  public static ensureXMLDeclaration(xmlString: string): string {
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
   * Normalize whitespace in text content based on configuration
   * @param text Text to normalize
   * @param preserveWhitespace Whether to preserve whitespace
   * @returns Normalized text
   */
  public static normalizeTextContent(text: string, preserveWhitespace: boolean = false): string {
    return EntityUtils.normalizeWhitespace(text, preserveWhitespace);
  }

  /**
   * Create a DOM document from an XML string
   * @param xmlString XML string
   * @returns New DOM document
   */
  public static createDocumentFromXml(xmlString: string): Document {
    return XmlUtils.parseXml(xmlString);
  }

  /**
   * Create an empty DOM document
   * @returns New empty DOM document
   */
  public static createEmptyDocument(): Document {
    return DomUtils.createDocument();
  }

  /**
   * Extract XML fragments from a string
   * @param text Text containing XML fragments
   * @returns Array of XML fragments
   */
  public static extractXmlFragments(text: string): string[] {
    const fragments: string[] = [];
    const regex = /<[^>]+>[\s\S]*?<\/[^>]+>/g;
    
    let match;
    while ((match = regex.exec(text)) !== null) {
      fragments.push(match[0]);
    }
    
    return fragments;
  }

  /**
   * Check if a string is valid XML
   * @param xmlString String to check
   * @returns True if the string is valid XML
   */
  public static isValidXml(xmlString: string): boolean {
    try {
      XmlUtils.parseXml(xmlString);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get XML element tag name
   * @param element DOM element
   * @returns Tag name
   */
  public static getTagName(element: Element): string {
    return element.tagName;
  }

  /**
   * Get XML element attributes as an object
   * @param element DOM element
   * @returns Object with attribute name-value pairs
   */
  public static getAttributes(element: Element): Record<string, string> {
    return DomUtils.getNodeAttributes(element);
  }
}