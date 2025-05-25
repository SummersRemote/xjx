// services/xjxService.js
// Wrapper service for the XJX library with webpack-compatibility
import {
  XJX,
  LogLevel,
  toBoolean,
  toNumber,
  regex,
  compose,
} from "../../../dist/esm/index.js";

// Create a singleton XJX instance for log level management
const globalXJX = new XJX();

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
      preservePrefixedNames: false,

      // High-level strategies - now grouped under strategies property
      strategies: {
        highFidelity: false,
        attributeStrategy: "merge",
        textStrategy: "direct",
        namespaceStrategy: "prefix",
        arrayStrategy: "multiple",
        emptyElementStrategy: "object",
        mixedContentStrategy: "preserve",
      },

      // Property names - using single 'value' property
      properties: {
        attribute: "$attr",
        value: "$val",
        namespace: "$ns",
        prefix: "$pre",
        cdata: "$cdata",
        comment: "$cmnt",
        processingInstr: "$pi",
        target: "$trgt",
        children: "$children"
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

      // Fragment root name for functional operations
      fragmentRoot: "results",
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
   * Set the log level for the XJX library
   * @param {string} level - Log level ('debug', 'info', 'warn', 'error', 'none')
   */
  setLogLevel(level) {
    // Map string levels to LogLevel enum values
    const logLevelMap = {
      debug: LogLevel.DEBUG,
      info: LogLevel.INFO,
      warn: LogLevel.WARN,
      error: LogLevel.ERROR,
      none: LogLevel.NONE,
    };

    // Set log level in the global instance
    globalXJX.setLogLevel(logLevelMap[level] || LogLevel.ERROR);

    console.log(`XJX log level set to: ${level}`);
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

    let builder = xjx;

    // Apply config if provided
    if (config) {
      builder = builder.withConfig(config);
    }

    // Start the conversion chain with fluent API
    builder = builder.fromXml(xml);

    // Apply transforms if provided
    if (transforms && transforms.length > 0) {
      const transformFunctions = this._createTransformers(transforms);

      if (transformFunctions.length > 0) {
        // Use compose to combine all transforms into a single function
        const combinedTransform = compose(...transformFunctions);
        // Apply the combined transform
        builder = builder.transform(combinedTransform);
      }
    }

    // Convert to JSON with the high-fidelity setting from config.strategies
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

    let builder = xjx;

    // Apply config if provided
    if (config) {
      builder = builder.withConfig(config);
    }

    // Start the conversion chain with the unified JSON method
    builder = builder.fromJson(json);

    // Apply transforms if provided
    if (transforms && transforms.length > 0) {
      const transformFunctions = this._createTransformers(transforms);

      if (transformFunctions.length > 0) {
        // Use compose to combine all transforms into a single function
        const combinedTransform = compose(...transformFunctions);
        // Apply the combined transform
        builder = builder.transform(combinedTransform);
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
    let code = `import { XJX, LogLevel, toBoolean, toNumber, regex, compose } from 'xjx';\n\n`;
    code += `const xjx = new XJX();\n`;

    // Add log level if not default
    if (globalXJX.logLevel && globalXJX.logLevel !== "error") {
      code += `xjx.setLogLevel(LogLevel.${(
        globalXJX.logLevel || "ERROR"
      ).toUpperCase()});\n`;
    }

    code += `const builder = xjx.from${fromType === "xml" ? "Xml" : "Json"}(${
      fromType === "xml" ? "xml" : "json"
    })`;

    if (config) {
      code += `\n  .withConfig(${JSON.stringify(config, null, 2)})`;
    }

    if (transforms && transforms.length > 0) {
      const transformsStr = transforms
        .map((t) => {
          return this._generateTransformCode(t);
        })
        .join(",\n    ");

      code += `\n  .transform(compose(\n    ${transformsStr}\n  ))`;
    }

    // Determine the appropriate terminal method based on direction and format
    let terminalMethod;
    let options = "";
    if (fromType === "xml") {
      terminalMethod = "toJson";
      options = "()";
    } else {
      // For XML output, use toXmlString
      terminalMethod = "toXmlString";
      options = "()";
    }

    // Add the terminal method
    code += `\n  .${terminalMethod}${options}`;
    code += ";";

    return code;
  }

  /**
   * Create transformer functions from transformer configurations
   * @param {Array} transforms - Array of transform objects
   * @returns {Array} Array of transformer functions
   * @private
   */
  _createTransformers(transforms) {
    return transforms
      .map((t) => {
        return this._createTransformerFunction(t);
      })
      .filter(Boolean); // Remove any null entries
  }

  /**
   * Create a transformer function from transform configuration
   * @param {Object} transform - Transform object with type and options
   * @returns {Function} Transform function
   * @private
   */
  _createTransformerFunction(transform) {
    try {
      switch (transform.type) {
        case 'BooleanTransform':
          return toBoolean(transform.options);
        case 'NumberTransform':
          return toNumber(transform.options);
        case 'RegexTransform':
          if (transform.options && transform.options.pattern) {
            const pattern = transform.options.pattern;
            const replacement = transform.options.replacement || '';
            const options = { ...transform.options };
            delete options.pattern;
            delete options.replacement;
            
            return regex(pattern, replacement, options);
          }
          return null;
        default:
          console.error(`Unsupported transformer type: ${transform.type}`);
          return null;
      }
    } catch (err) {
      console.error(`Error creating transformer: ${err.message}`);
      return null;
    }
  }

  /**
   * Generate transform code for API display
   * @param {Object} transform - Transform object
   * @returns {string} Transform code
   * @private
   */
  _generateTransformCode(transform) {
    switch (transform.type) {
      case 'BooleanTransform':
        return `toBoolean(${JSON.stringify(transform.options)})`;
      case 'NumberTransform':
        return `toNumber(${JSON.stringify(transform.options)})`;
      case 'RegexTransform':
        if (transform.options && transform.options.pattern) {
          const pattern = transform.options.pattern;
          const replacement = transform.options.replacement || '';
          const otherOptions = { ...transform.options };
          delete otherOptions.pattern;
          delete otherOptions.replacement;
          
          return `regex(${JSON.stringify(pattern)}, ${JSON.stringify(replacement)}${
            Object.keys(otherOptions).length > 0 ? `, ${JSON.stringify(otherOptions)}` : ''
          })`;
        }
        return 'regex(/.*/, "")';
      default:
        return '/* Unsupported transform */';
    }
  }
}

export default new XJXService();