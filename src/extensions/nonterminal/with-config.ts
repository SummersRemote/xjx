/**
 * Core extension that implements the withConfig method
 */
import { XJX } from "../../XJX";
import { Configuration, Config } from "../../core/config";
import { NonTerminalExtensionContext } from "../../core/extension";
import { Common } from "../../core/common";
import { logger, validate, ConfigurationError, ValidationError, handleError, ErrorType } from "../../core/error";

/**
 * Set configuration options
 * @param config Partial configuration to merge with defaults
 */
function withConfig(this: NonTerminalExtensionContext, config: Partial<Configuration>) {
  try {
    // Use the new createOrUpdate method with current config as base
    this.config = Config.createOrUpdate(config, this.config);
    return this;
  } catch (err) {
    // At API boundary, use handleError to ensure consistent error handling
    return handleError(err, "apply configuration", {
      data: { 
        configKeys: Object.keys(config || {}),
        configType: typeof config
      },
      errorType: ErrorType.CONFIGURATION,
      fallback: this // Return this as fallback for fluent API
    });
  }
}

// Register the extension
XJX.registerNonTerminalExtension("withConfig", withConfig);