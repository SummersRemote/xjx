/**
 * XNode to XML converter implementation
 * 
 * Converts XNode to XML string or DOM document with consistent application of preservation settings.
 */
import { XNodeToXmlConverter } from './converter-interfaces';
import { Config, Configuration } from '../core/config';
import { XmlSerializer } from '../core/xml';
import { DOM } from '../core/dom';
import { NodeType } from '../core/dom';
import { logger, validate, handleError, ErrorType } from '../core/error';
import { XmlNamespace } from '../core/xml';
import { XmlEntity } from '../core/xml';
import { XNode } from '../core/xnode';

/**
 * Converts XNode to XML string or DOM document
 */
export class DefaultXNodeToXmlConverter implements XNodeToXmlConverter {
  private config: Configuration;
  private namespaceMap: Record<string, string> = {};

  /**
   * Create a new converter
   * @param config Configuration
   */
  constructor(config: Configuration) {
    // Initialize properties first to satisfy TypeScript
    this.config = config;
    
    try {
      // Then validate and potentially update
      if (!Config.isValid(config)) {
        this.config = Config.createOrUpdate({}, config);
      }
    } catch (err) {
      // If validation/update fails, use default config
      this.config = Config.getDefault();
      handleError(err, "initialize XNode to XML converter", {
        errorType: ErrorType.CONFIGURATION
      });
    }
  }

  /**
   * Convert XNode to XML string
   * @param node XNode representation
   * @returns XML string
   */
  public convert(node: XNode): string {
    try {
      // VALIDATION: Check for valid input
      validate(node instanceof XNode, "Node must be an XNode instance");
      
      logger.debug('Starting XNode to XML conversion', { 
        nodeName: node.name, 
        nodeType: node.type 
      });
      
      // First create a DOM document from the XNode
      const doc = this.createDomDocument(node);
      
      // Then serialize according to configuration
      let xmlString = XmlSerializer.serialize(doc);
      
      // Apply pretty printing if enabled
      if (this.config.converters.xml.options.prettyPrint) {
        xmlString = XmlSerializer.prettyPrint(xmlString, this.config.converters.xml.options.indent);
      }
      
      // Add XML declaration if configured
      if (this.config.converters.xml.options.declaration) {
        xmlString = XmlSerializer.ensureXMLDeclaration(xmlString);
      }
      
      logger.debug('Successfully converted XNode to XML', { xmlLength: xmlString.length });
      
      return xmlString;
    } catch (err) {
      return handleError(err, 'convert XNode to XML', {
        data: { 
          nodeName: node?.name,
          nodeType: node?.type
        },
        errorType: ErrorType.SERIALIZE,
        fallback: "<root/>" // Return minimal XML as fallback
      });
    }
  }

  /**
   * Create a DOM Document from an XNode
   * @param node XNode to convert
   * @returns DOM Document
   */
  public createDomDocument(node: XNode): Document {
    try {
      // VALIDATION: Check for valid input
      validate(node instanceof XNode, "Node must be an XNode instance");
      
      // Reset namespace map
      this.namespaceMap = {};

      // Create DOM document
      const doc = DOM.createDocument();
      
      logger.debug('Creating DOM document from XNode', { 
        nodeName: node.name, 
        nodeType: node.type 
      });
      
      // Convert XNode to DOM
      const element = this.xnodeToDom(node, doc);
      
      // Handle the root element
      if (doc.documentElement && doc.documentElement.nodeName === "temp") {
        doc.replaceChild(element, doc.documentElement);
      } else {
        doc.appendChild(element);
      }
      
      logger.debug('Successfully created DOM document', {
        documentElement: doc.documentElement?.nodeName
      });
      
      return doc;
    } catch (err) {
      return handleError(err, 'create DOM document from XNode', {
        data: { 
          nodeName: node?.name,
          nodeType: node?.type
        },
        errorType: ErrorType.SERIALIZE,
        fallback: DOM.createDocument() // Return empty document as fallback
      });
    }
  }

