/**
 * XML to XNode unified converter - Simplified, performance tracking removed
 * Phase 2: All performance.startStage/endStage calls removed
 */
import { LoggerFactory } from "../core/logger";
const logger = LoggerFactory.create();

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
  processAttributes,
  processNamespaceDeclarations,
  hasTextContent
} from '../core/converter';
import { UnifiedConverter } from '../core/pipeline';
import { PipelineContext } from '../core/context';

/**
 * Context for XML to XNode conversion
 */
interface ConversionContext {
  namespaceMap: Record<string, string>;
  parentNode?: XNode;
}

/**
 * Simplified XML to XNode converter - performance tracking removed
 * REMOVED: All context.performance.startStage/endStage calls
 */
export const xmlToXNodeConverter: UnifiedConverter<string, XNode> = {
  name: 'xmlToXNode',
  inputType: 'string',
  outputType: 'XNode',
  
  validate(xml: string, context: PipelineContext): void {
    context.validateInput(typeof xml === "string", "XML source must be a string");
    context.validateInput(xml.trim().length > 0, "XML source cannot be empty");
  },
  
  execute(xml: string, context: PipelineContext): XNode {
    logger.debug('Starting XML to XNode conversion', {
      xmlLength: xml.length
    });
    
    try {
      // Parse XML string to DOM
      const doc = xmlUtils.parseXml(xml);
      
      logger.debug('Successfully parsed XML to DOM', {
        rootElement: doc.documentElement?.nodeName
      });
      
      // Register DOM document for cleanup
      context.resources.registerDOMDocument(doc);
      
      // Create context with empty namespace map
      const conversionContext: ConversionContext = { namespaceMap: {} };
      
      // Convert DOM element to XNode
      const result = convertElementToXNode(doc.documentElement, context, conversionContext);
      
      // Register result for tracking
      context.resources.registerXNode(result);
      
      logger.debug('Successfully converted XML to XNode', {
        rootNodeName: result.name,
        rootNodeType: result.type
      });
      
      return result;
      
    } catch (err) {
      throw new ProcessingError(`Failed to convert XML to XNode: ${err instanceof Error ? err.message : String(err)}`, xml);
    }
  },
  
  onError(error: Error, xml: string, context: PipelineContext): XNode | null {
    logger.error('XML to XNode conversion failed', { error, xmlLength: xml.length });
    return null;
  }
};

/**
 * Convert DOM element to XNode
 */
function convertElementToXNode(
  element: Element, 
  context: PipelineContext, 
  conversionContext: ConversionContext
): XNode {
  const config = context.config.get();
  
  // Create base node
  let xnode = createElement(
    element.localName ||
    element.nodeName.split(":").pop() ||
    element.nodeName
  );
  
  // Set parent reference
  xnode.parent = conversionContext.parentNode;

  // Process namespace information if preserving namespaces
  if (config.preserveNamespaces) {
    xnode.namespace = element.namespaceURI || undefined;
    xnode.prefix = element.prefix || undefined;

    // Process namespace declarations
    if (hasNamespaceDeclarations(element)) {
      const namespaceResult = processNamespaceDeclarations(element, conversionContext.namespaceMap);
      
      if (Object.keys(namespaceResult.declarations).length > 0) {
        xnode.namespaceDeclarations = namespaceResult.declarations;
        xnode.isDefaultNamespace = element.hasAttribute("xmlns");
        conversionContext.namespaceMap = namespaceResult.namespaceMap;
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
    processChildren(element, xnode, context, conversionContext);
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
  context: PipelineContext,
  conversionContext: ConversionContext
): void {
  const config = context.config.get();
  
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
          context, 
          { ...conversionContext, parentNode }
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
  config: any,
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