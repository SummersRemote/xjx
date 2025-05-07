/**
 * XML to XNode converter implementation
 */
import { XmlToXNodeConverter } from './converter-interfaces';
import { Configuration, XNode } from '../types/transform-interfaces';
import { XmlUtil } from '../utils/xml-utils';
import { NodeType } from '../types/dom-types';
import { XJXError, XmlToJsonError } from '../types/error-types';
import { NamespaceUtil } from '../utils/namespace-util';

/**
 * Converts XML strings to XNode representation
 */
export class DefaultXmlToXNodeConverter implements XmlToXNodeConverter {
  private config: Configuration;
  private xmlUtil: XmlUtil;
  private namespaceUtil: NamespaceUtil;
  private namespaceMap: Record<string, string> = {};

  /**
   * Create a new converter
   * @param config Configuration
   */
  constructor(config: Configuration) {
    this.config = config;
    this.xmlUtil = new XmlUtil(config);
    this.namespaceUtil = NamespaceUtil.getInstance();
  }

  /**
   * Convert XML string to XNode
   * @param xml XML string
   * @returns XNode representation
   */
  public convert(xml: string): XNode {
    try {
      // Reset namespace map
      this.namespaceMap = {};
      
      // Parse XML string to DOM
      const doc = this.xmlUtil.parseXml(xml);
      
      // Convert DOM element to XNode
      return this.elementToXNode(doc.documentElement);
    } catch (error) {
      throw new XmlToJsonError(
        `Failed to convert XML to XNode: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Convert DOM element to XNode
   * @param element DOM element
   * @param parentNode Optional parent node
   * @returns XNode representation
   */
  public elementToXNode(element: Element, parentNode?: XNode): XNode {
    // Create base node
    const xnode: XNode = {
      name:
        element.localName ||
        element.nodeName.split(":").pop() ||
        element.nodeName,
      type: NodeType.ELEMENT_NODE,
      namespace: element.namespaceURI || undefined,
      prefix: element.prefix || undefined,
      parent: parentNode,
    };

    // Process attributes and namespace declarations
    if (element.attributes.length > 0) {
      xnode.attributes = {};

      // Get namespace declarations
      const namespaceDecls =
        this.namespaceUtil.getNamespaceDeclarations(element);
      if (Object.keys(namespaceDecls).length > 0) {
        xnode.namespaceDeclarations = namespaceDecls;
        xnode.isDefaultNamespace =
          this.namespaceUtil.hasDefaultNamespace(element);

        // Update global namespace map
        Object.assign(this.namespaceMap, namespaceDecls);
      }

      // Process regular attributes
      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];

        // Skip namespace declarations
        if (attr.name === "xmlns" || attr.name.startsWith("xmlns:")) continue;

        // Add regular attribute
        const attrName =
          attr.localName || attr.name.split(":").pop() || attr.name;
        xnode.attributes[attrName] = attr.value;
      }
    }

    // Process child nodes
    if (element.childNodes.length > 0) {
      // Detect mixed content
      const hasMixed = this.hasMixedContent(element);

      // Optimize single text node case
      if (
        element.childNodes.length === 1 &&
        element.childNodes[0].nodeType === NodeType.TEXT_NODE &&
        !hasMixed
      ) {
        const text = element.childNodes[0].nodeValue || "";
        const normalizedText = this.normalizeTextContent(text);

        if (normalizedText && this.config.preserveTextNodes) {
          xnode.value = normalizedText;
        }
      } else {
        // Process multiple children
        const children: XNode[] = [];

        for (let i = 0; i < element.childNodes.length; i++) {
          const child = element.childNodes[i];

          switch (child.nodeType) {
            case NodeType.TEXT_NODE:
              this.processTextNode(child, children, xnode, hasMixed);
              break;

            case NodeType.CDATA_SECTION_NODE:
              this.processCDATANode(child, children, xnode);
              break;

            case NodeType.COMMENT_NODE:
              this.processCommentNode(child, children, xnode);
              break;

            case NodeType.PROCESSING_INSTRUCTION_NODE:
              this.processProcessingInstructionNode(
                child as ProcessingInstruction,
                children,
                xnode
              );
              break;

            case NodeType.ELEMENT_NODE:
              children.push(this.elementToXNode(child as Element, xnode));
              break;
          }
        }

        if (children.length > 0) {
          xnode.children = children;
        }
      }
    }

    return xnode;
  }

  /**
   * Check if element has mixed content (text and elements)
   * @param element DOM element
   * @returns True if mixed content
   */
  private hasMixedContent(element: Element): boolean {
    let hasText = false;
    let hasElement = false;

    for (let i = 0; i < element.childNodes.length; i++) {
      const child = element.childNodes[i];

      if (child.nodeType === NodeType.TEXT_NODE) {
        if (this.hasContent(child.nodeValue || "")) {
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
  private hasContent(text: string): boolean {
    return text.trim().length > 0;
  }

  /**
   * Normalize text content based on configuration
   * @param text Text to normalize
   * @returns Normalized text
   */
  private normalizeTextContent(text: string): string {
    if (!this.config.preserveWhitespace) {
      return text.trim().replace(/\s+/g, " ");
    }
    return text;
  }

  /**
   * Process a text node
   * @param node Text node
   * @param children Children array to add to
   * @param parentNode Parent XNode
   * @param hasMixed True if parent has mixed content
   */
  private processTextNode(
    node: Node,
    children: XNode[],
    parentNode: XNode,
    hasMixed: boolean
  ): void {
    const text = node.nodeValue || "";

    if (this.config.preserveWhitespace || hasMixed || this.hasContent(text)) {
      const normalizedText = this.normalizeTextContent(text);

      if (normalizedText && this.config.preserveTextNodes) {
        children.push({
          name: "#text",
          type: NodeType.TEXT_NODE,
          value: normalizedText,
          parent: parentNode,
        });
      }
    }
  }

  /**
   * Process a CDATA node
   * @param node CDATA node
   * @param children Children array to add to
   * @param parentNode Parent XNode
   */
  private processCDATANode(
    node: Node,
    children: XNode[],
    parentNode: XNode
  ): void {
    if (this.config.preserveCDATA) {
      children.push({
        name: "#cdata",
        type: NodeType.CDATA_SECTION_NODE,
        value: node.nodeValue || "",
        parent: parentNode,
      });
    }
  }

  /**
   * Process a comment node
   * @param node Comment node
   * @param children Children array to add to
   * @param parentNode Parent XNode
   */
  private processCommentNode(
    node: Node,
    children: XNode[],
    parentNode: XNode
  ): void {
    if (this.config.preserveComments) {
      children.push({
        name: "#comment",
        type: NodeType.COMMENT_NODE,
        value: node.nodeValue || "",
        parent: parentNode,
      });
    }
  }

  /**
   * Process a processing instruction node
   * @param pi Processing instruction
   * @param children Children array to add to
   * @param parentNode Parent XNode
   */
  private processProcessingInstructionNode(
    pi: ProcessingInstruction,
    children: XNode[],
    parentNode: XNode
  ): void {
    if (this.config.preserveProcessingInstr) {
      children.push({
        name: "#pi",
        type: NodeType.PROCESSING_INSTRUCTION_NODE,
        value: pi.data || "",
        attributes: { target: pi.target },
        parent: parentNode,
      });
    }
  }
}