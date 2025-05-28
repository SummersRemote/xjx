// services/codeGenerationService.js - Updated for non-terminal hoist
import LoggingService from "./loggingService.js";

/**
 * Service for generating code from operations
 */
class CodeGenerationService {
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
    LoggingService.debug('Generating fluent API code', { 
      fromType, 
      jsonFormat,
      stepsCount: steps?.length || 0
    });
    
    // Use the fluent API in the examples
    let code = `import { XJX, LogLevel, toBoolean, toNumber, regex, compose, TransformIntent } from 'xjx';\n\n`;
    code += `const xjx = new XJX();\n`;

    // Add log level if not default
    const currentLogLevel = LoggingService.getLogLevel();
    if (currentLogLevel && currentLogLevel !== "error") {
      code += `xjx.setLogLevel(LogLevel.${currentLogLevel.toUpperCase()});\n`;
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

    LoggingService.debug('Fluent API code generation completed');
    
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
      case 'filter':
        return this._generateFilterCode(step.options);
      case 'map':
        return this._generateMapCode(step.options);
      case 'reduce':
        return this._generateReduceCode(step.options);
      case 'select':
        return this._generateSelectCode(step.options);
      case 'slice':
        return this._generateSliceCode(step.options);
      case 'unwrap':
        return this._generateUnwrapCode();
      case 'hoist':
        return this._generateHoistCode(step.options);
      case 'transform':
        return this._generateTransformCode(step.options);
      default:
        LoggingService.warn(`Unknown step type for code generation: ${step.type}`);
        return null;
    }
  }

  /**
   * Generate code for filter operation
   * @param {Object} options - Filter options
   * @returns {string} Filter code
   * @private
   */
  _generateFilterCode(options) {
    const { predicate } = options || {};
    if (!predicate) return 'filter(() => true)';
    
    return `filter(${predicate})`;
  }

  /**
   * Generate code for map operation
   * @param {Object} options - Map options
   * @returns {string} Map code
   * @private
   */
  _generateMapCode(options) {
    const { transformer } = options || {};
    if (!transformer) return 'map(node => node)';
    
    return `map(${transformer})`;
  }

  /**
   * Generate code for reduce operation
   * @param {Object} options - Reduce options
   * @returns {string} Reduce code
   * @private
   */
  _generateReduceCode(options) {
    const { reducer, initialValue } = options || {};
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
    
    return `reduce(${reducer}, ${initialValueCode})`;
  }

  /**
   * Generate code for select operation
   * @param {Object} options - Select options
   * @returns {string} Select code
   * @private
   */
  _generateSelectCode(options) {
    const { predicate } = options || {};
    if (!predicate) return 'select(() => true)';
    
    return `select(${predicate})`;
  }

  /**
   * Generate code for slice operation
   * @param {Object} options - Slice options
   * @returns {string} Slice code
   * @private
   */
  _generateSliceCode(options) {
    const { start, end, step } = options || {};
    
    // Build the parameters
    let params = [];
    
    // Start parameter
    if (start !== undefined && start !== 0) {
      params.push(start);
    } else if (end !== undefined || step !== undefined && step !== 1) {
      // If start is default but end or step is specified, we need to include start
      params.push(0);
    }
    
    // End parameter
    if (end !== undefined) {
      params.push(end);
    } else if (step !== undefined && step !== 1) {
      // If end is default but step is specified, we need to include a placeholder for end
      params.push('undefined');
    }
    
    // Step parameter
    if (step !== undefined && step !== 1) {
      params.push(step);
    }
    
    // Generate the code
    return `slice(${params.join(', ')})`;
  }

  /**
   * Generate code for unwrap operation
   * @returns {string} Unwrap code
   * @private
   */
  _generateUnwrapCode() {
    return 'unwrap()';
  }

  /**
   * Generate code for hoist operation
   * @param {Object} options - Hoist options
   * @returns {string} Hoist code
   * @private
   */
  _generateHoistCode(options) {
    const { containerName } = options || {};
    
    // If containerName is provided and not the default, include it
    if (containerName && containerName !== 'values') {
      return `hoist("${containerName}")`;
    }
    
    // Otherwise use the default
    return 'hoist()';
  }

  /**
   * Generate code for transform operation
   * @param {Object} options - Transform options
   * @returns {string} Transform code
   * @private
   */
  _generateTransformCode(options) {
    const transformType = options?.type;
    const transformOptions = options?.options || {};
    
    if (!transformType) {
      return 'map(/* Unknown transform */)';
    }
    
    // For transforms, we now use map with compose to handle selective transforms
    switch (transformType) {
      case 'BooleanTransform':
        return `map(compose(
  node => {
    // Skip null/undefined
    if (!node) return null;
    
    // Apply based on options
    const applyToValues = ${transformOptions.values !== false};
    const applyToAttributes = ${transformOptions.attributes !== false};
    const isAttribute = node.parent && node.parent.attributes && Object.values(node.parent.attributes).includes(node);
    
    // Skip if conditions don't match
    if (isAttribute && !applyToAttributes) return null;
    if (!isAttribute && !applyToValues) return null;
    
    return node;
  },
  toBoolean(${JSON.stringify(transformOptions)})
))`;
      case 'NumberTransform':
        return `map(compose(
  node => {
    // Skip null/undefined
    if (!node) return null;
    
    // Apply based on options
    const applyToValues = ${transformOptions.values !== false};
    const applyToAttributes = ${transformOptions.attributes !== false};
    const isAttribute = node.parent && node.parent.attributes && Object.values(node.parent.attributes).includes(node);
    
    // Skip if conditions don't match
    if (isAttribute && !applyToAttributes) return null;
    if (!isAttribute && !applyToValues) return null;
    
    return node;
  },
  toNumber(${JSON.stringify(transformOptions)})
))`;
      case 'RegexTransform':
        if (transformOptions.pattern) {
          return `map(compose(
  node => {
    // Skip null/undefined
    if (!node) return null;
    
    // Apply based on options
    const applyToValues = ${transformOptions.values !== false};
    const applyToAttributes = ${transformOptions.attributes !== false};
    const isAttribute = node.parent && node.parent.attributes && Object.values(node.parent.attributes).includes(node);
    
    // Skip if conditions don't match
    if (isAttribute && !applyToAttributes) return null;
    if (!isAttribute && !applyToValues) return null;
    
    return node;
  },
  regex(${JSON.stringify(transformOptions.pattern)}, ${JSON.stringify(transformOptions.replacement || '')}, ${JSON.stringify({ ...transformOptions, pattern: undefined, replacement: undefined })})
))`;
        }
        return `map(regex("", "", ${JSON.stringify(transformOptions)}))`;
      default:
        return `map(/* ${transformType} */)`;
    }
  }
}

// Export as a singleton instance
export default new CodeGenerationService();