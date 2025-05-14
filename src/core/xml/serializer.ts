/**
 * XML serialization utilities
 */
import { Configuration } from '../config';
import { DOM } from '../dom';
import { logger, validate, SerializeError, ValidationError } from '../error';
import { XmlEntity } from './entity';

/**
 * XML serialization utilities
 */
export class XmlSerializer {
  /**
   * Serialize DOM node to XML string
   * @param node DOM node to serialize
   * @returns Serialized XML string
   */
  static serialize(node: Node): string {
    try {
      // VALIDATION: Check for valid input
      validate(node !== null && node !== undefined, "Node must be provided");
      
      // Use DOM for serialization
      let xmlString = DOM.serializeToString(node);
      
      // Post-process to ensure consistent entity handling and clean up
      xmlString = XmlEntity.postProcess(xmlString);
      
      logger.debug('Serialized XML node', { 
        nodeType: node.nodeType, 
        length: xmlString.length 
      });
      
      return xmlString;
    } catch (err) {
      const error = new SerializeError('Failed to serialize XML', node);
      logger.error('Failed to serialize XML', error);
      throw error;
    }
  }

  /**
   * Format XML string with indentation
   * @param xmlString XML string to format
   * @param indent Number of spaces for indentation (default: 2)
   * @returns Formatted XML string
   */
  static prettyPrint(xmlString: string, indent: number = 2): string {
    const INDENT = " ".repeat(indent);
    // Use default config for formatting preferences
    let preserveWhitespace = false;

    try {
      // VALIDATION: Check for valid input
      validate(typeof xmlString === "string", "XML string must be a string");
      validate(Number.isInteger(indent) && indent >= 0, "Indent must be a non-negative integer");
      
      const doc = DOM.parseFromString(xmlString);

      const serializer = (node: Node, level = 0): string => {
        const pad = INDENT.repeat(level);

        switch (node.nodeType) {
          case DOM.NodeType.ELEMENT_NODE: {
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
              (child) => child.nodeType === DOM.NodeType.ELEMENT_NODE
            );

            const hasTextOrCDATA = children.some(
              (child) =>
                (child.nodeType === DOM.NodeType.TEXT_NODE &&
                  child.textContent?.trim()) ||
                child.nodeType === DOM.NodeType.CDATA_SECTION_NODE
            );

            // Handle mixed content differently to preserve structure
            if (hasElementChildren && hasTextOrCDATA) {
              // Mixed content - preserve structure by inlining
              let inner = "";
              for (const child of children) {
                // For elements in mixed content, we still want them indented properly
                if (child.nodeType === DOM.NodeType.ELEMENT_NODE) {
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
              if (!preserveWhitespace) {
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
                  child.nodeType !== DOM.NodeType.ELEMENT_NODE &&
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

          case DOM.NodeType.TEXT_NODE: {
            const text = node.textContent || "";
            // Skip whitespace-only text nodes in indented output unless preserveWhitespace is true
            const trimmed = text.trim();
            if (!trimmed && !preserveWhitespace) {
              return "";
            }

            // For text nodes, normalize whitespace according to configuration
            const normalized = preserveWhitespace
              ? text
              : trimmed.replace(/\s+/g, " ");

            return `${pad}${normalized}\n`;
          }

          case DOM.NodeType.CDATA_SECTION_NODE:
            // Always preserve CDATA content exactly as is
            return `${pad}<![CDATA[${node.nodeValue}]]>\n`;

          case DOM.NodeType.COMMENT_NODE:
            return `${pad}<!--${node.nodeValue}-->\n`;

          case DOM.NodeType.PROCESSING_INSTRUCTION_NODE:
            const pi = node as ProcessingInstruction;
            return `${pad}<?${pi.target} ${pi.data}?>\n`;

          case DOM.NodeType.DOCUMENT_NODE:
            return Array.from(node.childNodes)
              .map((child) => serializer(child, level))
              .join("");

          default:
            return "";
        }
      };

      // Helper function to serialize text or CDATA without adding indentation or newlines
      const serializeTextOrCDATA = (node: Node): string => {
        if (node.nodeType === DOM.NodeType.TEXT_NODE) {
          return node.textContent || "";
        } else if (node.nodeType === DOM.NodeType.CDATA_SECTION_NODE) {
          return `<![CDATA[${node.nodeValue}]]>`;
        }
        return "";
      };

      // Combine the XML declaration (if any) with the formatted body
      const result = serializer(doc).trim();
      
      logger.debug('Pretty-printed XML', { 
        originalLength: xmlString.length, 
        formattedLength: result.length 
      });
      
      return result;
    } catch (err) {
      const error = new SerializeError('Failed to pretty print XML', xmlString);
      logger.error('Failed to pretty print XML', error);
      throw error;
    }
  }

  /**
   * Add XML declaration to a string if missing or replace existing declaration
   * @param xmlString XML string
   * @returns XML string with declaration
   */
  static ensureXMLDeclaration(xmlString: string): string {
    try {
      // VALIDATION: Check for valid input
      validate(typeof xmlString === "string", "XML string must be a string");
      
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
    } catch (err) {
      logger.error('Failed to ensure XML declaration', err);
      throw err;
    }
  }

  /**
   * Create an empty DOM document
   * @returns New empty DOM document
   */
  static createEmptyDocument(): Document {
    try {
      return DOM.createDocument();
    } catch (err) {
      const error = new SerializeError('Failed to create empty document', null);
      logger.error('Failed to create empty document', error);
      throw error;
    }
  }
}