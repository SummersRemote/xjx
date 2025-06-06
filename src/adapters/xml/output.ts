/**
 * XML output adapter - Semantic XNode to XML conversion
 */
import { LoggerFactory } from "../../core/logger";
const logger = LoggerFactory.create();

import { DOM, NodeType } from '../../core/dom';
import { ProcessingError } from '../../core/error';
import { XNode, XNodeType, getTextContent } from '../../core/xnode';
import { UnifiedConverter } from '../../core/pipeline';
import { PipelineContext } from '../../core/context';
import { TerminalExtensionContext } from "../../core/extension";
import { OutputHooks } from "../../core/hooks";
import { XmlOutputConfiguration, DEFAULT_XML_OUTPUT_CONFIG } from "./config";
import * as xmlUtils from './utils';

/**
 * Context for semantic XNode to XML conversion
 */
interface XmlOutputContext {
  namespaceMap: Record<string, string>;
  config: XmlOutputConfiguration;
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
      
      // Get XML output config from pipeline context or use defaults
      const baseConfig = context.config.get();
      const xmlOutputConfig: XmlOutputConfiguration = {
        ...DEFAULT_XML_OUTPUT_CONFIG,
        ...(baseConfig as any).xml?.output
      };
      
      // Create conversion context
      const outputContext: XmlOutputContext = {
        namespaceMap: {},
        config: xmlOutputConfig,
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
    const baseConfig = context.config.get();
    const xmlOutputConfig: XmlOutputConfiguration = {
      ...DEFAULT_XML_OUTPUT_CONFIG,
      ...(baseConfig as any).xml?.output
    };
    
    try {
      // First convert semantic XNode to DOM document
      const doc = xnodeToXmlConverter.execute(node, context);
      
      // Get formatting options
      const prettyPrint = xmlOutputConfig.prettyPrint;
      const indent = (baseConfig as any).formatting?.indent || 2;
      const declaration = xmlOutputConfig.declaration;
      
      // Serialize to string
      let xmlString = xmlUtils.serializeXml(doc);
      
      // Apply pretty printing if enabled
      if (prettyPrint) {
        xmlString = xmlUtils.formatXml(xmlString, indent);
      }
      
      // Add XML declaration if configured
      if (declaration) {
        xmlString = xmlUtils.ensureXmlDeclaration(xmlString);
      }
      
      logger.debug('Successfully converted semantic XNode to XML string', {
        xmlLength: xmlString.length,
        prettyPrint,
        indent,
        declaration
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
 * toXml extension implementation
 */
export function toXml(this: TerminalExtensionContext, hooks?: OutputHooks<Document>): Document {
  try {
    logger.debug('Converting semantic XNode to XML DOM', {
      hasOutputHooks: !!(hooks && (hooks.beforeTransform || hooks.afterTransform))
    });
    
    // Use unified pipeline with semantic XML converter
    const result = this.executeOutput(xnodeToXmlConverter, hooks);
    
    logger.debug('Successfully converted semantic XNode to DOM', {
      documentElement: result.documentElement?.nodeName
    });
    
    return result;
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to convert to XML: ${String(err)}`);
  }
}

/**
 * toXmlString extension implementation
 */
export function toXmlString(this: TerminalExtensionContext, hooks?: OutputHooks<string>): string {
  try {
    logger.debug('Converting semantic XNode to XML string', {
      hasOutputHooks: !!(hooks && (hooks.beforeTransform || hooks.afterTransform))
    });
    
    // Use unified pipeline with semantic XML string converter
    const result = this.executeOutput(xnodeToXmlStringConverter, hooks);
    
    logger.debug('Successfully converted to XML string', {
      xmlLength: result.length
    });
    
    return result;
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to convert to XML string: ${String(err)}`);
  }
}

// --- Helper Functions ---

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
  const xmlConfig = context.config;
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
    element.textContent = xmlUtils.safeXmlText(String(node.value));
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
  const xmlConfig = context.config;
  let element: Element;
  
  // Collections become wrapper elements in XML
  if (node.ns && xmlConfig.preserveNamespaces) {
    const qualifiedName = createQualifiedName(node, xmlConfig);
    element = DOM.createElementNS(context.doc, node.ns, qualifiedName);
  } else {
    element = DOM.createElement(context.doc, node.name);
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
  const xmlConfig = context.config;
  let element: Element;
  
  // Create element with namespace if provided
  if (node.ns && xmlConfig.preserveNamespaces) {
    const qualifiedName = createQualifiedName(node, xmlConfig);
    element = DOM.createElementNS(context.doc, node.ns, qualifiedName);
  } else {
    element = DOM.createElement(context.doc, node.name);
  }
  
  // Set text content
  if (node.value !== undefined) {
    element.textContent = xmlUtils.safeXmlText(String(node.value));
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
function createQualifiedName(node: XNode, xmlConfig: XmlOutputConfiguration): string {
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
  const xmlConfig = context.config;
  
  for (const attr of attributes) {
    if (attr.type === XNodeType.ATTRIBUTES) {
      const attrName = attr.name;
      const attrValue = xmlUtils.safeXmlText(String(attr.value || ''));
      
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
      const attrValue = xmlUtils.safeXmlText(String(child.value || ''));
      element.setAttribute(attrName, attrValue);
      continue;
    }
    
    // Convert child node to DOM node
    const childNode = convertSemanticNodeToDom(child, context);
    element.appendChild(childNode);
  }
}