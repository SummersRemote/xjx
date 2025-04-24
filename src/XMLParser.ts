/**
 * XMLParser class for converting XML to JSON with consistent namespace handling
 */
import { XMLToJSONConfig } from './types';
import { DEFAULT_CONFIG } from './config';

/**
 * XML Parser for converting XML to JSON
 */
export class XMLParser {
  private config: XMLToJSONConfig;
  private parser: DOMParser | null = null;

  /**
   * Constructor for XMLParser
   * @param config Configuration options
   */
  constructor(config: Partial<XMLToJSONConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Initialize parser for browser environment
    if (typeof window !== 'undefined') {
      this.parser = new DOMParser();
    } else {
      // Node.js environment - dynamically import would be needed
      throw new Error("Node.js environment detected. You need to use a Node-compatible XML parser.");
    }
  }

  /**
   * Convert XML string to JSON
   * @param xmlString XML content as string
   * @returns JSON object representing the XML content
   */
  public parse(xmlString: string): Record<string, any> {
    if (!this.parser) {
      throw new Error("XML parser not initialized");
    }

    try {
      const xmlDoc = this.parser.parseFromString(xmlString, "text/xml");
      
      // Check for parsing errors
      const parserError = xmlDoc.querySelector("parsererror");
      if (parserError) {
        throw new Error(`XML parsing error: ${parserError.textContent}`);
      }
      
      return this.nodeToJson(xmlDoc.documentElement);
    } catch (error) {
      throw new Error(`Failed to convert XML to JSON: ${error instanceof Error ? error.message : String(error)}`);
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
      // Use localName instead of nodeName to strip namespace prefix
      const nodeName = element.localName || element.nodeName.split(':').pop() || element.nodeName;
      
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
      
      // Process attributes if enabled
      if (this.config.preserveAttributes && element.attributes.length > 0) {
        const attrs: Array<Record<string, any>> = [];
        
        for (let i = 0; i < element.attributes.length; i++) {
          const attr = element.attributes[i];
          // Strip namespace prefix from attribute name
          const attrLocalName = attr.localName || attr.name.split(':').pop() || attr.name;
          
          // Create attribute object with consistent structure
          const attrObj: Record<string, any> = {
            [attrLocalName]: {
              [this.config.propNames.value]: attr.value
            }
          };
          
          // Add namespace info for attribute if present and enabled
          if (this.config.preserveNamespaces) {
            // Handle attribute namespace
            if (attr.namespaceURI) {
              attrObj[attrLocalName][this.config.propNames.namespace] = attr.namespaceURI;
            }
            
            // Handle attribute prefix
            if (attr.prefix) {
              attrObj[attrLocalName][this.config.propNames.prefix] = attr.prefix;
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
        
        for (let i = 0; i < element.childNodes.length; i++) {
          const child = element.childNodes[i];
          
          // Text nodes - only process if preserveTextNodes is true
          if (child.nodeType === Node.TEXT_NODE) {
            if (this.config.preserveTextNodes) {
              const text = child.nodeValue || "";
              
              // Skip whitespace-only text nodes if whitespace preservation is disabled
              if (!this.config.preserveWhitespace && text.trim() === "") {
                continue;
              }
              
              children.push({ [this.config.propNames.value]: text });
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
}