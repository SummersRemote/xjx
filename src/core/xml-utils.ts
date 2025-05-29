/**
 * XML utilities for parsing, serializing, and manipulating XML
 */
import { LoggerFactory } from "./logger";
const logger = LoggerFactory.create();

import { DOM, NodeType } from './dom';
import { ProcessingError } from './error';

/**
 * XML parsing utilities
 */
export function parseXml(xmlString: string, contentType: string = 'text/xml'): Document {
  try {
    // Pre-process XML string to handle entity issues
    const preprocessedXml = preprocessXml(xmlString);
    
    // Parse using DOM
    const doc = DOM.parseFromString(preprocessedXml, contentType);
    
    logger.debug('Successfully parsed XML document', {
      docElement: doc.documentElement?.nodeName,
      childCount: doc.childNodes.length
    });
    
    return doc;
  } catch (err) {
    throw new ProcessingError(`Failed to parse XML: ${err instanceof Error ? err.message : String(err)}`, xmlString);
  }
}

/**
 * Pre-process XML string before parsing to handle common issues
 */
export function preprocessXml(xmlString: string): string {
  // Handle unescaped ampersands that aren't part of entities
  return xmlString.replace(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[\da-fA-F]+;)/g, "&amp;");
}

/**
 * Post-process XML string after serialization
 */
export function postProcessXml(xmlString: string): string {
  // Remove xhtml namespace declaration that might be inserted by some DOM implementations
  let processed = xmlString.replace(
    ' xmlns="http://www.w3.org/1999/xhtml"',
    ""
  );

  // Clean up XML declaration if needed
  if (processed.startsWith("<?xml")) {
    const xmlDeclEnd = processed.indexOf("?>");
    if (xmlDeclEnd > 0) {
      processed = processed.substring(xmlDeclEnd + 2).trim();
    }
  }

  return processed;
}

/**
 * Serialize DOM node to XML string
 */
export function serializeXml(node: Node): string {
  const xmlString = DOM.serializeToString(node);
  return postProcessXml(xmlString);
}

/**
 * Format XML string with indentation - preserves all text content exactly as-is
 */
