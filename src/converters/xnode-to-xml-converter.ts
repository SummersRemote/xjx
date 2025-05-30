/**
 * XNode to XML converter implementation
 */
import { LoggerFactory } from "../core/logger";
const logger = LoggerFactory.create();

import { Configuration } from '../core/config';
import * as xml from '../core/xml-utils';
import { DOM, NodeType } from '../core/dom';
import { ProcessingError } from '../core/error';
import { XNode } from '../core/xnode';
import { Converter, NodeCallback, applyNodeCallbacks } from '../core/converter';

/**
 * Context type for XNode to XML conversion
 */
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
 * XNode to XML Document converter
 */
export const xnodeToXmlConverter: Converter<XNode, Document, XmlSerializationOptions> = {
  convert(
    node: XNode, 
    config: Configuration, 
    options?: XmlSerializationOptions,
    beforeFn?: NodeCallback,
    afterFn?: NodeCallback
  ): Document {
    try {
      logger.debug('Creating DOM document from XNode', { 
        nodeName: node.name, 
        nodeType: node.type 
      });
      
      // Apply before callback and use returned node
      const processedNode = applyNodeCallbacks(node, beforeFn);
      
      // Create context with empty namespace map
      const context: XNodeToXmlContext = { namespaceMap: {} };
      
      // Create DOM document
      const doc = DOM.createDocument();
      
      // Convert XNode to DOM
      const element = convertXNodeToDom(processedNode, doc, config, context, beforeFn, afterFn);
      
      // Handle the root element
      if (doc.documentElement && doc.documentElement.nodeName === "temp") {
        doc.replaceChild(element, doc.documentElement);
      } else {
        doc.appendChild(element);
      }
      
      // Apply after callback
      applyNodeCallbacks(processedNode, undefined, afterFn);
      
      logger.debug('Successfully created DOM document', {
        documentElement: doc.documentElement?.nodeName
      });
      
      return doc;
    } catch (err) {
      throw new ProcessingError(`Failed to convert XNode to XML: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
};

/**
 * XNode to XML string converter
 */
export const xnodeToXmlStringConverter: Converter<XNode, string, XmlSerializationOptions> = {
  convert(
    node: XNode, 
    config: Configuration, 
    options?: XmlSerializationOptions,
    beforeFn?: NodeCallback,
    afterFn?: NodeCallback
  ): string {
    try {
      // First convert XNode to DOM document
      const doc = xnodeToXmlConverter.convert(node, config, options, beforeFn, afterFn);
      
      // Get options with defaults
      const prettyPrint = options?.prettyPrint !== undefined ? 
        options.prettyPrint : config.formatting.pretty;
      
      const indent = options?.indent !== undefined ? 
        options.indent : config.formatting.indent;
      
      const declaration = options?.declaration !== undefined ? 
        options.declaration : config.formatting.declaration;
      
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
  }
};

/**
 * Convert XNode to DOM element
 */
function convertXNodeToDom(
  node: XNode,
  doc: Document,
  config: Configuration,
  context: XNodeToXmlContext,
  beforeFn?: NodeCallback,
  afterFn?: NodeCallback
): Element {
  let element: Element;
  
  // Apply before callback and use returned node
  const processedNode = applyNodeCallbacks(node, beforeFn);
  
  // Create element with namespace if provided in the XNode
  if (processedNode.namespace) {
    const qualifiedName = xml.createQualifiedName(processedNode.prefix, processedNode.name);
    element = DOM.createElementNS(doc, processedNode.namespace, qualifiedName);
  } else {
    element = DOM.createElement(doc, processedNode.name);
  }
  
  // Add namespace declarations if present in XNode
  if (processedNode.namespaceDeclarations) {
    xml.addNamespaceDeclarations(element, processedNode.namespaceDeclarations);
    
    // Update namespace map
    Object.entries(processedNode.namespaceDeclarations).forEach(([prefix, uri]) => {
      context.namespaceMap[prefix] = uri;
    });
  }
  
  // Add attributes if present in XNode
  if (processedNode.attributes) {
    addAttributes(element, processedNode, context.namespaceMap);
  }
  
  // Add content
  // Simple node with only text content
  if (processedNode.value !== undefined && (!processedNode.children || processedNode.children.length === 0)) {
    element.textContent = xml.safeXmlText(String(processedNode.value));
  }
  // Node with children
  else if (processedNode.children && processedNode.children.length > 0) {
    addChildNodes(element, processedNode.children, doc, config, context, beforeFn, afterFn);
  }
  
  // Apply after callback
  applyNodeCallbacks(processedNode, undefined, afterFn);
  
  logger.debug('Converted XNode to DOM element', {
    nodeName: processedNode.name,
    elementName: element.nodeName,
    childCount: element.childNodes.length
  });
  
  return element;
}

/**
 * Add attributes to a DOM element
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
 */
function addChildNodes(
  element: Element,
  children: XNode[],
  doc: Document,
  config: Configuration,
  context: XNodeToXmlContext,
  beforeFn?: NodeCallback,
  afterFn?: NodeCallback
): void {
  for (const child of children) {
    // Apply callbacks to child and use returned node
    const processedChild = applyNodeCallbacks(child, beforeFn);
    
    switch (processedChild.type) {
      case NodeType.TEXT_NODE:
        element.appendChild(
          DOM.createTextNode(doc, xml.safeXmlText(String(processedChild.value)))
        );
        break;
        
      case NodeType.CDATA_SECTION_NODE:
        element.appendChild(
          DOM.createCDATASection(doc, String(processedChild.value))
        );
        break;
        
      case NodeType.COMMENT_NODE:
        element.appendChild(
          DOM.createComment(doc, String(processedChild.value))
        );
        break;
        
      case NodeType.PROCESSING_INSTRUCTION_NODE:
        if (processedChild.attributes?.target) {
          element.appendChild(
            DOM.createProcessingInstruction(
              doc,
              processedChild.attributes.target,
              String(processedChild.value || "")
            )
          );
        }
        break;
        
      case NodeType.ELEMENT_NODE:
        // Recursively process child element
        element.appendChild(
          convertXNodeToDom(processedChild, doc, config, { ...context }, beforeFn, afterFn)
        );
        break;
    }
    
    // Apply after callback to child
    applyNodeCallbacks(processedChild, undefined, afterFn);
  }
}