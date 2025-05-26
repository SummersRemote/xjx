// services/xjxService.js
// Wrapper service for the XJX library with webpack-compatibility
import {
  XJX,
  LogLevel,
  toBoolean,
  toNumber,
  regex,
  compose,
  TransformIntent,
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
        children: "$children",
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
   * @param {Array} steps - Pipeline steps
   * @param {string} jsonFormat - JSON format ('xjx' or 'standard')
   * @returns {string} Fluent API code
   */
  generateFluentAPI(fromType, content, config, steps, jsonFormat = "xjx") {
    // Use the fluent API in the examples
    let code = `import { XJX, LogLevel, toBoolean, toNumber, regex, compose, TransformIntent } from 'xjx';\n\n`;
    code += `const xjx = new XJX();\n`;

    // Add log level if not default
    if (this.globalXJX && this.globalXJX.logLevel && this.globalXJX.logLevel !== "error") {
      code += `xjx.setLogLevel(LogLevel.${(
        this.globalXJX.logLevel || "ERROR"
      ).toUpperCase()});\n`;
    }

    code += `const builder = xjx.from${fromType === "xml" ? "Xml" : "Json"}(${
      fromType === "xml" ? "xml" : "json"
    })`;

    if (config) {
      code += `\n  .withConfig(${JSON.stringify(config, null, 2)})`;
    }

    // Apply all pipeline steps
    if (steps && steps.length > 0) {
      steps.forEach(step => {
        const stepCode = this._generateStepCode(step);
        if (stepCode) {
          code += `\n  ${stepCode}`;
        }
      });
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
   * Generate code for a pipeline step
   * @param {Object} step - Pipeline step
   * @returns {string} Step code
   * @private
   */
  _generateStepCode(step) {
    switch (step.type) {
      case 'select':
        return this._generateSelectCode(step.options);
      case 'filter':
        return this._generateFilterCode(step.options);
      case 'map':
        return this._generateMapCode(step.options);
      case 'reduce':
        return this._generateReduceCode(step.options);
      case 'children':
        return this._generateChildrenCode(step.options);
      case 'descendants':
        return this._generateDescendantsCode(step.options);
      case 'root':
        return this._generateRootCode(step.options);
      case 'transform':
        // Use the existing transform code generator if it's a transform
        if (typeof this._generateTransformCode === 'function') {
          return this._generateTransformCode(step.options);
        } else {
          // Fallback if the original method doesn't exist
          return `transform(/* Options for ${step.options.type} */)`;
        }
      default:
        return null;
    }
  }

  /**
   * Generate code for select operation
   * @param {Object} options - Select options
   * @returns {string} Select code
   * @private
   */
  _generateSelectCode(options) {
    const { predicate, fragmentRoot } = options || {};
    if (!predicate) return 'select(() => true)';
    
    let code = `select(${predicate})`;
    
    if (fragmentRoot) {
      code = `select(${predicate}, "${fragmentRoot}")`;
    }
    
    return code;
  }

  /**
   * Generate code for filter operation
   * @param {Object} options - Filter options
   * @returns {string} Filter code
   * @private
   */
  _generateFilterCode(options) {
    const { predicate, fragmentRoot } = options || {};
    if (!predicate) return 'filter(() => true)';
    
    let code = `filter(${predicate})`;
    
    if (fragmentRoot) {
      code = `filter(${predicate}, "${fragmentRoot}")`;
    }
    
    return code;
  }

  /**
   * Generate code for map operation
   * @param {Object} options - Map options
   * @returns {string} Map code
   * @private
   */
  _generateMapCode(options) {
    const { mapper, fragmentRoot } = options || {};
    if (!mapper) return 'map(node => node)';
    
    let code = `map(${mapper})`;
    
    if (fragmentRoot) {
      code = `map(${mapper}, "${fragmentRoot}")`;
    }
    
    return code;
  }

  /**
   * Generate code for reduce operation
   * @param {Object} options - Reduce options
   * @returns {string} Reduce code
   * @private
   */
  _generateReduceCode(options) {
    const { reducer, initialValue, fragmentRoot } = options || {};
    if (!reducer) return 'reduce((acc, node) => acc + 1, 0)';
    
    let initialValueCode = initialValue || '0';
    // Try to determine if the initial value is a string, number, boolean, etc.
    if (initialValueCode === 'true' || initialValueCode === 'false') {
      // Boolean
      initialValueCode = initialValueCode === 'true';
    } else if (initialValueCode === '[]') {
      // Empty array
      initialValueCode = '[]';
    } else if (initialValueCode === '{}') {
      // Empty object
      initialValueCode = '{}';
    } else if (!isNaN(Number(initialValueCode))) {
      // Number
      initialValueCode = Number(initialValueCode);
    } else if (initialValueCode.startsWith('"') && initialValueCode.endsWith('"')) {
      // Already a string literal
      // initialValueCode = initialValueCode;
    } else if (initialValueCode.startsWith("'") && initialValueCode.endsWith("'")) {
      // Already a string literal
      // initialValueCode = initialValueCode;
    } else {
      // Assume it's a string that needs quotes
      initialValueCode = `"${initialValueCode}"`;
    }
    
    let code = `reduce(${reducer}, ${initialValueCode})`;
    
    if (fragmentRoot) {
      code = `reduce(${reducer}, ${initialValueCode}, "${fragmentRoot}")`;
    }
    
    return code;
  }

  /**
   * Generate code for children operation
   * @param {Object} options - Children options
   * @returns {string} Children code
   * @private
   */
  _generateChildrenCode(options) {
    const { predicate, fragmentRoot } = options || {};
    
    // If predicate is empty or just 'node => true'
    if (!predicate || predicate === 'node => true') {
      if (fragmentRoot) {
        return `children(undefined, "${fragmentRoot}")`;
      }
      return 'children()';
    }
    
    let code = `children(${predicate})`;
    
    if (fragmentRoot) {
      code = `children(${predicate}, "${fragmentRoot}")`;
    }
    
    return code;
  }

  /**
   * Generate code for descendants operation
   * @param {Object} options - Descendants options
   * @returns {string} Descendants code
   * @private
   */
  _generateDescendantsCode(options) {
    const { predicate, fragmentRoot } = options || {};
    
    // If predicate is empty or just 'node => true'
    if (!predicate || predicate === 'node => true') {
      if (fragmentRoot) {
        return `descendants(undefined, "${fragmentRoot}")`;
      }
      return 'descendants()';
    }
    
    let code = `descendants(${predicate})`;
    
    if (fragmentRoot) {
      code = `descendants(${predicate}, "${fragmentRoot}")`;
    }
    
    return code;
  }

  /**
   * Generate code for root operation
   * @param {Object} options - Root options
   * @returns {string} Root code
   * @private
   */
  _generateRootCode(options) {
    const { fragmentRoot } = options || {};
    
    if (fragmentRoot) {
      return `root("${fragmentRoot}")`;
    }
    
    return 'root()';
  }

  /**
   * Get default options for a specific transformer type
   * @param {string} type - Transformer type
   * @returns {Object} Default options
   */
  getDefaultOptions(type) {
    // Common transform options shared by all transform types
    const commonOptions = {
      values: true,
      attributes: true,
      intent: 'parse'
    };
    
    switch (type) {
      case 'BooleanTransform':
        return {
          ...commonOptions,
          // Parse mode options
          trueValues: ['true', 'yes', '1', 'on'],
          falseValues: ['false', 'no', '0', 'off'],
          ignoreCase: true,
          // Serialize mode options
          trueString: 'true',
          falseString: 'false'
        };
        
      case 'NumberTransform':
        return {
          ...commonOptions,
          // Parse mode options
          integers: true,
          decimals: true,
          scientific: true,
          decimalSeparator: '.',
          thousandsSeparator: ',',
          // Common options for both modes
          precision: undefined,
          // Serialize mode options
          format: undefined
        };
        
      case 'RegexTransform':
        return {
          ...commonOptions,
          pattern: '',
          replacement: '',
          attributeFilter: undefined
        };
        
      default:
        return commonOptions;
    }
  }
}

// Export as a singleton instance if that's how the original service is structured
export default new XJXService();