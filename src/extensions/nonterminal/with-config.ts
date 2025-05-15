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
      // Ensure config has required sections or can be merged properly
      if (config.propNames) {
        validate(typeof config.propNames === 'object', "propNames must be an object");
      }
      
      if (config.outputOptions) {
        validate(typeof config.outputOptions === 'object', "outputOptions must be an object");
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
      prettyPrint: this.config.outputOptions?.prettyPrint
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