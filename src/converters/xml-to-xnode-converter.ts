/**
 * XML to XNode converter implementation
 */
import { Configuration } from '../core/config';
import { NodeType } from '../core/dom';
import { logger, ProcessingError } from '../core/error';
import * as xmlUtils from '../core/xml-utils';
import { 
  XNode, 
  createElement, 
  createTextNode, 
  createCDATANode, 
  createCommentNode, 
  createProcessingInstructionNode, 
  addChild 
} from '../core/xnode';
import { 
  Converter, 
  NodeCallback,
  processAttributes,
  processNamespaceDeclarations,
  hasTextContent,
  applyNodeCallbacks
} from '../core/converter';

/**
 * Context for XML to XNode conversion
 */
interface ConversionContext {
  namespaceMap: Record<string, string>;
  parentNode?: XNode;
}

/**
 * XML to XNode converter
 */
export const xmlToXNodeConverter: Converter<string, XNode> = {
  convert(
    xml: string, 
    config: Configuration, 
    options?: any,
    beforeFn?: NodeCallback,
    afterFn?: NodeCallback
  ): XNode {
    // Parse XML string to DOM
    const doc = xmlUtils.parseXml(xml);
    
    logger.debug('Successfully parsed XML to DOM', {
      rootElement: doc.documentElement?.nodeName
    });
    
    // Create context with empty namespace map
    const context: ConversionContext = { namespaceMap: {} };
    
    // Convert DOM element to XNode
    return convertElementToXNode(doc.documentElement, config, context, beforeFn, afterFn);
  }
};

/**
 * Convert DOM element to XNode
 */
function convertElementToXNode(
  element: Element, 
  config: Configuration, 
  context: ConversionContext,
  beforeFn?: NodeCallback,
  afterFn?: NodeCallback
): XNode {
  // Create base node
  const xnode = createElement(
    element.localName ||
    element.nodeName.split(":").pop() ||
    element.nodeName
  );
  
  // Set parent reference
  xnode.parent = context.parentNode;

  // Apply before callback
  applyNodeCallbacks(xnode, beforeFn);

  // Process namespace information if preserving namespaces
  if (config.preserveNamespaces) {
    xnode.namespace = element.namespaceURI || undefined;
    xnode.prefix = element.prefix || undefined;

    // Process namespace declarations
    if (hasNamespaceDeclarations(element)) {
      const namespaceResult = processNamespaceDeclarations(element, context.namespaceMap);
      
      if (Object.keys(namespaceResult.declarations).length > 0) {
        xnode.namespaceDeclarations = namespaceResult.declarations;
        xnode.isDefaultNamespace = element.hasAttribute("xmlns");
        context.namespaceMap = namespaceResult.namespaceMap;
      }
    }
  }

  // Process attributes
  const attributes = processAttributes(element, config);
  if (attributes) {
    xnode.attributes = attributes;
  }

  // Process child nodes
  if (element.childNodes.length > 0) {
    processChildren(element, xnode, config, context, beforeFn, afterFn);
  }

  // Apply after callback
  applyNodeCallbacks(xnode, undefined, afterFn);

  logger.debug('Converted DOM element to XNode', { 
    elementName: element.nodeName, 
    xnodeName: xnode.name,
    childCount: xnode.children?.length || 0
  });
  
  return xnode;
}

/**
 * Check if element has namespace declarations
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
 * Check if element has mixed content (text and elements)
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
 * Process child nodes
 */
function processChildren(
  element: Element,
  parentNode: XNode,
  config: Configuration,
  context: ConversionContext,
  beforeFn?: NodeCallback,
  afterFn?: NodeCallback
): void {
  // Detect mixed content
  const hasMixed = hasMixedContent(element);

  // Optimize single text node case
  if (
    element.childNodes.length === 1 &&
    element.childNodes[0].nodeType === NodeType.TEXT_NODE &&
    !hasMixed
  ) {
    const text = element.childNodes[0].nodeValue || "";
    
    if (hasTextContent(text)) {
      const normalizedText = xmlUtils.normalizeWhitespace(text, config.preserveWhitespace);

      if (normalizedText && config.preserveTextNodes) {
        parentNode.value = normalizedText;
      }
    }
    return;
  }

  // Process multiple children
  for (let i = 0; i < element.childNodes.length; i++) {
    const child = element.childNodes[i];

    switch (child.nodeType) {
      case NodeType.TEXT_NODE:
        if (config.preserveTextNodes) {
          processTextNode(child, parentNode, config, hasMixed, beforeFn, afterFn);
        }
        break;

      case NodeType.CDATA_SECTION_NODE:
        if (config.preserveCDATA) {
          const cdataNode = createCDATANode(child.nodeValue || "");
          applyNodeCallbacks(cdataNode, beforeFn, afterFn);
          addChild(parentNode, cdataNode);
        }
        break;

      case NodeType.COMMENT_NODE:
        if (config.preserveComments) {
          const commentNode = createCommentNode(child.nodeValue || "");
          applyNodeCallbacks(commentNode, beforeFn, afterFn);
          addChild(parentNode, commentNode);
        }
        break;

      case NodeType.PROCESSING_INSTRUCTION_NODE:
        if (config.preserveProcessingInstr) {
          const pi = child as ProcessingInstruction;
          const piNode = createProcessingInstructionNode(pi.target, pi.data || "");
          applyNodeCallbacks(piNode, beforeFn, afterFn);
          addChild(parentNode, piNode);
        }
        break;

      case NodeType.ELEMENT_NODE:
        // Recursively process child element
        const childXNode = convertElementToXNode(
          child as Element, 
          config, 
          { ...context, parentNode },
          beforeFn,
          afterFn
        );
        addChild(parentNode, childXNode);
        break;
    }
  }
}

/**
 * Process a text node with improved whitespace handling
 */
function processTextNode(
  node: Node,
  parentNode: XNode,
  config: Configuration,
  hasMixed: boolean,
  beforeFn?: NodeCallback,
  afterFn?: NodeCallback
): void {
  const text = node.nodeValue || "";
  const hasContent = hasTextContent(text);
  
  if (hasContent || hasMixed) {
    const normalizedText = xmlUtils.normalizeWhitespace(text, config.preserveWhitespace);

    if ((normalizedText && config.preserveTextNodes) || 
        (config.preserveWhitespace && hasMixed && config.preserveTextNodes)) {
      const textNode = createTextNode(normalizedText || text);
      applyNodeCallbacks(textNode, beforeFn, afterFn);
      addChild(parentNode, textNode);
    }
  }
}