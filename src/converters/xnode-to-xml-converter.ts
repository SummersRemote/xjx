/**
 * XNode to XML converter implementation
 */
import { Configuration } from '../core/config';
import * as xml from '../core/xml-utils';
import { DOM, NodeType } from '../core/dom';
import { logger, ProcessingError } from '../core/error';
import { XNode } from '../core/xnode';
import { validateInput, Converter, createConverter } from '../core/converter';

// Context type for XNode to XML conversion
interface XNodeToXmlContext {
  namespaceMap: Record<string, string>;
}

/**
 * Options for XML serialization
 */
export interface XmlSerializationOptions {
  prettyPrint?: boolean;
  indent?: number;
  declaration?: boolean;
}

/**
 * Create an XNode to XML Document converter
 * @param config Configuration for the converter
 * @returns Converter implementation
 */
export function createXNodeToXmlConverter(config: Configuration): Converter<XNode, Document> {
  return createConverter(config, (node: XNode, config: Configuration) => {
    // Validate input
    validateInput(node, "Node must be an XNode instance", 
                  input => input !== null && typeof input === 'object');
    
    try {
      logger.debug('Creating DOM document from XNode', { 
        nodeName: node.name, 
        nodeType: node.type 
      });
      
      // Create context with empty namespace map
      const context: XNodeToXmlContext = { namespaceMap: {} };
      
      // Create DOM document
      const doc = DOM.createDocument();
      
      // Convert XNode to DOM
      const element = convertXNodeToDom(node, doc, config, context);
      
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
      throw new ProcessingError(`Failed to convert XNode to XML: ${err instanceof Error ? err.message : String(err)}`);
    }
  });
}

/**
 * Create an XNode to XML string converter
 * @param config Configuration for the converter
 * @returns Converter implementation
 */
export function createXNodeToXmlStringConverter(
  config: Configuration, 
  serializationOptions?: XmlSerializationOptions
): Converter<XNode, string, XmlSerializationOptions> {
  return createConverter(config, (node: XNode, config: Configuration, options?: XmlSerializationOptions) => {
    try {
      // Merge options with any pre-configured options
      const mergedOptions = {
        ...serializationOptions,
        ...options
      };
      
      // First convert XNode to DOM document
      const docConverter = createXNodeToXmlConverter(config);
      const doc = docConverter.convert(node);
      
      // Get options, allowing overrides from the parameters
      const prettyPrint = mergedOptions?.prettyPrint !== undefined ? 
        mergedOptions.prettyPrint : config.formatting.pretty;
      
      const indent = mergedOptions?.indent !== undefined ? 
        mergedOptions.indent : config.formatting.indent;
      
      const declaration = mergedOptions?.declaration !== undefined ? 
        mergedOptions.declaration : config.formatting.declaration;
      
      // Serialize to string
      let xmlString = xml.serializeXml(doc);
      
      // Apply pretty printing if enabled
      if (prettyPrint) {
        xmlString = xml.formatXml(xmlString, indent);
      }
      
      // Add XML declaration if configured
      if (declaration) {
        xmlString = xml.ensureXmlDeclaration(xmlString);
      }
      
      logger.debug('Successfully converted XNode to XML string', {
        xmlLength: xmlString.length,
        prettyPrint,
        indent,
        declaration
      });
      
      return xmlString;
    } catch (err) {
      throw new ProcessingError(`Failed to convert XNode to XML string: ${err instanceof Error ? err.message : String(err)}`);
    }
  });
}

/**
 * Convert XNode to DOM element
 * @param node XNode to convert
 * @param doc DOM document
 * @param config Configuration
 * @param context Conversion context
 * @returns DOM element
 */
function convertXNodeToDom(
  node: XNode,
  doc: Document,
  config: Configuration,
  context: XNodeToXmlContext
): Element {
  let element: Element;
  
  // Create element with namespace if provided in the XNode
  if (node.namespace) {
    const qualifiedName = xml.createQualifiedName(node.prefix, node.name);
    element = DOM.createElementNS(doc, node.namespace, qualifiedName);
  } else {
    element = DOM.createElement(doc, node.name);
  }
  
  // Add namespace declarations if present in XNode
  if (node.namespaceDeclarations) {
    xml.addNamespaceDeclarations(element, node.namespaceDeclarations);
    
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
    element.textContent = xml.safeXmlText(String(node.value));
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
        element.setAttributeNS(nsUri, name, xml.safeXmlText(String(value)));
        continue;
      }
    }
    
    // Regular attribute
    element.setAttribute(name, xml.safeXmlText(String(value)));
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
          DOM.createTextNode(doc, xml.safeXmlText(String(child.value)))
        );
        break;
        
      case NodeType.CDATA_SECTION_NODE:
        element.appendChild(
          DOM.createCDATASection(doc, String(child.value))
        );
        break;
        
      case NodeType.COMMENT_NODE:
        element.appendChild(
          DOM.createComment(doc, String(child.value))
        );
        break;
        
      case NodeType.PROCESSING_INSTRUCTION_NODE:
        if (child.attributes?.target) {
          element.appendChild(
            DOM.createProcessingInstruction(
              doc,
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