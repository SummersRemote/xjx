/**
 * JSON to XNode converter implementation
 */
import { Configuration, createJsonConfig } from '../core/config';
import { NodeType } from '../core/dom';
import { logger, ProcessingError, validate, ValidationError } from '../core/error';
import { XNode, createElement, createTextNode, createCDATANode, createCommentNode, createProcessingInstructionNode, addChild } from '../core/xnode';
import { validateInput, Converter, JsonOptions, JsonProcessingContext, JsonValue, JsonObject, JsonArray, FormatDetectionResult } from '../core/converter';
import { createConverter } from '../core/converter';
import { 
  createProcessingContext, 
  createChildContext, 
  createElementNode, 
  sanitizeNodeName,
  processNamespaces, 
  processAttributes, 
  processTextContent, 
  processSpecialNode,
  getArrayItemName
} from './json-xnode-common';
import { detectJsonFormat } from '../core/json-utils';

/**
 * Create a JSON to XNode converter
 * @param config Configuration for the converter
 * @returns Converter implementation
 */
export function createJsonToXNodeConverter(config: Configuration): Converter<JsonValue, XNode, JsonOptions> {
  return createConverter(config, (json: JsonValue, config: Configuration, options?: JsonOptions) => {
    // Validate input
    validateInput(json, "JSON source must be a valid object or array", 
                  input => input !== null && typeof input === 'object');
    
    try {
      logger.debug('Starting JSON to XNode conversion', {
        sourceType: Array.isArray(json) ? 'array' : 'object'
      });
      
      // Create converter instance
      const converter = new JsonToXNodeConverterImpl(config);
      
      // Auto-detect format if not specified in options
      const format = converter.detectFormat(json);
      
      // Create options with detected format
      const mergedOptions: JsonOptions = {
        ...options,
        highFidelity: options?.highFidelity !== undefined ? options.highFidelity : format.isHighFidelity
      };
      
      // Convert with auto-detected format
      return converter.convert(json, mergedOptions);
    } catch (err) {
      throw new ProcessingError(`Failed to convert JSON to XNode: ${err instanceof Error ? err.message : String(err)}`);
    }
  });
}

/**
 * Implementation of JSON to XNode converter
 */
class JsonToXNodeConverterImpl implements Converter<JsonValue, XNode, JsonOptions> {
  private readonly config: Configuration;
  
  /**
   * Create a new converter
   * @param config Base configuration
   */
  constructor(config: Configuration) {
    this.config = config;
  }
  
  /**
   * Convert JSON to XNode
   * @param json JSON value to convert
   * @param options Conversion options
   * @returns XNode representation
   */
  convert(json: JsonValue, options?: JsonOptions): XNode {
    // Create processing context
    const context = createProcessingContext(this.config, options);
    
    // Validate JSON input
    this.validateJsonInput(json);
    
    // Auto-detect format if not specified
    if (options?.highFidelity === undefined) {
      const format = this.detectFormat(json);
      context.config = createJsonConfig(context.config, { 
        highFidelity: format.isHighFidelity 
      });
    }
    
    logger.debug('Converting JSON to XNode', {
      highFidelity: context.config.highFidelity,
      isArray: Array.isArray(json)
    });
    
    // Process based on high-fidelity setting
    if (context.config.highFidelity) {
      return this.convertFromHighFidelityJson(json, context);
    } else {
      return this.convertFromStandardJson(json, context);
    }
  }
  
  /**
   * Detect format of JSON input
   * @param json JSON value to analyze
   * @returns Format detection result
   */
  detectFormat(json: JsonValue): FormatDetectionResult {
    return detectJsonFormat(json, this.config);
  }
  
  /**
   * Validate JSON input structure
   * @param json JSON input
   * @throws ValidationError if validation fails
   */
  private validateJsonInput(json: JsonValue): void {
    // Skip if not an object or array
    if (json === null || typeof json !== 'object') {
      throw new ValidationError("JSON input must be an object or array");
    }
    
    // Array is always valid
    if (Array.isArray(json)) {
      return;
    }
    
    // Object must have at least one property (root element)
    const jsonObj = json as JsonObject;
    if (Object.keys(jsonObj).length === 0) {
      throw new ValidationError("JSON object must have at least one property");
    }
  }
  