  /**
   * Convert XNode to DOM element
   * @param node XNode to convert
   * @param doc DOM document
   * @returns DOM element
   */
  public xnodeToDom(node: XNode, doc: Document): Element {
    try {
      // VALIDATION: Check for valid inputs
      validate(node instanceof XNode, "Node must be an XNode instance");
      validate(doc instanceof Document, "Doc must be a Document instance");
      
      let element: Element;
      
      // Create element with namespace if provided in the XNode
      if (node.namespace) {
        const qualifiedName = XmlNamespace.createQualifiedName(node.prefix, node.name);
        element = doc.createElementNS(node.namespace, qualifiedName);
      } else {
        element = doc.createElement(node.name);
      }
      
      // Add namespace declarations if present in XNode
      if (node.namespaceDeclarations) {
        XmlNamespace.addNamespaceDeclarations(element, node.namespaceDeclarations);
        
        // Update namespace map
        Object.entries(node.namespaceDeclarations).forEach(([prefix, uri]) => {
          this.namespaceMap[prefix] = uri;
        });
      }
      
      // Add attributes if present in XNode
      if (node.attributes) {
        for (const [name, value] of Object.entries(node.attributes)) {
          // Skip xmlns attributes (handled separately)
          if (name === "xmlns" || name.startsWith("xmlns:")) continue;
          
          // Handle attributes with namespaces
          if (XmlNamespace.hasPrefix(name)) {
            const { prefix } = XmlNamespace.parseQualifiedName(name);
            
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
      
      logger.debug('Converted XNode to DOM element', {
        nodeName: node.name,
        elementName: element.nodeName,
        childCount: element.childNodes.length
      });
      
      return element;
    } catch (err) {
      return handleError(err, 'convert XNode to DOM element', {
        data: {
          nodeName: node?.name,
          nodeType: node?.type
        },
        errorType: ErrorType.SERIALIZE
      });
    }
  }

  /**
   * Append a child node to a DOM element
   * @param element Parent DOM element
   * @param child Child XNode
   * @param doc DOM document
   * @private
   */
  private appendChildNode(element: Element, child: XNode, doc: Document): void {
    try {
      // VALIDATION: Check for valid inputs
      validate(element !== null && element !== undefined, "Element must be provided");
      validate(child instanceof XNode, "Child must be an XNode instance");
      validate(doc instanceof Document, "Doc must be a Document instance");
      
      // Process the child based on its type - no preservation checks
      // since these were already applied during XML-to-XNode conversion
      switch (child.type) {
        case NodeType.TEXT_NODE:
          element.appendChild(
            doc.createTextNode(XmlEntity.safeText(String(child.value)))
          );
          break;
          
        case NodeType.CDATA_SECTION_NODE:
          element.appendChild(doc.createCDATASection(String(child.value)));
          break;
          
        case NodeType.COMMENT_NODE:
          element.appendChild(doc.createComment(String(child.value)));
          break;
          
        case NodeType.PROCESSING_INSTRUCTION_NODE:
          if (child.attributes?.target) {
            element.appendChild(
              doc.createProcessingInstruction(child.attributes.target, String(child.value || ""))
            );
          }
          break;
          
        case NodeType.ELEMENT_NODE:
          element.appendChild(this.xnodeToDom(child, doc));
          break;
      }
    } catch (err) {
      handleError(err, 'append child node', {
        data: {
          childType: child?.type,
          childName: child?.name,
          parentElementName: element?.nodeName
        }
      });
      // Continue processing other children even if this one fails
    }
  }

  /**
   * Find namespace URI for a prefix
   * @param node XNode to start from
   * @param prefix Prefix to find
   * @returns Namespace URI or undefined
   * @private
   */
  private findNamespaceForPrefix(node: XNode, prefix: string): string | undefined {
    try {
      return XmlNamespace.findNamespaceForPrefix(node, prefix, this.namespaceMap);
    } catch (err) {
      return handleError(err, 'find namespace for prefix', {
        data: { prefix, nodeName: node?.name },
        fallback: undefined
      });
    }
  }
}