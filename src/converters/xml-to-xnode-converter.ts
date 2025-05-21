/**
 * XML to XNode converter implementation
 */
import { Configuration } from '../core/config';
import { NodeType } from '../core/dom';
import { logger, ProcessingError } from '../core/error';
import * as xmlUtils from '../core/xml-utils';
import { XNode, createElement, createTextNode, createCDATANode, createCommentNode, createProcessingInstructionNode, addChild } from '../core/xnode';
import { validateInput, Converter, createConverter } from '../core/converter';

// Context type for XML to XNode conversion
interface XmlToXNodeContext {
  namespaceMap: Record<string, string>;
  parentNode?: XNode;
}

/**
 * Create an XML to XNode converter
 * @param config Configuration for the converter
 * @returns Converter implementation
 */
export function createXmlToXNodeConverter(config: Configuration): Converter<string, XNode> {
  return createConverter(config, (xml: string, config: Configuration) => {
    // Validate input
    validateInput(xml, "XML source must be a string", 
                 input => typeof input === "string" && input.length > 0);
    
    try {
      // Parse XML string to DOM
      const doc = xmlUtils.parseXml(xml);
      
      logger.debug('Successfully parsed XML to DOM', {
        rootElement: doc.documentElement?.nodeName
      });
      
      // Create context with empty namespace map
      const context: XmlToXNodeContext = { namespaceMap: {} };
      
      // Convert DOM element to XNode
      return convertElementToXNode(doc.documentElement, config, context);
    } catch (err) {
      throw new ProcessingError(`Failed to convert XML to XNode: ${err instanceof Error ? err.message : String(err)}`, xml);
    }
  });
}

/**
 * Convert DOM element to XNode
 * @param element DOM element to convert
 * @param config Configuration
 * @param context Conversion context
 * @returns XNode representation
 */
function convertElementToXNode(
  element: Element, 
  config: Configuration, 
  context: XmlToXNodeContext
): XNode {
  // Create base node
  const xnode = createElement(
    element.localName ||
    element.nodeName.split(":").pop() ||
    element.nodeName
  );
  
  // Set parent reference
  xnode.parent = context.parentNode;

  // Only store namespace information if we're preserving namespaces
  if (config.preserveNamespaces) {
    xnode.namespace = element.namespaceURI || undefined;
    xnode.prefix = element.prefix || undefined;
  }

  // Process attributes and namespace declarations
  if (element.attributes.length > 0) {
    // Only create attributes object if preserving attributes or namespaces
    if (config.preserveAttributes || 
       (config.preserveNamespaces && hasNamespaceDeclarations(element))) {
      xnode.attributes = {};
    }

    // Get namespace declarations if preserving namespaces
    if (config.preserveNamespaces) {
      const namespaceResult = processNamespaceDeclarations(element, context.namespaceMap);
      
      if (Object.keys(namespaceResult.declarations).length > 0) {
        xnode.namespaceDeclarations = namespaceResult.declarations;
        xnode.isDefaultNamespace = element.hasAttribute("xmlns");

        // Update namespace map in context
        context.namespaceMap = namespaceResult.namespaceMap;
      }
    }

    // Process regular attributes if preserving attributes
    if (config.preserveAttributes && xnode.attributes) {
      processAttributes(element, xnode.attributes, config);
    }
  }

  // Process child nodes
  if (element.childNodes.length > 0) {
    // Detect mixed content
    const hasMixed = hasMixedContent(element);

    // Optimize single text node case
    if (
      element.childNodes.length === 1 &&
      element.childNodes[0].nodeType === NodeType.TEXT_NODE &&
      !hasMixed
    ) {
      const text = element.childNodes[0].nodeValue || "";
      const normalizedText = xmlUtils.normalizeWhitespace(text, config.preserveWhitespace);

      if (normalizedText && config.preserveTextNodes) {
        xnode.value = normalizedText;
      }
    } else {
      // Process multiple children
      processChildren(element, xnode, config, context, hasMixed);
    }
  }

  logger.debug('Converted DOM element to XNode', { 
    elementName: element.nodeName, 
    xnodeName: xnode.name,
    childCount: xnode.children?.length || 0
  });
  
  return xnode;
}

/**
 * Check if element has namespace declarations
 * @param element DOM element
 * @returns True if it has namespace declarations
 */
function hasNamespaceDeclarations(element: Element): boolean {
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    if (attr.name === "xmlns" || attr.name.startsWith("xmlns:")) {
      return true;
    }
  }
  return false;
}

/**
 * Process namespace declarations from an element
 * @param element DOM element
 * @param currentMap Current namespace map
 * @returns Updated namespace declarations and map
 */
