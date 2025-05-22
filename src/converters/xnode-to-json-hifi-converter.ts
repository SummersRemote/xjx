import { Configuration } from '../core/config';
import { NodeType } from '../core/dom';
import { logger, ProcessingError } from '../core/error';
import { XNode } from '../core/xnode';
import { validateInput, Converter, JsonOptions, JsonValue, JsonObject, JsonArray } from '../core/converter';
import { createConverter } from '../core/converter';
import { removeEmptyElements } from '../core/json-utils';

/**
 * Create an XNode to JSON HiFi converter
 * @param config Configuration for the converter
 * @returns Converter implementation
 */
export function createXNodeToJsonHiFiConverter(config: Configuration): Converter<XNode, JsonValue, JsonOptions> {
  return createConverter(config, (node: XNode, config: Configuration, options?: JsonOptions) => {
    // Validate input
    validateInput(node, "Node must be an XNode instance", 
                  input => input !== null && typeof input === 'object');

    try {
      logger.debug('Starting XNode to JSON HiFi conversion', {
        nodeName: node.name,
        nodeType: node.type
      });

      // Create converter instance
      const converter = new XNodeToJsonHiFiConverterImpl(config);
      
      // Convert to HiFi format
      const result = converter.convert(node, options);
      
      // Apply remove empty elements strategy if configured
      if (config.strategies.emptyElementStrategy === 'remove') {
        const processedResult = removeEmptyElements(result, config);
        return processedResult === undefined ? {} : processedResult;
      }
      
      return result;
    } catch (err) {
      throw new ProcessingError(`Failed to convert XNode to JSON HiFi: ${err instanceof Error ? err.message : String(err)}`);
    }
  });
}

/**
 * Implementation of XNode to JSON HiFi converter
 */
class XNodeToJsonHiFiConverterImpl implements Converter<XNode, JsonValue, JsonOptions> {
  private readonly config: Configuration;
  
  /**
   * Create a new converter
   * @param config Base configuration
   */
  constructor(config: Configuration) {
    this.config = config;
  }
  
  /**
   * Convert XNode to JSON HiFi
   * @param node XNode to convert
   * @param options Conversion options
   * @returns JSON representation in HiFi format
   */
  convert(node: XNode, options?: JsonOptions): JsonValue {
    // Process based on node type
    if (node.type !== NodeType.ELEMENT_NODE) {
      // Handle non-element nodes
      return this.processSpecialNode(node);
    }
    
    // Process element node
    return this.processElementNode(node);
  }
  
  /**
   * Process special node types (text, CDATA, comment, PI)
   * @param node Node to process
   * @returns HiFi representation
   */
  private processSpecialNode(node: XNode): JsonValue {
    const { properties } = this.config;
    
    switch (node.type) {
      case NodeType.TEXT_NODE:
        if (this.config.preserveTextNodes) {
          return { [properties.value]: node.value };
        }
        break;
        
      case NodeType.CDATA_SECTION_NODE:
        if (this.config.preserveCDATA) {
          return { [properties.cdata]: node.value };
        }
        break;
        
      case NodeType.COMMENT_NODE:
        if (this.config.preserveComments) {
          return { [properties.comment]: node.value };
        }
        break;
        
      case NodeType.PROCESSING_INSTRUCTION_NODE:
        if (this.config.preserveProcessingInstr && node.attributes?.target) {
          const piObj: JsonObject = {
            [properties.target]: node.attributes.target
          };
          
          if (node.value !== undefined) {
            piObj[properties.value] = node.value;
          }
          
          return { [properties.processingInstr]: piObj };
        }
        break;
    }
    
    // Default for unknown or filtered node types
    return null;
  }
  
