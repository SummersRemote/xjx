/**
 * XJX Service - Fixed Version
 * 
 * Manages XJX instances and provides methods for working with transformers directly.
 * This version properly handles configuration changes by recreating the instance
 * while preserving transformers.
 */
import { XJX, TransformDirection } from '../../../dist';
import { BooleanTransformer, NumberTransformer, StringReplaceTransformer } from '../../../dist';
import FilterChildrenTransformer from './transformers/FilterChildrenTransformer';

export default class XjxService {
  // Store active transformers
  static _transformers = [];
  
  // Direction enum for convenience
  static Direction = TransformDirection;
  
  /**
   * Create a fresh XJX instance with the provided configuration
   * @param {Object} config - Configuration to use
   * @returns {XJX} A new XJX instance
   */
  static createInstance(config) {
    return new XJX(config);
  }
  
  /**
   * Create an XJX instance with the current transformers applied
   * @param {Object} config - Configuration to use
   * @returns {XJX} A new XJX instance with transformers applied
   */
  static createInstanceWithTransformers(config) {
    // Create fresh instance with the provided config
    const xjx = new XJX(config);
    
    // Apply all registered transformers
    if (XjxService._transformers && XjxService._transformers.length > 0) {
      for (const { direction, type, transformer } of XjxService._transformers) {
        try {
          // Convert direction string to enum
          const dirEnum = TransformDirection[direction];
          
          // Apply transformer based on type
          if (type === 'value') {
            xjx.addValueTransformer(dirEnum, transformer);
          } else if (type === 'children') {
            xjx.addChildrenTransformer(dirEnum, transformer);
          } else if (type === 'attribute') {
            xjx.addAttributeTransformer(dirEnum, transformer);
          } else if (type === 'node') {
            xjx.addNodeTransformer(dirEnum, transformer);
          }
        } catch (error) {
          console.error(`Error applying transformer:`, error);
        }
      }
    }
    
    return xjx;
  }
  
  /**
   * Get available transformer classes
   * @returns {Object} Object containing transformer classes
   */
  static getTransformerClasses() {
    return {
      BooleanTransformer,
      NumberTransformer,
      StringReplaceTransformer,
      FilterChildrenTransformer
    };
  }
  
  /**
   * Add a Boolean transformer
   * @param {string} direction - 'XML_TO_JSON' or 'JSON_TO_XML'
   * @param {Object} options - Transformer options
   * @returns {BooleanTransformer} The created transformer
   */
  static addBooleanTransformer(direction, options) {
    const transformer = new BooleanTransformer(options);
    
    // Store the transformer in our registry
    XjxService._transformers.push({
      direction,
      type: 'value',
      transformer
    });
    
    return transformer;
  }
  
  /**
   * Add a Number transformer
   * @param {string} direction - 'XML_TO_JSON' or 'JSON_TO_XML'
   * @param {Object} options - Transformer options
   * @returns {NumberTransformer} The created transformer
   */
  static addNumberTransformer(direction, options) {
    const transformer = new NumberTransformer(options);
    
    // Store the transformer in our registry
    XjxService._transformers.push({
      direction,
      type: 'value',
      transformer
    });
    
    return transformer;
  }
  
  /**
   * Add a String Replace transformer
   * @param {string} direction - 'XML_TO_JSON' or 'JSON_TO_XML'
   * @param {Object} options - Transformer options
   * @returns {StringReplaceTransformer} The created transformer
   */
  static addStringReplaceTransformer(direction, options) {
    // Convert string pattern to RegExp if needed
    if (typeof options.pattern === 'string' && 
        options.pattern.startsWith('/') && 
        options.pattern.lastIndexOf('/') > 0) {
      const lastSlashIndex = options.pattern.lastIndexOf('/');
      const patternBody = options.pattern.substring(1, lastSlashIndex);
      const flags = options.pattern.substring(lastSlashIndex + 1);
      options.pattern = new RegExp(patternBody, flags);
    }
    
    const transformer = new StringReplaceTransformer(options);
    
    // Store the transformer in our registry
    XjxService._transformers.push({
      direction,
      type: 'value',
      transformer
    });
    
    return transformer;
  }
  
  /**
   * Add a Filter Children transformer
   * @param {string} direction - 'XML_TO_JSON' or 'JSON_TO_XML'
   * @param {Object} options - Transformer options
   * @returns {FilterChildrenTransformer} The created transformer
   */
  static addFilterChildrenTransformer(direction, options) {
    const transformer = new FilterChildrenTransformer(options);
    
    // Store the transformer in our registry
    XjxService._transformers.push({
      direction,
      type: 'children',
      transformer
    });
    
    return transformer;
  }
  
