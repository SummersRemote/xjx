/**
 * XML source adapter - XML to Semantic XNode conversion
 */
import { LoggerFactory } from "../../core/logger";
const logger = LoggerFactory.create();

import { NodeType } from '../../core/dom';
import { ProcessingError } from '../../core/error';
import { 
  XNode, 
  XNodeType,
  createCollection,
  createRecord, 
  createField,
  createValue,
  createComment, 
  createInstruction, 
  createData,
  addChild,
  addAttribute
} from '../../core/xnode';
import { UnifiedConverter } from '../../core/pipeline';
import { PipelineContext } from '../../core/context';
import { NonTerminalExtensionContext } from "../../core/extension";
import { SourceHooks } from "../../core/hooks";
import { XmlConfiguration, DEFAULT_XML_CONFIG } from "./config";
import * as xmlUtils from './utils';

/**
 * Context for XML to Semantic XNode conversion
 */
interface XmlConversionContext {
  namespaceMap: Record<string, string>;
  config: XmlConfiguration;
  parentNode?: XNode;
}

/**
 * XML to Semantic XNode converter
 */
export const xmlToXNodeConverter: UnifiedConverter<string, XNode> = {
  name: 'xmlToSemanticXNode',
  inputType: 'string',
  outputType: 'XNode',
  
  validate(xml: string, context: PipelineContext): void {
    context.validateInput(typeof xml === "string", "XML source must be a string");
    context.validateInput(xml.trim().length > 0, "XML source cannot be empty");
  },
  
  execute(xml: string, context: PipelineContext): XNode {
    logger.debug('Converting XML to semantic XNode', {
      xmlLength: xml.length
    });
    
    try {
      // Parse XML string to DOM
      const doc = xmlUtils.parseXml(xml);
      
      logger.debug('Successfully parsed XML to DOM', {
        rootElement: doc.documentElement?.nodeName
      });
      
      // Register DOM document for cleanup
      context.resources.registerDOMDocument(doc);
      
      // Get XML config from pipeline context or use defaults
      const baseConfig = context.config.get();
      const xmlConfig: XmlConfiguration = {
        ...DEFAULT_XML_CONFIG,
        ...(baseConfig as any).xml
      };
      
      // Create conversion context
      const conversionContext: XmlConversionContext = { 
        namespaceMap: {},
        config: xmlConfig
      };
      
      // Convert DOM element to semantic XNode
      const result = convertElementToSemanticXNode(doc.documentElement, context, conversionContext);
      
      // Register result for tracking
      context.resources.registerXNode(result);
      
      logger.debug('Successfully converted XML to semantic XNode', {
        rootNodeName: result.name,
        rootNodeType: result.type
      });
      
      return result;
      
    } catch (err) {
      throw new ProcessingError(`Failed to convert XML to semantic XNode: ${err instanceof Error ? err.message : String(err)}`, xml);
    }
  },
  
  onError(error: Error, xml: string, context: PipelineContext): XNode | null {
    logger.error('XML to semantic XNode conversion failed', { error, xmlLength: xml.length });
    return null;
  }
};

/**
 * fromXml extension implementation
 */
