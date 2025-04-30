/**
 * XML to JSON converter with transformer support and improved entity and whitespace handling
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
      // This is only a fallback in case the XML wasn't properly escaped before
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
   * This isn't a complete solution but catches common problems for better user experience
   * @param xmlString Original XML string
   * @returns Preprocessed XML string
   */
  private preprocessXml(xmlString: string): string {
    // Attempt to identify unescaped entities outside of CDATA sections
    // This is a basic preprocessor and won't catch all cases
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
   * Normalizes whitespace according to configuration settings
   * @param text Text to normalize
   * @returns Normalized text
   */
  private normalizeWhitespace(text: string): string {
    if (!this.config.preserveWhitespace) {
      // If not preserving whitespace, normalize all whitespace
      // This trims the text and collapses multiple whitespace to single spaces
      return text.trim().replace(/\s+/g, ' ');
    }
    return text;
  }

  /**
   * Convert DOM element to XNode
   * @param element DOM element
   * @returns XNode representation
   */
  private domToXNode(element: Element): XNode {
    const xnode: XNode = {
      name: element.localName || element.nodeName.split(':').pop() || element.nodeName,
      type: NodeType.ELEMENT_NODE,
      namespace: element.namespaceURI || undefined,
      prefix: element.prefix || undefined
    };
    
    // Process attributes
    if (element.attributes.length > 0) {
      xnode.attributes = {};
      
      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        const attrName = attr.localName || attr.name.split(':').pop() || attr.name;
        
        // Ensure attribute values are properly unescaped
        xnode.attributes[attrName] = unescapeXML(attr.value);
      }
    }
    
    // Process child nodes
    if (element.childNodes.length > 0) {
      const childNodes: XNode[] = [];
      let textContent = '';
      
      for (let i = 0; i < element.childNodes.length; i++) {
        const child = element.childNodes[i];
        
        // Text nodes
        if (child.nodeType === NodeType.TEXT_NODE) {
          const text = child.nodeValue || '';
          
          // Skip whitespace-only text nodes if whitespace preservation is disabled
          if (!this.config.preserveWhitespace && text.trim() === '') {
            continue;
          }
          
          // Properly unescape text content to avoid double escaping
          textContent += unescapeXML(text);
        }
        // CDATA sections
        else if (child.nodeType === NodeType.CDATA_SECTION_NODE && this.config.preserveCDATA) {
          childNodes.push({
            name: '#cdata',
            type: NodeType.CDATA_SECTION_NODE,
            value: child.nodeValue || ''
          });
        }
        // Comments
        else if (child.nodeType === NodeType.COMMENT_NODE && this.config.preserveComments) {
          childNodes.push({
            name: '#comment',
            type: NodeType.COMMENT_NODE,
            value: child.nodeValue || ''
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
            attributes: { target: pi.target }
          });
        }
        // Element nodes (recursive)
        else if (child.nodeType === NodeType.ELEMENT_NODE) {
          childNodes.push(this.domToXNode(child as Element));
        }
      }
      
      // Normalize text content based on whitespace configuration
      textContent = this.normalizeWhitespace(textContent);
      
      // If only textContent exists, set as value
      if (childNodes.length === 0 && textContent) {
        xnode.value = textContent;
      }
      // Otherwise if textContent exists, add it as a child text node first
      else if (textContent && this.config.preserveTextNodes) {
        childNodes.unshift({
          name: '#text',
          type: NodeType.TEXT_NODE,
          value: textContent
        });
        xnode.children = childNodes;
      }
      // Otherwise just set children if there are any
      else if (childNodes.length > 0) {
        xnode.children = childNodes;
      }
    }
    
    return xnode;
  }

  /**
   * Convert XNode to JSON
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
    
    // Add attributes if present
    if (node.attributes && Object.keys(node.attributes).length > 0) {
      const attrs: Array<Record<string, any>> = [];
      
      for (const [name, value] of Object.entries(node.attributes)) {
        const attrObj: Record<string, any> = {
          [name]: { [this.config.propNames.value]: value }
        };
        
        attrs.push(attrObj);
      }
      
      nodeObj[this.config.propNames.attributes] = attrs;
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