/**
 * XJX Service - Refactored with Fluent API
 * 
 * Manages XJX operations using the new fluent API while maintaining
 * support for transformers.
 */
import { XJX, TransformDirection } from '../../../dist/xjx.full.js'; // Import the full version with extensions
import { BooleanTransform, NumberTransform } from '../../../dist';
import FilterChildrenTransformer from './transformers/FilterChildrenTransformer';

export default class XjxService {
  // Store active transformers
  static _transformers = [];
  
  // Direction enum for convenience
  static Direction = TransformDirection;
  
  /**
   * Convert XML string to JSON
   * @param {string} xmlString - XML content
   * @param {Object} config - XJX configuration options
   * @returns {Object} JSON representation of the XML
   */
  static xmlToJson(xmlString, config) {
    console.log('Converting XML to JSON with transformers:', XjxService._transformers.length);
    
    try {
      // Start with the XML
      let builder = XJX.fromXml(xmlString);
      
      // Apply configuration
      builder = builder.withConfig(config);
      
      // Apply transformers
      if (XjxService._transformers.length > 0) {
        // Filter transformers for XML to JSON direction
        const xmlToJsonTransformers = XjxService._transformers
          .filter(t => t.direction === 'XML_TO_JSON' || t.direction === TransformDirection.XML_TO_JSON)
          .map(t => t.transformer);
        
        if (xmlToJsonTransformers.length > 0) {
          builder = builder.withTransforms(...xmlToJsonTransformers);
        }
      }
      
      // Execute the transformation
      return builder.toJson();
    } catch (error) {
      console.error('Error converting XML to JSON:', error);
      throw error;
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
    
    try {
      // Start with the JSON
      let builder = XJX.fromJson(jsonObj);
      
      // Apply configuration
      builder = builder.withConfig(config);
      
      // Apply transformers
      if (XjxService._transformers.length > 0) {
        // Filter transformers for JSON to XML direction
        const jsonToXmlTransformers = XjxService._transformers
          .filter(t => t.direction === 'JSON_TO_XML' || t.direction === TransformDirection.JSON_TO_XML)
          .map(t => t.transformer);
        
        if (jsonToXmlTransformers.length > 0) {
          builder = builder.withTransforms(...jsonToXmlTransformers);
        }
      }
      
      // Execute the transformation
      return builder.toXml();
    } catch (error) {
      console.error('Error converting JSON to XML:', error);
      throw error;
    }
  }
  
  /**
   * Pretty print XML string
   * @param {string} xmlString - XML content
   * @param {Object} config - XJX configuration options
   * @returns {string} Formatted XML
   */
  static prettyPrintXml(xmlString, config) {
    // Using static method directly
    return XJX.prettyPrintXml(xmlString);
  }
  
  /**
   * Validate XML string
   * @param {string} xmlString - XML content
   * @param {Object} config - XJX configuration options
   * @returns {Object} Validation result {isValid, message}
   */
  static validateXml(xmlString, config) {
    // Using static method directly
    return XJX.validateXml(xmlString);
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
    try {
      // In the new API, getPath is an extension method added to the XJX namespace
      // We need to check if it exists and use it directly
      if (typeof XJX.getPath === 'function') {
        return XJX.getPath(jsonObj, path, fallback);
      } else {
        console.warn('getPath method not found on XJX. Make sure you are using the full bundle with extensions.');
        return fallback;
      }
    } catch (error) {
      console.error('Error in getPath:', error);
      return fallback;
    }
  }
  
  /**
   * Generate a JSON schema based on the current configuration
   * @param {Object} config - XJX configuration options
   * @returns {Object} JSON schema object for validating XML-JSON documents
   */
  static getJsonSchema(config) {
    try {
      // In the new API, getJsonSchema is an extension method
      if (typeof XJX.getJsonSchema === 'function') {
        return XJX.getJsonSchema(config);
      } else {
        console.warn('getJsonSchema method not found on XJX. Make sure you are using the full bundle with extensions.');
        return null;
      }
    } catch (error) {
      console.error('Error generating JSON schema:', error);
      return null;
    }
  }
  
  // === Transformer Management Methods ===
  
  /**
   * Add a Boolean transformer
   * @param {string} direction - 'XML_TO_JSON' or 'JSON_TO_XML'
   * @param {Object} options - Transformer options
   * @returns {BooleanTransform} The created transformer
   */
  static addBooleanTransformer(direction, options) {
    try {
      // Parse options to ensure they're in the correct format
      const parsedOptions = {
        ...options,
        trueValues: Array.isArray(options.trueValues) ? options.trueValues : String(options.trueValues).split(',').map(v => v.trim()),
        falseValues: Array.isArray(options.falseValues) ? options.falseValues : String(options.falseValues).split(',').map(v => v.trim()),
      };
      
      console.log('Creating BooleanTransform with options:', parsedOptions);
      const transformer = new BooleanTransform(parsedOptions);
      
      // Store the transformer in our registry
      XjxService._transformers.push({
        direction,
        type: 'value',
        transformer,
        options: parsedOptions
      });
      
      console.log(`Added BooleanTransform. Current transformers: ${XjxService._transformers.length}`);
      return transformer;
    } catch (error) {
      console.error('Error creating BooleanTransform:', error);
      throw error;
    }
  }
  
  /**
   * Add a Number transformer
   * @param {string} direction - 'XML_TO_JSON' or 'JSON_TO_XML'
   * @param {Object} options - Transformer options
   * @returns {NumberTransform} The created transformer
   */
  static addNumberTransformer(direction, options) {
    try {
      console.log('Creating NumberTransform with options:', options);
      const transformer = new NumberTransform(options);
      
      // Store the transformer in our registry
      XjxService._transformers.push({
        direction,
        type: 'value',
        transformer,
        options
      });
      
      console.log(`Added NumberTransform. Current transformers: ${XjxService._transformers.length}`);
      return transformer;
    } catch (error) {
      console.error('Error creating NumberTransform:', error);
      throw error;
    }
  }
  
  // /**
  //  * Add a String Replace transformer
  //  * @param {string} direction - 'XML_TO_JSON' or 'JSON_TO_XML'
  //  * @param {Object} options - Transformer options
  //  * @returns {StringReplaceTransform} The created transformer
  //  */
  // static addStringReplaceTransformer(direction, options) {
  //   try {
  //     // Clone to avoid modifying the original object
  //     const processedOptions = {...options};
      
  //     // Convert string pattern to RegExp if needed
  //     if (typeof processedOptions.pattern === 'string' && 
  //         processedOptions.pattern.startsWith('/') && 
  //         processedOptions.pattern.lastIndexOf('/') > 0) {
  //       const lastSlashIndex = processedOptions.pattern.lastIndexOf('/');
  //       const patternBody = processedOptions.pattern.substring(1, lastSlashIndex);
  //       const flags = processedOptions.pattern.substring(lastSlashIndex + 1);
  //       processedOptions.pattern = new RegExp(patternBody, flags);
  //     } else if (typeof processedOptions.pattern === 'string') {
  //       // Create a regular expression with appropriate flags
  //       const flags = (processedOptions.ignoreCase ? 'i' : '') + 
  //                     (processedOptions.replaceAll !== false ? 'g' : '');
  //       processedOptions.pattern = new RegExp(processedOptions.pattern, flags);
  //     }
      
  //     console.log('Creating StringReplaceTransform with options:', 
  //                 { ...processedOptions, pattern: processedOptions.pattern.toString() });
      
  //     const transformer = new StringReplaceTransform(processedOptions);
      
  //     // Store the transformer in our registry
  //     XjxService._transformers.push({
  //       direction,
  //       type: 'value',
  //       transformer,
  //       options: processedOptions
  //     });
      
  //     console.log(`Added StringReplaceTransform. Current transformers: ${XjxService._transformers.length}`);
  //     return transformer;
  //   } catch (error) {
  //     console.error('Error creating StringReplaceTransform:', error);
  //     throw error;
  //   }
  // }
  
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
   * Get available transformer classes
   * @returns {Object} Object containing transformer classes
   */
  static getTransformerClasses() {
    return {
      BooleanTransform,
      NumberTransform,
      // StringReplaceTransform,
      FilterChildrenTransformer
    };
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