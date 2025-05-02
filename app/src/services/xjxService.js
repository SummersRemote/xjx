/**
 * XJX Service - Simplified Version
 * 
 * Manages a persistent XJX instance and provides methods for
 * working with transformers directly.
 */
import { XJX, TransformDirection } from '../../../dist';
import { BooleanTransformer, NumberTransformer, StringReplaceTransformer } from '../../../dist';
import FilterChildrenTransformer from './transformers/FilterChildrenTransformer';

export default class XjxService {
  // Singleton XJX instance
  static _instance = null;
  
  // Direction enum for convenience
  static Direction = TransformDirection;
  
  /**
   * Get the singleton XJX instance, creating it if necessary
   * @param {Object} config - Optional configuration to reset the instance
   * @returns {XJX} The XJX instance
   */
  static getInstance(config = null) {
    if (!XjxService._instance || config) {
      // Create a new instance with the provided config or default
      XjxService._instance = new XJX(config || {});
    }
    return XjxService._instance;
  }
  
  /**
   * Reset the XJX instance with a new configuration
   * @param {Object} config - New configuration
   * @returns {XJX} The new XJX instance
   */
  static resetInstance(config) {
    // Clean up the old instance if it exists
    if (XjxService._instance) {
      XjxService._instance.cleanup();
    }
    
    // Create and return a new instance
    XjxService._instance = new XJX(config || {});
    return XjxService._instance;
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
    const instance = XjxService.getInstance();
    const transformer = new BooleanTransformer(options);
    
    // Add to XJX instance
    instance.addValueTransformer(TransformDirection[direction], transformer);
    
    return transformer;
  }
  
  /**
   * Add a Number transformer
   * @param {string} direction - 'XML_TO_JSON' or 'JSON_TO_XML'
   * @param {Object} options - Transformer options
   * @returns {NumberTransformer} The created transformer
   */
  static addNumberTransformer(direction, options) {
    const instance = XjxService.getInstance();
    const transformer = new NumberTransformer(options);
    
    // Add to XJX instance
    instance.addValueTransformer(TransformDirection[direction], transformer);
    
    return transformer;
  }
  
  /**
   * Add a String Replace transformer
   * @param {string} direction - 'XML_TO_JSON' or 'JSON_TO_XML'
   * @param {Object} options - Transformer options
   * @returns {StringReplaceTransformer} The created transformer
   */
  static addStringReplaceTransformer(direction, options) {
    const instance = XjxService.getInstance();
    
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
    
    // Add to XJX instance
    instance.addValueTransformer(TransformDirection[direction], transformer);
    
    return transformer;
  }
  
  /**
   * Add a Filter Children transformer
   * @param {string} direction - 'XML_TO_JSON' or 'JSON_TO_XML'
   * @param {Object} options - Transformer options
   * @returns {FilterChildrenTransformer} The created transformer
   */
  static addFilterChildrenTransformer(direction, options) {
    const instance = XjxService.getInstance();
    const transformer = new FilterChildrenTransformer(options);
    
    // Add to XJX instance
    instance.addChildrenTransformer(TransformDirection[direction], transformer);
    
    return transformer;
  }
  
  /**
   * Clear all transformers for a specific direction
   * @param {string} direction - 'XML_TO_JSON' or 'JSON_TO_XML', or null for all
   */
  static clearTransformers(direction = null) {
    const instance = XjxService.getInstance();
    
    if (direction) {
      // Clear transformers for specific direction
      instance.clearTransformers(TransformDirection[direction]);
    } else {
      // Clear all transformers
      instance.clearTransformers();
    }
  }
  
  /**
   * Convert XML string to JSON
   * @param {string} xmlString - XML content
   * @param {Object} config - XJX configuration options
   * @returns {Object} JSON representation of the XML
   */
  static xmlToJson(xmlString, config) {
    // Update instance with new config but preserve transformers
    const instance = XjxService.getInstance();
    
    // Apply the new configuration
    Object.keys(config).forEach(key => {
      // Skip valueTransforms since we're not using it anymore
      if (key !== 'valueTransforms') {
        instance[key] = config[key];
      }
    });
    
    // Perform the conversion
    return instance.xmlToJson(xmlString);
  }
  
  /**
   * Convert JSON object to XML string
   * @param {Object} jsonObj - JSON content
   * @param {Object} config - XJX configuration options
   * @returns {string} XML representation of the JSON
   */
  static jsonToXml(jsonObj, config) {
    // Update instance with new config but preserve transformers
    const instance = XjxService.getInstance();
    
    // Apply the new configuration
    Object.keys(config).forEach(key => {
      // Skip valueTransforms since we're not using it anymore
      if (key !== 'valueTransforms') {
        instance[key] = config[key];
      }
    });
    
    // Perform the conversion
    return instance.jsonToXml(jsonObj);
  }
  
  /**
   * Pretty print XML string
   * @param {string} xmlString - XML content
   * @param {Object} config - XJX configuration options
   * @returns {string} Formatted XML
   */
  static prettyPrintXml(xmlString, config) {
    // Use the existing instance but don't update its config
    const instance = XjxService.getInstance();
    return instance.prettyPrintXml(xmlString);
  }
  
  /**
   * Validate XML string
   * @param {string} xmlString - XML content
   * @param {Object} config - XJX configuration options
   * @returns {Object} Validation result {isValid, message}
   */
  static validateXml(xmlString, config) {
    // Use the existing instance but don't update its config
    const instance = XjxService.getInstance();
    return instance.validateXML(xmlString);
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
    // Use the existing instance but don't update its config
    const instance = XjxService.getInstance();
    return instance.getPath(jsonObj, path, fallback);
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
    const instance = XjxService.getInstance();
    return instance.getJsonSchema();
  }
  
  /**
   * Clean up resources when app shuts down
   */
  static cleanup() {
    if (XjxService._instance) {
      XjxService._instance.cleanup();
      XjxService._instance = null;
    }
  }
}