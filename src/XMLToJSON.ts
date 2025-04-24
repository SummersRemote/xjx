/**
 * XMLToJSON main class with hybrid DOM implementation support
 */
import { XMLToJSONConfig } from './types';
import DEFAULT_CONFIG from './config';
import DOMAdapter, { DOMImplementation } from './dom-adapter';

/**
 * XMLToJSON - Main class for XML to JSON transformation
 * Supports both browser and Node.js environments through a hybrid DOM approach
 */
class XMLToJSON {
  private config: XMLToJSONConfig;
  private domAdapter: DOMAdapter;

  /**
   * Constructor for XMLToJSON utility
   * @param config Configuration options
   * @param customDOMImplementation Optional custom DOM implementation
   */
  constructor(
    config: Partial<XMLToJSONConfig> = {}, 
    customDOMImplementation?: DOMImplementation
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.domAdapter = new DOMAdapter(customDOMImplementation);
  }

  /**
   * Convert XML string to JSON
   * @param xmlString XML content as string
   * @returns JSON object representing the XML content
   */
  public xmlToJson(xmlString: string): Record<string, any> {
    try {
      const xmlDoc = this.domAdapter.parseFromString(xmlString, 'text/xml');
      
      // Check for parsing errors - the approach differs between browser and Node.js
      // This is a simplified check that works in most environments
      const errors = xmlDoc.getElementsByTagName('parsererror');
      if (errors.length > 0) {
        throw new Error(`XML parsing error: ${errors[0].textContent}`);
      }
      
      return this.nodeToJson(xmlDoc.documentElement);
    } catch (error) {
      throw new Error(`Failed to convert XML to JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Convert JSON object back to XML string
   * @param jsonObj JSON object to convert
   * @returns XML string
   */
  public jsonToXml(jsonObj: Record<string, any>): string {
    try {
      const doc = this.domAdapter.createDocument();
      const rootElement = this.jsonToNode(jsonObj, doc);
      
      if (rootElement) {
        doc.appendChild(rootElement);
      }
      
      // Add XML declaration if specified
      let xmlString = this.domAdapter.serializeToString(doc);
      if (this.config.outputOptions.xml.declaration && !xmlString.startsWith('<?xml')) {
        xmlString = '<?xml version="1.0" encoding="UTF-8"?>\n' + xmlString;
      }
      
      // Apply pretty printing if enabled
      if (this.config.outputOptions.prettyPrint) {
        xmlString = this.prettyPrintXml(xmlString);
      }
      
      return xmlString;
    } catch (error) {
      throw new Error(`Failed to convert JSON to XML: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Convert a DOM node to JSON representation
   * @param node DOM node to convert
   * @returns JSON representation of the node
   */
  private nodeToJson(node: Node): Record<string, any> {
    const result: Record<string, any> = {};
    
    // Handle element nodes
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const nodeName = element.nodeName;
      
      const nodeObj: Record<string, any> = {};
      
      // Process namespaces if enabled
      if (this.config.preserveNamespaces) {
        const ns = element.namespaceURI;
        if (ns) {
          nodeObj[this.config.propNames.namespace] = ns;
        }
        
        const prefix = element.prefix;
        if (prefix) {
          nodeObj[this.config.propNames.prefix] = prefix;
        }
      }
      
      // Process attributes
      if (element.attributes.length > 0) {
        const attrs: Array<Record<string, any>> = [];
        
        for (let i = 0; i < element.attributes.length; i++) {
          const attr = element.attributes[i];
          const attrObj: Record<string, any> = {
            [attr.name]: {
              [this.config.propNames.value]: attr.value
            }
          };
          
          // Add namespace info for attribute if present and enabled
          if (this.config.preserveNamespaces) {
            if (attr.namespaceURI) {
              attrObj[attr.name][this.config.propNames.namespace] = attr.namespaceURI;
            }
            if (attr.prefix) {
              attrObj[attr.name][this.config.propNames.prefix] = attr.prefix;
            }
          }
          
          attrs.push(attrObj);
        }
        
        if (attrs.length > 0) {
          nodeObj[this.config.propNames.attributes] = attrs;
        }
      }
      
      // Process child nodes
      if (element.childNodes.length > 0) {
        const children: Array<Record<string, any>> = [];
        
        let hasNonWhitespaceContent = false;
        
        for (let i = 0; i < element.childNodes.length; i++) {
          const child = element.childNodes[i];
          
          // Text nodes
          if (child.nodeType === Node.TEXT_NODE) {
            const text = child.nodeValue || "";
            
            // Skip whitespace-only text nodes if whitespace preservation is disabled
            if (!this.config.preserveWhitespace && text.trim() === "") {
              continue;
            }
            
            if (this.config.preserveTextNodes) {
              hasNonWhitespaceContent = true;
              children.push({ [this.config.propNames.value]: text });
            } else if (text.trim() !== "") {
              // If we're not preserving text nodes as separate entities,
              // but the text isn't just whitespace, use it as the node's value
              hasNonWhitespaceContent = true;
              nodeObj[this.config.propNames.value] = text;
            }
          }
          // CDATA sections
          else if (child.nodeType === Node.CDATA_SECTION_NODE && this.config.preserveCDATA) {
            children.push({ [this.config.propNames.cdata]: child.nodeValue || "" });
          }
          // Comments
          else if (child.nodeType === Node.COMMENT_NODE && this.config.preserveComments) {
            children.push({ [this.config.propNames.comments]: child.nodeValue || "" });
          }
          // Processing instructions
          else if (child.nodeType === Node.PROCESSING_INSTRUCTION_NODE && this.config.preserveProcessingInstr) {
            children.push({ 
              [this.config.propNames.processing]: {
                target: child.nodeName,
                data: child.nodeValue || ""
              }
            });
          }
          // Element nodes (recursive)
          else if (child.nodeType === Node.ELEMENT_NODE) {
            children.push(this.nodeToJson(child));
          }
        }
        
        if (children.length > 0) {
          nodeObj[this.config.propNames.children] = children;
        }
      }
      
      // Apply compact option - remove empty properties if enabled
      if (this.config.outputOptions.compact) {
        Object.keys(nodeObj).forEach(key => {
          if (
            nodeObj[key] === null || 
            nodeObj[key] === undefined || 
            (Array.isArray(nodeObj[key]) && nodeObj[key].length === 0) ||
            (typeof nodeObj[key] === 'object' && Object.keys(nodeObj[key]).length === 0)
          ) {
            delete nodeObj[key];
          }
        });
      }
      
      result[nodeName] = nodeObj;
    }
    
    return result;
  }

  /**
   * Convert JSON object to DOM node
   * @param jsonObj JSON object to convert
   * @param doc Document for creating elements
   * @returns DOM Element
   */
  private jsonToNode(jsonObj: Record<string, any>, doc: Document): Element | null {
    if (!jsonObj || typeof jsonObj !== 'object') {
      return null;
    }
    
    // Get the node name (first key in the object)
    const nodeName = Object.keys(jsonObj)[0];
    if (!nodeName) {
      return null;
    }
    
    const nodeData = jsonObj[nodeName];
    
    // Create element with namespace if available
    let element: Element;
    const ns = nodeData[this.config.propNames.namespace];
    const prefix = nodeData[this.config.propNames.prefix];
    
    if (ns && this.config.preserveNamespaces) {
      if (prefix) {
        element = this.domAdapter.createElementNS(ns, `${prefix}:${nodeName}`);
      } else {
        element = this.domAdapter.createElementNS(ns, nodeName);
      }
    } else {
      element = this.domAdapter.createElement(nodeName);
    }
    
    // Process attributes
    if (nodeData[this.config.propNames.attributes] && Array.isArray(nodeData[this.config.propNames.attributes])) {
      nodeData[this.config.propNames.attributes].forEach((attrObj: Record<string, any>) => {
        const attrName = Object.keys(attrObj)[0];
        if (!attrName) return;
        
        const attrData = attrObj[attrName];
        const attrValue = attrData[this.config.propNames.value] || '';
        const attrNs = attrData[this.config.propNames.namespace];
        const attrPrefix = attrData[this.config.propNames.prefix];
        
        if (attrNs && this.config.preserveNamespaces) {
          if (attrPrefix) {
            element.setAttributeNS(attrNs, `${attrPrefix}:${attrName}`, attrValue);
          } else {
            element.setAttributeNS(attrNs, attrName, attrValue);
          }
        } else {
          element.setAttribute(attrName, attrValue);
        }
      });
    }
    
    // Process simple text value
    if (nodeData[this.config.propNames.value] !== undefined) {
      element.textContent = nodeData[this.config.propNames.value];
    }
    
    // Process children
    if (nodeData[this.config.propNames.children] && Array.isArray(nodeData[this.config.propNames.children])) {
      nodeData[this.config.propNames.children].forEach((child: Record<string, any>) => {
        // Text nodes
        if (child[this.config.propNames.value] !== undefined && this.config.preserveTextNodes) {
          element.appendChild(this.domAdapter.createTextNode(child[this.config.propNames.value]));
        }
        // CDATA sections
        else if (child[this.config.propNames.cdata] !== undefined && this.config.preserveCDATA) {
          element.appendChild(this.domAdapter.createCDATASection(child[this.config.propNames.cdata]));
        }
        // Comments
        else if (child[this.config.propNames.comments] !== undefined && this.config.preserveComments) {
          element.appendChild(this.domAdapter.createComment(child[this.config.propNames.comments]));
        }
        // Processing instructions
        else if (child[this.config.propNames.processing] !== undefined && this.config.preserveProcessingInstr) {
          const piData = child[this.config.propNames.processing];
          if (piData.target) {
            element.appendChild(this.domAdapter.createProcessingInstruction(piData.target, piData.data || ''));
          }
        }
        // Element nodes (recursive)
        else {
          const childElement = this.jsonToNode(child, doc);
          if (childElement) {
            element.appendChild(childElement);
          }
        }
      });
    }
    
    return element;
  }

  /**
   * Apply simple pretty printing to XML string
   * @param xmlString XML string to format
   * @returns Formatted XML string
   */
  private prettyPrintXml(xmlString: string): string {
    // This is a simple implementation
    // A production-ready solution would use a proper XML formatter
    let formatted = '';
    let indent = 0;
    const indentString = ' '.repeat(this.config.outputOptions.indent);
    
    // Simple state machine for XML formatting
    let inTag = false;
    let inContent = false;
    let inCDATA = false;
    let inComment = false;
    
    for (let i = 0; i < xmlString.length; i++) {
      const char = xmlString.charAt(i);
      const nextChar = xmlString.charAt(i + 1);
      
      // Handle CDATA sections
      if (char === '<' && xmlString.substr(i, 9) === '<![CDATA[') {
        inCDATA = true;
        formatted += char;
        continue;
      }
      if (inCDATA && xmlString.substr(i, 3) === ']]>') {
        inCDATA = false;
        formatted += ']]>';
        i += 2;
        continue;
      }
      if (inCDATA) {
        formatted += char;
        continue;
      }
      
      // Handle comments
      if (char === '<' && xmlString.substr(i, 4) === '<!--') {
        inComment = true;
        formatted += char;
        continue;
      }
      if (inComment && xmlString.substr(i, 3) === '-->') {
        inComment = false;
        formatted += '-->';
        i += 2;
        continue;
      }
      if (inComment) {
        formatted += char;
        continue;
      }
      
      // Handle tags and content
      if (char === '<' && !inTag && !inContent) {
        // Check if it's a closing tag
        if (nextChar === '/') {
          indent -= 1;
        }
        
        if (!inContent) {
          formatted += '\n' + indentString.repeat(indent);
        }
        
        formatted += char;
        inTag = true;
        inContent = false;
      } 
      else if (char === '>' && inTag) {
        formatted += char;
        inTag = false;
        
        // Check if it's a self-closing tag
        if (xmlString.charAt(i - 1) !== '/') {
          inContent = true;
        }
        
        // Check if it's an opening tag (not self-closing)
        if (xmlString.charAt(i - 1) !== '/' && xmlString.charAt(i - 1) !== '?') {
          indent += 1;
        }
      }
      else if (inContent && char === '<' && nextChar !== '!') {
        inContent = false;
        i--; // Re-process this character as a tag start
      }
      else {
        formatted += char;
      }
    }
    
    return formatted;
  }

  /**
   * Clean up any resources (especially for JSDOM)
   */
  public cleanup(): void {
    this.domAdapter.cleanup();
  }
}

export default XMLToJSON;