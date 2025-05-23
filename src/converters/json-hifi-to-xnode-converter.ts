import { Configuration } from '../core/config';
import { NodeType } from '../core/dom';
import { logger, ProcessingError, validate, ValidationError } from '../core/error';
import { XNode, createElement, createTextNode, createCDATANode, createCommentNode, createProcessingInstructionNode, addChild } from '../core/xnode';
import { validateInput, Converter, JsonOptions, JsonValue, JsonObject, JsonArray } from '../core/converter';
import { createConverter } from '../core/converter';

/**
 * Create a JSON HiFi to XNode converter
 * @param config Configuration for the converter
 * @returns Converter implementation
 */
export function createJsonHiFiToXNodeConverter(config: Configuration): Converter<JsonValue, XNode, JsonOptions> {
  return createConverter(config, (json: JsonValue, config: Configuration, options?: JsonOptions) => {
    // Validate input
    validateInput(json, "JSON source must be a valid object", 
                 input => input !== null && typeof input === 'object' && !Array.isArray(input));
    
    try {
      logger.debug('Starting JSON HiFi to XNode conversion', {
        sourceType: typeof json
      });
      
      // Create converter instance
      const converter = new JsonHiFiToXNodeConverterImpl(config);
      
      // Convert with options
      return converter.convert(json, options);
    } catch (err) {
      throw new ProcessingError(`Failed to convert JSON HiFi to XNode: ${err instanceof Error ? err.message : String(err)}`);
    }
  });
}

/**
 * Implementation of JSON HiFi to XNode converter
 */
class JsonHiFiToXNodeConverterImpl implements Converter<JsonValue, XNode, JsonOptions> {
  private readonly config: Configuration;
  
  /**
   * Create a new converter
   * @param config Base configuration
   */
  constructor(config: Configuration) {
    this.config = config;
  }
  
  /**
   * Convert JSON HiFi to XNode
   * @param json JSON HiFi to convert
   * @param options Conversion options 
   * @returns XNode representation
   */
  convert(json: JsonValue, options?: JsonOptions): XNode {
    // Verify we have an object
    if (typeof json !== 'object' || json === null || Array.isArray(json)) {
      throw new ValidationError("JSON HiFi input must be an object");
    }
    
    const jsonObj = json as JsonObject;
    
    // Get root element name
    const rootName = Object.keys(jsonObj)[0];
    if (!rootName) {
      throw new ValidationError("JSON HiFi object must have a root element");
    }
    
    // Get root object
    const rootObj = jsonObj[rootName];
    if (typeof rootObj !== 'object' || rootObj === null || Array.isArray(rootObj)) {
      throw new ValidationError("JSON HiFi root element must be an object");
    }
    
    // Process the root element
    return this.processElement(rootName, rootObj as JsonObject);
  }
  
  /**
   * Process a JSON HiFi element
   * @param name Element name
   * @param obj Element object
   * @param parent Optional parent node
   * @returns XNode representation
   */
  private processElement(name: string, obj: JsonObject, parent?: XNode): XNode {
    // Handle prefixed names if configured
    let prefix: string | undefined;
    let localName: string = name;
    
    if (this.config.preservePrefixedNames && name.includes(':')) {
      const parts = name.split(':');
      prefix = parts[0];
      localName = parts[1];
    }
    
    // Create the element
    const element = createElement(localName);
    
    // Set parent reference if provided
    if (parent) {
      element.parent = parent;
    }
    
    // Set the prefix if we extracted one
    if (prefix) {
      element.prefix = prefix;
    }
    
    const { properties } = this.config;
    
    // Process namespace information
    if (obj[properties.namespace] && this.config.preserveNamespaces) {
      element.namespace = String(obj[properties.namespace]);
    }
    
    if (obj[properties.prefix] && this.config.preserveNamespaces) {
      element.prefix = String(obj[properties.prefix]);
    }
    
    // Process namespace declarations
    if (obj.namespaceDeclarations && typeof obj.namespaceDeclarations === 'object' && 
        !Array.isArray(obj.namespaceDeclarations) && this.config.preserveNamespaces) {
      element.namespaceDeclarations = {};
      
      // Copy all namespace declarations
      Object.entries(obj.namespaceDeclarations).forEach(([prefix, uri]) => {
        element.namespaceDeclarations![prefix] = String(uri);
      });
      
      // Set default namespace flag if present
      if (obj.isDefaultNamespace === true) {
        element.isDefaultNamespace = true;
      }
    }
    
    // Process attributes
    if (obj[properties.attribute] && Array.isArray(obj[properties.attribute]) && 
        this.config.preserveAttributes) {
      this.processAttributes(element, obj[properties.attribute] as JsonArray);
    }
    
    // Process value
    // MERGED: Check for properties.value instead of separate value property
    if (obj[properties.value] !== undefined && this.config.preserveTextNodes) {
      element.value = obj[properties.value];
    }
    
    // Process children
    if (obj[properties.children] && Array.isArray(obj[properties.children])) {
      this.processChildren(element, obj[properties.children] as JsonArray);
    }
    
    // Process metadata if present
    if (obj.metadata && typeof obj.metadata === 'object' && !Array.isArray(obj.metadata)) {
      element.metadata = { ...obj.metadata as Record<string, any> };
    }
    
    return element;
  }
  
