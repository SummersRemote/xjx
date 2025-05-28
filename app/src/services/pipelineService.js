// services/pipelineService.js - Updated for non-terminal hoist
import { 
  toBoolean,
  toNumber,
  regex,
  compose
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
        case 'filter':
          return this._applyFilterStep(currentBuilder, step.options);
        case 'map':
          return this._applyMapStep(currentBuilder, step.options);
        case 'reduce':
          // Note: reduce is a terminal operation and should be last
          return this._applyReduceStep(currentBuilder, step.options);
        case 'select':
          return this._applySelectStep(currentBuilder, step.options);
        case 'slice':
          return this._applySliceStep(currentBuilder, step.options);
        case 'unwrap':
          return this._applyUnwrapStep(currentBuilder);
        case 'hoist':
          return this._applyHoistStep(currentBuilder, step.options);
        case 'transform':
          return this._applyTransformStep(currentBuilder, step.options);
        default:
          LoggingService.warn(`Unknown pipeline step type: ${step.type}`);
          return currentBuilder;
      }
    }, builder);
  }

  /**
   * Apply filter step
   * @param {XJX} builder - XJX builder
   * @param {Object} options - Step options
   * @returns {XJX} Updated builder
   * @private
   */
  _applyFilterStep(builder, options) {
    const { predicate } = options || {};
    if (!predicate) return builder;

    try {
      // Create predicate function from string
      const predicateFunc = TransformerService.createFunction(predicate);

      // Apply filter operation
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
    const { transformer } = options || {};
    if (!transformer) return builder;

    try {
      // Create transformer function from string
      const transformerFunc = TransformerService.createFunction(transformer);

      // Apply map operation
      return builder.map(transformerFunc);
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
    const { reducer, initialValue } = options || {};
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

      // Apply reduce operation (terminal operation)
      return builder.reduce(reducerFunc, parsedInitialValue);
    } catch (err) {
      LoggingService.error('Error applying reduce step:', err);
      return builder;
    }
  }

  /**
   * Apply select step
   * @param {XJX} builder - XJX builder
   * @param {Object} options - Step options
   * @returns {XJX} Updated builder
   * @private
   */
  _applySelectStep(builder, options) {
    const { predicate } = options || {};
    if (!predicate) return builder;

    try {
      // Create predicate function from string
      const predicateFunc = TransformerService.createFunction(predicate);

      // Apply select operation
      return builder.select(predicateFunc);
    } catch (err) {
      LoggingService.error('Error applying select step:', err);
      return builder;
    }
  }

  /**
   * Apply slice step
   * @param {XJX} builder - XJX builder
   * @param {Object} options - Step options
   * @returns {XJX} Updated builder
   * @private
   */
  _applySliceStep(builder, options) {
    const { start, end, step } = options || {};
    
    try {
      // Use the slice function to select nodes by position
      return builder.slice(start, end, step);
    } catch (err) {
      LoggingService.error('Error applying slice step:', err);
      return builder;
    }
  }

  /**
   * Apply unwrap step
   * @param {XJX} builder - XJX builder
   * @returns {XJX} Updated builder
   * @private
   */
  _applyUnwrapStep(builder) {
    try {
      // Use the unwrap function to remove the container
      return builder.unwrap();
    } catch (err) {
      LoggingService.error('Error applying unwrap step:', err);
      return builder;
    }
  }

  /**
   * Apply hoist step
   * @param {XJX} builder - XJX builder
   * @param {Object} options - Step options
   * @returns {XJX} Updated builder
   * @private
   */
  _applyHoistStep(builder, options) {
    try {
      // Get container name from options
      const { containerName } = options || {};
      
      // Use the hoist function (now non-terminal)
      return builder.hoist(containerName);
    } catch (err) {
      LoggingService.error('Error applying hoist step:', err);
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

      // Use map with a selective transform using compose
      return builder.map(compose(
        // Filter by attributes if specified
        node => {
          // Skip null/undefined
          if (!node) return null;
          
          // Apply to values if specified
          const applyToValues = transformOptions.values !== false;
          
          // Apply to attributes if specified
          const applyToAttributes = transformOptions.attributes !== false;
          
          // Context info for attribute transforms
          const isAttribute = node.parent && 
                            node.parent.attributes && 
                            Object.values(node.parent.attributes).includes(node);
          
          // Skip if this is an attribute and we're not transforming attributes
          if (isAttribute && !applyToAttributes) return null;
          
          // Skip if this is a value and we're not transforming values
          if (!isAttribute && !applyToValues) return null;
          
          return node;
        },
        // Apply the actual transform
        transformFunction
      ));
    } catch (err) {
      LoggingService.error('Error applying transform step:', err);
      return builder;
    }
  }
}

// Export as a singleton instance
export default new PipelineService();