export function formatXml(xmlString: string, indent: number = 2): string {
  const INDENT_STRING = " ".repeat(indent);

  // Parse the XML to a DOM document
  const doc = parseXml(xmlString);

  // Recursive function to serialize nodes with proper indentation
  const serializeNode = (node: Node, level = 0): string => {
    const pad = INDENT_STRING.repeat(level);

    switch (node.nodeType) {
      case NodeType.ELEMENT_NODE: {
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

        // Check for mixed content or text-only content
        const hasElementChildren = children.some(
          (child) => child.nodeType === NodeType.ELEMENT_NODE
        );

        const hasTextOrCDATA = children.some(
          (child) =>
            (child.nodeType === NodeType.TEXT_NODE &&
              child.textContent?.trim()) ||
            child.nodeType === NodeType.CDATA_SECTION_NODE
        );

        // Handle mixed content - preserve exact structure
        if (hasElementChildren && hasTextOrCDATA) {
          let inner = "";
          for (const child of children) {
            if (child.nodeType === NodeType.ELEMENT_NODE) {
              // For elements in mixed content, serialize without padding
              const childSerialized = serializeNode(child, 0);
              inner += childSerialized.trim();
            } else {
              // For text and CDATA, preserve exactly as-is
              inner += serializeTextOrCDATA(child);
            }
          }
          return `${pad}${openTag}${inner}</${tagName}>\n`;
        }

        // Text-only content - preserve text exactly as-is
        if (!hasElementChildren && hasTextOrCDATA) {
          let inner = "";
          for (const child of children) {
            inner += serializeTextOrCDATA(child);
          }

          // Don't normalize text content - preserve it exactly
          if (inner !== "") {
            return `${pad}${openTag}${inner}</${tagName}>\n`;
          }
        }

        // Empty or whitespace-only elements
        if (
          children.every(
            (child) =>
              child.nodeType !== NodeType.ELEMENT_NODE &&
              (!child.textContent || !child.textContent.trim())
          )
        ) {
          return `${pad}<${tagName}${
            attrs ? " " + attrs : ""
          }></${tagName}>\n`;
        }

        // Regular element with element children - pretty format
        const inner = children
          .map((child) => serializeNode(child, level + 1))
          .join("");
        return `${pad}${openTag}\n${inner}${pad}</${tagName}>\n`;
      }

      case NodeType.TEXT_NODE: {
        const text = node.textContent || "";
        // Skip whitespace-only text nodes in pretty formatting unless they have content
        const trimmed = text.trim();
        if (!trimmed) {
          return "";
        }

        // IMPORTANT: Don't normalize whitespace in text content - preserve it exactly
        return `${pad}${text}\n`;
      }

      case NodeType.CDATA_SECTION_NODE:
        // Always preserve CDATA content exactly as is
        return `${pad}<![CDATA[${node.nodeValue}]]>\n`;

      case NodeType.COMMENT_NODE:
        return `${pad}<!--${node.nodeValue}-->\n`;

      case NodeType.PROCESSING_INSTRUCTION_NODE:
        const pi = node as ProcessingInstruction;
        return `${pad}<?${pi.target} ${pi.data}?>\n`;

      case NodeType.DOCUMENT_NODE:
        return Array.from(node.childNodes)
          .map((child) => serializeNode(child, level))
          .join("");

      default:
        return "";
    }
  };

  // Helper function to serialize text or CDATA without adding indentation or newlines
  // CRITICAL: This preserves text content exactly as-is
  const serializeTextOrCDATA = (node: Node): string => {
    if (node.nodeType === NodeType.TEXT_NODE) {
      // Return text content exactly as-is - no normalization
      return node.textContent || "";
    } else if (node.nodeType === NodeType.CDATA_SECTION_NODE) {
      return `<![CDATA[${node.nodeValue}]]>`;
    }
    return "";
  };

  // Format the document
  return serializeNode(doc).trim();
}

/**
 * Add XML declaration to a string if missing
 */
export function ensureXmlDeclaration(xmlString: string): string {
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
 * Escapes special characters in text for safe XML usage
 */
export function escapeXml(text: string): string {
  if (!text) return "";

  return text.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      case "'": return "&apos;";
      default: return char;
    }
  });
}

/**
 * Unescapes XML entities back to their character equivalents
 */
export function unescapeXml(text: string): string {
  if (!text) return "";

  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

/**
 * Safely handle text content for XML
 * Detects if the text appears to contain entity references and skips escaping if it does
 */
export function safeXmlText(text: string): string {
  if (!text) return "";

  // Skip escaping if text already contains entities
  if (/&(amp|lt|gt|quot|apos);/.test(text)) {
    return text;
  }

  return escapeXml(text);
}

/**
 * Normalize whitespace in text content
 * This should only be used during XML-to-XNode conversion, NOT during pretty printing
 */
export function normalizeWhitespace(text: string, preserveWhitespace: boolean = false): string {
  if (!text) return '';

  if (!preserveWhitespace) {
    return text.trim().replace(/\s+/g, ' ');
  }

  return text;
}

/**
 * Create a qualified name from namespace prefix and local name
 */
export function createQualifiedName(prefix: string | null | undefined, localName: string): string {
  return prefix ? `${prefix}:${localName}` : localName;
}

/**
 * Parse a qualified name into prefix and local name parts
 */
export function parseQualifiedName(qualifiedName: string): {
  prefix: string | null;
  localName: string;
} {
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
}

/**
 * Get namespace declarations from DOM Element
 */
export function getNamespaceDeclarations(element: Element): Record<string, string> {
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

  return result;
}

/**
 * Add namespace declarations to a DOM element
 */
export function addNamespaceDeclarations(
  element: Element,
  declarations: Record<string, string>
): void {
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
}