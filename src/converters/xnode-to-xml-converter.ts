/**
 * Semantic XNode to XML converter - Maps semantic types to XML DOM
 * Replaces DOM-specific conversion with semantic type awareness
 */
import { LoggerFactory } from "../core/logger";
const logger = LoggerFactory.create();

import * as xml from '../core/xml-utils';
import { DOM, NodeType } from '../core/dom';
import { ProcessingError } from '../core/error';
import { XNode, XNodeType, getTextContent } from '../core/xnode';
import { ConfigurationHelper } from '../core/config';
import { UnifiedConverter } from '../core/pipeline';
import { PipelineContext } from '../core/context';

/**
 * Context for semantic XNode to XML conversion
 */
interface XmlOutputContext {
  namespaceMap: Record<string, string>;
  config: ConfigurationHelper;
  doc: Document;
}

/**
 * Semantic XNode to XML Document converter
 */
export const xnodeToXmlConverter: UnifiedConverter<XNode, Document> = {
  name: 'semanticXNodeToXml',
  inputType: 'XNode',
  outputType: 'Document',
  
  validate(node: XNode, context: PipelineContext): void {
    context.validateInput(!!node, "XNode cannot be null or undefined");
    context.validateInput(typeof node.name === 'string', "XNode must have a valid name");
  },
  
  execute(node: XNode, context: PipelineContext): Document {
    logger.debug('Converting semantic XNode to XML document', { 
      nodeName: node.name, 
      nodeType: node.type
    });
    
    try {
      // Create DOM document
      const doc = DOM.createDocument();
      
      // Register DOM document for cleanup
      context.resources.registerDOMDocument(doc);
      
      // Create conversion context
      const outputContext: XmlOutputContext = {
        namespaceMap: {},
        config: new ConfigurationHelper(context.config.get()),
        doc
      };
      
      // Convert semantic XNode to DOM element
      const element = convertSemanticNodeToDom(node, outputContext);
      
      // Handle the root element
      if (doc.documentElement && doc.documentElement.nodeName === "temp") {
        doc.replaceChild(element, doc.documentElement);
      } else {
        doc.appendChild(element);
      }
      
      logger.debug('Successfully converted semantic XNode to XML document', {
        documentElement: doc.documentElement?.nodeName
      });
      
      return doc;
      
    } catch (err) {
      throw new ProcessingError(`Failed to convert semantic XNode to XML: ${err instanceof Error ? err.message : String(err)}`);
    }
  },
  
  onError(error: Error, node: XNode, context: PipelineContext): Document | null {
    logger.error('Semantic XNode to XML conversion failed', { error, nodeName: node?.name });
    return null;
  }
};

/**
 * Semantic XNode to XML string converter
 */
export const xnodeToXmlStringConverter: UnifiedConverter<XNode, string> = {
  name: 'semanticXNodeToXmlString',
  inputType: 'XNode',
  outputType: 'string',
  
  validate(node: XNode, context: PipelineContext): void {
    context.validateInput(!!node, "XNode cannot be null or undefined");
    context.validateInput(typeof node.name === 'string', "XNode must have a valid name");
  },
  
  execute(node: XNode, context: PipelineContext): string {
    const config = new ConfigurationHelper(context.config.get());
    
    try {
      // First convert semantic XNode to DOM document
      const doc = xnodeToXmlConverter.execute(node, context);
      
      // Get formatting options from config
      const prettyPrint = config.getJsonConfig().prettyPrint ?? config.config.formatting.pretty;
      const indent = config.config.formatting.indent;
      const declaration = config.config.formatting.declaration ?? true;
      
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
      
      logger.debug('Successfully converted semantic XNode to XML string', {
        xmlLength: xmlString.length,
        prettyPrint,
        indent
      });
      
      return xmlString;
      
    } catch (err) {
      throw new ProcessingError(`Failed to convert semantic XNode to XML string: ${err instanceof Error ? err.message : String(err)}`);
    }
  },
  
  onError(error: Error, node: XNode, context: PipelineContext): string | null {
    logger.error('Semantic XNode to XML string conversion failed', { error, nodeName: node?.name });
    return null;
  }
};

/**
 * Convert semantic XNode to DOM element/node based on type
 */
function convertSemanticNodeToDom(node: XNode, context: XmlOutputContext): Element | Node {
  switch (node.type) {
    case XNodeType.RECORD:
      return convertRecordToElement(node, context);
      
    case XNodeType.COLLECTION:
      // Collections in XML become wrapper elements
      return convertCollectionToElement(node, context);
      
    case XNodeType.FIELD:
    case XNodeType.VALUE:
      // Fields and values become elements with text content
      return convertPrimitiveToElement(node, context);
      
    case XNodeType.COMMENT:
      return DOM.createComment(context.doc, String(node.value || ''));
      
    case XNodeType.INSTRUCTION:
      return DOM.createProcessingInstruction(context.doc, node.name, String(node.value || ''));
      
    case XNodeType.DATA:
      // CDATA becomes CDATA section
      return DOM.createCDATASection(context.doc, String(node.value || ''));
      
    default:
      logger.warn('Unknown semantic node type in XML conversion', {
        nodeType: node.type,
        nodeName: node.name
      });
      // Fallback: create element
      return convertRecordToElement(node, context);
  }
}

/**
 * Convert RECORD node to XML element
 */