  /**
   * Clear all transformers for a specific direction
   * @param {string} direction - 'XML_TO_JSON' or 'JSON_TO_XML', or null for all
   */
  static clearTransformers(direction = null) {
    if (direction) {
      // Filter out transformers for the specified direction
      XjxService._transformers = XjxService._transformers.filter(
        t => t.direction !== direction
      );
    } else {
      // Clear all transformers
      XjxService._transformers = [];
    }
  }
  
  /**
   * Get active transformers
   * @returns {Array} Array of transformer entries
   */
  static getActiveTransformers() {
    return [...XjxService._transformers];
  }
  
  /**
   * Convert XML string to JSON
   * @param {string} xmlString - XML content
   * @param {Object} config - XJX configuration options
   * @returns {Object} JSON representation of the XML
   */
  static xmlToJson(xmlString, config) {
    // Create fresh instance with config AND transformers
    const xjx = this.createInstanceWithTransformers(config);
    
    try {
      // Perform conversion
      return xjx.xmlToJson(xmlString);
    } finally {
      // Clean up the instance
      xjx.cleanup();
    }
  }
  
  /**
   * Convert JSON object to XML string
   * @param {Object} jsonObj - JSON content
   * @param {Object} config - XJX configuration options
   * @returns {string} XML representation of the JSON
   */
  static jsonToXml(jsonObj, config) {
    // Create fresh instance with config AND transformers
    const xjx = this.createInstanceWithTransformers(config);
    
    try {
      // Perform conversion
      return xjx.jsonToXml(jsonObj);
    } finally {
      // Clean up the instance
      xjx.cleanup();
    }
  }
  
  /**
   * Pretty print XML string
   * @param {string} xmlString - XML content
   * @param {Object} config - XJX configuration options
   * @returns {string} Formatted XML
   */
  static prettyPrintXml(xmlString, config) {
    const xjx = this.createInstance(config);
    try {
      return xjx.prettyPrintXml(xmlString);
    } finally {
      xjx.cleanup();
    }
  }
  
  /**
   * Validate XML string
   * @param {string} xmlString - XML content
   * @param {Object} config - XJX configuration options
   * @returns {Object} Validation result {isValid, message}
   */
  static validateXml(xmlString, config) {
    const xjx = this.createInstance(config);
    try {
      return xjx.validateXML(xmlString);
    } finally {
      xjx.cleanup();
    }
  }
  
  /**
   * Get a value from JSON object using a path
   * @param {Object} jsonObj - JSON object
   * @param {string} path - Dot notation path
   * @param {Object} config - XJX configuration options
   * @param {any} fallback - Fallback value if path doesn't exist
   * @returns {any} Retrieved value
   */
  static getPath(jsonObj, path, config, fallback) {
    const xjx = this.createInstance(config);
    try {
      return xjx.getPath(jsonObj, path, fallback);
    } finally {
      xjx.cleanup();
    }
  }
  
  /**
   * Format JSON string with proper indentation
   * @param {string} jsonString - JSON string
   * @param {number} indent - Indentation spaces
   * @returns {string} Formatted JSON string
   */
  static formatJson(jsonString, indent = 2) {
    try {
      const jsonObj = JSON.parse(jsonString);
      return JSON.stringify(jsonObj, null, indent);
    } catch (error) {
      throw new Error(`Failed to format JSON: ${error.message}`);
    }
  }
  
  /**
   * Validate JSON string
   * @param {string} jsonString - JSON string
   * @returns {Object} Validation result {isValid, message}
   */
  static validateJson(jsonString) {
    try {
      JSON.parse(jsonString);
      return { isValid: true };
    } catch (error) {
      return { isValid: false, message: error.message };
    }
  }
  
  /**
   * Generate a JSON schema based on the current configuration
   * @param {Object} config - XJX configuration options
   * @returns {Object} JSON schema object for validating XML-JSON documents
   */
  static getJsonSchema(config) {
    const xjx = this.createInstance(config);
    try {
      return xjx.getJsonSchema();
    } finally {
      xjx.cleanup();
    }
  }
  
  /**
   * Reset service state
   */
  static reset() {
    // Clear all transformers
    XjxService._transformers = [];
  }
}