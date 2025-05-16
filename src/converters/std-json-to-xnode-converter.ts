/**
 * standard-json-to-xnode-converter.ts
 * 
 * Implements conversion from standard JSON objects to XNode representation
 * with proper application of preservation settings.
 */
import { Converter } from './converter-interfaces';
import { Config, Configuration } from '../core/config';
import { NodeType } from '../core/dom';
import { logger, validate, handleError, ErrorType } from '../core/error';
import { XNode } from '../core/xnode';

/**
 * Standard JSON object to XNode converter interface
 */
export interface StandardJsonToXNodeConverter extends Converter<Record<string, any> | any[], XNode> {}

/**
 * Converts standard JSON objects to XNode representation
 */
export class DefaultStandardJsonToXNodeConverter implements StandardJsonToXNodeConverter {
  private config: Configuration;

  /**
   * Create a new converter
   * @param config Configuration
   */
  constructor(config: Configuration) {
    // Initialize properties first to satisfy TypeScript
    this.config = config;
    
    try {
      // Then validate and potentially update
      if (!Config.isValid(config)) {
        this.config = Config.createOrUpdate({}, config);
      }
      
      // Access config properties to avoid unused variable warning
      logger.debug('StandardJsonToXNodeConverter initialized', { 
        preserveTextNodes: this.config.preserveTextNodes,
        preserveAttributes: this.config.preserveAttributes
      });
    } catch (err) {
      // If validation/update fails, use default config
      this.config = Config.getDefault();
      handleError(err, "initialize StandardJSON to XNode converter", {
        errorType: ErrorType.CONFIGURATION
      });
    }
  }

  /**
   * Convert standard JSON object to XNode
   * @param source Standard JSON object or array
   * @returns XNode representation
   */
  public convert(source: Record<string, any> | any[]): XNode {
    try {
      // Validate input
      validate(source !== null && typeof source === 'object', 
               "Source must be a valid object or array");
      
      logger.debug('Starting standard JSON to XNode conversion', {
        sourceType: Array.isArray(source) ? 'array' : 'object'
      });
      
      // Create root node based on source type
      const rootName = Array.isArray(source) ? "array" : "root";
      const rootNode = new XNode(rootName, NodeType.ELEMENT_NODE);
      
      // Process the source
      if (Array.isArray(source)) {
        // Process array items using the configured array item name
        const arrayItemName = this.config.converters.stdJson.naming.arrayItem;
        
        source.forEach(item => {
          const childNode = this.convertValue(arrayItemName, item);
          if (childNode) {
            rootNode.addChild(childNode);
          }
        });
      } else {
        // Process object properties
        Object.entries(source).forEach(([key, value]) => {
          const childNode = this.convertValue(this.sanitizeNodeName(key), value);
          if (childNode) {
            rootNode.addChild(childNode);
          }
        });
      }
      
      logger.debug('Successfully converted standard JSON to XNode', {
        rootName: rootNode.name,
        childCount: rootNode.children?.length || 0
      });
      
      return rootNode;
    } catch (err) {
      return handleError(err, 'convert standard JSON to XNode', {
        data: { sourceType: Array.isArray(source) ? 'array' : 'object' },
        errorType: ErrorType.PARSE
      });
    }
  }
  
  /**
   * Convert a JSON value to an XNode
   * @param name Node name
   * @param value JSON value
   * @returns XNode representation or null if filtered
   * @private
   */
  private convertValue(name: string, value: any): XNode | null {
    try {
      // Create node with sanitized name
      const node = new XNode(this.sanitizeNodeName(name), NodeType.ELEMENT_NODE);
      
      // Handle null/undefined
      if (value === null || value === undefined) {
        return node;
      }
      
      // Handle primitive values (apply preserveTextNodes)
      if (typeof value !== 'object') {
        if (this.config.preserveTextNodes) {
          const normalizedValue = typeof value === 'string' && !this.config.preserveWhitespace ? 
                                  value.trim() : value;
          node.value = normalizedValue;
        }
        return node;
      }
      
      // Handle arrays
      if (Array.isArray(value)) {
        // Use the configured array item name
        const arrayItemName = this.config.converters.stdJson.naming.arrayItem;
        
        value.forEach(item => {
          const childNode = this.convertValue(arrayItemName, item);
          if (childNode) {
            node.addChild(childNode);
          }
        });
        return node;
      }
      
      // Handle standard JavaScript objects by inspecting properties structure
      const options = this.config.converters.stdJson.options;
      
      // Check for attribute handling based on the options
      if (this.config.preserveAttributes) {
        this.processObjectAttributes(node, value, options);
      }
      
      // Process object properties as child nodes
      Object.entries(value).forEach(([key, propValue]) => {
        // Skip properties that might have been handled as attributes
        if (this.isAttributeProperty(key, options)) {
          return;
        }
        
        // Skip text property if it's designated as the text content holder
        if (key === options.textPropertyName && typeof propValue !== 'object') {
          if (this.config.preserveTextNodes) {
            const normalized = typeof propValue === 'string' && !this.config.preserveWhitespace ? 
                             propValue.trim() : propValue;
            node.value = normalized;
          }
          return;
        }
        
        // Process regular properties as child nodes
        const childNode = this.convertValue(this.sanitizeNodeName(key), propValue);
        if (childNode) {
          node.addChild(childNode);
        }
      });
      
      return node;
    } catch (err) {
      return handleError(err, 'convert JSON value to XNode', {
        data: { name, valueType: typeof value },
        errorType: ErrorType.PARSE,
        fallback: new XNode(this.sanitizeNodeName(name), NodeType.ELEMENT_NODE)
      });
    }
  }
  
