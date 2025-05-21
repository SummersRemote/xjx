// services/XJXService.js
// Wrapper service for the XJX library with webpack-compatibility
import {
  XJX,
  LogLevel,
  BooleanTransform,
  NumberTransform,
  RegexTransform,
} from "../../../dist/esm/index.js";

// Create a map of transformer types to their constructors
const transformerMap = {
  BooleanTransform: BooleanTransform,
  NumberTransform: NumberTransform,
  RegexTransform: RegexTransform,
};

class XJXService {
  /**
   * Get default configuration
   * @returns {Object} Default configuration
   */
  getDefaultConfig() {
    // Create a default configuration that matches the updated structure
    return {
      // Preservation settings
      preserveNamespaces: true,
      preserveComments: true,
      preserveProcessingInstr: true,
      preserveCDATA: true,
      preserveTextNodes: true,
      preserveWhitespace: false,
      preserveAttributes: true,

      // High-level strategies
      highFidelity: false,
      attributeStrategy: "merge",
      textStrategy: "direct",
      namespaceStrategy: "prefix",
      arrayStrategy: "multiple",
      emptyElementStrategy: "object",
      mixedContentStrategy: "preserve",

      // Property names
      properties: {
        attribute: "$attr",
        value: "$val",
        text: "_text",
        namespace: "$ns",
        prefix: "$pre",
        cdata: "$cdata",
        comment: "$cmnt",
        processingInstr: "$pi",
        target: "$trgt",
        children: "$children",
        compact: true,
      },

      // Prefix configurations
      prefixes: {
        attribute: "@",
        namespace: "xmlns:",
        comment: "#",
        cdata: "!",
        pi: "?",
      },

      // Array configurations
      arrays: {
        forceArrays: [],
        defaultItemName: "item",
        itemNames: {},
      },

      // Output formatting
      formatting: {
        indent: 2,
        declaration: true,
        pretty: true,
      },
    };
  }

  /**
   * Get available transformers from the XJX library
   * @returns {Object} Available transformers
   */
  getAvailableTransformers() {
    return {
      BooleanTransform: "BooleanTransform",
      NumberTransform: "NumberTransform",
      RegexTransform: "RegexTransform",
    };
  }

  /**
   * Convert XML to JSON (using unified JSON converter)
   * @param {string} xml - XML string
   * @param {Object} config - Configuration object
   * @param {Array} transforms - Array of transform objects
   * @returns {Object} Resulting JSON
   */
  convertXmlToJson(xml, config, transforms) {
    // Create a new instance for each conversion
    const xjx = new XJX();

    let builder = xjx.setLogLevel(LogLevel.DEBUG);

    // Apply config if provided
    if (config) {
      builder = builder.withConfig(config);
    }

    // Start the conversion chain with fluent API
    builder = builder.fromXml(xml);

    // Apply transforms if provided
    if (transforms && transforms.length > 0) {
      const transformInstances = this._createTransformers(transforms);

      if (transformInstances.length > 0) {
        builder = builder.withTransforms(...transformInstances);
      }
    }

    // Use the new unified method with highFidelity: true
    return builder.toJson();
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

    let builder = xjx.setLogLevel(LogLevel.DEBUG);

    // Apply config if provided
    if (config) {
      builder = builder.withConfig(config);
    }

    // Start the conversion chain with the unified JSON method
    builder = builder.fromJson(json);

    // Apply transforms if provided
    if (transforms && transforms.length > 0) {
      const transformInstances = this._createTransformers(transforms);

      if (transformInstances.length > 0) {
        builder = builder.withTransforms(...transformInstances);
      }
    }

    // Convert to XML string
    return builder.toXmlString();
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
  generateFluentAPI(fromType, content, config, transforms, jsonFormat = "xjx") {
    // Use the fluent API in the examples
    let code = `import { XJX } from 'xjx';\n\n`;
    code += `const xjx = new XJX();\n`;
    code += `const builder = xjx.from${fromType === "xml" ? "Xml" : "Json"}(${
      fromType === "xml" ? "xml" : "json"
    })`;

    if (config) {
      code += `\n  .withConfig(${JSON.stringify(config, null, 2)})`;
    }

    if (transforms && transforms.length > 0) {
      const transformsStr = transforms
        .map((t) => {
          const type = t.type;
          const options = JSON.stringify(t.options);
          return `new ${type}(${options})`;
        })
        .join(",\n    ");

      code += `\n  .withTransforms(\n    ${transformsStr}\n  )`;
    }

    // Determine the appropriate terminal method based on direction and format
    let terminalMethod;
    let options = "";
    if (fromType === "xml") {
      // Using the unified JSON method with appropriate highFidelity setting
      terminalMethod = "toJson";
      if (jsonFormat === "standard") {
        // Standard format is the default (highFidelity: false)
        options = "";
      } else {
        // XJX format requires highFidelity: true
        options = "({ highFidelity: true })";
      }
    } else {
      // For XML output, use toXmlString
      terminalMethod = "toXmlString";
    }

    // Add the terminal method
    code += `\n  .${terminalMethod}${options ? options : "()"}`;
    code += ";";

    return code;
  }

  /**
   * Create transformer instances from transformer configurations
   * @param {Array} transforms - Array of transform objects
   * @returns {Array} Array of transformer instances
   * @private
   */
  _createTransformers(transforms) {
    return transforms
      .map((t) => {
        const TransformerClass = transformerMap[t.type];
        if (!TransformerClass) {
          console.error(`Transformer class not found for type: ${t.type}`);
          return null;
        }
        return new TransformerClass(t.options);
      })
      .filter(Boolean); // Remove any null entries
  }
}

export default new XJXService();