  /**
   * Convert high-fidelity JSON to XNode
   * @param json JSON value
   * @param context Processing context
   * @returns XNode representation
   */
  private convertFromHighFidelityJson(json: JsonValue, context: JsonProcessingContext): XNode {
    // Handle array input
    if (Array.isArray(json)) {
      return this.convertHighFidelityArray(json as JsonArray, context);
    }
    
    // Handle object input
    const jsonObj = json as JsonObject;
    const rootName = Object.keys(jsonObj)[0];
    
    if (!rootName) {
      throw new ValidationError("JSON object must have at least one property");
    }
    
    // Get root element value
    const rootValue = jsonObj[rootName];
    
    // Check if this is a special node
    if (typeof rootValue !== 'object' || rootValue === null) {
      // Simple value - create element with value
      const node = createElementNode(rootName);
      node.value = rootValue;
      return node;
    }
    
    // Create root element
    const rootNode = createElementNode(rootName);
    
    // Get object value
    const obj = rootValue as JsonObject;
    
    // Check if this is a special node (text, CDATA, comment, PI)
    const specialNode = processSpecialNode(obj, context.config);
    if (specialNode) {
      return specialNode;
    }
    
    // Process namespace and prefix
    processNamespaces(obj, rootNode, context.config, context);
    
    // Process value if present
    const hasText = processTextContent(obj, rootNode, context.config);
    
    // Process attributes
    processAttributes(obj, rootNode, context.config);
    
    // Process children if present
    const childrenProp = context.config.properties.children;
    if (obj[childrenProp] && Array.isArray(obj[childrenProp])) {
      const children = obj[childrenProp] as JsonArray;
      const childContext = createChildContext(context, rootName);
      
      this.processHighFidelityChildren(children, rootNode, childContext);
    }
    
    return rootNode;
  }
  
  /**
   * Convert a high-fidelity JSON array to XNode
   * @param array JSON array
   * @param context Processing context
   * @returns XNode representation (root element with children)
   */
  private convertHighFidelityArray(array: JsonArray, context: JsonProcessingContext): XNode {
    // Create root array element
    const rootName = context.path.length > 0 ? context.path[context.path.length - 1] : "array";
    const rootNode = createElementNode(rootName);
    
    // Process children
    const childContext = createChildContext(context, rootName);
    
    this.processHighFidelityChildren(array, rootNode, childContext);
    
    return rootNode;
  }
  
  /**
   * Process children from high-fidelity JSON
   * @param children Children array
   * @param parentNode Parent XNode
   * @param context Processing context
   */
  private processHighFidelityChildren(
    children: JsonArray,
    parentNode: XNode,
    context: JsonProcessingContext
  ): void {
    // Process each child
    children.forEach(child => {
      // Skip null/undefined children
      if (child === null || child === undefined) {
        return;
      }
      
      // Check if this is a direct value (primitive)
      if (typeof child !== 'object') {
        // Simple text node
        if (context.config.preserveTextNodes) {
          const textNode = createTextNode(String(child));
          addChild(parentNode, textNode);
        }
        return;
      }
      
      const childObj = child as JsonObject;
      const { properties } = context.config;
      
      // Check for special nodes
      if (childObj[properties.value] !== undefined && context.config.preserveTextNodes) {
        // Text node
        const textNode = createTextNode(String(childObj[properties.value]));
        addChild(parentNode, textNode);
        return;
      }
      
      if (childObj[properties.cdata] !== undefined && context.config.preserveCDATA) {
        // CDATA section
        const cdataNode = createCDATANode(String(childObj[properties.cdata]));
        addChild(parentNode, cdataNode);
        return;
      }
      
      if (childObj[properties.comment] !== undefined && context.config.preserveComments) {
        // Comment
        const commentNode = createCommentNode(String(childObj[properties.comment]));
        addChild(parentNode, commentNode);
        return;
      }
      
      if (childObj[properties.processingInstr] !== undefined && context.config.preserveProcessingInstr) {
        // Processing instruction
        const piObj = childObj[properties.processingInstr];
        if (piObj && typeof piObj === 'object' && !Array.isArray(piObj)) {
          const piData = piObj as JsonObject;
          const target = piData[properties.target];
          const value = piData[properties.value] || '';
          
          if (target) {
            const piNode = createProcessingInstructionNode(String(target), String(value));
            addChild(parentNode, piNode);
          }
        }
        return;
      }
      
      // Element node (regular object)
      if (typeof child === 'object' && !Array.isArray(child)) {
        const childNode = this.convertFromHighFidelityJson(child, context);
        if (childNode) {
          addChild(parentNode, childNode);
        }
      }
    });
  }
  