  /**
   * Process element node
   * @param node Element node to process
   * @returns HiFi representation
   */
  private processElementNode(node: XNode): JsonValue {
    const result: JsonObject = {};
    const nodeObj: JsonObject = {};
    const { properties } = this.config;
    
    // Add namespace and prefix if present
    if (node.namespace && this.config.preserveNamespaces) {
      nodeObj[properties.namespace] = node.namespace;
    }

    if (node.prefix && this.config.preserveNamespaces) {
      nodeObj[properties.prefix] = node.prefix;
    }

    // Process attributes
    if (node.attributes && Object.keys(node.attributes).length > 0 && this.config.preserveAttributes) {
      nodeObj[properties.attribute] = this.processAttributes(node);
    }

    // Process namespace declarations
    if (node.namespaceDeclarations && Object.keys(node.namespaceDeclarations).length > 0 && 
        this.config.preserveNamespaces) {
      nodeObj.namespaceDeclarations = { ...node.namespaceDeclarations };
      
      // Flag if this is a default namespace
      if (node.isDefaultNamespace) {
        nodeObj.isDefaultNamespace = true;
      }
    }

    // Process value or children
    if (node.value !== undefined && this.config.preserveTextNodes) {
      // Direct value
      nodeObj[properties.value] = node.value;
    } else if (node.children && node.children.length > 0) {
      // Process children
      const children = this.processChildren(node.children);
      if (children.length > 0) {
        nodeObj[properties.children] = children;
      }
    }
    
    // Add metadata if present
    if (node.metadata && Object.keys(node.metadata).length > 0) {
      nodeObj.metadata = { ...node.metadata };
    }
    
    // Create root object with node name - handle prefixed names if configured
    const elementName = this.config.preservePrefixedNames && node.prefix ? 
      `${node.prefix}:${node.name}` : node.name;
    
    result[elementName] = nodeObj;
    
    return result;
  }
  
  /**
   * Process attributes
   * @param node Node with attributes
   * @returns Attributes in HiFi format
   */
  private processAttributes(node: XNode): JsonArray {
    const attrs: JsonArray = [];
    const { properties } = this.config;

    // Process regular attributes
    for (const [name, value] of Object.entries(node.attributes || {})) {
      // Skip xmlns attributes if not preserving namespaces or if handled elsewhere
      if (name === "xmlns" || name.startsWith("xmlns:")) {
        continue; // Namespace declarations are handled separately
      }
      
      // Create attribute object
      const attrObj: JsonObject = {};
      
      // Handle attributes with namespaces
      if (name.includes(':') && this.config.preserveNamespaces) {
        const [prefix, localName] = name.split(':');
        
        // Find namespace URI for this prefix if available
        let namespaceURI = null;
        if (node.namespaceDeclarations) {
          namespaceURI = node.namespaceDeclarations[prefix];
        }
        
        // Create attribute with namespace info
        const attrValue: JsonObject = { 
          [properties.value]: value,
          [properties.prefix]: prefix
        };
        
        // Add namespace URI if available
        if (namespaceURI) {
          attrValue[properties.namespace] = namespaceURI;
        }
        
        attrObj[localName] = attrValue;
      } else {
        // Regular attribute
        attrObj[name] = { [properties.value]: value };
      }
      
      attrs.push(attrObj);
    }

    return attrs;
  }
  
  /**
   * Process child nodes
   * @param children Child nodes
   * @returns Children in HiFi format
   */
  private processChildren(children: XNode[]): JsonArray {
    const result: JsonArray = [];
    
    // Process each child in order to preserve mixed content
    for (const child of children) {
      const processedChild = this.processChild(child);
      if (processedChild !== null) {
        result.push(processedChild);
      }
    }
    
    return result;
  }

  /**
   * Process individual child node
   * @param child Child node
   * @returns Processed child node or null if filtered
   */
  private processChild(child: XNode): JsonValue {
    switch (child.type) {
      case NodeType.TEXT_NODE:
        if (this.config.preserveTextNodes) {
          return this.processSpecialNode(child);
        }
        break;
        
      case NodeType.CDATA_SECTION_NODE:
        if (this.config.preserveCDATA) {
          return this.processSpecialNode(child);
        }
        break;
        
      case NodeType.COMMENT_NODE:
        if (this.config.preserveComments) {
          return this.processSpecialNode(child);
        }
        break;
        
      case NodeType.PROCESSING_INSTRUCTION_NODE:
        if (this.config.preserveProcessingInstr) {
          return this.processSpecialNode(child);
        }
        break;
        
      case NodeType.ELEMENT_NODE:
        // Recursively process element nodes
        return this.processElementNode(child);
    }
    
    return null;
  }
}