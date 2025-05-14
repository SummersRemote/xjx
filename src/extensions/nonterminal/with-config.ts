/**
 * Core extension that implements the withConfig method
 */
import { XJX } from "../../XJX";
import { Configuration, Config } from "../../core/config";
import { NonTerminalExtensionContext } from "../../core/extension";
import { Common } from "../../core/common";
import { logger, validate, ConfigurationError, ValidationError } from "../../core/error";

/**
 * Set configuration options
 * @param config Partial configuration to merge with defaults
 */
function withConfig(this: NonTerminalExtensionContext, config: Partial<Configuration>) {
  try {
    // API boundary validation - validate parameters
    validate(config !== null && typeof config === 'object', "Configuration must be an object");
    
    // Skip if empty config object
    if (Object.keys(config).length === 0) {
      logger.debug('Empty configuration provided, skipping merge');
      return this;
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
    
    // Merge with current config
    try {
      this.config = Config.merge(this.config, config);
    } catch (mergeError) {
      throw new ConfigurationError("Failed to merge configuration", config);
    }
    
    logger.debug('Successfully applied configuration', {
      preserveNamespaces: this.config.preserveNamespaces,
      prettyPrint: this.config.outputOptions?.prettyPrint
    });
    
    return this;
  } catch (err) {
    // At API boundary, we handle different error types appropriately
    if (err instanceof ValidationError) {
      logger.error('Invalid configuration', err);
      throw err;
    } else if (err instanceof ConfigurationError) {
      logger.error('Configuration error', err);
      throw err;
    } else {
      const error = new ConfigurationError('Failed to apply configuration', config);
      logger.error('Failed to apply configuration', error);
      throw error;
    }
  }
}

// Register the extension
XJX.registerNonTerminalExtension("withConfig", withConfig);