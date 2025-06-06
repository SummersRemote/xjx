/**
 * Configuration extensions - Direct configuration property access
 * ConfigurationHelper removed for simplicity and consistency
 */
import { LoggerFactory, LogLevel } from "../core/logger";
const logger = LoggerFactory.create();

import { XJX } from "../XJX";
import { Configuration } from "../core/config";
import { NonTerminalExtensionContext } from "../core/extension";

/**
 * Implementation for setting configuration options
 * Direct configuration property access instead of ConfigurationHelper
 */
export function withConfig(this: NonTerminalExtensionContext, config: Partial<Configuration>): void {
  try {
    // API boundary validation using pipeline context
    this.pipeline.validateInput(config !== null && typeof config === 'object', "Configuration must be an object");
    
    // Skip if empty config object
    if (Object.keys(config).length === 0) {
      logger.debug('Empty configuration provided, skipping merge');
      return;
    }
    
    // Direct configuration property access instead of helper methods
    const PRESERVATION_SETTINGS = [
      "preserveComments", 
      "preserveInstructions", 
      "preserveWhitespace",
      "xml.preserveNamespaces",
      "xml.preserveCDATA", 
      "xml.preserveMixedContent", 
      "xml.preserveTextNodes",
      "xml.preserveAttributes",
      "xml.preservePrefixedNames"
    ];
    
    if (this.xnode !== null) {
      // Source has already been set, check for preservation setting changes
      const currentConfig = this.pipeline.config.get();
      
      // Check preservation settings using direct property access
      const changedSettings = PRESERVATION_SETTINGS.filter(setting => {
        if (setting.includes('.')) {
          const [section, property] = setting.split('.');
          const configSection = config[section as keyof Configuration] as any;
          const currentSection = currentConfig[section as keyof Configuration] as any;
          
          return configSection && 
                 configSection[property] !== undefined && 
                 configSection[property] !== currentSection[property];
        } else {
          return config[setting as keyof Configuration] !== undefined && 
                 config[setting as keyof Configuration] !== currentConfig[setting as keyof Configuration];
        }
      });
      
      if (changedSettings.length > 0) {
        throw new Error(
          `Cannot change preservation settings (${changedSettings.join(', ')}) after source is set. ` +
          `These settings must be configured in the XJX constructor or via withConfig() before setting a source.`
        );
      }
    }
    
    // Apply configuration using pipeline configuration manager
    this.pipeline.config = this.pipeline.config.merge(config);
    
    // Log using direct configuration property access
    const finalConfig = this.pipeline.config.get();
    logger.debug('Successfully applied configuration using pipeline context', {
      preserveComments: finalConfig.preserveComments,
      preserveInstructions: finalConfig.preserveInstructions,
      preserveWhitespace: finalConfig.preserveWhitespace,
      highFidelity: finalConfig.highFidelity,
      xmlPreserveNamespaces: finalConfig.xml.preserveNamespaces,
      xmlAttributeHandling: finalConfig.xml.attributeHandling,
      xmlPrettyPrint: finalConfig.xml.prettyPrint,
      jsonFieldVsValue: finalConfig.json.fieldVsValue,
      jsonPrettyPrint: finalConfig.json.prettyPrint
    });
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to apply configuration: ${String(err)}`);
  }
}

/**
 * Implementation for setting the log level using unified pipeline context
 * Unchanged - already using direct approach
 */
export function withLogLevel(this: NonTerminalExtensionContext, level: LogLevel | string): void {
  try {
    // API boundary validation using pipeline context
    this.pipeline.validateInput(level !== undefined && level !== null, "Log level must be provided");
    
    // Handle string input for level
    let logLevel: LogLevel;
    
    if (typeof level === 'string') {
      // Convert string to LogLevel enum
      const normalizedLevel = level.toUpperCase();
      
      switch (normalizedLevel) {
        case 'DEBUG':
          logLevel = LogLevel.DEBUG;
          break;
        case 'INFO':
          logLevel = LogLevel.INFO;
          break;
        case 'WARN':
          logLevel = LogLevel.WARN;
          break;
        case 'ERROR':
          logLevel = LogLevel.ERROR;
          break;
        case 'NONE':
          logLevel = LogLevel.NONE;
          break;
        default:
          throw new Error(`Invalid log level: ${level}. Valid values are: debug, info, warn, error, none`);
      }
    } else {
      // Level is already a LogLevel enum value
      logLevel = level;
    }
    
   // Set the default log level
   LoggerFactory.setDefaultLevel(logLevel);
    
    logger.info(`Log level set to ${logLevel} via pipeline context`);
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to set log level: ${String(err)}`);
  }
}

// Register the extensions with XJX
XJX.registerNonTerminalExtension("withConfig", withConfig);
XJX.registerNonTerminalExtension("withLogLevel", withLogLevel);