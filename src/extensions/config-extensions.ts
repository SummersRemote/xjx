/**
 * Extension implementation for configuration methods
 */
import { XJX } from "../XJX";
import { Configuration, createConfig } from "../core/config";
import { logger, LogLevel, validate } from "../core/error";

/**
 * Implementation for setting configuration options
 */
export function implementWithConfig(xjx: XJX, config: Partial<Configuration>): void {
  try {
    // API boundary validation
    validate(config !== null && typeof config === 'object', "Configuration must be an object");
    
    // Skip if empty config object
    if (Object.keys(config).length === 0) {
      logger.debug('Empty configuration provided, skipping merge');
      return;
    }
    
    // Check if any preservation settings are being changed after initialization
    const PRESERVATION_SETTINGS = [
      "preserveNamespaces",
      "preserveComments", 
      "preserveProcessingInstr", 
      "preserveCDATA", 
      "preserveTextNodes",
      "preserveWhitespace", 
      "preserveAttributes"
    ];
    
    if (xjx.xnode !== null) {
      // Source has already been set, check for preservation setting changes
      const changedSettings = PRESERVATION_SETTINGS.filter(
        setting => config[setting as keyof Configuration] !== undefined && 
                   config[setting as keyof Configuration] !== xjx.config[setting as keyof Configuration]
      );
      
      if (changedSettings.length > 0) {
        throw new Error(
          `Cannot change preservation settings (${changedSettings.join(', ')}) after source is set. ` +
          `These settings must be configured in the XJX constructor or via withConfig() before setting a source.`
        );
      }
    }
    
    // Apply configuration using the config utility
    xjx.config = createConfig(config, xjx.config);
    
    logger.debug('Successfully applied configuration', {
      preserveNamespaces: xjx.config.preserveNamespaces,
      prettyPrint: xjx.config.converters.xml.options.prettyPrint
    });
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to apply configuration: ${String(err)}`);
  }
}

/**
 * Implementation for setting the log level
 */
export function implementSetLogLevel(xjx: XJX, level: LogLevel | string): void {
  try {
    // API boundary validation
    validate(level !== undefined && level !== null, "Log level must be provided");
    
    // Handle string input for level
    let logLevel: LogLevel;
    
    if (typeof level === 'string') {
      // Convert string to LogLevel enum
      const normalizedLevel = level.toLowerCase();
      
      switch (normalizedLevel) {
        case 'debug':
          logLevel = LogLevel.DEBUG;
          break;
        case 'info':
          logLevel = LogLevel.INFO;
          break;
        case 'warn':
          logLevel = LogLevel.WARN;
          break;
        case 'error':
          logLevel = LogLevel.ERROR;
          break;
        case 'none':
          logLevel = LogLevel.NONE;
          break;
        default:
          throw new Error(`Invalid log level: ${level}. Valid values are: debug, info, warn, error, none`);
      }
    } else {
      // Level is already a LogLevel enum value
      logLevel = level;
    }
    
    // Set log level in the logger
    logger.setLevel(logLevel);
    
    logger.info(`Log level set to ${logLevel}`);
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to set log level: ${String(err)}`);
  }
}

// Register the implementations with XJX
XJX.prototype.withConfig = function(config: Partial<Configuration>): XJX {
  implementWithConfig(this, config);
  return this;
};

XJX.prototype.setLogLevel = function(level: LogLevel | string): XJX {
  implementSetLogLevel(this, level);
  return this;
};