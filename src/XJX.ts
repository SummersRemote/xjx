/**
 * XJX - Main class with extensible fluent API
 *
 * Core implementation that allows extensions through prototype methods.
 */
import { Configuration, Config } from "./core/config";
import { XmlParser, XmlSerializer } from "./core/xml";
import { DOM } from "./core/dom";
import { Transform, FormatId } from "./core/transform";
import { XNode } from "./core/xnode";
import {
  logger,
  validate,
  ValidationError,
  ConfigurationError,
  SerializeError,
  ParseError,
  TransformError,
  EnvironmentError,
  handleError,
  ErrorType,
} from "./core/error";
import { Common } from "./core/common";

/**
 * Main XJX class - provides the fluent API and manages extensions
 */
export class XJX {
  // Allow dynamic property access for extensions
  [key: string]: any;
  
  // Instance properties
  public xnode: XNode | null = null;
  public transforms: Transform[] = [];
  public config: Configuration;
  public sourceFormat: FormatId | null = null;
  
  // Static registry properties for tracking extensions
  private static terminalExtensions: Map<string, Function> = new Map();
  private static nonTerminalExtensions: Map<string, Function> = new Map();
  
  // Static global configuration
  private static globalConfig: Configuration = Config.getDefault();
  
  /**
   * Create a new XJX instance
   * @param config Optional configuration
   */
  constructor(config?: Partial<Configuration>) {
    try {
      this.config = Config.createOrUpdate(config);
      logger.debug('Created new XJX instance');
    } catch (err) {
      this.config = Config.getDefault();
      handleError(err, "initialize XJX instance", {
        errorType: ErrorType.CONFIGURATION
      });
    }
  }
  
  /**
   * Utility method to validate XML string
   * @param xmlString XML string to validate
   * @returns Validation result with isValid flag and optional error message
   */
  public static validateXml(xmlString: string): {
    isValid: boolean;
    message?: string;
  } {
    try {
      validate(typeof xmlString === "string", "XML string must be a string");
      logger.debug("Validating XML string", { length: xmlString.length });
      return XmlParser.validate(xmlString);
    } catch (err) {
      return handleError(err, "validate XML", {
        data: { xmlLength: xmlString?.length },
        fallback: { isValid: false, message: String(err) },
      });
    }
  }

  /**
   * Utility method to pretty print XML string
   * @param xmlString XML string to format
   * @param indent Optional indentation level (default: 2)
   * @returns Formatted XML string
   */
  public static prettyPrintXml(xmlString: string, indent: number = 2): string {
    try {
      validate(typeof xmlString === "string", "XML string must be a string");
      validate(
        Number.isInteger(indent) && indent >= 0,
        "Indent must be a non-negative integer"
      );

      logger.debug("Pretty printing XML string", {
        length: xmlString.length,
        indent,
      });

      return XmlSerializer.prettyPrint(xmlString, indent);
    } catch (err) {
      return handleError(err, "pretty print XML", {
        data: {
          xmlLength: xmlString?.length,
          indent,
        },
        errorType: ErrorType.SERIALIZE,
        fallback: xmlString,
      });
    }
  }

  /**
   * Reset global configuration to defaults
   */
  public static resetConfig(): void {
    try {
      logger.debug("Resetting global configuration to defaults");
      this.globalConfig = Config.getDefault();
      logger.debug("Global configuration reset complete");
    } catch (err) {
      handleError(err, "reset configuration", {
        errorType: ErrorType.CONFIGURATION,
      });
    }
  }

  /**
   * Update global configuration
   * @param config Configuration to apply
   */
  public static updateConfig(config: Partial<Configuration>): void {
    try {
      logger.debug('Updating global configuration', { 
        configKeys: Object.keys(config || {}) 
      });
      
      this.globalConfig = Config.createOrUpdate(config, this.globalConfig);
      
      logger.debug('Global configuration updated successfully');
    } catch (err) {
      handleError(err, "update configuration", {
        data: { configKeys: Object.keys(config || {}) },
        errorType: ErrorType.CONFIGURATION
      });
    }
  }

  /**
   * Get current global configuration (deep clone to prevent mutation)
   * @returns Current configuration
   */
  public static getConfig(): Configuration {
    try {
      logger.debug("Getting a copy of the global configuration");
      return Common.deepClone(this.globalConfig);
    } catch (err) {
      return handleError(err, "get configuration", {
        errorType: ErrorType.CONFIGURATION,
        fallback: Config.getDefault(),
      });
    }
  }

  /**
   * Cleanup resources (e.g., DOM adapter)
   */
  public static cleanup(): void {
    try {
      logger.debug("Cleaning up resources");
      DOM.cleanup();
      logger.debug("Cleanup completed successfully");
    } catch (err) {
      handleError(err, "clean up resources", {
        errorType: ErrorType.ENVIRONMENT,
      });
    }
  }

