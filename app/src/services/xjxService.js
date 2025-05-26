// services/xjxService.js
// Wrapper service for the XJX library with webpack-compatibility
import {
  XJX,
  LogLevel,
  toBoolean,
  toNumber,
  regex,
  compose,
  TransformIntent
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
    let code = `import { XJX, LogLevel, toBoolean, toNumber, regex, compose, TransformIntent } from 'xjx';\n\n`;
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
      // Extract common transform options
      const { values, attributes, intent, attributeFilter, pathFilter } = transform.options || {};
      
      // Create transform options object with defaults
      const transformOptions = {
        values: values !== undefined ? values : true,
        attributes: attributes !== undefined ? attributes : true
      };
      
      // Add intent if provided
      if (intent) {
        transformOptions.intent = intent === 'serialize' ? 
          TransformIntent.SERIALIZE : TransformIntent.PARSE;
      }
      
      switch (transform.type) {
        case 'BooleanTransform': {
          const options = { ...transform.options };
          
          // Handle specific boolean transform options
          return toBoolean({
            trueValues: options.trueValues,
            falseValues: options.falseValues,
            ignoreCase: options.ignoreCase,
            trueString: options.trueString,
            falseString: options.falseString,
            ...transformOptions
          });
        }
        
        case 'NumberTransform': {
          const options = { ...transform.options };
          
          // Handle specific number transform options
          return toNumber({
            precision: options.precision,
            integers: options.integers,
            decimals: options.decimals,
            scientific: options.scientific,
            decimalSeparator: options.decimalSeparator,
            thousandsSeparator: options.thousandsSeparator,
            format: options.format,
            ...transformOptions
          });
        }
        
        case 'RegexTransform': {
          const options = { ...transform.options };
          
          if (options.pattern) {
            const pattern = options.pattern;
            const replacement = options.replacement || '';
            
            // Extract transform options
            const regexOptions = {
              ...transformOptions
            };
            
            return regex(pattern, replacement, regexOptions);
          }
          return null;
        }
        
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
    // Extract common transform options
    const { values, attributes, intent, attributeFilter, pathFilter } = transform.options || {};
    
    // Create options object for code display
    const commonOptions = {};
    
    // Only add options that differ from defaults
    if (values === false) commonOptions.values = false;
    if (attributes === false) commonOptions.attributes = false;
    if (intent === 'serialize') commonOptions.intent = 'TransformIntent.SERIALIZE';
    if (attributeFilter) commonOptions.attributeFilter = attributeFilter;
    if (pathFilter) commonOptions.pathFilter = pathFilter;
    
    switch (transform.type) {
      case 'BooleanTransform': {
        const options = { ...transform.options };
        const booleanOptions = { ...commonOptions };
        
        // Add boolean-specific options if they exist and aren't default values
        if (options.trueValues && 
            !this._arraysEqual(options.trueValues, ['true', 'yes', '1', 'on'])) {
          booleanOptions.trueValues = options.trueValues;
        }
        
        if (options.falseValues && 
            !this._arraysEqual(options.falseValues, ['false', 'no', '0', 'off'])) {
          booleanOptions.falseValues = options.falseValues;
        }
        
        if (options.ignoreCase === false) {
          booleanOptions.ignoreCase = false;
        }
        
        if (options.trueString && options.trueString !== 'true') {
          booleanOptions.trueString = options.trueString;
        }
        
        if (options.falseString && options.falseString !== 'false') {
          booleanOptions.falseString = options.falseString;
        }
        
        // Generate code with options if needed
        const hasOptions = Object.keys(booleanOptions).length > 0;
        return hasOptions ? 
          `toBoolean(${this._formatOptions(booleanOptions)})` : 
          'toBoolean()';
      }
      
      case 'NumberTransform': {
        const options = { ...transform.options };
        const numberOptions = { ...commonOptions };
        
        // Add number-specific options if they exist and aren't default values
        if (options.precision !== undefined) {
          numberOptions.precision = options.precision;
        }
        
        if (options.integers === false) {
          numberOptions.integers = false;
        }
        
        if (options.decimals === false) {
          numberOptions.decimals = false;
        }
        
        if (options.scientific === false) {
          numberOptions.scientific = false;
        }
        
        if (options.decimalSeparator && options.decimalSeparator !== '.') {
          numberOptions.decimalSeparator = options.decimalSeparator;
        }
        
        if (options.thousandsSeparator && options.thousandsSeparator !== ',') {
          numberOptions.thousandsSeparator = options.thousandsSeparator;
        }
        
        if (options.format) {
          numberOptions.format = options.format;
        }
        
        // Generate code with options if needed
        const hasOptions = Object.keys(numberOptions).length > 0;
        return hasOptions ? 
          `toNumber(${this._formatOptions(numberOptions)})` : 
          'toNumber()';
      }
      
      case 'RegexTransform': {
        const options = { ...transform.options };
        
        if (options.pattern) {
          const pattern = options.pattern;
          const replacement = options.replacement || '';
          
          // Extract regex-specific options
          const regexOptions = { ...commonOptions };
          
          // Generate code with options if needed
          const hasOptions = Object.keys(regexOptions).length > 0;
          
          if (hasOptions) {
            return `regex(${JSON.stringify(pattern)}, ${JSON.stringify(replacement)}, ${this._formatOptions(regexOptions)})`;
          } else {
            return `regex(${JSON.stringify(pattern)}, ${JSON.stringify(replacement)})`;
          }
        }
        return 'regex(/.*/, "")';
      }
      
      default:
        return '/* Unsupported transform */';
    }
  }
  
  /**
   * Format options object for code display, handling TransformIntent enum
   * @param {Object} options - Options object
   * @returns {string} Formatted options string
   * @private
   */
  _formatOptions(options) {
    return JSON.stringify(options, (key, value) => {
      // Handle TransformIntent enum
      if (key === 'intent' && value === 'TransformIntent.SERIALIZE') {
        return undefined; // Remove from JSON to handle specially
      }
      return value;
    }, 2).replace(
      // Replace "intent": "TransformIntent.SERIALIZE" with intent: TransformIntent.SERIALIZE
      /"intent": "TransformIntent\.SERIALIZE"/g,
      'intent: TransformIntent.SERIALIZE'
    );
  }
  
  /**
   * Compare two arrays for equality
   * @param {Array} arr1 - First array
   * @param {Array} arr2 - Second array
   * @returns {boolean} True if arrays are equal
   * @private
   */
  _arraysEqual(arr1, arr2) {
    if (!Array.isArray(arr1) || !Array.isArray(arr2)) return false;
    if (arr1.length !== arr2.length) return false;
    
    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) return false;
    }
    
    return true;
  }
}

export default new XJXService();