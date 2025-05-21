import { Configuration } from '../core/config';
import { NodeType } from '../core/dom';
import { logger, ProcessingError } from '../core/error';
import { XNode, getTextContent } from '../core/xnode';
import { validateInput, Converter, JsonOptions, JsonValue, JsonObject, JsonArray } from '../core/converter';
import { createConverter } from '../core/converter';

/**
 * Create an XNode to standard JSON converter
 * @param config Configuration for the converter
 * @returns Converter implementation
 */
export function createXNodeToJsonConverter(config: Configuration): Converter<XNode, JsonValue, JsonOptions> {
  return createConverter(config, (node: XNode, config: Configuration, options?: JsonOptions) => {
    // Validate input
    validateInput(node, "Node must be an XNode instance", 
                  input => input !== null && typeof input === 'object');

    try {
      logger.debug('Starting XNode to JSON conversion', {
        nodeName: node.name,
        nodeType: node.type
      });

      // Create converter instance
      const converter = new XNodeToJsonConverterImpl(config);
      
      // Apply any overridden options
      const effectiveConfig = { ...config };
      if (options) {
        Object.assign(effectiveConfig, options);
      }
      
      // Convert with effective config
      return converter.convert(node, { config: effectiveConfig });
    } catch (err) {
      throw new ProcessingError(`Failed to convert XNode to JSON: ${err instanceof Error ? err.message : String(err)}`);
    }
  });
}

/**
 * Implementation of XNode to JSON converter
 */
class XNodeToJsonConverterImpl implements Converter<XNode, JsonValue, { config: Configuration }> {
  private readonly config: Configuration;
  
  /**
   * Create a new converter
   * @param config Base configuration
   */
  constructor(config: Configuration) {
    this.config = config;
  }
  
  /**
   * Convert XNode to JSON
   * @param node XNode to convert
   * @param options Options including effective configuration
   * @returns JSON representation
   */
  convert(node: XNode, options?: { config: Configuration }): JsonValue {
    // Use provided config or default to instance config
    const config = options?.config || this.config;
    
    // Handle non-element nodes
    if (node.type !== NodeType.ELEMENT_NODE) {
      return this.processNonElementNode(node, config);
    }
    
    // Process element node
    return this.processElementNode(node, config);
  }
  
  /**
   * Process a non-element node
   * @param node Node to process
   * @param config Configuration
   * @returns JSON value
   */
  private processNonElementNode(node: XNode, config: Configuration): JsonValue {
    switch (node.type) {
      case NodeType.TEXT_NODE:
        return config.preserveTextNodes ? node.value : null;
        
      case NodeType.CDATA_SECTION_NODE:
        return config.preserveCDATA ? node.value : null;
        
      case NodeType.COMMENT_NODE:
      case NodeType.PROCESSING_INSTRUCTION_NODE:
        // Typically not included in standard JSON
        return null;
        
      default:
        return null;
    }
  }
  
  /**
   * Process an element node
   * @param node Element node
   * @param config Configuration
   * @returns JSON object
   */
  private processElementNode(node: XNode, config: Configuration): JsonValue {
    const result: JsonObject = {};
    
    // Get the element name - use prefixed name if configured
    const elementName = config.preservePrefixedNames && node.prefix ? 
      `${node.prefix}:${node.name}` : node.name;
    
    // Process with either direct value or children
    if (this.hasOnlyTextContent(node)) {
      result[elementName] = this.processElementWithTextOnly(node, config);
    } else if (node.children && node.children.length > 0) {
      result[elementName] = this.processElementWithChildren(node, config);
    } else {
      // Empty element
      result[elementName] = this.processEmptyElement(node, config);
    }
    
    return result;
  }
  
  /**
   * Check if node has only text content
   * @param node Node to check
   * @returns true if node has only text content
   */
  private hasOnlyTextContent(node: XNode): boolean {
    // Check if node has a direct value
    if (node.value !== undefined) {
      return true;
    }
    
    // Check if node has only text children
    if (!node.children || node.children.length === 0) {
      return false;
    }
    
    return node.children.every(child => 
      child.type === NodeType.TEXT_NODE || child.type === NodeType.CDATA_SECTION_NODE
    );
  }
  
  /**
   * Process an element with only text content
   * @param node Element node
   * @param config Configuration
   * @returns JSON value or object
   */
  private processElementWithTextOnly(node: XNode, config: Configuration): JsonValue {
    // Get text content
    const text = node.value !== undefined ? node.value : getTextContent(node);
    
    // Get attributes
    const hasAttributes = node.attributes && Object.keys(node.attributes).length > 0 && config.preserveAttributes;
    
    // If no attributes and direct text strategy, return the text directly
    if (!hasAttributes && config.strategies.textStrategy === 'direct') {
      return text;
    }
    
    // Create object for element
    const result: JsonObject = {};
    
    // Add attributes based on strategy
    if (hasAttributes) {
      this.addAttributes(result, node, config);
    }
    
    // Add text content based on strategy
    if (config.strategies.textStrategy === 'direct') {
      // Add as special property
      result[config.properties.text] = text;
    } else {
      // Add as configured property
      result[config.properties.text] = text;
    }
    
    return result;
  }
  
