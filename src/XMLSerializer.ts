/**
 * XMLSerializer class for converting JSON to XML with consistent namespace handling
 */
import { XMLToJSONConfig } from './types';
import DEFAULT_CONFIG from './config';

/**
 * XML Serializer for converting JSON to XML
 */
class XMLSerializerUtil {
  private config: XMLToJSONConfig;
  private serializer: XMLSerializer | null = null;

  /**
   * Constructor for XMLSerializer
   * @param config Configuration options
   */
  constructor(config: Partial<XMLToJSONConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Initialize serializer for browser environment
    if (typeof window !== 'undefined') {
      this.serializer = new XMLSerializer();
    } else {
      // Node.js environment - dynamically import would be needed
      throw new Error("Node.js environment detected. You need to use a Node-compatible XML serializer.");
    }
  }

  /**
   * Convert JSON object to XML string
   * @param jsonObj JSON object to convert
   * @returns XML string
   */
  public serialize(jsonObj: Record<string, any>): string {
    if (!this.serializer) {
      throw new Error("XML serializer not initialized");
    }

    try {
      const doc = document.implementation.createDocument(null, null, null);
      const rootElement = this.jsonToNode(jsonObj, doc);
      
      if (rootElement) {
        doc.appendChild(rootElement);
      }
      
      // Add XML declaration if specified
      let xmlString = this.serializer.serializeToString(doc);
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
        element = doc.createElementNS(ns, `${prefix}:${nodeName}`);
      } else {
        element = doc.createElementNS(ns, nodeName);
      }
    } else {
      element = doc.createElement(nodeName);
    }
    
    // Process attributes with consistent namespace handling
    if (nodeData[this.config.propNames.attributes] && Array.isArray(nodeData[this.config.propNames.attributes])) {
      nodeData[this.config.propNames.attributes].forEach((attrObj: Record<string, any>) => {
        const attrName = Object.keys(attrObj)[0];
        if (!attrName) return;
        
        const attrData = attrObj[attrName];
        const attrValue = attrData[this.config.propNames.value] || '';
        const attrNs = attrData[this.config.propNames.namespace];
        const attrPrefix = attrData[this.config.propNames.prefix];
        
        // Handle namespaced attributes consistently
        let qualifiedName = attrName;
        if (attrPrefix) {
          qualifiedName = `${attrPrefix}:${attrName}`;
        }
        
        if (attrNs && this.config.preserveNamespaces) {
          element.setAttributeNS(attrNs, qualifiedName, attrValue);
        } else {
          element.setAttribute(qualifiedName, attrValue);
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
          element.appendChild(doc.createTextNode(child[this.config.propNames.value]));
        }
        // CDATA sections
        else if (child[this.config.propNames.cdata] !== undefined && this.config.preserveCDATA) {
          element.appendChild(doc.createCDATASection(child[this.config.propNames.cdata]));
        }
        // Comments
        else if (child[this.config.propNames.comments] !== undefined && this.config.preserveComments) {
          element.appendChild(doc.createComment(child[this.config.propNames.comments]));
        }
        // Processing instructions
        else if (child[this.config.propNames.processing] !== undefined && this.config.preserveProcessingInstr) {
          const piData = child[this.config.propNames.processing];
          if (piData.target) {
            element.appendChild(doc.createProcessingInstruction(piData.target, piData.data || ''));
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
}

export default XMLSerializerUtil;