/**
 * XNode to XML unified converters - Simplified, performance tracking removed
 * Phase 2: All performance.startStage/endStage calls removed
 */
import { LoggerFactory } from "../core/logger";
const logger = LoggerFactory.create();

import * as xml from '../core/xml-utils';
import { DOM, NodeType } from '../core/dom';
import { ProcessingError } from '../core/error';
import { XNode } from '../core/xnode';
import { UnifiedConverter } from '../core/pipeline';
import { PipelineContext } from '../core/context';

/**
 * Context type for XNode to XML conversion
 */
interface XNodeToXmlContext {
  namespaceMap: Record<string, string>;
}

/**
 * Simplified XNode to XML Document converter
 * REMOVED: All performance tracking calls
 */
export const xnodeToXmlConverter: UnifiedConverter<XNode, Document> = {
  name: 'xnodeToXml',
  inputType: 'XNode',
  outputType: 'Document',
  
  validate(node: XNode, context: PipelineContext): void {
    context.validateInput(!!node, "XNode cannot be null or undefined");
    context.validateInput(typeof node.name === 'string', "XNode must have a valid name");
  },
  
  execute(node: XNode, context: PipelineContext): Document {
    logger.debug('Creating DOM document from XNode', { 
      nodeName: node.name, 
      nodeType: node.type
    });
    
    const config = context.config.get();
    
    try {
      // Create context with empty namespace map
      const conversionContext: XNodeToXmlContext = { namespaceMap: {} };
      
      // Create DOM document
      const doc = DOM.createDocument();
      
      // Register DOM document for cleanup
      context.resources.registerDOMDocument(doc);
      
      // Convert XNode to DOM
      const element = convertXNodeToDom(node, doc, config, conversionContext);
      
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
  },
  
  onError(error: Error, node: XNode, context: PipelineContext): Document | null {
    logger.error('XNode to XML conversion failed', { error, nodeName: node?.name });
    return null;
  }
};

/**
 * Simplified XNode to XML string converter
 * REMOVED: All performance tracking calls
 */
export const xnodeToXmlStringConverter: UnifiedConverter<XNode, string> = {
  name: 'xnodeToXmlString',
  inputType: 'XNode',
  outputType: 'string',
  
  validate(node: XNode, context: PipelineContext): void {
    context.validateInput(!!node, "XNode cannot be null or undefined");
    context.validateInput(typeof node.name === 'string', "XNode must have a valid name");
  },
  
  execute(node: XNode, context: PipelineContext): string {
    const config = context.config.get();
    
    try {
      // First convert XNode to DOM document
      const doc = xnodeToXmlConverter.execute(node, context);
      
      // Get formatting options from config
      const prettyPrint = config.formatting.pretty;
      const indent = config.formatting.indent;
      const declaration = config.formatting.declaration;
      
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
  },
  
  onError(error: Error, node: XNode, context: PipelineContext): string | null {
    logger.error('XNode to XML string conversion failed', { error, nodeName: node?.name });
    return null;
  }
};

/**
 * Convert XNode to DOM element
 */
function convertXNodeToDom(
  node: XNode,
  doc: Document,
  config: any,
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
  config: any,
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