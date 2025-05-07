/**
 * XNode to XML converter implementation
 */
import { XNodeToXmlConverter } from './converter-interfaces';
import { Configuration, XNode } from '../types/transform-interfaces';
import { XmlUtil } from '../utils/xml-utils';
import { DOMAdapter } from '../adapters/dom-adapter';
import { NodeType } from '../types/dom-types';
import { XJXError } from '../types/error-types';
import { NamespaceUtil } from '../utils/namespace-util';
import { XmlEntityHandler } from '../utils/xml-entity-handler';

/**
 * Converts XNode to XML string
 */
export class DefaultXNodeToXmlConverter implements XNodeToXmlConverter {
  private config: Configuration;
  private xmlUtil: XmlUtil;
  private namespaceUtil: NamespaceUtil;
  private entityHandler: XmlEntityHandler;
  private namespaceMap: Record<string, string> = {};

  /**
   * Create a new converter
   * @param config Configuration
   */
  constructor(config: Configuration) {
    this.config = config;
    this.xmlUtil = new XmlUtil(config);
    this.namespaceUtil = NamespaceUtil.getInstance();
    this.entityHandler = XmlEntityHandler.getInstance();
  }

  /**
   * Convert XNode to XML string
   * @param node XNode representation
   * @returns XML string
   */
  public convert(node: XNode): string {
    try {
      // Reset namespace map
      this.namespaceMap = {};

      // Create DOM document
      const doc = DOMAdapter.createDocument();
      
      // Convert XNode to DOM
      const element = this.xnodeToDom(node, doc);
      
      // Handle the root element
      if (doc.documentElement && doc.documentElement.nodeName === "temp") {
        doc.replaceChild(element, doc.documentElement);
      } else {
        doc.appendChild(element);
      }
      
      // Serialize and format XML
      let xmlString = this.xmlUtil.serializeXml(doc);
      
      // Apply pretty printing if enabled
      if (this.config.outputOptions.prettyPrint) {
        xmlString = this.xmlUtil.prettyPrintXml(xmlString);
      }
      
      // Add XML declaration if configured
      if (this.config.outputOptions.xml.declaration) {
        xmlString = this.xmlUtil.ensureXMLDeclaration(xmlString);
      }
      
      return xmlString;
    } catch (error) {
      throw new XJXError(
        `Failed to convert XNode to XML: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Convert XNode to DOM element
   * @param node XNode to convert
   * @param doc DOM document
   * @returns DOM element
   */
  public xnodeToDom(node: XNode, doc: Document): Element {
    let element: Element;
    
    // Create element with namespace if needed
    if (node.namespace && this.config.preserveNamespaces) {
      const qualifiedName = this.namespaceUtil.createQualifiedName(node.prefix, node.name);
      element = doc.createElementNS(node.namespace, qualifiedName);
    } else {
      element = doc.createElement(node.name);
    }
    
    // Add namespace declarations
    if (node.namespaceDeclarations && this.config.preserveNamespaces) {
      this.namespaceUtil.addNamespaceDeclarations(element, node.namespaceDeclarations);
      
      // Update namespace map
      Object.entries(node.namespaceDeclarations).forEach(([prefix, uri]) => {
        this.namespaceMap[prefix] = uri;
      });
    }
    
    // Add attributes
    if (node.attributes) {
      for (const [name, value] of Object.entries(node.attributes)) {
        // Skip xmlns attributes (handled separately)
        if (name === "xmlns" || name.startsWith("xmlns:")) continue;
        
        // Handle attributes with namespaces
        const colonIndex = name.indexOf(":");
        if (colonIndex > 0 && this.config.preserveNamespaces) {
          const attrPrefix = name.substring(0, colonIndex);
          const attrNs = this.findNamespaceForPrefix(node, attrPrefix);
          
          if (attrNs) {
            element.setAttributeNS(
              attrNs,
              name,
              this.entityHandler.escapeXML(String(value))
            );
            continue;
          }
        }
        
        // Regular attribute
        element.setAttribute(
          name,
          this.entityHandler.escapeXML(String(value))
        );
      }
    }
    
    // Add content
    // Simple node with only text content
    if (node.value !== undefined && (!node.children || node.children.length === 0)) {
      element.textContent = this.entityHandler.safeXmlText(String(node.value));
    }
    // Node with children
    else if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        switch (child.type) {
          case NodeType.TEXT_NODE:
            element.appendChild(
              doc.createTextNode(this.entityHandler.safeXmlText(String(child.value)))
            );
            break;
            
          case NodeType.CDATA_SECTION_NODE:
            element.appendChild(doc.createCDATASection(String(child.value)));
            break;
            
          case NodeType.COMMENT_NODE:
            element.appendChild(doc.createComment(String(child.value)));
            break;
            
          case NodeType.PROCESSING_INSTRUCTION_NODE:
            const target = child.attributes?.target || "";
            element.appendChild(
              doc.createProcessingInstruction(target, String(child.value))
            );
            break;
            
          case NodeType.ELEMENT_NODE:
            element.appendChild(this.xnodeToDom(child, doc));
            break;
        }
      }
    }
    
    return element;
  }

  /**
   * Find namespace URI for a prefix
   * @param node XNode to start from
   * @param prefix Prefix to find
   * @returns Namespace URI or undefined
   */
  private findNamespaceForPrefix(node: XNode, prefix: string): string | undefined {
    return this.namespaceUtil.findNamespaceForPrefix(node, prefix, this.namespaceMap);
  }
}