function processNamespaceDeclarations(
  element: Element,
  currentMap: Record<string, string>
): { declarations: Record<string, string>; namespaceMap: Record<string, string> } {
  const declarations: Record<string, string> = {};
  const namespaceMap = { ...currentMap };
  
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];

    if (attr.name === "xmlns") {
      // Default namespace
      declarations[""] = attr.value;
      namespaceMap[""] = attr.value;
    } else if (attr.name.startsWith("xmlns:")) {
      // Prefixed namespace
      const prefix = attr.name.substring(6);
      declarations[prefix] = attr.value;
      namespaceMap[prefix] = attr.value;
    }
  }
  
  return { declarations, namespaceMap };
}

/**
 * Process regular attributes from an element
 * @param element DOM element
 * @param attributes Attributes object to populate
 * @param config Configuration
 */
function processAttributes(
  element: Element,
  attributes: Record<string, any>,
  config: Configuration
): void {
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];

    // Skip namespace declarations
    if (attr.name === "xmlns" || attr.name.startsWith("xmlns:")) continue;

    // Use the full attribute name (with prefix) when preserving namespaces
    const attrName = config.preserveNamespaces 
      ? attr.name 
      : (attr.localName || attr.name.split(":").pop() || attr.name);
    
    attributes[attrName] = attr.value;
  }
}

/**
 * Check if element has mixed content (text and elements)
 * @param element DOM element
 * @returns True if it has mixed content
 */
function hasMixedContent(element: Element): boolean {
  let hasText = false;
  let hasElement = false;

  for (let i = 0; i < element.childNodes.length; i++) {
    const child = element.childNodes[i];

    if (child.nodeType === NodeType.TEXT_NODE) {
      if (hasTextContent(child.nodeValue || "")) {
        hasText = true;
      }
    } else if (child.nodeType === NodeType.ELEMENT_NODE) {
      hasElement = true;
    }

    if (hasText && hasElement) return true;
  }

  return false;
}

/**
 * Check if text has non-whitespace content
 * @param text Text to check
 * @returns True if has content
 */
function hasTextContent(text: string): boolean {
  return text.trim().length > 0;
}

/**
 * Process child nodes
 * @param element DOM element
 * @param parentNode Parent XNode
 * @param config Configuration
 * @param context Conversion context
 * @param hasMixed Whether parent has mixed content
 */
function processChildren(
  element: Element,
  parentNode: XNode,
  config: Configuration,
  context: XmlToXNodeContext,
  hasMixed: boolean
): void {
  for (let i = 0; i < element.childNodes.length; i++) {
    const child = element.childNodes[i];

    switch (child.nodeType) {
      case NodeType.TEXT_NODE:
        processTextNode(child, parentNode, config, hasMixed);
        break;

      case NodeType.CDATA_SECTION_NODE:
        processCDATANode(child, parentNode, config);
        break;

      case NodeType.COMMENT_NODE:
        processCommentNode(child, parentNode, config);
        break;

      case NodeType.PROCESSING_INSTRUCTION_NODE:
        processProcessingInstructionNode(
          child as ProcessingInstruction,
          parentNode,
          config
        );
        break;

      case NodeType.ELEMENT_NODE:
        // Recursively process child element
        const childXNode = convertElementToXNode(
          child as Element, 
          config, 
          { ...context, parentNode }
        );
        addChild(parentNode, childXNode);
        break;
    }
  }
}

/**
 * Process a text node
 * @param node Text node
 * @param parentNode Parent XNode
 * @param config Configuration
 * @param hasMixed Whether parent has mixed content
 */
function processTextNode(
  node: Node,
  parentNode: XNode,
  config: Configuration,
  hasMixed: boolean
): void {
  const text = node.nodeValue || "";

  if (config.preserveWhitespace || hasMixed || hasTextContent(text)) {
    const normalizedText = xmlUtils.normalizeWhitespace(text, config.preserveWhitespace);

    if (normalizedText && config.preserveTextNodes) {
      const textNode = createTextNode(normalizedText);
      addChild(parentNode, textNode);
    }
  }
}

/**
 * Process a CDATA node
 * @param node CDATA node
 * @param parentNode Parent XNode
 * @param config Configuration
 */
function processCDATANode(
  node: Node,
  parentNode: XNode,
  config: Configuration
): void {
  if (config.preserveCDATA) {
    const cdataNode = createCDATANode(node.nodeValue || "");
    addChild(parentNode, cdataNode);
  }
}

/**
 * Process a comment node
 * @param node Comment node
 * @param parentNode Parent XNode
 * @param config Configuration
 */
function processCommentNode(
  node: Node,
  parentNode: XNode,
  config: Configuration
): void {
  if (config.preserveComments) {
    const commentNode = createCommentNode(node.nodeValue || "");
    addChild(parentNode, commentNode);
  }
}

/**
 * Process a processing instruction node
 * @param pi Processing instruction
 * @param parentNode Parent XNode
 * @param config Configuration
 */
function processProcessingInstructionNode(
  pi: ProcessingInstruction,
  parentNode: XNode,
  config: Configuration
): void {
  if (config.preserveProcessingInstr) {
    const piNode = createProcessingInstructionNode(pi.target, pi.data || "");
    addChild(parentNode, piNode);
  }
}