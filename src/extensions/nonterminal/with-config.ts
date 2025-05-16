/**
 * Core extension that implements the withConfig method
 */
import { XJX } from "../../XJX";
import { Configuration, Config } from "../../core/config";
import { logger, validate, ConfigurationError, handleError, ErrorType } from "../../core/error";

// Type augmentation - add method to XJX interface
declare module '../../XJX' {
  interface XJX {
    /**
     * Set configuration options
     * @param config Partial configuration to merge with defaults
     * @returns This instance for chaining
     */
    withConfig(config: Partial<Configuration>): XJX;
  }
}

/**
 * Set configuration options
 * @param config Partial configuration to merge with defaults
 */
function withConfig(this: XJX, config: Partial<Configuration>): void {
  try {
    // API boundary validation
    validate(config !== null && typeof config === 'object', "Configuration must be an object");
    
    // Skip if empty config object
    if (Object.keys(config).length === 0) {
      logger.debug('Empty configuration provided, skipping merge');
      return;
    }
    
    // Validate configuration structure
    try {
      // Check core properties if provided
      const coreProps = [
        "preserveNamespaces", "preserveComments", "preserveProcessingInstr", 
        "preserveCDATA", "preserveTextNodes", "preserveWhitespace", "preserveAttributes"
      ];
      
      coreProps.forEach(prop => {
        if (prop in config && typeof config[prop as keyof Configuration] !== 'boolean') {
          throw new ConfigurationError(`${prop} must be a boolean`, config);
        }
      });
      
      // Check converters section structure if provided
      if ('converters' in config) {
        validate(
          typeof config.converters === 'object', 
          "converters must be an object"
        );
        
        // Validate stdJson section
        if (config.converters?.stdJson) {
          validate(
            typeof config.converters.stdJson === 'object',
            "converters.stdJson must be an object"
          );
          
          // Validate options subsection
          if (config.converters.stdJson.options) {
            validate(
              typeof config.converters.stdJson.options === 'object',
              "converters.stdJson.options must be an object"
            );
          }
          
          // Validate naming subsection
          if (config.converters.stdJson.naming) {
            validate(
              typeof config.converters.stdJson.naming === 'object',
              "converters.stdJson.naming must be an object"
            );
          }
        }
        
        // Validate xjxJson section
        if (config.converters?.xjxJson) {
          validate(
            typeof config.converters.xjxJson === 'object',
            "converters.xjxJson must be an object"
          );
          
          // Validate options subsection
          if (config.converters.xjxJson.options) {
            validate(
              typeof config.converters.xjxJson.options === 'object',
              "converters.xjxJson.options must be an object"
            );
          }
          
          // Validate naming subsection
          if (config.converters.xjxJson.naming) {
            validate(
              typeof config.converters.xjxJson.naming === 'object',
              "converters.xjxJson.naming must be an object"
            );
          }
        }
        
        // Validate xml section
        if (config.converters?.xml) {
          validate(
            typeof config.converters.xml === 'object',
            "converters.xml must be an object"
          );
          
          // Validate options subsection
          if (config.converters.xml.options) {
            validate(
              typeof config.converters.xml.options === 'object',
              "converters.xml.options must be an object"
            );
          }
        }
      }
    } catch (validationErr) {
      throw new ConfigurationError("Invalid configuration structure", config);
    }
    
    logger.debug('Merging configuration', {
      configKeys: Object.keys(config)
    });
    
    // Merge with current config using the updated Config utilities
    try {
      this.config = Config.createOrUpdate(config, this.config);
    } catch (mergeError) {
      throw new ConfigurationError("Failed to merge configuration", config);
    }
    
    logger.debug('Successfully applied configuration', {
      preserveNamespaces: this.config.preserveNamespaces,
      prettyPrint: this.config.converters.xml.options.prettyPrint
    });
  } catch (err) {
    handleError(err, "apply configuration", {
      data: { 
        configKeys: Object.keys(config || {})
      },
      errorType: ErrorType.CONFIGURATION
    });
  }
}

// Register the extension
XJX.registerNonTerminalExtension("withConfig", withConfig);