  /**
   * Process an element with children
   * @param node Element node
   * @param config Configuration
   * @returns JSON object
   */
  private processElementWithChildren(node: XNode, config: Configuration): JsonObject {
    const result: JsonObject = {};
    
    // Add attributes if present and configured to preserve
    if (node.attributes && Object.keys(node.attributes).length > 0 && config.preserveAttributes) {
      this.addAttributes(result, node, config);
    }
    
    // Handle mixed content
    const textNodes = node.children?.filter(c => 
      c.type === NodeType.TEXT_NODE || c.type === NodeType.CDATA_SECTION_NODE
    ) || [];
    
    const elementNodes = node.children?.filter(c => c.type === NodeType.ELEMENT_NODE) || [];
    
    const hasMixedContent = textNodes.length > 0 && elementNodes.length > 0;
    
    // Process mixed content according to strategy
    if (hasMixedContent) {
      switch (config.strategies.mixedContentStrategy) {
        case 'preserve':
          // Add text nodes as a property
          if (textNodes.length > 0 && config.preserveTextNodes) {
            const combinedText = textNodes.map(t => t.value).join('');
            result[config.properties.text] = combinedText;
          }
          // Then add elements normally
          this.processChildElements(result, elementNodes, config);
          break;
          
        case 'prioritize-text':
          // Only use text if we have it
          if (textNodes.length > 0 && config.preserveTextNodes) {
            const combinedText = textNodes.map(t => t.value).join('');
            result[config.properties.text] = combinedText;
          } else {
            // Fall back to elements
            this.processChildElements(result, elementNodes, config);
          }
          break;
          
        case 'prioritize-elements':
          // Only use elements if we have them
          if (elementNodes.length > 0) {
            this.processChildElements(result, elementNodes, config);
          } else if (textNodes.length > 0 && config.preserveTextNodes) {
            // Fall back to text
            const combinedText = textNodes.map(t => t.value).join('');
            result[config.properties.text] = combinedText;
          }
          break;
      }
    } else {
      // Not mixed content, process normally
      if (textNodes.length > 0 && config.preserveTextNodes) {
        const combinedText = textNodes.map(t => t.value).join('');
        result[config.properties.text] = combinedText;
      } else if (elementNodes.length > 0) {
        this.processChildElements(result, elementNodes, config);
      }
    }
    
    return result;
  }
  
  /**
   * Process an empty element
   * @param node Element node
   * @param config Configuration
   * @returns JSON value
   */
  private processEmptyElement(node: XNode, config: Configuration): JsonValue {
    // Handle attributes if present
    const hasAttributes = node.attributes && Object.keys(node.attributes).length > 0 && config.preserveAttributes;
    
    if (hasAttributes) {
      // If we have attributes, return an object with them
      const result: JsonObject = {};
      this.addAttributes(result, node, config);
      return result;
    }
    
    // No attributes, handle based on strategy
    switch (config.strategies.emptyElementStrategy) {
      case 'null':
        return null;
        
      case 'string':
        return '';
        
      case 'object':
      default:
        return {};
    }
  }
  
  /**
   * Add attributes to a result object
   * @param result Result object
   * @param node Source node
   * @param config Configuration
   */
  private addAttributes(result: JsonObject, node: XNode, config: Configuration): void {
    if (!node.attributes) return;
    
    const { properties, prefixes } = config;
    const { attributeStrategy } = config.strategies;

    switch (attributeStrategy) {
      case 'merge':
        // Add attributes directly to the element object
        Object.entries(node.attributes).forEach(([key, value]) => {
          result[key] = value;
        });
        break;
        
      case 'prefix':
        // Add attributes with a prefix
        const prefix = prefixes.attribute;
        Object.entries(node.attributes).forEach(([key, value]) => {
          result[prefix + key] = value;
        });
        break;
        
      case 'property':
        // Add attributes as a separate property
        const attrs: JsonObject = {};
        Object.entries(node.attributes).forEach(([key, value]) => {
          attrs[key] = value;
        });
        result[properties.attribute] = attrs;
        break;
    }
  }
  
  /**
   * Process child elements into a result object
   * @param result Result object
   * @param children Child elements
   * @param config Configuration
   */
  private processChildElements(result: JsonObject, children: XNode[], config: Configuration): void {
    // Group children by element name
    const childrenByName: Record<string, XNode[]> = {};
    
    // Build the groupings - include prefix in the name if configured
    children.forEach(child => {
      const childName = config.preservePrefixedNames && child.prefix ? 
        `${child.prefix}:${child.name}` : child.name;
        
      if (!childrenByName[childName]) {
        childrenByName[childName] = [];
      }
      childrenByName[childName].push(child);
    });
    
    // Process each group
    Object.entries(childrenByName).forEach(([name, nodes]) => {
      // Determine if this should be an array
      const forcedArray = config.arrays.forceArrays.includes(name);
      const multipleNodes = nodes.length > 1;
      const alwaysArray = config.strategies.arrayStrategy === 'always';
      const neverArray = config.strategies.arrayStrategy === 'never';
      
      const shouldBeArray = forcedArray || (multipleNodes && !neverArray) || alwaysArray;
      
      if (shouldBeArray) {
        // Create an array of values
        const values: JsonArray = nodes.map(node => {
          // Convert the node and extract its value
          const converted = this.convert(node, { config }) as JsonObject;
          // Get the element name with prefix if configured
          const nodeName = config.preservePrefixedNames && node.prefix ? 
            `${node.prefix}:${node.name}` : node.name;
          return converted[nodeName];
        });
        
        result[name] = values;
      } else {
        // Just use the last node (or only node)
        const node = nodes[nodes.length - 1];
        const converted = this.convert(node, { config }) as JsonObject;
        const nodeName = config.preservePrefixedNames && node.prefix ? 
          `${node.prefix}:${node.name}` : node.name;
        result[name] = converted[nodeName];
      }
    });
  }
}