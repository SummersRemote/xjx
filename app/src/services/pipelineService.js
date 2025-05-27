// services/pipelineService.js
import { 
  toBoolean,
  toNumber,
  regex
 } from "../../../dist/esm/index.js";
import LoggingService from "./loggingService.js";
import TransformerService from "./transformerService.js";

/**
 * Service for managing pipeline operations
 */
class PipelineService {
  /**
   * Apply a series of pipeline steps to the XJX builder
   * @param {XJX} builder - XJX builder instance
   * @param {Array} steps - Pipeline steps
   * @returns {XJX} Updated builder with steps applied
   */
  applyPipelineSteps(builder, steps) {
    if (!steps || steps.length === 0) return builder;

    LoggingService.debug(`Applying ${steps.length} pipeline steps`);

    // Process each step in order
    return steps.reduce((currentBuilder, step) => {
      switch (step.type) {
        case 'select':
          return this._applySelectStep(currentBuilder, step.options);
        case 'filter':
          return this._applyFilterStep(currentBuilder, step.options);
        case 'map':
          return this._applyMapStep(currentBuilder, step.options);
        case 'reduce':
          // Note: reduce is a terminal operation and should be last
          return this._applyReduceStep(currentBuilder, step.options);
        case 'get':
          return this._applyGetStep(currentBuilder, step.options);
        case 'transform':
          return this._applyTransformStep(currentBuilder, step.options);
        default:
          LoggingService.warn(`Unknown pipeline step type: ${step.type}`);
          return currentBuilder;
      }
    }, builder);
  }

  /**
   * Apply select step
   * @param {XJX} builder - XJX builder
   * @param {Object} options - Step options
   * @returns {XJX} Updated builder
   * @private
   */
  _applySelectStep(builder, options) {
    const { predicate, fragmentRoot } = options || {};
    if (!predicate) return builder;

    try {
      // Create predicate function from string
      const predicateFunc = TransformerService.createFunction(predicate);

      // Apply with or without fragmentRoot
      if (fragmentRoot) {
        return builder.select(predicateFunc, fragmentRoot);
      }
      return builder.select(predicateFunc);
    } catch (err) {
      LoggingService.error('Error applying select step:', err);
      return builder;
    }
  }

  /**
   * Apply filter step
   * @param {XJX} builder - XJX builder
   * @param {Object} options - Step options
   * @returns {XJX} Updated builder
   * @private
   */
  _applyFilterStep(builder, options) {
    const { predicate, fragmentRoot } = options || {};
    if (!predicate) return builder;

    try {
      // Create predicate function from string
      const predicateFunc = TransformerService.createFunction(predicate);

      // Apply with or without fragmentRoot
      if (fragmentRoot) {
        return builder.filter(predicateFunc, fragmentRoot);
      }
      return builder.filter(predicateFunc);
    } catch (err) {
      LoggingService.error('Error applying filter step:', err);
      return builder;
    }
  }

  /**
   * Apply map step
   * @param {XJX} builder - XJX builder
   * @param {Object} options - Step options
   * @returns {XJX} Updated builder
   * @private
   */
  _applyMapStep(builder, options) {
    const { mapper, fragmentRoot } = options || {};
    if (!mapper) return builder;

    try {
      // Create mapper function from string
      const mapperFunc = TransformerService.createFunction(mapper);

      // Apply with or without fragmentRoot
      if (fragmentRoot) {
        return builder.map(mapperFunc, fragmentRoot);
      }
      return builder.map(mapperFunc);
    } catch (err) {
      LoggingService.error('Error applying map step:', err);
      return builder;
    }
  }

  /**
   * Apply reduce step
   * @param {XJX} builder - XJX builder
   * @param {Object} options - Step options
   * @returns {XJX} Updated builder
   * @private
   */
  _applyReduceStep(builder, options) {
    const { reducer, initialValue, fragmentRoot } = options || {};
    if (!reducer) return builder;

    try {
      // Create reducer function from string
      const reducerFunc = TransformerService.createFunction(reducer);

      // Parse initial value (could be string, number, boolean, array, object)
      let parsedInitialValue;
      try {
        parsedInitialValue = JSON.parse(initialValue);
      } catch (e) {
        // If not valid JSON, use as is (string)
        parsedInitialValue = initialValue;
      }

      // Apply with or without fragmentRoot
      if (fragmentRoot) {
        return builder.reduce(reducerFunc, parsedInitialValue, fragmentRoot);
      }
      return builder.reduce(reducerFunc, parsedInitialValue);
    } catch (err) {
      LoggingService.error('Error applying reduce step:', err);
      return builder;
    }
  }

  /**
   * Apply get step
   * @param {XJX} builder - XJX builder
   * @param {Object} options - Step options
   * @returns {XJX} Updated builder
   * @private
   */
  _applyGetStep(builder, options) {
    const { index, unwrap } = options || {};
    
    try {
      // Use the get function to select a node by index
      return builder.get(index !== undefined ? index : 0, unwrap !== undefined ? unwrap : true);
    } catch (err) {
      LoggingService.error('Error applying get step:', err);
      return builder;
    }
  }

  /**
   * Apply transform step
   * @param {XJX} builder - XJX builder
   * @param {Object} options - Step options
   * @returns {XJX} Updated builder
   * @private
   */
  _applyTransformStep(builder, options) {
    try {
      const transformType = options.type;
      const transformOptions = options.options || {};

      let transformFunction;
      switch (transformType) {
        case 'BooleanTransform':
          transformFunction = toBoolean(transformOptions);
          break;
        case 'NumberTransform':
          transformFunction = toNumber(transformOptions);
          break;
        case 'RegexTransform':
          transformFunction = regex(transformOptions.pattern, transformOptions.replacement, transformOptions);
          break;
        default:
          LoggingService.warn(`Unknown transform type: ${transformType}`);
          return builder;
      }

      return builder.transform(transformFunction);
    } catch (err) {
      LoggingService.error('Error applying transform step:', err);
      return builder;
    }
  }
}

// Export as a singleton instance
export default new PipelineService();