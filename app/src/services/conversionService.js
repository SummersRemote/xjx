// services/ConversionService.js
import { XJX } from "../../../dist/esm/index.js";
import LoggingService from "./loggingService.js";
import TransformerService from "./transformerService.js";
import PipelineService from "./pipelineService.js";

/**
 * Service for handling conversions between XML and JSON
 */
class ConversionService {
  /**
   * Convert XML to JSON
   * @param {string} xml - XML string
   * @param {Object} config - Configuration object
   * @param {Array} transforms - Array of transform objects (from transformStore)
   * @param {Array} pipelineSteps - Array of pipeline steps (from pipelineStore)
   * @returns {Object} Resulting JSON
   */
  convertXmlToJson(xml, config, transforms, pipelineSteps = []) {
    LoggingService.debug('Starting XML to JSON conversion');
    
    // Create a new instance for each conversion
    const xjx = new XJX();

    let builder = xjx;

    // Apply config if provided
    if (config) {
      builder = builder.withConfig(config);
    }

    // Start the conversion chain with fluent API
    builder = builder.fromXml(xml);

    // Apply pipeline steps if provided
    if (pipelineSteps && pipelineSteps.length > 0) {
      builder = PipelineService.applyPipelineSteps(builder, pipelineSteps);
    }

    // Apply transforms if provided (legacy support)
    if (transforms && transforms.length > 0) {
      const transformFunctions = TransformerService.createTransformers(transforms);

      if (transformFunctions.length > 0) {
        // Combine all transforms into a single function
        const combinedTransform = TransformerService.combineTransformers(transformFunctions);
        
        // Apply the combined transform
        if (combinedTransform) {
          builder = builder.transform(combinedTransform);
        }
      }
    }

    // Convert to JSON with the high-fidelity setting from config.strategies
    const result = builder.toJson();
    
    LoggingService.debug('XML to JSON conversion completed successfully');
    
    return result;
  }

  /**
   * Convert JSON to XML
   * Auto-detects whether input is XJX JSON or standard JSON
   * @param {Object} json - JSON object
   * @param {Object} config - Configuration object
   * @param {Array} transforms - Array of transform objects (from transformStore)
   * @param {Array} pipelineSteps - Array of pipeline steps (from pipelineStore)
   * @returns {string} Resulting XML
   */
  convertJsonToXml(json, config, transforms, pipelineSteps = []) {
    LoggingService.debug('Starting JSON to XML conversion');
    
    // Create a new instance for each conversion
    const xjx = new XJX();

    let builder = xjx;

    // Apply config if provided
    if (config) {
      builder = builder.withConfig(config);
    }

    // Start the conversion chain with the unified JSON method
    builder = builder.fromJson(json);

    // Apply pipeline steps if provided
    if (pipelineSteps && pipelineSteps.length > 0) {
      builder = PipelineService.applyPipelineSteps(builder, pipelineSteps);
    }

    // Apply transforms if provided (legacy support)
    if (transforms && transforms.length > 0) {
      const transformFunctions = TransformerService.createTransformers(transforms);

      if (transformFunctions.length > 0) {
        // Combine all transforms into a single function
        const combinedTransform = TransformerService.combineTransformers(transformFunctions);
        
        // Apply the combined transform
        if (combinedTransform) {
          builder = builder.transform(combinedTransform);
        }
      }
    }

    // Convert to XML string
    const result = builder.toXmlString();
    
    LoggingService.debug('JSON to XML conversion completed successfully');
    
    return result;
  }
}

// Export as a singleton instance
export default new ConversionService();