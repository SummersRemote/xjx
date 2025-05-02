/**
 * XJX Service - Fixed Version with Improved Transformer Handling
 * 
 * Manages XJX instances and provides methods for working with transformers directly.
 * This version properly handles configuration changes by recreating the instance
 * while preserving transformers.
 */
import { XJX, TransformDirection } from '../../../dist/xjx.full.js'; // Import the full version with extensions
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
    // Make sure to use the full bundle that includes extensions
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
      console.log(`Applying ${XjxService._transformers.length} transformers to XJX instance`);
      
      for (const { direction, type, transformer } of XjxService._transformers) {
        try {
          // Make sure we have a valid direction enum value
          let dirEnum;
          if (typeof direction === 'string') {
            dirEnum = TransformDirection[direction];
            if (dirEnum === undefined) {
              console.error(`Invalid direction string: ${direction}`);
              continue;
            }
          } else {
            dirEnum = direction;
          }
          
          console.log(`Applying ${type} transformer for direction: ${dirEnum}`);
          
          // Apply transformer based on type
          switch (type) {
            case 'value':
              xjx.addValueTransformer(dirEnum, transformer);
              break;
            case 'children':
              xjx.addChildrenTransformer(dirEnum, transformer);
              break;
            case 'attribute':
              xjx.addAttributeTransformer(dirEnum, transformer);
              break;
            case 'node':
              xjx.addNodeTransformer(dirEnum, transformer);
              break;
            default:
              console.error(`Unknown transformer type: ${type}`);
          }
        } catch (error) {
          console.error(`Error applying transformer:`, error);
        }
      }
    } else {
      console.log('No transformers to apply');
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
    try {
      // Parse options to ensure they're in the correct format
      const parsedOptions = {
        ...options,
        trueValues: Array.isArray(options.trueValues) ? options.trueValues : String(options.trueValues).split(',').map(v => v.trim()),
        falseValues: Array.isArray(options.falseValues) ? options.falseValues : String(options.falseValues).split(',').map(v => v.trim()),
      };
      
      console.log('Creating BooleanTransformer with options:', parsedOptions);
      const transformer = new BooleanTransformer(parsedOptions);
      
      // Store the transformer in our registry
      XjxService._transformers.push({
        direction,
        type: 'value',
        transformer,
        options: parsedOptions
      });
      
      console.log(`Added BooleanTransformer. Current transformers: ${XjxService._transformers.length}`);
      return transformer;
    } catch (error) {
      console.error('Error creating BooleanTransformer:', error);
      throw error;
    }
  }
  
  /**
   * Add a Number transformer
   * @param {string} direction - 'XML_TO_JSON' or 'JSON_TO_XML'
   * @param {Object} options - Transformer options
   * @returns {NumberTransformer} The created transformer
   */
  static addNumberTransformer(direction, options) {
    try {
      console.log('Creating NumberTransformer with options:', options);
      const transformer = new NumberTransformer(options);
      
      // Store the transformer in our registry
      XjxService._transformers.push({
        direction,
        type: 'value',
        transformer,
        options
      });
      
      console.log(`Added NumberTransformer. Current transformers: ${XjxService._transformers.length}`);
      return transformer;
    } catch (error) {
      console.error('Error creating NumberTransformer:', error);
      throw error;
    }
  }
  
  /**
   * Add a String Replace transformer
   * @param {string} direction - 'XML_TO_JSON' or 'JSON_TO_XML'
   * @param {Object} options - Transformer options
   * @returns {StringReplaceTransformer} The created transformer
   */
  static addStringReplaceTransformer(direction, options) {
    try {
      // Clone to avoid modifying the original object
      const processedOptions = {...options};
      
      // Convert string pattern to RegExp if needed
      if (typeof processedOptions.pattern === 'string' && 
          processedOptions.pattern.startsWith('/') && 
          processedOptions.pattern.lastIndexOf('/') > 0) {
        const lastSlashIndex = processedOptions.pattern.lastIndexOf('/');
        const patternBody = processedOptions.pattern.substring(1, lastSlashIndex);
        const flags = processedOptions.pattern.substring(lastSlashIndex + 1);
        processedOptions.pattern = new RegExp(patternBody, flags);
      } else if (typeof processedOptions.pattern === 'string') {
        // Create a regular expression with appropriate flags
        const flags = (processedOptions.ignoreCase ? 'i' : '') + 
                      (processedOptions.replaceAll !== false ? 'g' : '');
        processedOptions.pattern = new RegExp(processedOptions.pattern, flags);
      }
      
      console.log('Creating StringReplaceTransformer with options:', 
                  { ...processedOptions, pattern: processedOptions.pattern.toString() });
      
      const transformer = new StringReplaceTransformer(processedOptions);
      
      // Store the transformer in our registry
      XjxService._transformers.push({
        direction,
        type: 'value',
        transformer,
        options: processedOptions
      });
      
      console.log(`Added StringReplaceTransformer. Current transformers: ${XjxService._transformers.length}`);
      return transformer;
    } catch (error) {
      console.error('Error creating StringReplaceTransformer:', error);
      throw error;
    }
  }
  
  /**
   * Add a Filter Children transformer
   * @param {string} direction - 'XML_TO_JSON' or 'JSON_TO_XML'
   * @param {Object} options - Transformer options
   * @returns {FilterChildrenTransformer} The created transformer
   */
  static addFilterChildrenTransformer(direction, options) {
    try {
      // Parse options to ensure they're in the correct format
      const parsedOptions = {
        ...options,
        excludeNames: Array.isArray(options.excludeNames) ? options.excludeNames : String(options.excludeNames).split(',').map(v => v.trim())
      };
      
      console.log('Creating FilterChildrenTransformer with options:', parsedOptions);
      const transformer = new FilterChildrenTransformer(parsedOptions);
      
      // Store the transformer in our registry
      XjxService._transformers.push({
        direction,
        type: 'children',
        transformer,
        options: parsedOptions
      });
      
      console.log(`Added FilterChildrenTransformer. Current transformers: ${XjxService._transformers.length}`);
      return transformer;
    } catch (error) {
      console.error('Error creating FilterChildrenTransformer:', error);
      throw error;
    }
  }
  
  /**
   * Clear all transformers for a specific direction
   * @param {string} direction - 'XML_TO_JSON' or 'JSON_TO_XML', or null for all
   */
  static clearTransformers(direction = null) {
    const beforeCount = XjxService._transformers.length;
    
    if (direction) {
      // Filter out transformers for the specified direction
      XjxService._transformers = XjxService._transformers.filter(
        t => t.direction !== direction
      );
    } else {
      // Clear all transformers
      XjxService._transformers = [];
    }
    
    console.log(`Cleared transformers. Before: ${beforeCount}, After: ${XjxService._transformers.length}`);
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
    console.log('Converting XML to JSON with transformers:', XjxService._transformers.length);
    
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
    console.log('Converting JSON to XML with transformers:', XjxService._transformers.length);
    
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
      // Check if the method exists before calling it
      if (typeof xjx.getPath !== 'function') {
        console.error('getPath method not found on XJX instance. Make sure you are using the full bundle.');
        return fallback;
      }
      
      return xjx.getPath(jsonObj, path, fallback);
    } catch (error) {
      console.error('Error in getPath:', error);
      return fallback;
    } finally {
      xjx.cleanup();
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
      // Check if the method exists before calling it
      if (typeof xjx.getJsonSchema !== 'function') {
        console.error('getJsonSchema method not found on XJX instance. Make sure you are using the full bundle.');
        return null;
      }
      
      return xjx.getJsonSchema();
    } catch (error) {
      console.error('Error generating JSON schema:', error);
      return null;
    } finally {
      xjx.cleanup();
    }
  }
  
  /**
   * Reset service state
   */
  static reset() {
    console.log(`Resetting service. Clearing ${XjxService._transformers.length} transformers.`);
    // Clear all transformers
    XjxService._transformers = [];
  }
}