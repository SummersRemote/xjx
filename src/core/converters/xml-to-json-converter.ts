/**
 * XML to JSON converter with improved mixed content handling
 */
import { Configuration } from "../types/config-types";
import { XJXError } from "../types/error-types";
import { DOMAdapter } from "../adapters/dom-adapter";
import { NodeType } from "../types/dom-types";
import { 
  XNode, 
  TransformContext, 
  TransformDirection 
} from "../types/transform-types";
import { TransformUtil } from "../utils/transform-utils";
import { escapeXML, unescapeXML } from "../utils/xml-escape-utils";

/**
 * XML to JSON converter
 */
export class XmlToJsonConverter {
  private config: Configuration;
  private transformUtil: TransformUtil;
  private xjx: any; // Reference to XJX instance

  /**
   * Constructor
   * @param config Configuration
   * @param xjx XJX instance
   */
  constructor(config: Configuration, xjx: any) {
    this.config = config;
    this.transformUtil = new TransformUtil(this.config);
    this.xjx = xjx;
  }

  /**
   * Convert XML string to JSON
   * @param xmlString XML content as string
   * @returns JSON object representing the XML content
   */
  public convert(xmlString: string): Record<string, any> {
    try {
      // Pre-process XML string to handle parsing errors due to unescaped characters
      const preprocessedXml = this.preprocessXml(xmlString);

      // 1. Parse XML to DOM
      const xmlDoc = DOMAdapter.parseFromString(preprocessedXml, "text/xml");
      
      // Check for parsing errors
      const errors = xmlDoc.getElementsByTagName("parsererror");
      if (errors.length > 0) {
        throw new XJXError(`XML parsing error: ${errors[0].textContent}`);
      }

      // 2. Convert DOM to XNode
      const xnode = this.domToXNode(xmlDoc.documentElement);
      
      // 3. Create root context for transformation
      const context = this.transformUtil.createRootContext(
        TransformDirection.XML_TO_JSON,
        xnode.name
      );
      
      // 4. Apply transformations
      const transformedNode = this.xjx.applyTransformations(xnode, context);
      if (transformedNode === null) {
        throw new XJXError('Root node was removed during transformation');
      }
      
      // 5. Convert XNode to JSON
      return this.xnodeToJson(transformedNode);
    } catch (error) {
      throw new XJXError(
        `Failed to convert XML to JSON: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Preprocess XML string to handle common escaping issues
   * @param xmlString Original XML string
   * @returns Preprocessed XML string
   */
  private preprocessXml(xmlString: string): string {
    // Attempt to identify unescaped entities outside of CDATA sections
    let inCdata = false;
    let result = '';
    let i = 0;

    while (i < xmlString.length) {
      // Check for CDATA section start
      if (xmlString.substring(i, i + 9) === '<![CDATA[') {
        inCdata = true;
        result += '<![CDATA[';
        i += 9;
        continue;
      }
      
      // Check for CDATA section end
      if (inCdata && xmlString.substring(i, i + 3) === ']]>') {
        inCdata = false;
        result += ']]>';
        i += 3;
        continue;
      }
      
      // Handle special characters outside CDATA
      if (!inCdata) {
        const char = xmlString.charAt(i);
        if (char === '&') {
          // Check if this is already an entity reference
          if (xmlString.substring(i, i + 5) === '&amp;' ||
              xmlString.substring(i, i + 4) === '&lt;' ||
              xmlString.substring(i, i + 4) === '&gt;' ||
              xmlString.substring(i, i + 6) === '&quot;' ||
              xmlString.substring(i, i + 6) === '&apos;') {
            // Already an entity, leave it as is
            result += char;
          } else {
            // Not a valid entity reference, escape it
            result += '&amp;';
          }
        } else {
          result += char;
        }
      } else {
        // Inside CDATA, pass through unchanged
        result += xmlString.charAt(i);
      }
      
      i++;
    }
    
    return result;
  }

  /**
   * Normalize text content according to whitespace settings
   * This method has been updated to better handle mixed content
   * @param text Text to normalize
   * @param inMixedContent Whether this text is part of mixed content
   * @returns Normalized text
   */
  private normalizeTextContent(text: string, inMixedContent: boolean = false): string {
    if (!text) return '';
    
    if (!this.config.preserveWhitespace) {
      if (inMixedContent) {
        // For mixed content, preserve single spaces between tags
        // but collapse multiple spaces to single space
        return text.replace(/\s+/g, ' ');
      } else {
        // For standalone text nodes, trim and collapse whitespace
        return text.trim().replace(/\s+/g, ' ');
      }
    }
    
    // When preserveWhitespace is true, keep everything as is
    return text;
  }

  /**
   * Determine if text contains more than just whitespace
   * @param text Text to check
   * @returns True if text contains non-whitespace content
   */
  private hasContent(text: string): boolean {
    return text.trim().length > 0;
  }

  /**
   * Check if a node is part of mixed content
   * @param element Parent element to check
   * @returns True if element has mixed content
   */
  private hasMixedContent(element: Element): boolean {
    if (element.childNodes.length <= 1) return false;
    
    let hasText = false;
    let hasElement = false;
    
    for (let i = 0; i < element.childNodes.length; i++) {
      const child = element.childNodes[i];
      if (child.nodeType === NodeType.TEXT_NODE) {
        if (this.hasContent(child.nodeValue || '')) {
          hasText = true;
        }
      } else if (child.nodeType === NodeType.ELEMENT_NODE) {
        hasElement = true;
      }
      
      if (hasText && hasElement) return true;
    }
    
    return false;
  }

  /**
   * Convert DOM element to XNode with improved mixed content and namespace handling
   * @param element DOM element
   * @param parentNode Optional parent XNode for building the node hierarchy
   * @returns XNode representation
   */
  private domToXNode(element: Element, parentNode?: XNode): XNode {
    const xnode: XNode = {
      name: element.localName || element.nodeName.split(':').pop() || element.nodeName,
      type: NodeType.ELEMENT_NODE,
      namespace: element.namespaceURI || undefined,
      prefix: element.prefix || undefined,
      parent: parentNode  // Set parent reference for namespace resolution
    };
    
    // Process attributes and find namespace declarations
    if (element.attributes.length > 0) {
      xnode.attributes = {};
      const namespaceDecls: Record<string, string> = {};
      let hasNamespaceDecls = false;
      
      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        const attrValue = unescapeXML(attr.value);
        
        // Handle namespace declarations specially
        if (attr.name === 'xmlns') {
          // Default namespace declaration
          namespaceDecls[''] = attrValue;
          xnode.isDefaultNamespace = true;
          hasNamespaceDecls = true;
        } else if (attr.name.startsWith('xmlns:')) {
          // Prefixed namespace declaration
          const prefix = attr.name.substring(6); // Remove 'xmlns:'
          namespaceDecls[prefix] = attrValue;
          hasNamespaceDecls = true;
        } else {
          // Regular attribute
          const attrName = attr.localName || attr.name.split(':').pop() || attr.name;
          xnode.attributes[attrName] = attrValue;
        }
      }
      
      // Add namespace declarations if we found any
      if (hasNamespaceDecls) {
        xnode.namespaceDeclarations = namespaceDecls;
      }
    }
    
    // Detect if this element has mixed content
    const hasMixed = this.hasMixedContent(element);
    
    // Process child nodes
    if (element.childNodes.length > 0) {
      // Single text node handling (optimize common case)
      if (element.childNodes.length === 1 && 
          element.childNodes[0].nodeType === NodeType.TEXT_NODE && 
          !hasMixed) {
        const text = element.childNodes[0].nodeValue || '';
        const normalizedText = this.normalizeTextContent(text, false);
        if (normalizedText) {
          xnode.value = unescapeXML(normalizedText);
        }
      } else {
        // Mixed content or multiple children handling
        const childNodes: XNode[] = [];
        
        for (let i = 0; i < element.childNodes.length; i++) {
          const child = element.childNodes[i];
          
          // Text nodes
          if (child.nodeType === NodeType.TEXT_NODE) {
            const text = child.nodeValue || '';
            
            // Important: even with preserveWhitespace=false, we'll keep 
            // non-empty text nodes in mixed content to preserve order
            if (this.config.preserveWhitespace || hasMixed || this.hasContent(text)) {
              const normalizedText = this.normalizeTextContent(text, hasMixed);
              
              // Only add if we have text (could be empty after normalization)
              if (normalizedText && this.config.preserveTextNodes) {
                childNodes.push({
                  name: '#text',
                  type: NodeType.TEXT_NODE,
                  value: unescapeXML(normalizedText),
                  parent: xnode  // Set parent reference
                });
              }
            }
          }
          // CDATA sections - Preserve regardless of whitespace setting
          else if (child.nodeType === NodeType.CDATA_SECTION_NODE && this.config.preserveCDATA) {
            childNodes.push({
              name: '#cdata',
              type: NodeType.CDATA_SECTION_NODE,
              value: child.nodeValue || '',
              parent: xnode  // Set parent reference
            });
          }
          // Comments
          else if (child.nodeType === NodeType.COMMENT_NODE && this.config.preserveComments) {
            childNodes.push({
              name: '#comment',
              type: NodeType.COMMENT_NODE,
              value: child.nodeValue || '',
              parent: xnode  // Set parent reference
            });
          }
          // Processing instructions
          else if (
            child.nodeType === NodeType.PROCESSING_INSTRUCTION_NODE && 
            this.config.preserveProcessingInstr
          ) {
            const pi = child as ProcessingInstruction;
            childNodes.push({
              name: '#pi',
              type: NodeType.PROCESSING_INSTRUCTION_NODE,
              value: pi.data || '',
              attributes: { target: pi.target },
              parent: xnode  // Set parent reference
            });
          }
          // Element nodes (recursive)
          else if (child.nodeType === NodeType.ELEMENT_NODE) {
            childNodes.push(this.domToXNode(child as Element, xnode));
          }
        }
        
        // Only set children if there are any after filtering
        if (childNodes.length > 0) {
          xnode.children = childNodes;
        }
      }
    }
    
    return xnode;
  }

  /**
   * Convert XNode to JSON with enhanced namespace handling
   * @param node XNode to convert
   * @returns JSON representation
   */
  private xnodeToJson(node: XNode): Record<string, any> {
    const result: Record<string, any> = {};
    const nodeObj: Record<string, any> = {};
    
    // Add namespace and prefix if present
    if (node.namespace && this.config.preserveNamespaces) {
      nodeObj[this.config.propNames.namespace] = node.namespace;
    }
    
    if (node.prefix && this.config.preserveNamespaces) {
      nodeObj[this.config.propNames.prefix] = node.prefix;
    }
    
    // Add value if present
    if (node.value !== undefined) {
      nodeObj[this.config.propNames.value] = node.value;
    }
    
    // Add attributes and namespace declarations if present
    if (this.config.preserveAttributes) {
      const attrs: Array<Record<string, any>> = [];
      
      // Add regular attributes
      if (node.attributes && Object.keys(node.attributes).length > 0) {
        for (const [name, value] of Object.entries(node.attributes)) {
          const attrObj: Record<string, any> = {
            [name]: { [this.config.propNames.value]: value }
          };
          attrs.push(attrObj);
        }
      }
      
      // Add namespace declarations as special attributes
      if (node.namespaceDeclarations && this.config.preserveNamespaces) {
        for (const [prefix, uri] of Object.entries(node.namespaceDeclarations)) {
          const attrName = prefix === '' ? 'xmlns' : `xmlns:${prefix}`;
          const attrObj: Record<string, any> = {
            [attrName]: { [this.config.propNames.value]: uri }
          };
          attrs.push(attrObj);
        }
      }
      
      if (attrs.length > 0) {
        nodeObj[this.config.propNames.attributes] = attrs;
      }
    }
    
    // Add children if present
    if (node.children && node.children.length > 0) {
      const children: Array<Record<string, any>> = [];
      
      for (const child of node.children) {
        if (child.type === NodeType.TEXT_NODE) {
          // Text node
          children.push({ [this.config.propNames.value]: child.value });
        } else if (child.type === NodeType.CDATA_SECTION_NODE) {
          // CDATA section
          children.push({ [this.config.propNames.cdata]: child.value });
        } else if (child.type === NodeType.COMMENT_NODE) {
          // Comment
          children.push({ [this.config.propNames.comments]: child.value });
        } else if (child.type === NodeType.PROCESSING_INSTRUCTION_NODE) {
          // Processing instruction
          children.push({
            [this.config.propNames.instruction]: {
              [this.config.propNames.target]: child.attributes?.target,
              [this.config.propNames.value]: child.value
            }
          });
        } else if (child.type === NodeType.ELEMENT_NODE) {
          // Element node
          children.push(this.xnodeToJson(child));
        }
      }
      
      if (children.length > 0) {
        nodeObj[this.config.propNames.children] = children;
      }
    }
    
    // Clean empty properties if compact mode
    if (this.config.outputOptions.compact) {
      Object.keys(nodeObj).forEach(key => {
        const value = nodeObj[key];
        if (value === undefined || value === null || 
            (Array.isArray(value) && value.length === 0) ||
            (typeof value === 'object' && Object.keys(value).length === 0)) {
          delete nodeObj[key];
        }
      });
    }
    
    result[node.name] = nodeObj;
    return result;
  }
}