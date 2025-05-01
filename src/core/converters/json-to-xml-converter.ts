/**
 * JSON to XML converter with improved architecture
 * Uses consolidated utilities for entity handling, namespace resolution, and configuration
 */
import { Configuration } from "../types/config-types";
import { XJXError, JsonToXmlError } from "../types/error-types";
import { DOMAdapter } from "../adapters/dom-adapter";
import { NodeType } from "../types/dom-types";
import {
  XNode,
  TransformContext,
  TransformDirection,
} from "../types/transform-types";
import { TransformUtil } from "../utils/transform-utils";
import { XmlUtil } from "../utils/xml-utils";
import { XmlEntityHandler } from "../utils/xml-entity-handler";
import { NamespaceUtil } from "../utils/namespace-util";
import { ConfigProvider } from "../config/config-provider";
import { ExtensionRegistry } from "../extensions/registry";

/**
 * JSON to XML converter
 */
export class JsonToXmlConverter {
  private config: Configuration;
  private transformUtil: TransformUtil;
  private xmlUtil: XmlUtil;
  private entityHandler: XmlEntityHandler;
  private namespaceUtil: NamespaceUtil;
  private namespaceMap: Record<string, string>; // Collected namespaces for resolution

  /**
   * Constructor
   * @param config Configuration
   */
  constructor(config: Configuration) {
    this.config = config;
    this.transformUtil = new TransformUtil(this.config);
    this.xmlUtil = new XmlUtil(this.config);
    this.entityHandler = XmlEntityHandler.getInstance();
    this.namespaceUtil = NamespaceUtil.getInstance();
    this.namespaceMap = {};
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
      const context = this.transformUtil.createRootContext(
        TransformDirection.JSON_TO_XML,
        xnode.name
      );

      // 3. Apply transformations using registry
      const applyTransformations = ExtensionRegistry.getTransformationOperation('applyTransformations');
      const transformedNode = applyTransformations(xnode, context);
      
      if (transformedNode === null) {
        throw new XJXError("Root node was removed during transformation");
      }

      // 4. Convert XNode to DOM and serialize
      const doc = DOMAdapter.createDocument();
      const element = this.xnodeToDom(transformedNode, doc);

      // Handle the temporary root element if it exists
      if (doc.documentElement && doc.documentElement.nodeName === "temp") {
        doc.replaceChild(element, doc.documentElement);
      } else {
        doc.appendChild(element);
      }

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
    } catch (error) {
      throw new XJXError(
        `Failed to convert JSON to XML: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Convert JSON object to XNode with enhanced namespace handling
   * @param jsonObj JSON object to convert
   * @param parentNode Optional parent node for building hierarchy
   * @returns XNode representation
   */
  private jsonToXNode(jsonObj: Record<string, any>, parentNode?: XNode): XNode {
    if (!jsonObj || typeof jsonObj !== "object") {
      throw new JsonToXmlError("Invalid JSON object");
    }

    // Get the node name (first key in the object)
    const nodeName = Object.keys(jsonObj)[0];
    if (!nodeName) {
      throw new JsonToXmlError("Empty JSON object");
    }

    const nodeData = jsonObj[nodeName];

    // Create XNode
    const xnode: XNode = {
      name: nodeName,
      type: NodeType.ELEMENT_NODE,
      parent: parentNode, // Set parent reference
    };

    // Add namespace and prefix if present
    const namespaceKey = this.config.propNames.namespace;
    const prefixKey = this.config.propNames.prefix;

    if (nodeData[namespaceKey] && this.config.preserveNamespaces) {
      xnode.namespace = nodeData[namespaceKey];
    }

    if (nodeData[prefixKey] && this.config.preserveNamespaces) {
      xnode.prefix = nodeData[prefixKey];
    }

    // Add value if present
    const valueKey = this.config.propNames.value;
    if (nodeData[valueKey] !== undefined) {
      xnode.value = nodeData[valueKey];
    }

    // Add attributes and detect namespace declarations
    const attributesKey = this.config.propNames.attributes;
    if (
      this.config.preserveAttributes &&
      nodeData[attributesKey] &&
      Array.isArray(nodeData[attributesKey])
    ) {
      xnode.attributes = {};
      const namespaceDecls: Record<string, string> = {};
      let hasNamespaceDecls = false;

      for (const attrObj of nodeData[attributesKey]) {
        const attrName = Object.keys(attrObj)[0];
        if (!attrName) continue;

        const attrData = attrObj[attrName];
        const attrValue = attrData[valueKey];

        // Check if this is a namespace declaration
        if (attrName === "xmlns") {
          // Default namespace
          namespaceDecls[""] = attrValue;
          xnode.isDefaultNamespace = true;
          hasNamespaceDecls = true;

          // Add to global namespace map for resolution
          this.namespaceMap[""] = attrValue;
        } else if (attrName.startsWith("xmlns:")) {
          // Prefixed namespace
          const prefix = attrName.substring(6);
          namespaceDecls[prefix] = attrValue;
          hasNamespaceDecls = true;

          // Add to global namespace map for resolution
          this.namespaceMap[prefix] = attrValue;
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

    // Add children if present
    const childrenKey = this.config.propNames.children;
    const cdataKey = this.config.propNames.cdata;
    const commentsKey = this.config.propNames.comments;
    const instructionKey = this.config.propNames.instruction;
    const targetKey = this.config.propNames.target;

    if (nodeData[childrenKey] && Array.isArray(nodeData[childrenKey])) {
      xnode.children = [];

      for (const child of nodeData[childrenKey]) {
        // Text nodes
        if (child[valueKey] !== undefined && this.config.preserveTextNodes) {
          xnode.children.push({
            name: "#text",
            type: NodeType.TEXT_NODE,
            value: child[valueKey],
            parent: xnode, // Set parent reference
          });
        }
        // CDATA sections
        else if (child[cdataKey] !== undefined && this.config.preserveCDATA) {
          xnode.children.push({
            name: "#cdata",
            type: NodeType.CDATA_SECTION_NODE,
            value: child[cdataKey],
            parent: xnode, // Set parent reference
          });
        }
        // Comments
        else if (
          child[commentsKey] !== undefined &&
          this.config.preserveComments
        ) {
          xnode.children.push({
            name: "#comment",
            type: NodeType.COMMENT_NODE,
            value: child[commentsKey],
            parent: xnode, // Set parent reference
          });
        }
        // Processing instructions
        else if (
          child[instructionKey] !== undefined &&
          this.config.preserveProcessingInstr
        ) {
          const piData = child[instructionKey];
          const target = piData[targetKey];
          const data = piData[valueKey] || "";

          if (target) {
            xnode.children.push({
              name: "#pi",
              type: NodeType.PROCESSING_INSTRUCTION_NODE,
              value: data,
              attributes: { target },
              parent: xnode, // Set parent reference
            });
          }
        }
        // Element nodes (recursive)
        else {
          xnode.children.push(this.jsonToXNode(child, xnode));
        }
      }
    }

    return xnode;
  }

  /**
   * Convert XNode to DOM element with consistent entity handling
   * @param node XNode to convert
   * @param doc DOM document
   * @returns DOM element
   */
  private xnodeToDom(node: XNode, doc: Document): Element {
    // Create element with namespace if available
    let element: Element;

    if (node.namespace && this.config.preserveNamespaces) {
      const qualifiedName = this.namespaceUtil.createQualifiedName(node.prefix, node.name);
      element = DOMAdapter.createElementNS(node.namespace, qualifiedName);
    } else {
      element = DOMAdapter.createElement(node.name);
    }

    // Add namespace declarations using NamespaceUtil
    if (node.namespaceDeclarations && this.config.preserveNamespaces) {
      this.namespaceUtil.addNamespaceDeclarations(element, node.namespaceDeclarations);
    }

    // Set attributes
    if (node.attributes) {
      for (const [name, value] of Object.entries(node.attributes)) {
        // Skip any xmlns attributes as we've handled them separately
        if (name === "xmlns" || name.startsWith("xmlns:")) continue;

        // Handle attributes with namespaces
        const colonIndex = name.indexOf(":");
        if (colonIndex > 0 && this.config.preserveNamespaces) {
          const attrPrefix = name.substring(0, colonIndex);
          const attrLocalName = name.substring(colonIndex + 1);
          
          // Use NamespaceUtil for consistent namespace resolution
          const attrNs = this.namespaceUtil.findNamespaceForPrefix(node, attrPrefix, this.namespaceMap);

          if (attrNs) {
            // Set attribute with namespace, with entity handling
            element.setAttributeNS(
              attrNs, 
              name, 
              this.entityHandler.escapeXML(String(value))
            );
          } else {
            // No namespace found, set as regular attribute
            element.setAttribute(
              name, 
              this.entityHandler.escapeXML(String(value))
            );
          }
        } else {
          // Regular attribute with entity handling
          element.setAttribute(
            name, 
            this.entityHandler.escapeXML(String(value))
          );
        }
      }
    }

    // Set text content if this is a simple node with only a value
    if (
      node.value !== undefined &&
      (!node.children || node.children.length === 0)
    ) {
      // Normalize and safely escape text content
      const normalizedText = this.xmlUtil.normalizeTextContent(node.value);
      element.textContent = this.entityHandler.safeXmlText(normalizedText);
    }

    // Add children
    if (node.children) {
      for (const child of node.children) {
        if (child.type === NodeType.TEXT_NODE) {
          // Text node - normalize and safely escape content
          const normalizedText = this.xmlUtil.normalizeTextContent(child.value);
          element.appendChild(
            doc.createTextNode(this.entityHandler.safeXmlText(normalizedText))
          );
        } else if (child.type === NodeType.CDATA_SECTION_NODE) {
          // CDATA section - no escaping needed
          element.appendChild(doc.createCDATASection(String(child.value)));
        } else if (child.type === NodeType.COMMENT_NODE) {
          // Comment
          element.appendChild(doc.createComment(String(child.value)));
        } else if (child.type === NodeType.PROCESSING_INSTRUCTION_NODE) {
          // Processing instruction
          const target = child.attributes?.target || "";
          element.appendChild(
            doc.createProcessingInstruction(target, String(child.value))
          );
        } else if (child.type === NodeType.ELEMENT_NODE) {
          // Element node
          element.appendChild(this.xnodeToDom(child, doc));
        }
      }
    }

    return element;
  }
}