  /**
   * Register a terminal extension method (returns a value)
   * @param name Extension name
   * @param method Implementation function
   */
  public static registerTerminalExtension(name: string, method: Function): void {
    try {
      // Validate inputs
      validate(typeof name === "string" && name.length > 0, "Extension name must be a non-empty string");
      validate(typeof method === "function", "Extension method must be a function");
      
      // Check for conflicts
      if ((XJX.prototype as any)[name]) {
        const err = new ConfigurationError(`Extension '${name}' conflicts with an existing method`);
        handleError(err, "register terminal extension", {
          data: { name },
          errorType: ErrorType.CONFIGURATION
        });
        return;
      }
      
      // Register the extension
      this.terminalExtensions.set(name, method);
      
      // Add to prototype - directly assign the method
      (XJX.prototype as any)[name] = method;
      
      logger.debug('Terminal extension registered', { name });
    } catch (err) {
      handleError(err, "register terminal extension", {
        data: { name },
        errorType: ErrorType.CONFIGURATION
      });
    }
  }

  /**
   * Register a non-terminal extension method (returns this for chaining)
   * @param name Extension name
   * @param method Implementation function
   */
  public static registerNonTerminalExtension(name: string, method: Function): void {
    try {
      // Validate inputs
      validate(typeof name === "string" && name.length > 0, "Extension name must be a non-empty string");
      validate(typeof method === "function", "Extension method must be a function");
      
      // Check for conflicts
      if ((XJX.prototype as any)[name]) {
        const err = new ConfigurationError(`Extension '${name}' conflicts with an existing method`);
        handleError(err, "register non-terminal extension", {
          data: { name },
          errorType: ErrorType.CONFIGURATION
        });
        return;
      }
      
      // Register the extension
      this.nonTerminalExtensions.set(name, method);
      
      // Add to prototype - use a wrapper to ensure it returns 'this'
      (XJX.prototype as any)[name] = function(...args: any[]) {
        method.apply(this, args);
        return this;
      };
      
      logger.debug('Non-terminal extension registered', { name });
    } catch (err) {
      handleError(err, "register non-terminal extension", {
        data: { name },
        errorType: ErrorType.CONFIGURATION
      });
    }
  }
  
  /**
   * Check if a terminal extension is registered
   * @param name Extension name
   * @returns True if the extension is registered
   */
  public static hasTerminalExtension(name: string): boolean {
    return this.terminalExtensions.has(name);
  }
  
  /**
   * Check if a non-terminal extension is registered
   * @param name Extension name
   * @returns True if the extension is registered
   */
  public static hasNonTerminalExtension(name: string): boolean {
    return this.nonTerminalExtensions.has(name);
  }
  
  /**
   * Get all registered terminal extensions
   * @returns Array of extension names
   */
  public static getTerminalExtensions(): string[] {
    return Array.from(this.terminalExtensions.keys());
  }
  
  /**
   * Get all registered non-terminal extensions
   * @returns Array of extension names
   */
  public static getNonTerminalExtensions(): string[] {
    return Array.from(this.nonTerminalExtensions.keys());
  }
  
  /**
   * Deep clone an object (utility method)
   * @param obj Object to clone
   * @returns Deep clone of the object
   */
  public deepClone<T>(obj: T): T {
    try {
      return Common.deepClone(obj);
    } catch (err) {
      return handleError(err, "deep clone object", {
        data: { objectType: typeof obj },
        fallback: obj
      });
    }
  }
  
  /**
   * Deep merge two objects (utility method)
   * @param target Target object
   * @param source Source object to merge into target
   * @returns New object with merged properties
   */
  public deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
    try {
      return Common.deepMerge(target, source);
    } catch (err) {
      return handleError(err, "deep merge objects", {
        data: { 
          targetType: typeof target,
          sourceType: typeof source
        },
        fallback: target
      });
    }
  }
  
  /**
   * Validate that a source has been set before transformation
   * @throws Error if no source has been set
   */
  public validateSource(): void {
    try {
      if (!this.xnode || !this.sourceFormat) {
        throw new ValidationError('No source set: call a source-setting extension before transformation');
      }
      logger.debug('Source validation passed', {
        sourceFormat: this.sourceFormat,
        rootNodeName: this.xnode.name
      });
    } catch (err) {
      handleError(err, "validate source", {
        data: { 
          hasNode: this.xnode !== null,
          sourceFormat: this.sourceFormat
        },
        errorType: ErrorType.VALIDATION
      });
    }
  }
}

// Export default for easier importing
export default XJX;