/**
 * XNode to XML converter implementation
 * 
 * Converts XNode to XML string using the new static utilities.
 */
import { XNodeToXmlConverter } from './converter-interfaces';
import { Configuration } from '../core/config';
import { XmlSerializer } from '../core/xml';
import { DOM } from '../core/dom';
import { NodeType } from '../core/dom';
import { ErrorHandler } from '../core/error';
import { XmlNamespace } from '../core/xml';
import { XmlEntity } from '../core/xml';
import { XNode } from '../core/xnode';

/**
 * Converts XNode to XML string
 */
export class DefaultXNodeToXmlConverter implements XNodeToXmlConverter {
  private config: Configuration;
  private namespaceMap: Record<string, string> = {};

  /**
   * Create a new converter
   * @param config Configuration
   */
  constructor(config: Configuration) {
    this.config = config;
  }

  /**
   * Convert XNode to XML string
   * @param node XNode representation
   * @returns XML string
   */
  public convert(node: XNode): string {
    return ErrorHandler.try(
      () => {
        // Reset namespace map
        this.namespaceMap = {};

        // Create DOM document
        const doc = DOM.createDocument();
        
        // Convert XNode to DOM
        const element = this.xnodeToDom(node, doc);
        
        // Handle the root element
        if (doc.documentElement && doc.documentElement.nodeName === "temp") {
          doc.replaceChild(element, doc.documentElement);
        } else {
          doc.appendChild(element);
        }
        
        // Serialize and format XML
        let xmlString = XmlSerializer.serialize(doc);
        
        // Apply pretty printing if enabled
        if (this.config.outputOptions.prettyPrint) {
          xmlString = XmlSerializer.prettyPrint(xmlString, this.config.outputOptions.indent);
        }
        
        // Add XML declaration if configured
        if (this.config.outputOptions.xml.declaration) {
          xmlString = XmlSerializer.ensureXMLDeclaration(xmlString);
        }
        
        return xmlString;
      },
      'Failed to convert XNode to XML',
      'json-to-xml'
    );
  }

  /**
   * Convert XNode to DOM element
   * @param node XNode to convert
   * @param doc DOM document
   * @returns DOM element
   */
  public xnodeToDom(node: XNode, doc: Document): Element {
    return ErrorHandler.try(
      () => {
        let element: Element;
        
        // Create element with namespace if needed
        if (node.namespace && this.config.preserveNamespaces) {
          const qualifiedName = XmlNamespace.createQualifiedName(node.prefix, node.name);
          element = doc.createElementNS(node.namespace, qualifiedName);
        } else {
          element = doc.createElement(node.name);
        }
        
        // Add namespace declarations
        if (node.namespaceDeclarations && this.config.preserveNamespaces) {
          XmlNamespace.addNamespaceDeclarations(element, node.namespaceDeclarations);
          
          // Update namespace map
          Object.entries(node.namespaceDeclarations).forEach(([prefix, uri]) => {
            this.namespaceMap[prefix] = uri;
          });
        }
        
        // Add attributes
        if (this.config.preserveAttributes && node.attributes) {
          for (const [name, value] of Object.entries(node.attributes)) {
            // Skip xmlns attributes (handled separately)
            if (name === "xmlns" || name.startsWith("xmlns:")) continue;
            
            // Handle attributes with namespaces
            if (XmlNamespace.hasPrefix(name) && this.config.preserveNamespaces) {
              const { prefix, localName } = XmlNamespace.parseQualifiedName(name);
              
              if (prefix) {
                const attrNs = this.findNamespaceForPrefix(node, prefix);
                
                if (attrNs) {
                  element.setAttributeNS(
                    attrNs,
                    name,
                    XmlEntity.escape(String(value))
                  );
                  continue;
                }
              }
            }
            
            // Regular attribute
            element.setAttribute(
              name,
              XmlEntity.escape(String(value))
            );
          }
        }
        
        // Add content
        // Simple node with only text content
        if (node.value !== undefined && (!node.children || node.children.length === 0)) {
          element.textContent = XmlEntity.safeText(String(node.value));
        }
        // Node with children
        else if (node.children && node.children.length > 0) {
          for (const child of node.children) {
            this.appendChildNode(element, child, doc);
          }
        }
        
        return element;
      },
      'Failed to convert XNode to DOM element',
      'json-to-xml'
    );
  }

  /**
   * Append a child node to a DOM element
   * @param element Parent DOM element
   * @param child Child XNode
   * @param doc DOM document
   */
  private appendChildNode(element: Element, child: XNode, doc: Document): void {
    switch (child.type) {
      case NodeType.TEXT_NODE:
        if (this.config.preserveTextNodes) {
          element.appendChild(
            doc.createTextNode(XmlEntity.safeText(String(child.value)))
          );
        }
        break;
        
      case NodeType.CDATA_SECTION_NODE:
        if (this.config.preserveCDATA) {
          element.appendChild(doc.createCDATASection(String(child.value)));
        }
        break;
        
      case NodeType.COMMENT_NODE:
        if (this.config.preserveComments) {
          element.appendChild(doc.createComment(String(child.value)));
        }
        break;
        
      case NodeType.PROCESSING_INSTRUCTION_NODE:
        if (this.config.preserveProcessingInstr && child.attributes?.target) {
          element.appendChild(
            doc.createProcessingInstruction(child.attributes.target, String(child.value || ""))
          );
        }
        break;
        
      case NodeType.ELEMENT_NODE:
        element.appendChild(this.xnodeToDom(child, doc));
        break;
    }
  }

  /**
   * Find namespace URI for a prefix
   * @param node XNode to start from
   * @param prefix Prefix to find
   * @returns Namespace URI or undefined
   */
  private findNamespaceForPrefix(node: XNode, prefix: string): string | undefined {
    return XmlNamespace.findNamespaceForPrefix(node, prefix, this.namespaceMap);
  }
}