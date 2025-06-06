/**
 * XML adapter utilities - XML parsing, serializing, and manipulating utilities
 */
import { LoggerFactory } from "../../core/logger";
const logger = LoggerFactory.create();

import { DOM, NodeType } from '../../core/dom';
import { ProcessingError } from '../../core/error';

/**
 * Parse XML string to DOM document with preprocessing
 */
export function parseXml(xmlString: string, contentType: string = 'text/xml'): Document {
  try {
    const preprocessedXml = preprocessXml(xmlString);
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
 * Pre-process XML string to handle unescaped ampersands
 */
export function preprocessXml(xmlString: string): string {
  return xmlString.replace(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[\da-fA-F]+;)/g, "&amp;");
}

/**
 * Post-process XML string after serialization
 */
export function postProcessXml(xmlString: string): string {
  // Remove xhtml namespace declaration that might be inserted by some DOM implementations
  let processed = xmlString.replace(' xmlns="http://www.w3.org/1999/xhtml"', "");

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
 * Format XML string with indentation
 */
export function formatXml(xmlString: string, indent: number = 2): string {
  const INDENT_STRING = " ".repeat(indent);
  const doc = parseXml(xmlString);

  return formatNode(doc, 0, INDENT_STRING).trim();
}

/**
 * Format a single node recursively
 */
function formatNode(node: Node, level: number, indentString: string): string {
  const pad = indentString.repeat(level);

  switch (node.nodeType) {
    case NodeType.DOCUMENT_NODE:
      return Array.from(node.childNodes)
        .map(child => formatNode(child, level, indentString))
        .join("");

    case NodeType.ELEMENT_NODE:
      return formatElement(node as Element, level, indentString, pad);

    case NodeType.TEXT_NODE:
      return formatTextNode(node, pad);

    case NodeType.CDATA_SECTION_NODE:
      return `${pad}<![CDATA[${node.nodeValue}]]>\n`;

    case NodeType.COMMENT_NODE:
      return `${pad}<!--${node.nodeValue}-->\n`;

    case NodeType.PROCESSING_INSTRUCTION_NODE:
      const pi = node as ProcessingInstruction;
      return `${pad}<?${pi.target} ${pi.data}?>\n`;

    default:
      return "";
  }
}

/**
 * Format an element node with proper content handling
 */
function formatElement(element: Element, level: number, indentString: string, pad: string): string {
  const tagName = element.tagName;
  const attrs = getAttributeString(element);
  const openTag = attrs ? `<${tagName} ${attrs}>` : `<${tagName}>`;
  const children = Array.from(element.childNodes);

  // Empty element
  if (children.length === 0) {
    return `${pad}${openTag.replace(/>$/, " />")}\n`;
  }

  const contentAnalysis = analyzeElementContent(children);
  
  // Handle different content types
  if (contentAnalysis.isMixed) {
    return formatMixedContent(element, openTag, tagName, pad);
  } else if (contentAnalysis.isTextOnly) {
    return formatTextOnlyElement(element, openTag, tagName, pad);
  } else if (contentAnalysis.isEmpty) {
    return `${pad}<${tagName}${attrs ? " " + attrs : ""}></${tagName}>\n`;
  } else {
    return formatElementWithChildren(element, openTag, tagName, pad, level, indentString);
  }
}

/**
 * Analyze element content to determine formatting strategy
 */
function analyzeElementContent(children: Node[]): {
  isMixed: boolean;
  isTextOnly: boolean;
  isEmpty: boolean;
} {
  const hasElements = children.some(child => child.nodeType === NodeType.ELEMENT_NODE);
  const hasText = children.some(child => 
    (child.nodeType === NodeType.TEXT_NODE && child.textContent?.trim()) ||
    child.nodeType === NodeType.CDATA_SECTION_NODE
  );
  const isEmpty = children.every(child => 
    child.nodeType !== NodeType.ELEMENT_NODE &&
    (!child.textContent || !child.textContent.trim())
  );

  return {
    isMixed: hasElements && hasText,
    isTextOnly: !hasElements && hasText,
    isEmpty
  };
}

/**
 * Format element with mixed content (preserve exact structure)
 */
function formatMixedContent(element: Element, openTag: string, tagName: string, pad: string): string {
  const innerContent = Array.from(element.childNodes)
    .map(child => {
      if (child.nodeType === NodeType.ELEMENT_NODE) {
        return formatNode(child, 0, "").trim();
      } else {
        return serializeTextOrCDATA(child);
      }
    })
    .join('');

  return `${pad}${openTag}${innerContent}</${tagName}>\n`;
}

/**
 * Format element with text-only content
 */
function formatTextOnlyElement(element: Element, openTag: string, tagName: string, pad: string): string {
  const textContent = Array.from(element.childNodes)
    .map(child => serializeTextOrCDATA(child))
    .join('');

  return textContent ? `${pad}${openTag}${textContent}</${tagName}>\n` : "";
}

/**
 * Format element with child elements
 */
function formatElementWithChildren(
  element: Element, 
  openTag: string, 
  tagName: string, 
  pad: string, 
  level: number, 
  indentString: string
): string {
  const childrenContent = Array.from(element.childNodes)
    .map(child => formatNode(child, level + 1, indentString))
    .join("");

  return `${pad}${openTag}\n${childrenContent}${pad}</${tagName}>\n`;
}

/**
 * Format text node
 */
function formatTextNode(node: Node, pad: string): string {
  const text = node.textContent || "";
  const trimmed = text.trim();
  
  return trimmed ? `${pad}${text}\n` : "";
}

/**
 * Serialize text or CDATA content exactly as-is
 */
function serializeTextOrCDATA(node: Node): string {
  if (node.nodeType === NodeType.TEXT_NODE) {
    return node.textContent || "";
  } else if (node.nodeType === NodeType.CDATA_SECTION_NODE) {
    return `<![CDATA[${node.nodeValue}]]>`;
  }
  return "";
}

/**
 * Get formatted attribute string for an element
 */
function getAttributeString(element: Element): string {
  return Array.from(element.attributes)
    .map(attr => `${attr.name}="${attr.value}"`)
    .join(" ");
}

/**
 * Add XML declaration to a string if missing
 */
export function ensureXmlDeclaration(xmlString: string): string {
  const standardDecl = '<?xml version="1.0" encoding="UTF-8"?>\n';

  if (xmlString.trim().startsWith("<?xml")) {
    const match = xmlString.match(/^<\?xml[^?]*\?>/);
    if (match) {
      return xmlString.replace(match[0], standardDecl.trim()) + "\n";
    }
  }

  return standardDecl + xmlString;
}

/**
 * Escape special characters for XML
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
 * Safely handle text content for XML
 */
export function safeXmlText(text: string): string {
  if (!text) return "";
  
  // Simple check for existing entities - if found, assume already escaped
  if (/&(amp|lt|gt|quot|apos);/.test(text)) {
    return text;
  }

  return escapeXml(text);
}

/**
 * Normalize whitespace in text content
 */
export function normalizeWhitespace(text: string, preserveWhitespace: boolean = false): string {
  if (!text) return '';

  return preserveWhitespace ? text : text.trim().replace(/\s+/g, ' ');
}

/**
 * Create a qualified name from namespace prefix and local name
 */
export function createQualifiedName(prefix: string | null | undefined, localName: string): string {
  return prefix ? `${prefix}:${localName}` : localName;
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
      element.setAttribute("xmlns", uri);
    } else {
      element.setAttributeNS(
        "http://www.w3.org/2000/xmlns/",
        `xmlns:${prefix}`,
        uri
      );
    }
  }
}