export function fromXml(
  this: NonTerminalExtensionContext, 
  xml: string,
  hooks?: SourceHooks<string>
): void {
  try {
    logger.debug('Setting XML source with semantic XNode converter', {
      sourceLength: xml.length,
      hasSourceHooks: !!(hooks && (hooks.beforeTransform || hooks.afterTransform))
    });
    
    // Use unified pipeline with semantic XML converter
    this.executeSource(xmlToXNodeConverter, xml, hooks);
    
    logger.debug('Successfully set XML source', {
      rootNodeName: this.xnode?.name,
      rootNodeType: this.xnode?.type
    });
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to parse XML source: ${String(err)}`);
  }
}

// --- Helper Functions ---

/**
 * Convert DOM element to semantic XNode (RECORD type)
 */
function convertElementToSemanticXNode(
  element: Element, 
  context: PipelineContext, 
  conversionContext: XmlConversionContext
): XNode {
  const xmlConfig = conversionContext.config;
  
  // XML elements become RECORD nodes in semantic model
  const elementName = getElementName(element, conversionContext.config);
  const xnode = createRecord(elementName);
  
  // Set parent reference
  xnode.parent = conversionContext.parentNode;

  // Process namespace information if preserving namespaces
  if (xmlConfig.preserveNamespaces) {
    processNamespaceInfo(element, xnode, conversionContext);
  }

  // Process XML attributes based on configuration
  if (element.attributes.length > 0) {
    processElementAttributes(element, xnode, conversionContext);
  }

  // Process child nodes using semantic mapping
  if (element.childNodes.length > 0) {
    processElementChildren(element, xnode, context, conversionContext);
  }

  logger.debug('Converted XML element to semantic record', { 
    elementName: element.nodeName, 
    semanticName: xnode.name,
    semanticType: xnode.type,
    childCount: xnode.children?.length || 0,
    attributeCount: xnode.attributes?.length || 0
  });
  
  return xnode;
}

/**
 * Get element name based on configuration
 */
function getElementName(element: Element, config: XmlConfiguration): string {
  switch (config.namespacePrefixHandling) {
    case 'strip':
      return element.localName || element.nodeName.split(':').pop() || element.nodeName;
    case 'preserve':
      return element.nodeName;
    case 'label':
      // Use localName but preserve prefix in label property
      return element.localName || element.nodeName.split(':').pop() || element.nodeName;
    default:
      return element.localName || element.nodeName;
  }
}

/**
 * Process namespace information for semantic XNode
 */
function processNamespaceInfo(
  element: Element, 
  xnode: XNode, 
  conversionContext: XmlConversionContext
): void {
  const xmlConfig = conversionContext.config;
  
  // Set namespace URI
  if (element.namespaceURI) {
    xnode.ns = element.namespaceURI;
  }
  
  // Handle prefix based on configuration
  if (element.prefix) {
    switch (xmlConfig.namespacePrefixHandling) {
      case 'preserve':
        // Keep prefix in name (already handled in getElementName)
        break;
      case 'label':
        // Store prefix in label property
        xnode.label = element.prefix;
        break;
      case 'strip':
        // Don't preserve prefix
        break;
    }
  }
  
  // Process namespace declarations if present
  if (hasNamespaceDeclarations(element)) {
    processNamespaceDeclarations(element, conversionContext);
  }
}

/**
 * Check if element has namespace declarations
 */
function hasNamespaceDeclarations(element: Element): boolean {
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    if (attr.name === "xmlns" || attr.name.startsWith("xmlns:")) {
      return true;
    }
  }
  return false;
}

/**
 * Process namespace declarations
 */
function processNamespaceDeclarations(
  element: Element,
  conversionContext: XmlConversionContext
): void {
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    
    if (attr.name === "xmlns") {
      conversionContext.namespaceMap[""] = attr.value;
    } else if (attr.name.startsWith("xmlns:")) {
      const prefix = attr.name.substring(6);
      conversionContext.namespaceMap[prefix] = attr.value;
    }
  }
}

/**
 * Process XML attributes based on configuration
 */
function processElementAttributes(
  element: Element,
  xnode: XNode,
  conversionContext: XmlConversionContext
): void {
  const xmlConfig = conversionContext.config;
  
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    
    // Skip namespace declarations (handled separately)
    if (attr.name === "xmlns" || attr.name.startsWith("xmlns:")) continue;
    
    const attrName = getAttributeName(attr, conversionContext.config);
    const attrValue = attr.value;
    
    if (xmlConfig.attributeHandling === 'attributes') {
      // Use semantic attributes (XNode array)
      addAttribute(xnode, attrName, attrValue, attr.namespaceURI || undefined, attr.prefix || undefined);
    } else {
      // Represent as field children with special naming
      const attrField = createField(`@${attrName}`, attrValue);
      if (attr.namespaceURI) attrField.ns = attr.namespaceURI;
      if (attr.prefix) attrField.label = attr.prefix;
      addChild(xnode, attrField);
    }
  }
}

/**
 * Get attribute name based on configuration
 */
function getAttributeName(attr: Attr, config: XmlConfiguration): string {
  switch (config.namespacePrefixHandling) {
    case 'strip':
      return attr.localName || attr.name.split(':').pop() || attr.name;
    case 'preserve':
      return attr.name;
    case 'label':
      return attr.localName || attr.name.split(':').pop() || attr.name;
    default:
      return attr.name;
  }
}

/**
 * Process child nodes using semantic type mapping
 */
function processElementChildren(
  element: Element,
  parentNode: XNode,
  context: PipelineContext,
  conversionContext: XmlConversionContext
): void {
  const config = conversionContext.config;
  
  // Detect mixed content for proper semantic handling
  const mixedContentInfo = analyzeMixedContent(element, config);
  
  // Handle simple text-only content optimization
  if (mixedContentInfo.isTextOnly && !mixedContentInfo.hasSignificantWhitespace) {
    const textContent = getTextContent(element);
    if (textContent.trim()) {
      // Get base config for preserveWhitespace
      const baseConfig = context.config.get();
      const preserveWhitespace = (baseConfig as any).preserveWhitespace || false;
      parentNode.value = preserveWhitespace ? textContent : textContent.trim();
    }
    return;
  }
  
  // Process all child nodes with semantic mapping
  for (let i = 0; i < element.childNodes.length; i++) {
    const child = element.childNodes[i];
    const semanticChild = convertChildNodeToSemantic(child, context, conversionContext);
    
    if (semanticChild) {
      addChild(parentNode, semanticChild);
    }
  }
}

/**
 * Analyze mixed content to determine processing strategy
 */
function analyzeMixedContent(element: Element, config: XmlConfiguration): {
  isTextOnly: boolean;
  hasElements: boolean;
  hasSignificantWhitespace: boolean;
  hasMixedContent: boolean;
} {
  let hasText = false;
  let hasElements = false;
  let hasSignificantWhitespace = false;
  
  for (let i = 0; i < element.childNodes.length; i++) {
    const child = element.childNodes[i];
    
    switch (child.nodeType) {
      case NodeType.TEXT_NODE:
        const text = child.nodeValue || "";
        if (text.trim()) {
          hasText = true;
        }
        // Get preserveWhitespace from base config through the element
        if (/\s/.test(text)) {
          hasSignificantWhitespace = true;
        }
        break;
        
      case NodeType.ELEMENT_NODE:
        hasElements = true;
        break;
        
      case NodeType.CDATA_SECTION_NODE:
        hasText = true;
        break;
    }
  }
  
  return {
    isTextOnly: hasText && !hasElements,
    hasElements,
    hasSignificantWhitespace,
    hasMixedContent: hasText && hasElements
  };
}

/**
 * Get text content from element
 */
function getTextContent(element: Element): string {
  let text = "";
  
  for (let i = 0; i < element.childNodes.length; i++) {
    const child = element.childNodes[i];
    
    if (child.nodeType === NodeType.TEXT_NODE || child.nodeType === NodeType.CDATA_SECTION_NODE) {
      text += child.nodeValue || "";
    }
  }
  
  return text;
}

/**
 * Convert individual child node to semantic XNode
 */
function convertChildNodeToSemantic(
  node: Node,
  context: PipelineContext,
  conversionContext: XmlConversionContext
): XNode | null {
  const xmlConfig = conversionContext.config;
  const baseConfig = context.config.get();
  
  switch (node.nodeType) {
    case NodeType.ELEMENT_NODE:
      // Recursively convert child elements to semantic records
      const childContext = { ...conversionContext };
      return convertElementToSemanticXNode(node as Element, context, childContext);
      
    case NodeType.TEXT_NODE:
      const text = node.nodeValue || "";
      const preserveWhitespace = (baseConfig as any).preserveWhitespace || false;
      const normalizedText = preserveWhitespace ? text : text.trim();
      
      if (normalizedText) {
        return createValue("#text", normalizedText);
      }
      return null;
      
    case NodeType.CDATA_SECTION_NODE:
      if (xmlConfig.preserveCDATA) {
        return createData("#cdata", node.nodeValue || "");
      }
      return null;
      
    case NodeType.COMMENT_NODE:
      const preserveComments = (baseConfig as any).preserveComments || false;
      if (preserveComments) {
        return createComment(node.nodeValue || "");
      }
      return null;
      
    case NodeType.PROCESSING_INSTRUCTION_NODE:
      const preserveInstructions = (baseConfig as any).preserveInstructions || false;
      if (preserveInstructions) {
        const pi = node as ProcessingInstruction;
        return createInstruction(pi.target, pi.data || "");
      }
      return null;
      
    default:
      logger.debug('Skipping unsupported node type in semantic conversion', {
        nodeType: node.nodeType,
        nodeName: node.nodeName
      });
      return null;
  }
}