  /**
   * Convert standard JSON to XNode
   * @param json JSON value
   * @param context Processing context
   * @returns XNode representation
   */
  private convertFromStandardJson(json: JsonValue, context: JsonProcessingContext): XNode {
    // Handle array input
    if (Array.isArray(json)) {
      return this.convertStandardArray(json as JsonArray, context);
    }
    
    // Handle object input
    const jsonObj = json as JsonObject;
    const rootName = Object.keys(jsonObj)[0];
    
    if (!rootName) {
      throw new ValidationError("JSON object must have at least one property");
    }
    
    // Get root element value
    const rootValue = jsonObj[rootName];
    
    // Create context for child processing
    const childContext = createChildContext(context, rootName);
    
    // Call the recursive implementation to create the node
    return this.convertObjectToNode(rootName, rootValue, childContext);
  }
  
  /**
   * Convert a standard JSON array to XNode
   * @param array JSON array
   * @param context Processing context
   * @returns XNode representation (root element with children)
   */
  private convertStandardArray(array: JsonArray, context: JsonProcessingContext): XNode {
    // Create root array element
    const rootName = context.path.length > 0 ? context.path[context.path.length - 1] : "array";
    const rootNode = createElementNode(rootName);
    
    // Get item name from configuration
    const itemName = getArrayItemName(rootName, context.config);
    
    // Process array items
    array.forEach(item => {
      // Create child context
      const childContext = createChildContext(context, itemName);
      
      // Convert item to node
      const itemNode = this.convertObjectToNode(itemName, item, childContext);
      if (itemNode) {
        addChild(rootNode, itemNode);
      }
    });
    
    return rootNode;
  }
  
  /**
   * Convert an object property to an XNode
   * @param name Property name
   * @param value Property value
   * @param context Processing context
   * @returns XNode representation
   */
  private convertObjectToNode(
    name: string,
    value: JsonValue,
    context: JsonProcessingContext
  ): XNode {
    // Create base node
    const node = createElementNode(name);
    
    // Handle null and undefined
    if (value === null || value === undefined) {
      // Empty node based on emptyElementStrategy
      if (context.config.emptyElementStrategy === 'null') {
        node.value = null;
      } else if (context.config.emptyElementStrategy === 'string') {
        node.value = '';
      }
      return node;
    }
    
    // Handle primitive values directly
    if (typeof value !== 'object') {
      if (context.config.preserveTextNodes) {
        node.value = value;
      }
      return node;
    }
    
    // Handle arrays
    if (Array.isArray(value)) {
      this.processStandardArray(value as JsonArray, node, context);
      return node;
    }
    
    // Handle object
    const obj = value as JsonObject;
    
    // Check if this is a special attribute/value object
    if (this.processSpecialAttributes(obj, node, context)) {
      return node;
    }
    
    // Process object properties as child nodes
    this.processStandardObjectProperties(obj, node, context);
    
    return node;
  }
  
