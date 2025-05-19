/**
 * XNode to XML converter implementation with a hybrid OO-functional architecture
 * 
 * Converts XNode to XML string or DOM document with consistent application of preservation settings.
 */
import { XNodeToXmlConverter } from './converter-interfaces';
import { Configuration } from '../core/config';
import { XmlSerializer } from '../core/xml-utils';
import { DOM } from '../core/dom';
import { NodeType } from '../core/dom';
import { logger, handleError, ErrorType } from '../core/error';
// import { XmlNamespace } from '../core/xml';
import { XmlEntity } from '../core/xml-utils';
import { XNode } from '../core/xnode';
import { BaseConverter } from '../core/converter';

/**
 * Context type for XNode to XML conversion
 */
type XNodeToXmlContext = {
  namespaceMap: Record<string, string>;
};

/**
 * Converts XNode to XML string or DOM document
 */
export class DefaultXNodeToXmlConverter extends BaseConverter<XNode, string> implements XNodeToXmlConverter {
  /**
   * Convert XNode to XML string
   * @param node XNode representation
   * @returns XML string
   */
  public convert(node: XNode): string {
    try {
      // Validate input
      this.validateInput(node, "Node must be an XNode instance",
                      input => input instanceof XNode);
      
      logger.debug('Starting XNode to XML conversion', { 
        nodeName: node.name, 
        nodeType: node.type 
      });
      
      // First create a DOM document from the XNode
      const doc = this.createDomDocument(node);
      
      // Get serialization options
      const options = this.config.converters.xml.options;
      
      // Serialize according to configuration using pure functions
      let xmlString = serializeDomToString(doc);
      
      // Apply pretty printing if enabled
      if (options.prettyPrint) {
        xmlString = formatXml(xmlString, options.indent);
      }
      
      // Add XML declaration if configured
      if (options.declaration) {
        xmlString = addXmlDeclaration(xmlString);
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
      // Validate input
      this.validateInput(node, "Node must be an XNode instance",
                      input => input instanceof XNode);
      
      logger.debug('Creating DOM document from XNode', { 
        nodeName: node.name, 
        nodeType: node.type 
      });
      
      // Create context with empty namespace map
      const context: XNodeToXmlContext = { namespaceMap: {} };
      
      // Create DOM document
      const doc = DOM.createDocument();
      
      // Convert XNode to DOM using pure function
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
      // Validate inputs
      this.validateInput(node, "Node must be an XNode instance",
                      input => input instanceof XNode);
      this.validateInput(doc, "Document must be a Document instance",
                      input => input instanceof Document);
      
      // Create context with empty namespace map
      const context: XNodeToXmlContext = { namespaceMap: {} };
      
      // Use pure function to convert XNode to DOM element
      return convertXNodeToDom(node, doc, this.config, context);
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
}

// Pure functions (functional core)

/**
 * Convert XNode to DOM element
 * @param node XNode to convert
 * @param doc DOM document
 * @param config Configuration
 * @param context Conversion context
 * @returns DOM element
 */
export function convertXNodeToDom(
  node: XNode,
  doc: Document,
  config: Configuration,
  context: XNodeToXmlContext
): Element {
  let element: Element;
  
  // Create element with namespace if provided in the XNode
  if (node.namespace) {
    const qualifiedName = createQualifiedName(node.prefix, node.name);
    element = doc.createElementNS(node.namespace, qualifiedName);
  } else {
    element = doc.createElement(node.name);
  }
  
  // Add namespace declarations if present in XNode
  if (node.namespaceDeclarations) {
    addNamespaceDeclarations(element, node.namespaceDeclarations);
    
    // Update namespace map
    Object.entries(node.namespaceDeclarations).forEach(([prefix, uri]) => {
      context.namespaceMap[prefix] = uri;
    });
  }
  
  // Add attributes if present in XNode
  if (node.attributes) {
    addAttributes(element, node, context.namespaceMap);
  }
  
  // Add content
  // Simple node with only text content
  if (node.value !== undefined && (!node.children || node.children.length === 0)) {
    element.textContent = XmlEntity.safeText(String(node.value));
  }
  // Node with children
  else if (node.children && node.children.length > 0) {
    addChildNodes(element, node.children, doc, config, context);
  }
  
  logger.debug('Converted XNode to DOM element', {
    nodeName: node.name,
    elementName: element.nodeName,
    childCount: element.childNodes.length
  });
  
  return element;
}

/**
 * Create a qualified name from namespace prefix and local name
 * @param prefix Namespace prefix (can be null/undefined)
 * @param localName Local name
 * @returns Qualified name
 */
function createQualifiedName(prefix: string | null | undefined, localName: string): string {
  return prefix ? `${prefix}:${localName}` : localName;
}

/**
 * Add namespace declarations to a DOM element
 * @param element Target DOM element
 * @param declarations Namespace declarations to add
 */
function addNamespaceDeclarations(
  element: Element,
  declarations: Record<string, string>
): void {
  for (const [prefix, uri] of Object.entries(declarations)) {
    if (prefix === "") {
      // Default namespace
      element.setAttribute("xmlns", uri);
    } else {
      // Prefixed namespace
      element.setAttributeNS(
        "http://www.w3.org/2000/xmlns/",
        `xmlns:${prefix}`,
        uri
      );
    }
  }
}

/**
 * Add attributes to a DOM element
 * @param element Target DOM element
 * @param node Source XNode
 * @param namespaceMap Namespace map
 */
function addAttributes(
  element: Element,
  node: XNode,
  namespaceMap: Record<string, string>
): void {
  for (const [name, value] of Object.entries(node.attributes || {})) {
    // Skip xmlns attributes (handled separately)
    if (name === "xmlns" || name.startsWith("xmlns:")) continue;
    
    // Handle attributes with namespaces
    if (name.includes(':')) {
      const [prefix, localName] = name.split(':');
      const nsUri = findNamespaceURI(prefix, node, namespaceMap);
      
      if (nsUri) {
        element.setAttributeNS(nsUri, name, XmlEntity.safeText(String(value)));
        continue;
      }
    }
    
    // Regular attribute
    element.setAttribute(name, XmlEntity.safeText(String(value)));
  }
}

/**
 * Find namespace URI for a prefix
 * @param prefix Namespace prefix
 * @param node Starting node
 * @param namespaceMap Global namespace map
 * @returns Namespace URI or null if not found
 */
function findNamespaceURI(
  prefix: string,
  node: XNode,
  namespaceMap: Record<string, string>
): string | null {
  // First check node's own declarations
  if (node.namespaceDeclarations && node.namespaceDeclarations[prefix]) {
    return node.namespaceDeclarations[prefix];
  }
  
  // Then check namespace map
  return namespaceMap[prefix] || null;
}

/**
 * Add child nodes to a DOM element
 * @param element Target DOM element
 * @param children Source XNode children
 * @param doc DOM document
 * @param config Configuration
 * @param context Conversion context
 */
function addChildNodes(
  element: Element,
  children: XNode[],
  doc: Document,
  config: Configuration,
  context: XNodeToXmlContext
): void {
  for (const child of children) {
    switch (child.type) {
      case NodeType.TEXT_NODE:
        element.appendChild(
          doc.createTextNode(XmlEntity.safeText(String(child.value)))
        );
        break;
        
      case NodeType.CDATA_SECTION_NODE:
        element.appendChild(
          doc.createCDATASection(String(child.value))
        );
        break;
        
      case NodeType.COMMENT_NODE:
        element.appendChild(
          doc.createComment(String(child.value))
        );
        break;
        
      case NodeType.PROCESSING_INSTRUCTION_NODE:
        if (child.attributes?.target) {
          element.appendChild(
            doc.createProcessingInstruction(
              child.attributes.target,
              String(child.value || "")
            )
          );
        }
        break;
        
      case NodeType.ELEMENT_NODE:
        // Recursively process child element
        element.appendChild(
          convertXNodeToDom(child, doc, config, { ...context })
        );
        break;
    }
  }
}

/**
 * Serialize DOM node to XML string
 * @param node DOM node to serialize
 * @returns Serialized XML string
 */
function serializeDomToString(node: Node): string {
  return XmlSerializer.serialize(node);
}

/**
 * Format XML string with indentation
 * @param xmlString XML string to format
 * @param indent Number of spaces for indentation
 * @returns Formatted XML string
 */
function formatXml(xmlString: string, indent: number = 2): string {
  return XmlSerializer.prettyPrint(xmlString, indent);
}

/**
 * Add XML declaration to a string if missing
 * @param xmlString XML string
 * @returns XML string with declaration
 */
function addXmlDeclaration(xmlString: string): string {
  return XmlSerializer.ensureXMLDeclaration(xmlString);
}