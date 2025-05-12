// services/XJXService.js
// Wrapper service for the XJX library
import { XJX, BooleanTransform, NumberTransform, RegexTransform } from '../../../dist/esm'; // Path to the XJX library

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
    return XJX.getConfig();
  }
  
  /**
   * Convert XML to JSON
   * @param {string} xml - XML string
   * @param {Object} config - Configuration object
   * @param {Array} transforms - Array of transform objects
   * @returns {Object} Resulting JSON
   */
  convertXmlToJson(xml, config, transforms) {
    let builder = XJX.fromXml(xml);
    
    // Apply config if provided
    if (config) {
      builder = builder.withConfig(config);
    }
    
    // Apply transforms if provided
    if (transforms && transforms.length > 0) {
      const transformInstances = transforms.map(t => {
        const TransformerClass = transformerMap[t.type];
        if (!TransformerClass) {
          console.error(`Transformer class not found for type: ${t.type}`);
          return null;
        }
        return new TransformerClass(t.options);
      }).filter(Boolean); // Remove any null entries
      
      if (transformInstances.length > 0) {
        builder = builder.withTransforms(...transformInstances);
      }
    }
    
    return builder.toJson();
  }
  
  /**
   * Convert JSON to XML
   * @param {Object} json - JSON object
   * @param {Object} config - Configuration object
   * @param {Array} transforms - Array of transform objects
   * @returns {string} Resulting XML
   */
  convertJsonToXml(json, config, transforms) {
    let builder = XJX.fromJson(json);
    
    // Apply config if provided
    if (config) {
      builder = builder.withConfig(config);
    }
    
    // Apply transforms if provided
    if (transforms && transforms.length > 0) {
      const transformInstances = transforms.map(t => {
        const TransformerClass = transformerMap[t.type];
        if (!TransformerClass) {
          console.error(`Transformer class not found for type: ${t.type}`);
          return null;
        }
        return new TransformerClass(t.options);
      }).filter(Boolean); // Remove any null entries
      
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
   * @returns {string} Fluent API code
   */
  generateFluentAPI(fromType, content, config, transforms) {
    let code = `XJX.from${fromType === 'xml' ? 'Xml' : 'Json'}(${fromType === 'xml' ? 'xml' : 'json'})`;
    
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
    
    code += `\n  .to${fromType === 'xml' ? 'Json' : 'Xml'}()`;
    
    return code;
  }
}

export default new XJXService();