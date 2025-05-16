// services/XJXService.js
// Wrapper service for the XJX library with webpack-compatibility
import { XJX, BooleanTransform, NumberTransform, RegexTransform } from '../../../dist/esm/index.js';

// Create a map of transformer types to their constructors
const transformerMap = {
  'BooleanTransform': BooleanTransform,
  'NumberTransform': NumberTransform,
  'RegexTransform': RegexTransform
};

class XJXService {
  /**
   * Get default configuration
   * @returns {Object} Default configuration
   */
  getDefaultConfig() {
    // Create a default configuration that matches the updated structure
    return {
      // Preservation options
      preserveNamespaces: true,
      preserveComments: true,
      preserveProcessingInstr: true,
      preserveCDATA: true,
      preserveTextNodes: true,
      preserveWhitespace: false,
      preserveAttributes: true,

      // Converters section with format-specific settings
      converters: {
        // Standard JSON converter settings
        stdJson: {
          options: {
            attributeHandling: 'ignore',    // ignore, merge, prefix, property
            attributePrefix: '@',
            attributePropertyName: '_attrs',
            textPropertyName: '_text',
            alwaysCreateArrays: false,
            preserveMixedContent: true,
            emptyElementsAsNull: false
          },
          naming: {
            arrayItem: "item"
          }
        },
        
        // XJX JSON converter settings
        xjxJson: {
          options: {
            compact: true
          },
          naming: {
            namespace: "$ns",
            prefix: "$pre",
            attribute: "$attr",
            value: "$val",
            cdata: "$cdata",
            comment: "$cmnt",
            processingInstr: "$pi",
            target: "$trgt",
            children: "$children"
          }
        },
        
        // XML converter settings
        xml: {
          options: {
            declaration: true,
            prettyPrint: true,
            indent: 2
          }
        }
      }
    };
  }
  
  /**
   * Convert XML to JSON (XJX format)
   * @param {string} xml - XML string
   * @param {Object} config - Configuration object
   * @param {Array} transforms - Array of transform objects
   * @returns {Object} Resulting JSON
   */
  convertXmlToJson(xml, config, transforms) {
    // Create a new instance for each conversion
    const xjx = new XJX();
    
    // Start the conversion chain with fluent API
    let builder = xjx.fromXml(xml);
    
    // Apply config if provided
    if (config) {
      builder = builder.withConfig(config);
    }
    
    // Apply transforms if provided
    if (transforms && transforms.length > 0) {
      const transformInstances = this._createTransformers(transforms);
      
      if (transformInstances.length > 0) {
        builder = builder.withTransforms(...transformInstances);
      }
    }
    
    return builder.toJson();
  }
  
  /**
   * Convert XML to standard JSON
   * @param {string} xml - XML string
   * @param {Object} config - Configuration object
   * @param {Array} transforms - Array of transform objects
   * @returns {Object} Resulting standard JSON
   */
  convertXmlToStandardJson(xml, config, transforms) {
    // Create a new instance for each conversion
    const xjx = new XJX();
    
    // Start the conversion chain with fluent API
    let builder = xjx.fromXml(xml);
    
    // Apply config if provided
    if (config) {
      builder = builder.withConfig(config);
    }
    
    // Apply transforms if provided
    if (transforms && transforms.length > 0) {
      const transformInstances = this._createTransformers(transforms);
      
      if (transformInstances.length > 0) {
        builder = builder.withTransforms(...transformInstances);
      }
    }
    
    // Use toStandardJson extension method instead of toJson
    return builder.toStandardJson();
  }
  
  /**
   * Convert JSON to XML
   * Auto-detects whether input is XJX JSON or standard JSON
   * @param {Object} json - JSON object
   * @param {Object} config - Configuration object
   * @param {Array} transforms - Array of transform objects
   * @returns {string} Resulting XML
   */
  convertJsonToXml(json, config, transforms) {
    // Create a new instance for each conversion
    const xjx = new XJX();
    
    // Start the conversion chain - fromJson will auto-detect format
    let builder = xjx.fromJson(json);
    
    // Apply config if provided
    if (config) {
      builder = builder.withConfig(config);
    }
    
    // Apply transforms if provided
    if (transforms && transforms.length > 0) {
      const transformInstances = this._createTransformers(transforms);
      
      if (transformInstances.length > 0) {
        builder = builder.withTransforms(...transformInstances);
      }
    }
    
    return builder.toXml();
  }
  
  /**
   * Get available transformers from the XJX library
   * @returns {Object} Available transformers
   */
  getAvailableTransformers() {
    return {
      BooleanTransform: 'BooleanTransform',
      NumberTransform: 'NumberTransform',
      RegexTransform: 'RegexTransform'
    };
  }
  
  /**
   * Generate fluent API code string
   * @param {string} fromType - 'xml' or 'json'
   * @param {string|Object} content - Current content
   * @param {Object} config - Configuration object
   * @param {Array} transforms - Transform pipeline
   * @param {string} jsonFormat - JSON format ('xjx' or 'standard')
   * @returns {string} Fluent API code
   */
  generateFluentAPI(fromType, content, config, transforms, jsonFormat = 'xjx') {
    // Use the fluent API in the examples
    let code = `import { XJX } from 'xjx';\n\n`;
    code += `const xjx = new XJX();\n`;
    code += `const builder = xjx.from${fromType === 'xml' ? 'Xml' : 'Json'}(${fromType === 'xml' ? 'xml' : 'json'})`;
    
    if (config) {
      code += `\n  .withConfig(${JSON.stringify(config, null, 2)})`;
    }
    
    if (transforms && transforms.length > 0) {
      const transformsStr = transforms.map(t => {
        const type = t.type;
        const options = JSON.stringify(t.options);
        return `new ${type}(${options})`;
      }).join(',\n    ');
      
      code += `\n  .withTransforms(\n    ${transformsStr}\n  )`;
    }
    
    // Determine the appropriate terminal method based on direction and format
    let terminalMethod;
    if (fromType === 'xml') {
      terminalMethod = jsonFormat === 'standard' ? 'toStandardJson' : 'toJson';
    } else {
      terminalMethod = 'toXml';
    }
    
    code += `\n  .${terminalMethod}();`;
    
    return code;
  }
  
  /**
   * Create transformer instances from transformer configurations
   * @param {Array} transforms - Array of transform objects
   * @returns {Array} Array of transformer instances
   * @private
   */
  _createTransformers(transforms) {
    return transforms.map(t => {
      const TransformerClass = transformerMap[t.type];
      if (!TransformerClass) {
        console.error(`Transformer class not found for type: ${t.type}`);
        return null;
      }
      return new TransformerClass(t.options);
    }).filter(Boolean); // Remove any null entries
  }
}

export default new XJXService();