  /**
   * Process object attributes based on configuration
   * @param node XNode to add attributes to
   * @param obj Object containing potential attributes
   * @param options Standard JSON options
   * @private
   */
  private processObjectAttributes(node: XNode, obj: Record<string, any>, options: any): void {
    try {
      // Define attribute properties based on attributeHandling option
      let attributeProps: Record<string, any> = {};
      
      switch (options.attributeHandling) {
        case 'property':
          // Attributes in a specific property
          const propName = options.attributePropertyName;
          if (obj[propName] && typeof obj[propName] === 'object') {
            attributeProps = obj[propName];
          }
          break;
          
        case 'prefix':
          // Attributes with a specific prefix
          const prefix = options.attributePrefix;
          Object.entries(obj).forEach(([key, value]) => {
            if (key.startsWith(prefix)) {
              const attrName = key.substring(prefix.length);
              attributeProps[attrName] = value;
            }
          });
          break;
          
        case 'merge':
          // All primitive properties could be attributes
          Object.entries(obj).forEach(([key, value]) => {
            // Only consider primitives, not objects/arrays, and not the text content property
            if ((typeof value !== 'object' || value === null) && 
                key !== options.textPropertyName) {
              attributeProps[key] = value;
            }
          });
          break;
          
        // For 'ignore', we don't process attributes
      }
      
      // Add attributes to the node
      if (Object.keys(attributeProps).length > 0) {
        node.attributes = {};
        
        Object.entries(attributeProps).forEach(([name, value]) => {
          node.attributes![name] = value;
        });
      }
    } catch (err) {
      handleError(err, 'process object attributes', {
        data: { 
          nodeName: node.name,
          objectKeys: Object.keys(obj)
        }
      });
      // Continue even if attribute processing fails
    }
  }
  
  /**
   * Check if a property is an attribute based on the configuration
   * @param key Property key
   * @param options Standard JSON options
   * @returns True if it's an attribute property
   * @private
   */
  private isAttributeProperty(key: string, options: any): boolean {
    try {
      switch (options.attributeHandling) {
        case 'property':
          return key === options.attributePropertyName;
          
        case 'prefix':
          return key.startsWith(options.attributePrefix);
          
        case 'merge':
          // In merge mode, we can't definitively say which properties are attributes
          // since they're merged with regular properties
          return false;
          
        case 'ignore':
        default:
          return false;
      }
    } catch (err) {
      return handleError(err, 'check if property is attribute', {
        data: { key },
        fallback: false
      });
    }
  }
  
  /**
   * Sanitize a string to be a valid XML node name
   * @param name Name to sanitize
   * @returns Sanitized name
   * @private
   */
  private sanitizeNodeName(name: string): string {
    try {
      // XML element names must start with a letter or underscore
      // and can only contain letters, digits, hyphens, underscores, and periods
      
      // Replace invalid start character
      let result = name.trim();
      if (!/^[a-zA-Z_]/.test(result)) {
        result = 'n_' + result;
      }
      
      // Replace invalid characters
      result = result.replace(/[^\w\-\.]/g, '_');
      
      return result || 'node'; // Default if empty after sanitization
    } catch (err) {
      return handleError(err, 'sanitize node name', {
        data: { name },
        fallback: 'node'
      });
    }
  }
}