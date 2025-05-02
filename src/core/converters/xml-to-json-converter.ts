/**
 * XML to JSON converter extending the BaseConverter
 */
import { XJXError, XmlToJsonError } from "../types/error-types";
import { Configuration } from "../types/config-types";
import { DOMAdapter } from "../adapters/dom-adapter";
import { NodeType } from "../types/dom-types";
import { XNode, TransformDirection } from "../types/transform-types";
import { BaseConverter } from "./base-converter";

/**
 * XML to JSON converter
 */
export class XmlToJsonConverter extends BaseConverter {
  /**
   * Constructor
   * @param config Configuration
   */
  constructor(config: Configuration) {
    super(config);
  }

  /**
   * Convert XML string to JSON
   * @param xmlString XML content as string
   * @returns JSON object representing the XML content
   */
  public convert(xmlString: string): Record<string, any> {
    try {
      // 1. Parse XML to DOM
      const xmlDoc = this.xmlUtil.parseXml(xmlString);

      // 2. Convert DOM to XNode
      const xnode = this.domToXNode(xmlDoc.documentElement);

      // 3. Create root context for transformation
      const context = this.createRootContext(
        TransformDirection.XML_TO_JSON,
        xnode.name
      );

      // 4. Apply transformations
      const transformedNode = this.applyTransformations(xnode, context);

      if (transformedNode === null) {
        throw new XJXError("Root node was removed during transformation");
      }

      // 5. Convert XNode to JSON
      return this.xnodeToJson(transformedNode);
    } catch (error) {
      throw new XJXError(
        `Failed to convert XML to JSON: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Convert DOM element to XNode with improved mixed content and namespace handling
   * @param element DOM element
   * @param parentNode Optional parent XNode for building the node hierarchy
   * @returns XNode representation
   */
  private domToXNode(element: Element, parentNode?: XNode): XNode {
    // Create base node structure
    const xnode = this.createBaseXNode(element, parentNode);

    // Process attributes and namespace declarations
    this.processAttributesAndNamespaces(element, xnode);

    // Process child nodes
    this.processChildNodes(element, xnode);

    return xnode;
  }

  /**
   * Create the base XNode structure from a DOM element
   * @param element Source DOM element
   * @param parentNode Optional parent XNode
   * @returns Basic XNode structure
   */
  private createBaseXNode(element: Element, parentNode?: XNode): XNode {
    return {
      name:
        element.localName ||
        element.nodeName.split(":").pop() ||
        element.nodeName,
      type: NodeType.ELEMENT_NODE,
      namespace: element.namespaceURI || undefined,
      prefix: element.prefix || undefined,
      parent: parentNode, // Set parent reference for namespace resolution
    };
  }

  /**
   * Process attributes and namespace declarations from a DOM element
   * @param element Source DOM element
   * @param xnode Target XNode to populate
   */
  private processAttributesAndNamespaces(element: Element, xnode: XNode): void {
    if (element.attributes.length === 0) return;

    xnode.attributes = {};

    // Get namespace declarations
    const namespaceDecls = this.namespaceUtil.getNamespaceDeclarations(element);
    if (Object.keys(namespaceDecls).length > 0) {
      xnode.namespaceDeclarations = namespaceDecls;
      xnode.isDefaultNamespace =
        this.namespaceUtil.hasDefaultNamespace(element);
    }

    // Process regular attributes
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];

      // Skip namespace declarations as they were already processed
      if (attr.name === "xmlns" || attr.name.startsWith("xmlns:")) continue;

      // Regular attribute - use entityHandler for consistent unescaping
      const attrName =
        attr.localName || attr.name.split(":").pop() || attr.name;
      xnode.attributes[attrName] = this.entityHandler.unescapeXML(attr.value);
    }
  }

  /**
   * Process all child nodes of a DOM element
   * @param element Source DOM element
   * @param xnode Target XNode to populate with children
   */
  private processChildNodes(element: Element, xnode: XNode): void {
    if (element.childNodes.length === 0) return;

    // Detect if this element has mixed content
    const hasMixed = this.hasMixedContent(element);

    // Single text node handling (optimize common case)
    if (this.processSingleTextNodeChild(element, hasMixed, xnode)) {
      return;
    }

    // Multiple children or mixed content handling
    this.processMultipleChildren(element, xnode, hasMixed);
  }

  /**
   * Optimize handling for elements with a single text node child
   * @param element Source DOM element
   * @param hasMixed Whether element has mixed content
   * @param xnode Target XNode to populate
   * @returns True if handled as single text node
   */
  private processSingleTextNodeChild(
    element: Element,
    hasMixed: boolean,
    xnode: XNode
  ): boolean {
    if (
      element.childNodes.length === 1 &&
      element.childNodes[0].nodeType === NodeType.TEXT_NODE &&
      !hasMixed
    ) {
      const text = element.childNodes[0].nodeValue || "";
      const normalizedText = this.normalizeTextContent(text, false);
      if (normalizedText && this.config.preserveTextNodes) {
        // Only add the value if preserveTextNodes is true
        xnode.value = this.entityHandler.unescapeXML(normalizedText);
      }
      return true;
    }
    return false;
  }

  /**
   * Process multiple child nodes for an element
   * @param element Source DOM element
   * @param xnode Target XNode to populate
   * @param hasMixed Whether element has mixed content
   */
  private processMultipleChildren(
    element: Element,
    xnode: XNode,
    hasMixed: boolean
  ): void {
    const childNodes: XNode[] = [];

    for (let i = 0; i < element.childNodes.length; i++) {
      const child = element.childNodes[i];

      switch (child.nodeType) {
        case NodeType.TEXT_NODE:
          this.processTextNode(child, childNodes, xnode, hasMixed);
          break;

        case NodeType.CDATA_SECTION_NODE:
          this.processCDATANode(child, childNodes, xnode);
          break;

        case NodeType.COMMENT_NODE:
          this.processCommentNode(child, childNodes, xnode);
          break;

        case NodeType.PROCESSING_INSTRUCTION_NODE:
          this.processProcessingInstructionNode(
            child as ProcessingInstruction,
            childNodes,
            xnode
          );
          break;

        case NodeType.ELEMENT_NODE:
          this.processElementNode(child as Element, childNodes, xnode);
          break;
      }
    }

    // Only set children if there are any after filtering
    if (childNodes.length > 0) {
      xnode.children = childNodes;
    }
  }

  /**
   * Process a text node
   * @param node Text node
   * @param childNodes Array to add the processed node to
   * @param parentNode Parent XNode
   * @param hasMixed Whether parent has mixed content
   */
  private processTextNode(
    node: Node,
    childNodes: XNode[],
    parentNode: XNode,
    hasMixed: boolean
  ): void {
    const text = node.nodeValue || "";

    // Important: even with preserveWhitespace=false, we'll keep
    // non-empty text nodes in mixed content to preserve order
    if (this.config.preserveWhitespace || hasMixed || this.hasContent(text)) {
      const normalizedText = this.normalizeTextContent(text, hasMixed);

      // Only add if we have text (could be empty after normalization)
      if (normalizedText && this.config.preserveTextNodes) {
        childNodes.push({
          name: "#text",
          type: NodeType.TEXT_NODE,
          value: this.entityHandler.unescapeXML(normalizedText),
          parent: parentNode, // Set parent reference
        });
      }
    }
  }

  /**
   * Process a CDATA section node
   * @param node CDATA node
   * @param childNodes Array to add the processed node to
   * @param parentNode Parent XNode
   */
  private processCDATANode(
    node: Node,
    childNodes: XNode[],
    parentNode: XNode
  ): void {
    if (this.config.preserveCDATA) {
      childNodes.push({
        name: "#cdata",
        type: NodeType.CDATA_SECTION_NODE,
        value: node.nodeValue || "",
        parent: parentNode, // Set parent reference
      });
    }
  }

  /**
   * Process a comment node
   * @param node Comment node
   * @param childNodes Array to add the processed node to
   * @param parentNode Parent XNode
   */
  private processCommentNode(
    node: Node,
    childNodes: XNode[],
    parentNode: XNode
  ): void {
    if (this.config.preserveComments) {
      childNodes.push({
        name: "#comment",
        type: NodeType.COMMENT_NODE,
        value: node.nodeValue || "",
        parent: parentNode, // Set parent reference
      });
    }
  }

  /**
   * Process a processing instruction node
   * @param pi Processing instruction node
   * @param childNodes Array to add the processed node to
   * @param parentNode Parent XNode
   */
  private processProcessingInstructionNode(
    pi: ProcessingInstruction,
    childNodes: XNode[],
    parentNode: XNode
  ): void {
    if (this.config.preserveProcessingInstr) {
      childNodes.push({
        name: "#pi",
        type: NodeType.PROCESSING_INSTRUCTION_NODE,
        value: pi.data || "",
        attributes: { target: pi.target },
        parent: parentNode, // Set parent reference
      });
    }
  }

  /**
   * Process an element node (recursive)
   * @param element Element node
   * @param childNodes Array to add the processed node to
   * @param parentNode Parent XNode
   */
  private processElementNode(
    element: Element,
    childNodes: XNode[],
    parentNode: XNode
  ): void {
    childNodes.push(this.domToXNode(element, parentNode));
  }

  /**
   * Convert XNode to JSON with enhanced namespace handling
   * @param node XNode to convert
   * @returns JSON representation
   */
  private xnodeToJson(node: XNode): Record<string, any> {
    const result: Record<string, any> = {};
    const nodeObj: Record<string, any> = {};

    // Process core node properties (namespace, prefix, value)
    this.processNodeCoreProperties(node, nodeObj);

    // Process attributes and namespace declarations
    this.processNodeAttributesForJson(node, nodeObj);

    // Process child nodes
    this.processNodeChildrenForJson(node, nodeObj);

    // Clean empty properties in compact mode
    this.cleanEmptyPropertiesIfNeeded(nodeObj);

    result[node.name] = nodeObj;
    return result;
  }

  /**
   * Process core properties (namespace, prefix, value) for JSON conversion
   * @param node Source XNode
   * @param nodeObj Target JSON object
   */
  private processNodeCoreProperties(
    node: XNode,
    nodeObj: Record<string, any>
  ): void {
    // Add namespace if present
    if (node.namespace && this.config.preserveNamespaces) {
      nodeObj[this.config.propNames.namespace] = node.namespace;
    }

    // Add prefix if present
    if (node.prefix && this.config.preserveNamespaces) {
      nodeObj[this.config.propNames.prefix] = node.prefix;
    }

    // Add value if present and if text nodes should be preserved
    if (node.value !== undefined && this.config.preserveTextNodes) {
      nodeObj[this.config.propNames.value] = node.value;
    }
  }

  /**
   * Process attributes and namespace declarations for JSON conversion
   * @param node Source XNode
   * @param nodeObj Target JSON object
   */
  private processNodeAttributesForJson(
    node: XNode,
    nodeObj: Record<string, any>
  ): void {
    if (!this.config.preserveAttributes) return;

    const attrs: Array<Record<string, any>> = [];

    // Add regular attributes
    this.addRegularAttributesToJson(node, attrs);

    // Add namespace declarations as special attributes
    this.addNamespaceDeclarationsToJson(node, attrs);

    if (attrs.length > 0) {
      nodeObj[this.config.propNames.attributes] = attrs;
    }
  }

  /**
   * Add regular attributes to JSON attribute array
   * @param node Source XNode
   * @param attrs Target attributes array
   */
  private addRegularAttributesToJson(
    node: XNode,
    attrs: Array<Record<string, any>>
  ): void {
    if (node.attributes && Object.keys(node.attributes).length > 0) {
      for (const [name, value] of Object.entries(node.attributes)) {
        const attrObj: Record<string, any> = {
          [name]: { [this.config.propNames.value]: value },
        };
        attrs.push(attrObj);
      }
    }
  }

  /**
   * Add namespace declarations to JSON attribute array
   * @param node Source XNode
   * @param attrs Target attributes array
   */
  private addNamespaceDeclarationsToJson(
    node: XNode,
    attrs: Array<Record<string, any>>
  ): void {
    if (node.namespaceDeclarations && this.config.preserveNamespaces) {
      for (const [prefix, uri] of Object.entries(node.namespaceDeclarations)) {
        const attrName = prefix === "" ? "xmlns" : `xmlns:${prefix}`;
        const attrObj: Record<string, any> = {
          [attrName]: { [this.config.propNames.value]: uri },
        };
        attrs.push(attrObj);
      }
    }
  }

  /**
   * Process child nodes for JSON conversion
   * @param node Source XNode
   * @param nodeObj Target JSON object
   */
  private processNodeChildrenForJson(
    node: XNode,
    nodeObj: Record<string, any>
  ): void {
    if (!node.children || node.children.length === 0) return;

    const children: Array<Record<string, any>> = [];

    for (const child of node.children) {
      switch (child.type) {
        case NodeType.TEXT_NODE:
          // Only add text nodes if preserveTextNodes is true
          if (this.config.preserveTextNodes) {
            children.push({ [this.config.propNames.value]: child.value });
          }
          break;

        case NodeType.CDATA_SECTION_NODE:
          children.push({ [this.config.propNames.cdata]: child.value });
          break;

        case NodeType.COMMENT_NODE:
          children.push({ [this.config.propNames.comments]: child.value });
          break;

        case NodeType.PROCESSING_INSTRUCTION_NODE:
          children.push({
            [this.config.propNames.instruction]: {
              [this.config.propNames.target]: child.attributes?.target,
              [this.config.propNames.value]: child.value,
            },
          });
          break;

        case NodeType.ELEMENT_NODE:
          children.push(this.xnodeToJson(child));
          break;
      }
    }

    if (children.length > 0) {
      nodeObj[this.config.propNames.children] = children;
    }
  }

  /**
   * Clean empty properties in compact mode
   * @param nodeObj Object to clean
   */
  private cleanEmptyPropertiesIfNeeded(nodeObj: Record<string, any>): void {
    if (!this.config.outputOptions.compact) return;

    Object.keys(nodeObj).forEach((key) => {
      const value = nodeObj[key];
      if (
        value === undefined ||
        value === null ||
        (Array.isArray(value) && value.length === 0) ||
        (typeof value === "object" && Object.keys(value).length === 0)
      ) {
        delete nodeObj[key];
      }
    });
  }
}
