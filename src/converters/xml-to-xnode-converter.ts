/**
 * XML to XNode converter implementation - Updated for new hook system
 */
import { LoggerFactory } from "../core/logger";
const logger = LoggerFactory.create();

import { Configuration } from '../core/config';
import { NodeType } from '../core/dom';
import { ProcessingError } from '../core/error';
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
  processAttributes,
  processNamespaceDeclarations,
  hasTextContent
} from '../core/converter';
import {
  SourceHooks
} from "../core/hooks";

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
  convert(xml: string, config: Configuration): XNode {
    // Parse XML string to DOM
    const doc = xmlUtils.parseXml(xml);
    
    logger.debug('Successfully parsed XML to DOM', {
      rootElement: doc.documentElement?.nodeName
    });
    
    // Create context with empty namespace map
    const context: ConversionContext = { namespaceMap: {} };
    
    // Convert DOM element to XNode
    return convertElementToXNode(doc.documentElement, config, context);
  }
};

/**
 * Convert XML with source hooks support - FIXED TIMING
 * @param xml XML string
 * @param config Configuration
 * @param hooks Source hooks
 * @returns Converted XNode with hooks applied
 */
export function convertXmlWithHooks(
  xml: string,
  config: Configuration,
  hooks?: SourceHooks<string>
): XNode {
  let processedXml = xml;
  
  // Apply beforeTransform hook to raw XML
  if (hooks?.beforeTransform) {
    try {
      const beforeResult = hooks.beforeTransform(processedXml);
      if (beforeResult !== undefined && beforeResult !== null) {
        processedXml = beforeResult;
      }
    } catch (err) {
      logger.warn(`Error in XML source beforeTransform: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  
  // Convert XML to XNode (fully populated)
  const xnode = xmlToXNodeConverter.convert(processedXml, config);
  
  // Apply afterTransform hook to fully populated XNode
  let processedXNode = xnode;
  if (hooks?.afterTransform) {
    try {
      const afterResult = hooks.afterTransform(processedXNode);
      if (afterResult && typeof afterResult === 'object' && typeof afterResult.name === 'string') {
        processedXNode = afterResult;
      }
    } catch (err) {
      logger.warn(`Error in XML source afterTransform: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  
  return processedXNode;
}

/**
 * Convert DOM element to XNode
 */
function convertElementToXNode(
  element: Element, 
  config: Configuration, 
  context: ConversionContext
): XNode {
  // Create base node
  let xnode = createElement(
    element.localName ||
    element.nodeName.split(":").pop() ||
    element.nodeName
  );
  
  // Set parent reference
  xnode.parent = context.parentNode;

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
    processChildren(element, xnode, config, context);
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
  context: ConversionContext
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
          processTextNode(child, parentNode, config, hasMixed);
        }
        break;

      case NodeType.CDATA_SECTION_NODE:
        if (config.preserveCDATA) {
          const cdataNode = createCDATANode(child.nodeValue || "");
          addChild(parentNode, cdataNode);
        }
        break;

      case NodeType.COMMENT_NODE:
        if (config.preserveComments) {
          const commentNode = createCommentNode(child.nodeValue || "");
          addChild(parentNode, commentNode);
        }
        break;

      case NodeType.PROCESSING_INSTRUCTION_NODE:
        if (config.preserveProcessingInstr) {
          const pi = child as ProcessingInstruction;
          const piNode = createProcessingInstructionNode(pi.target, pi.data || "");
          addChild(parentNode, piNode);
        }
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
 * Process a text node with improved whitespace handling
 */
function processTextNode(
  node: Node,
  parentNode: XNode,
  config: Configuration,
  hasMixed: boolean
): void {
  const text = node.nodeValue || "";
  const hasContent = hasTextContent(text);
  
  if (hasContent || hasMixed) {
    const normalizedText = xmlUtils.normalizeWhitespace(text, config.preserveWhitespace);

    if ((normalizedText && config.preserveTextNodes) || 
        (config.preserveWhitespace && hasMixed && config.preserveTextNodes)) {
      const textNode = createTextNode(normalizedText || text);
      addChild(parentNode, textNode);
    }
  }
}