  /**
   * Process attributes from JSON HiFi format
   * @param element Target element
   * @param attrs Attributes array
   */
  private processAttributes(element: XNode, attrs: JsonArray): void {
    const { properties } = this.config;
    
    // Initialize attributes object if needed
    const attributes = (element.attributes ??= {});
    
    // Process each attribute in the array
    attrs.forEach(attr => {
      if (typeof attr !== 'object' || attr === null || Array.isArray(attr)) {
        return; // Skip invalid attributes
      }
      
      const attrObj = attr as JsonObject;
      const attrName = Object.keys(attrObj)[0];
      
      if (!attrName) return; // Skip empty attributes
      
      const attrValue = attrObj[attrName];
      
      // Check if this is a simple or complex attribute
      if (typeof attrValue === 'object' && attrValue !== null && !Array.isArray(attrValue)) {
        // Complex attribute with properties
        const attrProps = attrValue as JsonObject;
        
        // Get the actual value
        // MERGED: Use properties.value for attribute values
        const value = attrProps[properties.value];
        
        // Check if this is a namespaced attribute
        let finalAttrName = attrName;
        if (this.config.preserveNamespaces && attrProps[properties.prefix]) {
          finalAttrName = `${attrProps[properties.prefix]}:${attrName}`;
        }
        
        // Set the attribute
        attributes[finalAttrName] = value;
      } else {
        // Simple attribute
        attributes[attrName] = attrValue;
      }
    });
  }
  
  /**
   * Process children from JSON HiFi format
   * @param parent Parent element
   * @param children Children array
   */
  private processChildren(parent: XNode, children: JsonArray): void {
    const { properties } = this.config;
    
    // Process each child in order (important for mixed content)
    children.forEach(child => {
      if (child === null) return; // Skip null children
      
      // Check if this is a special node
      if (typeof child === 'object' && !Array.isArray(child)) {
        const childObj = child as JsonObject;
        
        // Text node
        // MERGED: Check for properties.value for text nodes
        if (childObj[properties.value] !== undefined && this.config.preserveTextNodes) {
          const textNode = createTextNode(String(childObj[properties.value]));
          addChild(parent, textNode);
          return;
        }
        
        // CDATA node
        if (childObj[properties.cdata] !== undefined && this.config.preserveCDATA) {
          const cdataNode = createCDATANode(String(childObj[properties.cdata]));
          addChild(parent, cdataNode);
          return;
        }
        
        // Comment node
        if (childObj[properties.comment] !== undefined && this.config.preserveComments) {
          const commentNode = createCommentNode(String(childObj[properties.comment]));
          addChild(parent, commentNode);
          return;
        }
        
        // Processing instruction
        if (childObj[properties.processingInstr] !== undefined && this.config.preserveProcessingInstr) {
          const piObj = childObj[properties.processingInstr];
          if (piObj && typeof piObj === 'object' && !Array.isArray(piObj)) {
            const piProps = piObj as JsonObject;
            const target = piProps[properties.target];
            // MERGED: Use properties.value for PI data
            const value = piProps[properties.value] || '';
            
            if (target) {
              const piNode = createProcessingInstructionNode(String(target), String(value));
              addChild(parent, piNode);
              return;
            }
          }
        }
        
        // Regular element node
        const elementName = Object.keys(childObj)[0];
        if (elementName) {
          const elementObj = childObj[elementName];
          if (typeof elementObj === 'object' && elementObj !== null && !Array.isArray(elementObj)) {
            const childNode = this.processElement(elementName, elementObj as JsonObject, parent);
            addChild(parent, childNode);
            return;
          }
        }
      }
      
      // If we get here, try to convert as raw text
      if (this.config.preserveTextNodes) {
        const textNode = createTextNode(String(child));
        addChild(parent, textNode);
      }
    });
  }
}