function convertRecordToElement(node: XNode, context: XmlOutputContext): Element {
  const xmlConfig = context.config.getXmlConfig();
  let element: Element;
  
  // Create element with namespace if provided
  if (node.ns && xmlConfig.preserveNamespaces) {
    const qualifiedName = createQualifiedName(node, xmlConfig);
    element = DOM.createElementNS(context.doc, node.ns, qualifiedName);
    
    // Update namespace map
    if (node.label) {
      context.namespaceMap[node.label] = node.ns;
    }
  } else {
    element = DOM.createElement(context.doc, node.name);
  }
  
  // Add semantic attributes as XML attributes
  if (node.attributes && node.attributes.length > 0) {
    addSemanticAttributesToElement(element, node.attributes, context);
  }
  
  // Handle content based on semantic structure
  if (node.value !== undefined && (!node.children || node.children.length === 0)) {
    // Simple value - set as text content
    element.textContent = xml.safeXmlText(String(node.value));
  } else if (node.children && node.children.length > 0) {
    // Has children - add as child nodes
    addSemanticChildrenToElement(element, node.children, context);
  }
  
  logger.debug('Converted semantic record to XML element', {
    nodeName: node.name,
    elementName: element.nodeName,
    childCount: element.childNodes.length
  });
  
  return element;
}

/**
 * Convert COLLECTION node to XML element
 */
function convertCollectionToElement(node: XNode, context: XmlOutputContext): Element {
  // Collections become wrapper elements in XML
  const element = DOM.createElement(context.doc, node.name);
  
  // Add namespace info if present
  if (node.ns && context.config.getXmlConfig().preserveNamespaces) {
    const qualifiedName = createQualifiedName(node, context.config.getXmlConfig());
    return DOM.createElementNS(context.doc, node.ns, qualifiedName);
  }
  
  // Add all collection items as child elements
  if (node.children && node.children.length > 0) {
    addSemanticChildrenToElement(element, node.children, context);
  }
  
  logger.debug('Converted semantic collection to XML element', {
    collectionName: node.name,
    itemCount: node.children?.length || 0
  });
  
  return element;
}

/**
 * Convert primitive node (FIELD/VALUE) to XML element
 */
function convertPrimitiveToElement(node: XNode, context: XmlOutputContext): Element {
  const element = DOM.createElement(context.doc, node.name);
  
  // Add namespace info if present
  if (node.ns && context.config.getXmlConfig().preserveNamespaces) {
    const qualifiedName = createQualifiedName(node, context.config.getXmlConfig());
    return DOM.createElementNS(context.doc, node.ns, qualifiedName);
  }
  
  // Set text content
  if (node.value !== undefined) {
    element.textContent = xml.safeXmlText(String(node.value));
  }
  
  // If field has children (complex field), add them
  if (node.children && node.children.length > 0) {
    addSemanticChildrenToElement(element, node.children, context);
  }
  
  return element;
}

/**
 * Create qualified name from semantic node
 */
function createQualifiedName(node: XNode, xmlConfig: any): string {
  if (!xmlConfig.preserveNamespaces) {
    return node.name;
  }
  
  switch (xmlConfig.namespacePrefixHandling) {
    case 'preserve':
      // Use label as prefix if available
      return node.label ? `${node.label}:${node.name}` : node.name;
      
    case 'label':
      // Use label as prefix
      return node.label ? `${node.label}:${node.name}` : node.name;
      
    case 'strip':
      // No prefix
      return node.name;
      
    default:
      return node.name;
  }
}

/**
 * Add semantic attributes to XML element
 */
function addSemanticAttributesToElement(
  element: Element, 
  attributes: XNode[], 
  context: XmlOutputContext
): void {
  const xmlConfig = context.config.getXmlConfig();
  
  for (const attr of attributes) {
    if (attr.type === XNodeType.ATTRIBUTES) {
      const attrName = attr.name;
      const attrValue = xml.safeXmlText(String(attr.value || ''));
      
      // Handle namespaced attributes
      if (attr.ns && xmlConfig.preserveNamespaces) {
        const qualifiedAttrName = attr.label ? `${attr.label}:${attrName}` : attrName;
        element.setAttributeNS(attr.ns, qualifiedAttrName, attrValue);
      } else {
        element.setAttribute(attrName, attrValue);
      }
    }
  }
}

/**
 * Add semantic children to XML element
 */
function addSemanticChildrenToElement(
  element: Element, 
  children: XNode[], 
  context: XmlOutputContext
): void {
  for (const child of children) {
    // Handle special field attributes (when XML attributes were converted to fields)
    if (child.type === XNodeType.FIELD && child.name.startsWith('@')) {
      // Convert back to XML attribute
      const attrName = child.name.substring(1);
      const attrValue = xml.safeXmlText(String(child.value || ''));
      element.setAttribute(attrName, attrValue);
      continue;
    }
    
    // Convert child node to DOM node
    const childNode = convertSemanticNodeToDom(child, context);
    element.appendChild(childNode);
  }
}

/**
 * Handle mixed content in semantic to XML conversion
 */
function handleMixedContent(node: XNode, element: Element, context: XmlOutputContext): void {
  if (!node.children) return;
  
  // Check if this is mixed content (text values among elements)
  const hasTextValues = node.children.some(child => 
    child.type === XNodeType.VALUE && child.name === '#text'
  );
  const hasElements = node.children.some(child => 
    child.type === XNodeType.RECORD || child.type === XNodeType.COLLECTION
  );
  
  if (hasTextValues && hasElements) {
    // Handle mixed content by preserving order
    for (const child of node.children) {
      if (child.type === XNodeType.VALUE && child.name === '#text') {
        // Add text node
        const textNode = DOM.createTextNode(context.doc, String(child.value || ''));
        element.appendChild(textNode);
      } else {
        // Add element node
        const childElement = convertSemanticNodeToDom(child, context);
        element.appendChild(childElement);
      }
    }
  } else {
    // Regular content - add all children
    addSemanticChildrenToElement(element, node.children, context);
  }
}