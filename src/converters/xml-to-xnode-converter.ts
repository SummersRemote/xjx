/**
 * XML to XNode converter implementation
 * 
 * Converts XML strings to XNode representation with a hybrid OO-functional architecture.
 */
import { XmlToXNodeConverter } from './converter-interfaces';
import { Configuration } from '../core/config';
import { NodeType } from '../core/dom';
import { logger, handleError, ErrorType } from '../core/error';
import { XmlParser, XmlEntity, XmlNamespace } from '../core/xml-utils';
import { XNode } from '../core/xnode';
import { BaseConverter } from '../core/converter';

/**
 * Context type for XML to XNode conversion
 */
type XmlToXNodeContext = {
  namespaceMap: Record<string, string>;
  parentNode?: XNode;
};

/**
 * Converts XML strings to XNode representation
 */
export class DefaultXmlToXNodeConverter extends BaseConverter<string, XNode> implements XmlToXNodeConverter {
  /**
   * Convert XML string to XNode
   * @param xml XML string
   * @returns XNode representation
   */
  public convert(xml: string): XNode {
    try {
      // Validate input
      this.validateInput(xml, "XML source must be a string", 
                      input => typeof input === "string" && input.length > 0);
      
      // Parse XML string to DOM
      const doc = XmlParser.parse(xml);
      
      logger.debug('Successfully parsed XML to DOM', {
        rootElement: doc.documentElement?.nodeName
      });
      
      // Create context with empty namespace map
      const context: XmlToXNodeContext = { namespaceMap: {} };
      
      // Convert DOM element to XNode using pure function
      return convertElementToXNode(doc.documentElement, this.config, context);
    } catch (err) {
      return handleError(err, 'convert XML to XNode', {
        data: { xmlLength: xml?.length },
        errorType: ErrorType.PARSE
      });
    }
  }

  /**
   * Convert DOM element to XNode
   * @param element DOM element
   * @param parentNode Optional parent node
   * @returns XNode representation
   */
  public elementToXNode(element: Element, parentNode?: XNode): XNode {
    try {
      // Validate input
      this.validateInput(element, "Element must be provided");
      
      // Create context with empty namespace map
      const context: XmlToXNodeContext = { 
        namespaceMap: {},
        parentNode
      };
      
      // Use pure function for conversion
      return convertElementToXNode(element, this.config, context);
    } catch (err) {
      return handleError(err, 'convert DOM element to XNode', {
        data: { 
          elementName: element?.nodeName,
          elementNodeType: element?.nodeType
        },
        errorType: ErrorType.PARSE
      });
    }
  }
}

// Pure functions (functional core)

/**
 * Convert DOM element to XNode
 * @param element DOM element to convert
 * @param config Configuration
 * @param context Conversion context
 * @returns XNode representation
 */
export function convertElementToXNode(
  element: Element, 
  config: Configuration, 
  context: XmlToXNodeContext
): XNode {
  // Create base node
  const xnode = new XNode(
    element.localName ||
    element.nodeName.split(":").pop() ||
    element.nodeName,
    NodeType.ELEMENT_NODE
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
        xnode.isDefaultNamespace = XmlNamespace.hasDefaultNamespace(element);

        // Update namespace map in context
        context.namespaceMap = namespaceResult.namespaceMap;
      }
    }

    // Process regular attributes if preserving attributes
    if (config.preserveAttributes && xnode.attributes) {
      processAttributes(element, xnode.attributes);
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
      const normalizedText = XmlEntity.normalizeWhitespace(text, config.preserveWhitespace);

      if (normalizedText && config.preserveTextNodes) {
        xnode.value = normalizedText;
      }
    } else {
      // Process multiple children
      const children = processChildren(element, xnode, config, context, hasMixed);
      
      if (children.length > 0) {
        xnode.children = children;
      }
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
 */
function processAttributes(
  element: Element,
  attributes: Record<string, any>
): void {
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];

    // Skip namespace declarations
    if (attr.name === "xmlns" || attr.name.startsWith("xmlns:")) continue;

    // Add regular attribute
    const attrName = attr.localName || attr.name.split(":").pop() || attr.name;
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
 * @returns Array of child XNodes
 */
function processChildren(
  element: Element,
  parentNode: XNode,
  config: Configuration,
  context: XmlToXNodeContext,
  hasMixed: boolean
): XNode[] {
  const children: XNode[] = [];

  for (let i = 0; i < element.childNodes.length; i++) {
    const child = element.childNodes[i];

    switch (child.nodeType) {
      case NodeType.TEXT_NODE:
        processTextNode(child, children, parentNode, config, hasMixed);
        break;

      case NodeType.CDATA_SECTION_NODE:
        processCDATANode(child, children, parentNode, config);
        break;

      case NodeType.COMMENT_NODE:
        processCommentNode(child, children, parentNode, config);
        break;

      case NodeType.PROCESSING_INSTRUCTION_NODE:
        processProcessingInstructionNode(
          child as ProcessingInstruction,
          children,
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
        children.push(childXNode);
        break;
    }
  }

  return children;
}

/**
 * Process a text node
 * @param node Text node
 * @param children Children array to add to
 * @param parentNode Parent XNode
 * @param config Configuration
 * @param hasMixed Whether parent has mixed content
 */
function processTextNode(
  node: Node,
  children: XNode[],
  parentNode: XNode,
  config: Configuration,
  hasMixed: boolean
): void {
  const text = node.nodeValue || "";

  if (config.preserveWhitespace || hasMixed || hasTextContent(text)) {
    const normalizedText = XmlEntity.normalizeWhitespace(text, config.preserveWhitespace);

    if (normalizedText && config.preserveTextNodes) {
      const textNode = XNode.createTextNode(normalizedText);
      textNode.parent = parentNode;
      children.push(textNode);
    }
  }
}

/**
 * Process a CDATA node
 * @param node CDATA node
 * @param children Children array to add to
 * @param parentNode Parent XNode
 * @param config Configuration
 */
function processCDATANode(
  node: Node,
  children: XNode[],
  parentNode: XNode,
  config: Configuration
): void {
  if (config.preserveCDATA) {
    const cdataNode = XNode.createCDATANode(node.nodeValue || "");
    cdataNode.parent = parentNode;
    children.push(cdataNode);
  }
}

/**
 * Process a comment node
 * @param node Comment node
 * @param children Children array to add to
 * @param parentNode Parent XNode
 * @param config Configuration
 */
function processCommentNode(
  node: Node,
  children: XNode[],
  parentNode: XNode,
  config: Configuration
): void {
  if (config.preserveComments) {
    const commentNode = XNode.createCommentNode(node.nodeValue || "");
    commentNode.parent = parentNode;
    children.push(commentNode);
  }
}

/**
 * Process a processing instruction node
 * @param pi Processing instruction
 * @param children Children array to add to
 * @param parentNode Parent XNode
 * @param config Configuration
 */
function processProcessingInstructionNode(
  pi: ProcessingInstruction,
  children: XNode[],
  parentNode: XNode,
  config: Configuration
): void {
  if (config.preserveProcessingInstr) {
    const piNode = XNode.createProcessingInstructionNode(pi.target, pi.data || "");
    piNode.parent = parentNode;
    children.push(piNode);
  }
}