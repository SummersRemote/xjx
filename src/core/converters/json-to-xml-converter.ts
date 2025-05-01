/**
 * JSON to XML converter with transformer support and improved entity and whitespace handling
 */
import { Configuration } from "../types/config-types";
import { XJXError } from "../types/error-types";
import { DOMAdapter } from "../adapters/dom-adapter";
import { NodeType } from "../types/dom-types";
import { 
  XNode, 
  TransformContext,
  TransformDirection
} from "../types/transform-types";
import { TransformUtil } from "../utils/transform-utils";
import { XmlUtil } from "../utils/xml-utils";
import { escapeXML, safeXmlText } from "../utils/xml-escape-utils";

/**
 * JSON to XML converter
 */
export class JsonToXmlConverter {
  private config: Configuration;
  private transformUtil: TransformUtil;
  private xmlUtil: XmlUtil;
  private xjx: any; // Reference to XJX instance

  /**
   * Constructor
   * @param config Configuration
   * @param xjx XJX instance
   */
  constructor(config: Configuration, xjx: any) {
    this.config = config;
    this.transformUtil = new TransformUtil(this.config);
    this.xmlUtil = new XmlUtil(this.config);
    this.xjx = xjx;
  }

  /**
   * Convert JSON to XML string
   * @param jsonObj JSON object to convert
   * @returns XML string
   */
  public convert(jsonObj: Record<string, any>): string {
    try {
      // 1. Convert JSON to XNode
      const xnode = this.jsonToXNode(jsonObj);
      
      // 2. Create root context for transformation
      const context = this.transformUtil.createRootContext(
        TransformDirection.JSON_TO_XML,
        xnode.name
      );
      
      // 3. Apply transformations
      const transformedNode = this.xjx.applyTransformations(xnode, context);
      if (transformedNode === null) {
        throw new XJXError('Root node was removed during transformation');
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
      
      // Serialize to XML string
      let xmlString = DOMAdapter.serializeToString(doc);
      
      // Remove xhtml decl inserted by some DOM implementations
      xmlString = xmlString.replace(' xmlns="http://www.w3.org/1999/xhtml"', '');
      
      // Add XML declaration if specified
      if (this.config.outputOptions.xml.declaration) {
        xmlString = this.xmlUtil.ensureXMLDeclaration(xmlString);
      }
      
      // Apply pretty printing if enabled
      if (this.config.outputOptions.prettyPrint) {
        xmlString = this.xmlUtil.prettyPrintXml(xmlString);
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
   * Convert JSON object to XNode
   * @param jsonObj JSON object to convert
   * @returns XNode representation
   */
  private jsonToXNode(jsonObj: Record<string, any>): XNode {
    if (!jsonObj || typeof jsonObj !== 'object') {
      throw new XJXError('Invalid JSON object');
    }
    
    // Get the node name (first key in the object)
    const nodeName = Object.keys(jsonObj)[0];
    if (!nodeName) {
      throw new XJXError('Empty JSON object');
    }
    
    const nodeData = jsonObj[nodeName];
    
    // Create XNode
    const xnode: XNode = {
      name: nodeName,
      type: NodeType.ELEMENT_NODE
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
    
    // Add attributes if present
    const attributesKey = this.config.propNames.attributes;
    if (
      this.config.preserveAttributes &&
      nodeData[attributesKey] &&
      Array.isArray(nodeData[attributesKey])
    ) {
      xnode.attributes = {};
      
      for (const attrObj of nodeData[attributesKey]) {
        const attrName = Object.keys(attrObj)[0];
        if (!attrName) continue;
        
        const attrData = attrObj[attrName];
        xnode.attributes[attrName] = attrData[valueKey];
      }
    }
    
    // Add children if present
    const childrenKey = this.config.propNames.children;
    const cdataKey = this.config.propNames.cdata;
    const commentsKey = this.config.propNames.comments;
    const instructionKey = this.config.propNames.instruction;
    const targetKey = this.config.propNames.target;
    
    if (
      nodeData[childrenKey] &&
      Array.isArray(nodeData[childrenKey])
    ) {
      xnode.children = [];
      
      for (const child of nodeData[childrenKey]) {
        // Text nodes
        if (child[valueKey] !== undefined && this.config.preserveTextNodes) {
          xnode.children.push({
            name: '#text',
            type: NodeType.TEXT_NODE,
            value: child[valueKey]
          });
        }
        // CDATA sections
        else if (child[cdataKey] !== undefined && this.config.preserveCDATA) {
          xnode.children.push({
            name: '#cdata',
            type: NodeType.CDATA_SECTION_NODE,
            value: child[cdataKey]
          });
        }
        // Comments
        else if (child[commentsKey] !== undefined && this.config.preserveComments) {
          xnode.children.push({
            name: '#comment',
            type: NodeType.COMMENT_NODE,
            value: child[commentsKey]
          });
        }
        // Processing instructions
        else if (child[instructionKey] !== undefined && this.config.preserveProcessingInstr) {
          const piData = child[instructionKey];
          const target = piData[targetKey];
          const data = piData[valueKey] || '';
          
          if (target) {
            xnode.children.push({
              name: '#pi',
              type: NodeType.PROCESSING_INSTRUCTION_NODE,
              value: data,
              attributes: { target }
            });
          }
        }
        // Element nodes (recursive)
        else {
          xnode.children.push(this.jsonToXNode(child));
        }
      }
    }
    
    return xnode;
  }

  /**
   * Normalizes text content according to whitespace settings
   * @param text Text to normalize
   * @returns Normalized text
   */
  private normalizeTextContent(text: string): string {
    if (!this.config.preserveWhitespace) {
      // When preserveWhitespace is false, normalize whitespace
      return String(text).trim();
    }
    return String(text);
  }

  /**
   * Convert XNode to DOM element
   * @param node XNode to convert
   * @param doc DOM document
   * @returns DOM element
   */
  private xnodeToDom(node: XNode, doc: Document): Element {
    // Create element with namespace if available
    let element: Element;
    
    if (node.namespace && this.config.preserveNamespaces) {
      if (node.prefix) {
        // Create element with namespace and prefix
        element = DOMAdapter.createElementNS(node.namespace, `${node.prefix}:${node.name}`);
      } else {
        // Create element with namespace but no prefix
        element = DOMAdapter.createElementNS(node.namespace, node.name);
      }
    } else {
      // Create element without namespace
      element = DOMAdapter.createElement(node.name);
    }
    
    // Set attributes
    if (node.attributes) {
      for (const [name, value] of Object.entries(node.attributes)) {
        // Safely escape attribute values
        element.setAttribute(name, escapeXML(String(value)));
      }
    }
    
    // Set text content if this is a simple node with only a value
    if (node.value !== undefined && (!node.children || node.children.length === 0)) {
      // Normalize and escape text content based on configuration
      const normalizedText = this.normalizeTextContent(node.value);
      element.textContent = safeXmlText(normalizedText);
    }
    
    // Add children
    if (node.children) {
      for (const child of node.children) {
        if (child.type === NodeType.TEXT_NODE) {
          // Text node - normalize and safely escape content
          const normalizedText = this.normalizeTextContent(child.value);
          element.appendChild(doc.createTextNode(safeXmlText(normalizedText)));
        } else if (child.type === NodeType.CDATA_SECTION_NODE) {
          // CDATA section - no escaping needed
          element.appendChild(doc.createCDATASection(String(child.value)));
        } else if (child.type === NodeType.COMMENT_NODE) {
          // Comment - safely escape content
          element.appendChild(doc.createComment(String(child.value)));
        } else if (child.type === NodeType.PROCESSING_INSTRUCTION_NODE) {
          // Processing instruction
          const target = child.attributes?.target || '';
          element.appendChild(doc.createProcessingInstruction(target, String(child.value)));
        } else if (child.type === NodeType.ELEMENT_NODE) {
          // Element node
          element.appendChild(this.xnodeToDom(child, doc));
        }
      }
    }
    
    return element;
  }
}