  /**
   * Process standard JSON array as children
   * @param array Array to process
   * @param parentNode Parent node 
   * @param context Processing context
   */
  private processStandardArray(
    array: JsonArray,
    parentNode: XNode,
    context: JsonProcessingContext
  ): void {
    // Get item name from configuration
    const itemName = getArrayItemName(parentNode.name, context.config);
    
    // Process array items
    array.forEach(item => {
      // Create child context
      const childContext = createChildContext(context, itemName);
      
      // Convert item to node
      const itemNode = this.convertObjectToNode(itemName, item, childContext);
      if (itemNode) {
        addChild(parentNode, itemNode);
      }
    });
  }
  
  /**
   * Process special attribute/value object pattern
   * @param obj Source object
   * @param node Target node
   * @param context Processing context
   * @returns True if processed as special pattern
   */
  private processSpecialAttributes(
    obj: JsonObject,
    node: XNode,
    context: JsonProcessingContext
  ): boolean {
    const { attributeStrategy, textStrategy, prefixes, properties } = context.config;
    
    // Check text property
    const hasTextProperty = obj[properties.text] !== undefined;
    
    // Check if it's an attribute/text object pattern
    let hasAttributePattern = false;
    
    switch (attributeStrategy) {
      case 'property':
        // Check for attribute property
        hasAttributePattern = obj[properties.attribute] !== undefined;
        break;
        
      case 'prefix':
        // Check for prefixed attributes
        const attrPrefix = prefixes.attribute;
        hasAttributePattern = Object.keys(obj).some(key => key.startsWith(attrPrefix));
        break;
        
      case 'merge':
        // For merge, we'll have to make a best guess
        // If it has both text property and other props, consider it an attribute pattern
        hasAttributePattern = hasTextProperty && Object.keys(obj).length > 1;
        break;
    }
    
    // If it's not a special pattern, return false
    if (!hasAttributePattern && !hasTextProperty) {
      return false;
    }
    
    // Process namespaces
    processNamespaces(obj, node, context.config, context);
    
    // Process attributes
    processAttributes(obj, node, context.config);
    
    // Process text content
    processTextContent(obj, node, context.config);
    
    return true;
  }
  
  /**
   * Process standard object properties
   * @param obj Source object
   * @param node Target node
   * @param context Processing context
   */
  private processStandardObjectProperties(
    obj: JsonObject,
    node: XNode,
    context: JsonProcessingContext
  ): void {
    const { attributeStrategy, textStrategy, prefixes, properties } = context.config;
    const reservedProps = this.getReservedPropNames(context.config);
    const childContext = createChildContext(context, node.name);
    
    // Process each property
    Object.entries(obj).forEach(([key, value]) => {
      // Skip reserved properties
      if (reservedProps.includes(key)) {
        return;
      }
      
      // Skip attribute properties based on strategy
      if (this.isAttributeProperty(key, context.config)) {
        return;
      }
      
      // Skip text property if configured
      if (key === properties.text) {
        return;
      }
      
      // Process as child element
      const childNode = this.convertObjectToNode(key, value, childContext);
      if (childNode) {
        addChild(node, childNode);
      }
    });
  }
  
  /**
   * Get reserved property names
   * @param config Configuration
   * @returns Array of reserved property names
   */
  private getReservedPropNames(config: Configuration): string[] {
    const { properties } = config;
    
    return [
      properties.attribute,
      properties.value,
      properties.namespace,
      properties.prefix,
      properties.cdata,
      properties.comment,
      properties.processingInstr,
      properties.target,
      properties.children
    ];
  }
  
  /**
   * Check if a property is an attribute based on strategy
   * @param key Property key
   * @param config Configuration
   * @returns True if it's an attribute property
   */
  private isAttributeProperty(key: string, config: Configuration): boolean {
    const { attributeStrategy, prefixes, properties } = config;
    
    switch (attributeStrategy) {
      case 'property':
        return key === properties.attribute;
        
      case 'prefix':
        return key.startsWith(prefixes.attribute);
        
      case 'merge':
        // In merge mode, no additional properties are reserved for attributes
        return false;
        
      default:
        return false;
    }
  }
}