/**
 * XjxService - Streamlined service for XJX library
 * 
 * Direct integration with the XJX library using the fluent API
 */
import { 
  XJX, 
  TransformDirection, 
  BooleanTransform, 
  NumberTransform, 
  RegexTransform 
} from '../../../dist/esm'; // Import from the local build

// Custom transformer
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
    try {
      console.log('Converting XML to JSON with', XjxService._transformers.length, 'transformers');
      
      // Start with the XML
      let builder = XJX.fromXml(xmlString);
      
      // Apply configuration
      builder = builder.withConfig(config);
      
      // Apply transformers
      if (XjxService._transformers.length > 0) {
        // Filter transformers for XML to JSON direction
        const xmlToJsonTransformers = XjxService._transformers
          .filter(t => {
            // Check if direction matches XML_TO_JSON
            const matches = t.direction === TransformDirection.XML_TO_JSON;
            console.log('Transformer direction check:', t.direction, TransformDirection.XML_TO_JSON, matches);
            return matches;
          })
          .map(t => t.transformer);
        
        console.log('Filtered transformers for XML_TO_JSON:', xmlToJsonTransformers.length);
        
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
    try {
      console.log('Converting JSON to XML with', XjxService._transformers.length, 'transformers');
      
      // Start with the JSON
      let builder = XJX.fromJson(jsonObj);
      
      // Apply configuration
      builder = builder.withConfig(config);
      
      // Apply transformers
      if (XjxService._transformers.length > 0) {
        // Filter transformers for JSON to XML direction
        const jsonToXmlTransformers = XjxService._transformers
          .filter(t => {
            // Check if direction matches JSON_TO_XML
            const matches = t.direction === TransformDirection.JSON_TO_XML;
            console.log('Transformer direction check:', t.direction, TransformDirection.JSON_TO_XML, matches);
            return matches;
          })
          .map(t => t.transformer);
        
        console.log('Filtered transformers for JSON_TO_XML:', jsonToXmlTransformers.length);
        
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
   * @returns {string} Formatted XML
   */
  static prettyPrintXml(xmlString) {
    return XJX.prettyPrintXml(xmlString);
  }
  
  /**
   * Validate XML string
   * @param {string} xmlString - XML content
   * @returns {Object} Validation result {isValid, message}
   */
  static validateXml(xmlString) {
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
      return XJX.getPath(jsonObj, path, fallback);
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
      // Use the withConfig method to apply configuration first
      return XJX.withConfig(config).toJsonSchema();
    } catch (error) {
      console.error('Error generating JSON schema:', error);
      return null;
    }
  }
  
  // === Transformer Management Methods ===
  
  /**
   * Add a Boolean transformer
   * @param {TransformDirection} direction - XML_TO_JSON or JSON_TO_XML
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
      
      const transformer = new BooleanTransform(parsedOptions);
      
      console.log('Created BooleanTransform:', transformer);
      console.log('BooleanTransform targets:', transformer.targets);
      
      // Store the transformer in our registry
      XjxService._transformers.push({
        direction,
        type: 'value',
        transformer,
        options: parsedOptions
      });
      
      return transformer;
    } catch (error) {
      console.error('Error creating BooleanTransform:', error);
      throw error;
    }
  }
  
  /**
   * Add a Number transformer
   * @param {TransformDirection} direction - XML_TO_JSON or JSON_TO_XML
   * @param {Object} options - Transformer options
   * @returns {NumberTransform} The created transformer
   */
  static addNumberTransformer(direction, options) {
    try {
      const transformer = new NumberTransform(options);
      
      // Store the transformer in our registry
      XjxService._transformers.push({
        direction,
        type: 'value',
        transformer,
        options
      });
      
      return transformer;
    } catch (error) {
      console.error('Error creating NumberTransform:', error);
      throw error;
    }
  }
  
  /**
   * Add a Regex transformer
   * @param {TransformDirection} direction - XML_TO_JSON or JSON_TO_XML
   * @param {Object} options - Transformer options
   * @returns {RegexTransform} The created transformer
   */
  static addRegexTransformer(direction, options) {
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
      
      const transformer = new RegexTransform(processedOptions);
      
      // Store the transformer in our registry
      XjxService._transformers.push({
        direction,
        type: 'value',
        transformer,
        options: processedOptions
      });
      
      return transformer;
    } catch (error) {
      console.error('Error creating RegexTransform:', error);
      throw error;
    }
  }
  
  /**
   * Add a Filter Children transformer
   * @param {TransformDirection} direction - XML_TO_JSON or JSON_TO_XML
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
      
      const transformer = new FilterChildrenTransformer(parsedOptions);
      
      // Store the transformer in our registry
      XjxService._transformers.push({
        direction,
        type: 'children',
        transformer,
        options: parsedOptions
      });
      
      return transformer;
    } catch (error) {
      console.error('Error creating FilterChildrenTransformer:', error);
      throw error;
    }
  }
  
  /**
   * Clear all transformers for a specific direction
   * @param {TransformDirection} direction - XML_TO_JSON or JSON_TO_XML, or null for all
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
   * Reset service state
   */
  static reset() {
    // Clear all transformers
    XjxService._transformers = [];
  }
}