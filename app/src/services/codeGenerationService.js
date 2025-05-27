// services/CodeGenerationService.js
import LoggingService from "./loggingService.js";
import { toBoolean, toNumber, regex } from "../../../dist/esm/index.js";

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
        return this._generateTransformCode(step.options);
      default:
        LoggingService.warn(`Unknown step type for code generation: ${step.type}`);
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
   * Generate code for transform operation
   * @param {Object} options - Transform options
   * @returns {string} Transform code
   * @private
   */
  _generateTransformCode(options) {
    const transformType = options?.type;
    const transformOptions = options?.options || {};
    
    if (!transformType) {
      return 'transform(/* Unknown transform */)';
    }
    
    switch (transformType) {
      case 'BooleanTransform':
        return `transform(toBoolean(${JSON.stringify(transformOptions)}))`;
      case 'NumberTransform':
        return `transform(toNumber(${JSON.stringify(transformOptions)}))`;
      case 'RegexTransform':
        if (transformOptions.pattern) {
          return `transform(regex(${JSON.stringify(transformOptions.pattern)}, ${JSON.stringify(transformOptions.replacement || '')}, ${JSON.stringify({ ...transformOptions, pattern: undefined, replacement: undefined })}))`;
        }
        return `transform(regex("", "", ${JSON.stringify(transformOptions)}))`;
      default:
        return `transform(/* ${transformType} */)`;
    }
  }
}

// Export as a singleton instance
export default new CodeGenerationService();