/**
 * standard-json-to-xnode-converter.ts
 * 
 * Converts standard JSON objects to XNode representation.
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
      logger.debug('StandardJsonToXNodeConverter initialized with config', { 
        preserveWhitespace: this.config.preserveWhitespace
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
        const arrayItemName = this.config.arrayItemName || "item";
        
        source.forEach(item => {
          const childNode = this.convertValue(arrayItemName, item);
          rootNode.addChild(childNode);
        });
      } else {
        // Process object properties
        Object.entries(source).forEach(([key, value]) => {
          const childNode = this.convertValue(this.sanitizeNodeName(key), value);
          rootNode.addChild(childNode);
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
   * @returns XNode representation
   * @private
   */
  private convertValue(name: string, value: any): XNode {
    try {
      // Create node with sanitized name
      const node = new XNode(this.sanitizeNodeName(name), NodeType.ELEMENT_NODE);
      
      if (value === null || value === undefined) {
        // Handle null/undefined
        node.value = null;
        return node;
      }
      
      if (typeof value !== 'object') {
        // Handle primitive values
        node.value = value;
        return node;
      }
      
      if (Array.isArray(value)) {
        // Handle arrays - use the configured array item name or default to "item"
        const arrayItemName = this.config.arrayItemName || "item";
        
        value.forEach(item => {
          const childNode = this.convertValue(arrayItemName, item);
          node.addChild(childNode);
        });
        return node;
      }
      
      // Handle objects
      Object.entries(value).forEach(([key, propValue]) => {
        const childNode = this.convertValue(this.sanitizeNodeName(key), propValue);
        node.addChild(childNode);
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
