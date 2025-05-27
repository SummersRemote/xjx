// services/XJXService.js
import { XJX } from "../../../dist/esm/index.js";
import ConfigService from "./configService.js";
import LoggingService from "./loggingService.js";
import TransformerService from "./transformerService.js";
import PipelineService from "./pipelineService.js";
import ConversionService from "./conversionService.js";
import CodeGenerationService from "./codeGenerationService.js";

/**
 * Main XJX Service that composes all other services
 * This is the main entry point for the application to interact with the XJX library
 */
class XJXService {
  constructor() {
    // Reference to all other services for easy access
    this.configService = ConfigService;
    this.loggingService = LoggingService;
    this.transformerService = TransformerService;
    this.pipelineService = PipelineService;
    this.conversionService = ConversionService;
    this.codeGenerationService = CodeGenerationService;
  }

  /**
   * Get default configuration
   * @returns {Object} Default configuration
   */
  getDefaultConfig() {
    return this.configService.getDefaultConfig();
  }

  /**
   * Get available transformers from the XJX library
   * @returns {Object} Available transformers
   */
  getAvailableTransformers() {
    return this.configService.getAvailableTransformers();
  }

  /**
   * Get default options for a transform type
   * @param {string} type - Transform type
   * @returns {Object} Default options
   */
  getDefaultOptions(type) {
    return this.configService.getDefaultOptions(type);
  }

  /**
   * Set the log level for the XJX library
   * @param {string} level - Log level ('debug', 'info', 'warn', 'error', 'none')
   */
  setLogLevel(level) {
    this.loggingService.setLogLevel(level);
  }

  /**
   * Create a function from a string
   * @param {string} functionString - Function string
   * @returns {Function} Created function
   */
  createFunction(functionString) {
    return this.transformerService.createFunction(functionString);
  }

  /**
   * Apply a series of pipeline steps to the XJX builder
   * @param {XJX} builder - XJX builder instance
   * @param {Array} steps - Pipeline steps
   * @returns {XJX} Updated builder with steps applied
   */
  applyPipelineSteps(builder, steps) {
    return this.pipelineService.applyPipelineSteps(builder, steps);
  }

  /**
   * Convert XML to JSON
   * @param {string} xml - XML string
   * @param {Object} config - Configuration object
   * @param {Array} transforms - Array of transform objects (from transformStore)
   * @param {Array} pipelineSteps - Array of pipeline steps (from pipelineStore)
   * @returns {Object} Resulting JSON
   */
  convertXmlToJson(xml, config, transforms, pipelineSteps = []) {
    return this.conversionService.convertXmlToJson(xml, config, transforms, pipelineSteps);
  }

  /**
   * Convert JSON to XML
   * @param {Object} json - JSON object
   * @param {Object} config - Configuration object
   * @param {Array} transforms - Array of transform objects (from transformStore)
   * @param {Array} pipelineSteps - Array of pipeline steps (from pipelineStore)
   * @returns {string} Resulting XML
   */
  convertJsonToXml(json, config, transforms, pipelineSteps = []) {
    return this.conversionService.convertJsonToXml(json, config, transforms, pipelineSteps);
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
    return this.codeGenerationService.generateFluentAPI(fromType, content, config, steps, jsonFormat);
  }
}

// Export as a singleton instance
export default new XJXService();