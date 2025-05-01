/**
 * JSON to XML converter extending the BaseConverter
 */
import { Configuration } from "../types/config-types";
import { XJXError, JsonToXmlError } from "../types/error-types";
import { DOMAdapter } from "../adapters/dom-adapter";
import { NodeType } from "../types/dom-types";
import { XNode, TransformDirection } from "../types/transform-types";
import { BaseConverter } from "./base-converter";

/**
 * JSON to XML converter
 */
export class JsonToXmlConverter extends BaseConverter {
  /**
   * Constructor
   * @param config Configuration
   */
  constructor(config: Configuration) {
    super(config);
  }

  /**
   * Convert JSON to XML string
   * @param jsonObj JSON object to convert
   * @returns XML string
   */
  public convert(jsonObj: Record<string, any>): string {
    try {
      // Reset the namespace map
      this.namespaceMap = {};

      // 1. Convert JSON to XNode
      const xnode = this.jsonToXNode(jsonObj);

      // 2. Create root context for transformation
      const context = this.createRootContext(
        TransformDirection.JSON_TO_XML,
        xnode.name
      );

      // 3. Apply transformations
      const transformedNode = this.applyTransformations(xnode, context);
      
      if (transformedNode === null) {
        throw new XJXError("Root node was removed during transformation");
      }

      // 4. Convert XNode to DOM and serialize
      const doc = DOMAdapter.createDocument();
      const element = this.xnodeToDom(transformedNode, doc);

      // Handle the temporary root element if it exists
      this.handleRootElement(doc, element);

      // 5. Serialize and format the XML
      return this.serializeAndFormatXml(doc);
    } catch (error) {
      throw new XJXError(
        `Failed to convert JSON to XML: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Handle root element in the document
   * @param doc Document
   * @param element Element to set as root
   */
  private handleRootElement(doc: Document, element: Element): void {
    if (doc.documentElement && doc.documentElement.nodeName === "temp") {
      doc.replaceChild(element, doc.documentElement);
    } else {
      doc.appendChild(element);
    }
  }

  /**
   * Serialize and format XML
   * @param doc Document to serialize
   * @returns Formatted XML string
   */
  private serializeAndFormatXml(doc: Document): string {
    // Serialize to XML string using XmlUtil for consistent handling
    let xmlString = this.xmlUtil.serializeXml(doc);

    // Apply pretty printing if enabled
    if (this.config.outputOptions.prettyPrint) {
      xmlString = this.xmlUtil.prettyPrintXml(xmlString);
    }

    // Add the XML declaration at the beginning if configured to do so
    if (this.config.outputOptions.xml.declaration) {
      xmlString = this.xmlUtil.ensureXMLDeclaration(xmlString);
    }

    return xmlString;
  }

  /**
   * Convert JSON object to XNode
   * @param jsonObj JSON object to convert
   * @param parentNode Optional parent node for building hierarchy
   * @returns XNode representation
   */
  private jsonToXNode(jsonObj: Record<string, any>, parentNode?: XNode): XNode {
    this.validateJsonObject(jsonObj);

    // Get the node name (first key in the object)
    const nodeName = Object.keys(jsonObj)[0];
    if (!nodeName) {
      throw new JsonToXmlError("Empty JSON object");
    }

    const nodeData = jsonObj[nodeName];

    // Create base XNode
    const xnode = this.createBaseXNode(nodeName, parentNode);

    // Process core properties (namespace, prefix, value)
    this.processNodeCoreProperties(nodeData, xnode);

    // Process attributes and namespace declarations
    this.processNodeAttributes(nodeData, xnode);

    // Process children
    this.processNodeChildren(nodeData, xnode);

    return xnode;
  }

  /**
   * Validate JSON object
   * @param jsonObj JSON object to validate
   */
  private validateJsonObject(jsonObj: Record<string, any>): void {
    if (!jsonObj || typeof jsonObj !== "object") {
      throw new JsonToXmlError("Invalid JSON object");
    }
  }

  /**
   * Create base XNode structure
   * @param nodeName Node name
   * @param parentNode Optional parent node
   * @returns Base XNode
   */
  private createBaseXNode(nodeName: string, parentNode?: XNode): XNode {
    return {
      name: nodeName,
      type: NodeType.ELEMENT_NODE,
      parent: parentNode, // Set parent reference
    };
  }

  /**
   * Process core properties (namespace, prefix, value)
   * @param nodeData Source node data from JSON
   * @param xnode Target XNode
   */
  private processNodeCoreProperties(nodeData: any, xnode: XNode): void {
    // Add namespace and prefix if present
    const namespaceKey = this.config.propNames.namespace;
    const prefixKey = this.config.propNames.prefix;
    const valueKey = this.config.propNames.value;

    if (nodeData[namespaceKey] && this.config.preserveNamespaces) {
      xnode.namespace = nodeData[namespaceKey];
    }

    if (nodeData[prefixKey] && this.config.preserveNamespaces) {
      xnode.prefix = nodeData[prefixKey];
    }

    // Add value if present
    if (nodeData[valueKey] !== undefined) {
      xnode.value = nodeData[valueKey];
    }
  }

  /**
   * Process node attributes and namespace declarations
   * @param nodeData Source node data from JSON
   * @param xnode Target XNode
   */
  private processNodeAttributes(nodeData: any, xnode: XNode): void {
    const attributesKey = this.config.propNames.attributes;
    
    if (!this.config.preserveAttributes || 
        !nodeData[attributesKey] || 
        !Array.isArray(nodeData[attributesKey])) {
      return;
    }

    xnode.attributes = {};
    const namespaceDecls: Record<string, string> = {};
    let hasNamespaceDecls = false;

    for (const attrObj of nodeData[attributesKey]) {
      const attrName = Object.keys(attrObj)[0];
      if (!attrName) continue;

      const attrData = attrObj[attrName];
      const valueKey = this.config.propNames.value;
      const attrValue = attrData[valueKey];

      if (this.processNamespaceDeclaration(attrName, attrValue, namespaceDecls)) {
        hasNamespaceDecls = true;
      } else {
        // Regular attribute
        xnode.attributes[attrName] = attrValue;
      }
    }

    // Add namespace declarations if any were found
    if (hasNamespaceDecls) {
      xnode.namespaceDeclarations = namespaceDecls;
    }
  }

  /**
   * Process node children
   * @param nodeData Source node data from JSON
   * @param xnode Target XNode
   */
  private processNodeChildren(nodeData: any, xnode: XNode): void {
    const childrenKey = this.config.propNames.children;
    
    if (!nodeData[childrenKey] || !Array.isArray(nodeData[childrenKey])) {
      return;
    }

    xnode.children = [];

    for (const child of nodeData[childrenKey]) {
      this.processChildNode(child, xnode);
    }
  }

  /**
   * Process a single child node
   * @param child Child node data
   * @param parentNode Parent XNode
   */
  private processChildNode(child: any, parentNode: XNode): void {
    const valueKey = this.config.propNames.value;
    const cdataKey = this.config.propNames.cdata;
    const commentsKey = this.config.propNames.comments;
    const instructionKey = this.config.propNames.instruction;
    const targetKey = this.config.propNames.target;

    // Text nodes
    if (child[valueKey] !== undefined && this.config.preserveTextNodes) {
      this.addTextChildNode(child[valueKey], parentNode);
    }
    // CDATA sections
    else if (child[cdataKey] !== undefined && this.config.preserveCDATA) {
      this.addCDATAChildNode(child[cdataKey], parentNode);
    }
    // Comments
    else if (child[commentsKey] !== undefined && this.config.preserveComments) {
      this.addCommentChildNode(child[commentsKey], parentNode);
    }
    // Processing instructions
    else if (child[instructionKey] !== undefined && this.config.preserveProcessingInstr) {
      this.addProcessingInstructionChildNode(child[instructionKey], targetKey, valueKey, parentNode);
    }
    // Element nodes (recursive)
    else {
      parentNode.children!.push(this.jsonToXNode(child, parentNode));
    }
  }

  /**
   * Add a text child node
   * @param value Text value
   * @param parentNode Parent XNode
   */
  private addTextChildNode(value: any, parentNode: XNode): void {
    parentNode.children!.push({
      name: "#text",
      type: NodeType.TEXT_NODE,
      value: value,
      parent: parentNode, // Set parent reference
    });
  }

  /**
   * Add a CDATA child node
   * @param value CDATA value
   * @param parentNode Parent XNode
   */
  private addCDATAChildNode(value: any, parentNode: XNode): void {
    parentNode.children!.push({
      name: "#cdata",
      type: NodeType.CDATA_SECTION_NODE,
      value: value,
      parent: parentNode, // Set parent reference
    });
  }

  /**
   * Add a comment child node
   * @param value Comment value
   * @param parentNode Parent XNode
   */
  private addCommentChildNode(value: any, parentNode: XNode): void {
    parentNode.children!.push({
      name: "#comment",
      type: NodeType.COMMENT_NODE,
      value: value,
      parent: parentNode, // Set parent reference
    });
  }

  /**
   * Add a processing instruction child node
   * @param piData Processing instruction data
   * @param targetKey Key for target property
   * @param valueKey Key for value property
   * @param parentNode Parent XNode
   */
  private addProcessingInstructionChildNode(
    piData: any, 
    targetKey: string, 
    valueKey: string, 
    parentNode: XNode
  ): void {
    const target = piData[targetKey];
    const data = piData[valueKey] || "";

    if (target) {
      parentNode.children!.push({
        name: "#pi",
        type: NodeType.PROCESSING_INSTRUCTION_NODE,
        value: data,
        attributes: { target },
        parent: parentNode, // Set parent reference
      });
    }
  }

  /**
   * Convert XNode to DOM element
   * @param node XNode to convert
   * @param doc DOM document
   * @returns DOM element
   */
  private xnodeToDom(node: XNode, doc: Document): Element {
    // Create element with namespace
    const element = this.createElementWithNamespace(node, doc);
    
    // Add namespace declarations
    this.addNamespaceDeclarations(element, node);
    
    // Add attributes
    this.addAttributes(element, node);
    
    // Add content
    this.addNodeContent(element, node, doc);
    
    return element;
  }

  /**
   * Create element with namespace handling
   * @param node Source XNode
   * @param doc DOM document
   * @returns Created element
   */
  private createElementWithNamespace(node: XNode, doc: Document): Element {
    if (node.namespace && this.config.preserveNamespaces) {
      const qualifiedName = this.namespaceUtil.createQualifiedName(node.prefix, node.name);
      return DOMAdapter.createElementNS(node.namespace, qualifiedName);
    } else {
      return DOMAdapter.createElement(node.name);
    }
  }

  /**
   * Add namespace declarations to element
   * @param element Target DOM element
   * @param node Source XNode
   */
  private addNamespaceDeclarations(element: Element, node: XNode): void {
    if (node.namespaceDeclarations && this.config.preserveNamespaces) {
      this.namespaceUtil.addNamespaceDeclarations(element, node.namespaceDeclarations);
    }
  }

  /**
   * Add attributes to element
   * @param element Target DOM element
   * @param node Source XNode
   */
  private addAttributes(element: Element, node: XNode): void {
    if (!node.attributes) return;
    
    for (const [name, value] of Object.entries(node.attributes)) {
      // Skip any xmlns attributes as we've handled them separately
      if (name === "xmlns" || name.startsWith("xmlns:")) continue;

      // Handle attributes with namespaces
      if (this.isNamespacedAttribute(name, element, node, value)) {
        continue;
      }

      // Regular attribute with entity handling
      element.setAttribute(
        name, 
        this.entityHandler.escapeXML(String(value))
      );
    }
  }

  /**
   * Handle namespaced attribute
   * @param name Attribute name
   * @param element Target DOM element
   * @param node Source XNode
   * @param value Attribute value
   * @returns True if attribute was handled as namespaced
   */
  private isNamespacedAttribute(
    name: string, 
    element: Element, 
    node: XNode, 
    value: any
  ): boolean {
    const colonIndex = name.indexOf(":");
    if (colonIndex <= 0 || !this.config.preserveNamespaces) {
      return false;
    }
    
    const attrPrefix = name.substring(0, colonIndex);
    
    // Use NamespaceUtil for consistent namespace resolution
    const attrNs = this.findNamespaceForPrefix(node, attrPrefix);

    if (attrNs) {
      // Set attribute with namespace, with entity handling
      element.setAttributeNS(
        attrNs, 
        name, 
        this.entityHandler.escapeXML(String(value))
      );
      return true;
    }
    
    return false;
  }

  /**
   * Add content to element (text content or children)
   * @param element Target DOM element
   * @param node Source XNode
   * @param doc DOM document
   */
  private addNodeContent(element: Element, node: XNode, doc: Document): void {
    // Simple node with only a value
    if (this.hasOnlyTextContent(node)) {
      this.addTextContent(element, node);
      return;
    }
    
    // Add children
    this.addChildNodes(element, node, doc);
  }

  /**
   * Check if node has only text content
   * @param node XNode to check
   * @returns True if node has only text content
   */
  private hasOnlyTextContent(node: XNode): boolean {
    return node.value !== undefined && (!node.children || node.children.length === 0);
  }

  /**
   * Add text content to element
   * @param element Target DOM element
   * @param node Source XNode
   */
  private addTextContent(element: Element, node: XNode): void {
    // Normalize and safely escape text content
    const normalizedText = this.normalizeTextContent(String(node.value));
    element.textContent = this.entityHandler.safeXmlText(normalizedText);
  }

  /**
   * Add child nodes to element
   * @param element Target DOM element
   * @param node Source XNode
   * @param doc DOM document
   */
  private addChildNodes(element: Element, node: XNode, doc: Document): void {
    if (!node.children) return;
    
    for (const child of node.children) {
      switch (child.type) {
        case NodeType.TEXT_NODE:
          this.addTextNode(element, child, doc);
          break;
          
        case NodeType.CDATA_SECTION_NODE:
          this.addCDATANode(element, child, doc);
          break;
          
        case NodeType.COMMENT_NODE:
          this.addCommentNode(element, child, doc);
          break;
          
        case NodeType.PROCESSING_INSTRUCTION_NODE:
          this.addProcessingInstructionNode(element, child, doc);
          break;
          
        case NodeType.ELEMENT_NODE:
          element.appendChild(this.xnodeToDom(child, doc));
          break;
      }
    }
  }

  /**
   * Add text node to element
   * @param element Parent DOM element
   * @param node Source XNode
   * @param doc DOM document
   */
  private addTextNode(element: Element, node: XNode, doc: Document): void {
    // Text node - normalize and safely escape content
    const normalizedText = this.normalizeTextContent(String(node.value));
    element.appendChild(
      doc.createTextNode(this.entityHandler.safeXmlText(normalizedText))
    );
  }

  /**
   * Add CDATA node to element
   * @param element Parent DOM element
   * @param node Source XNode
   * @param doc DOM document
   */
  private addCDATANode(element: Element, node: XNode, doc: Document): void {
    // CDATA section - no escaping needed
    element.appendChild(doc.createCDATASection(String(node.value)));
  }

  /**
   * Add comment node to element
   * @param element Parent DOM element
   * @param node Source XNode
   * @param doc DOM document
   */
  private addCommentNode(element: Element, node: XNode, doc: Document): void {
    // Comment
    element.appendChild(doc.createComment(String(node.value)));
  }

  /**
   * Add processing instruction node to element
   * @param element Parent DOM element
   * @param node Source XNode
   * @param doc DOM document
   */
  private addProcessingInstructionNode(element: Element, node: XNode, doc: Document): void {
    // Processing instruction
    const target = node.attributes?.target || "";
    element.appendChild(
      doc.createProcessingInstruction(target, String(node.value))
    );
  }
}