/**
 * Parse element name with optional prefix
 */
export function parseElementName(
  name: string, 
  config: { preservePrefixedNames: boolean }
): { prefix?: string; localName: string } {
  if (config.preservePrefixedNames && name.includes(':')) {
    const parts = name.split(':');
    return {
      prefix: parts[0],
      localName: parts[1]
    };
  }
  return { localName: name };
}

/**
 * Get the appropriate element name based on configuration
 */
export function getElementName(
  name: string, 
  prefix: string | undefined, 
  config: { preservePrefixedNames: boolean }
): string {
  if (config.preservePrefixedNames && prefix) {
    return `${prefix}:${name}`;
  }
  return name;
}

/**
 * Get the appropriate attribute name based on configuration
 */
export function getAttributeName(
  originalName: string, 
  config: { preservePrefixedNames: boolean }
): string {
  if (config.preservePrefixedNames) {
    return originalName;
  }
  
  if (originalName.includes(':')) {
    const parts = originalName.split(':');
    return parts[parts.length - 1];
  }
  
  return originalName;
}

/**
 * Process attributes for semantic XNode
 */
export function processAttributes(
  element: Element,
  config: { preserveAttributes: boolean; preservePrefixedNames: boolean }
): Record<string, any> | undefined {
  if (!element.attributes || element.attributes.length === 0 || !config.preserveAttributes) {
    return undefined;
  }

  const attributes: Record<string, any> = {};
  
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];

    if (attr.name === "xmlns" || attr.name.startsWith("xmlns:")) continue;

    const attrName = getAttributeName(attr.name, config);
    attributes[attrName] = attr.value;
  }

  return Object.keys(attributes).length > 0 ? attributes : undefined;
}

/**
 * Process attribute object from JSON
 */
export function processAttributeObject(
  attrs: Record<string, any>,
  config: { preservePrefixedNames: boolean }
): Record<string, any> {
  const result: Record<string, any> = {};

  Object.entries(attrs).forEach(([key, value]) => {
    const finalAttrName = getAttributeName(key, config);
    result[finalAttrName] = value;
  });

  return result;
}