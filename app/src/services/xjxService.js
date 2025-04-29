/**
 * XJX Service
 * 
 * Provides a wrapper around the XJX library for centralized management
 * of XML/JSON conversion and other operations.
 */
import { XJX } from 'xjx/full';
// import 'xjx/extensions/GetPathExtension';
// import 'xjx/extensions/GetJsonSchemaExtension';

export default class XjxService {
  /**
   * Creates an XJX instance with the provided configuration
   * @param {Object} config - XJX configuration options
   * @returns {XJX} XJX instance
   */
  static createInstance(config) {
    return new XJX(config);
  }

  /**
   * Convert XML string to JSON
   * @param {string} xmlString - XML content
   * @param {Object} config - XJX configuration options
   * @returns {Object} JSON representation of the XML
   */
  static xmlToJson(xmlString, config) {
    const xjx = this.createInstance(config);
    try {
      const result = xjx.xmlToJson(xmlString);
      return result;
    } finally {
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
    const xjx = this.createInstance(config);
    try {
      const result = xjx.jsonToXml(jsonObj);
      return result;
    } finally {
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
      const result = xjx.prettyPrintXml(xmlString);
      return result;
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
      const result = xjx.validateXML(xmlString);
      return result;
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
      const result = xjx.getPath(jsonObj, path, fallback);
      return result;
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
  static generateJsonSchema(config) {
    const xjx = this.createInstance(config);
    try {
      const schema = xjx.getJsonSchema();
      return schema;
    } finally {
      xjx.cleanup();
    }
  }
}