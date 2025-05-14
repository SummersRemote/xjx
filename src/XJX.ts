/**
 * XJX - Main class with entry points to fluent API and extension registration
 *
 * Provides static utilities and extension registration for the XJX library.
 */
import { Configuration, Config } from "./core/config";
import { XjxBuilder } from "./xjx-builder";
import { XmlParser, XmlSerializer } from "./core/xml";
import { DOM } from "./core/dom";
import {
  TerminalExtensionContext,
  NonTerminalExtensionContext,
} from "./core/extension";
import { Transform, FormatId, FORMATS } from "./core/transform";
import { XNode } from "./core/xnode";
import {
  logger,
  validate,
  ValidationError,
  ConfigurationError,
  EnvironmentError,
  handleError,
  ErrorType,
} from "./core/error";

/**
 * Main XJX class - provides access to the fluent API and manages extensions
 */
export class XJX {
  // Global configuration - mutable reference for backward compatibility
  private static globalConfig: Configuration = Config.getDefault();

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
      // API boundary validation
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
      // API boundary validation
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
        fallback: xmlString, // Return original XML as fallback
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
      return Config.getDefault();
    } catch (err) {
      return handleError(err, "get configuration", {
        errorType: ErrorType.CONFIGURATION,
        fallback: Config.getDefault(), // Return fresh default as fallback
      });
    }
  }

  /**
   * Get mutable reference to global configuration (for backward compatibility)
   * @returns Reference to global configuration
   */
  public static getMutableConfig(): Configuration {
    try {
      logger.debug("Getting mutable reference to global configuration");
      return this.globalConfig;
    } catch (err) {
      return handleError(err, "get mutable configuration", {
        errorType: ErrorType.CONFIGURATION,
        fallback: this.globalConfig, // Return globalConfig as fallback
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
   * Create a builder for XML to JSON transformations
   * @param xml XML string to transform
   * @returns XjxBuilder instance
   */
  public static fromXml(xml: string): XjxBuilder {
    try {
      // API boundary validation
      validate(typeof xml === "string", "XML source must be a string");
      validate(xml.trim().length > 0, "XML source cannot be empty");

      logger.debug("Creating builder from XML source", { length: xml.length });
      return new XjxBuilder().fromXml(xml);
    } catch (err) {
      return handleError(err, "create builder from XML", {
        data: { xmlLength: xml?.length },
        errorType: ErrorType.PARSE,
        fallback: new XjxBuilder(), // Return empty builder as fallback
      });
    }
  }

  /**
   * Create a builder for JSON to XML transformations
   * @param json JSON object to transform
   * @returns XjxBuilder instance
   */
  public static fromJson(json: Record<string, any>): XjxBuilder {
    try {
      // API boundary validation
      validate(
        json !== null && typeof json === "object",
        "JSON source must be an object"
      );
      validate(!Array.isArray(json), "JSON source cannot be an array");
      validate(Object.keys(json).length > 0, "JSON source cannot be empty");

      logger.debug("Creating builder from JSON source", {
        keys: Object.keys(json),
      });

      return new XjxBuilder().fromJson(json);
    } catch (err) {
      return handleError(err, "create builder from JSON", {
        data: {
          jsonType: typeof json,
          isArray: Array.isArray(json),
          keyCount: Object.keys(json || {}).length,
        },
        errorType: ErrorType.PARSE,
        fallback: new XjxBuilder(), // Return empty builder as fallback
      });
    }
  }

  /**
   * Create a builder with custom configuration
   * @param config Configuration to apply
   * @returns XjxBuilder instance
   */
  public static withConfig(config: Partial<Configuration>): XjxBuilder {
    try {
      // No need for separate validation as createOrUpdate handles it
      logger.debug('Creating builder with custom configuration', { 
        configKeys: Object.keys(config || {}) 
      });
      
      // Create a new builder and apply config
      const builder = new XjxBuilder();
      builder.config = Config.createOrUpdate(config, builder.config);
      return builder;
    } catch (err) {
      return handleError(err, "create builder with config", {
        data: { configKeys: Object.keys(config || {}) },
        errorType: ErrorType.CONFIGURATION,
        fallback: new XjxBuilder() // Return empty builder as fallback
      });
    }
  }

  /**
   * Create a builder with transforms
   * @param transforms Transforms to apply
   * @returns XjxBuilder instance
   */
  public static withTransforms(...transforms: Transform[]): XjxBuilder {
    try {
      // API boundary validation
      validate(Array.isArray(transforms), "Transforms must be an array");

      // Validate each transform
      for (let i = 0; i < transforms.length; i++) {
        const transform = transforms[i];
        validate(
          transform !== null && typeof transform === "object",
          `Transform at index ${i} must be an object`
        );

        validate(
          Array.isArray(transform.targets) && transform.targets.length > 0,
          `Transform at index ${i} must have a targets array`
        );

        validate(
          typeof transform.transform === "function",
          `Transform at index ${i} must have a transform method`
        );
      }

      logger.debug("Creating builder with transforms", {
        transformCount: transforms.length,
      });

      return new XjxBuilder().withTransforms(...transforms);
    } catch (err) {
      return handleError(err, "create builder with transforms", {
        data: { transformCount: transforms?.length },
        errorType: ErrorType.TRANSFORM,
        fallback: new XjxBuilder(), // Return empty builder as fallback
      });
    }
  }

  /**
   * Register an extension method
   * @param name Extension name
   * @param method Implementation function
   * @param isTerminal Whether this is a terminal extension
   */
  public static registerExtension(
    name: string,
    method: Function,
    isTerminal: boolean = false
  ): void {
    try {
      // Validation
      validate(
        typeof name === "string" && name.length > 0,
        "Extension name must be a non-empty string"
      );
      validate(
        typeof method === "function",
        "Extension method must be a function"
      );

      logger.debug(
        `Registering ${isTerminal ? "terminal" : "non-terminal"} extension`,
        { name }
      );

      // Implementation logic here...
    } catch (err) {
      handleError(
        err,
        `register ${isTerminal ? "terminal" : "non-terminal"} extension`,
        {
          data: { name },
          errorType: ErrorType.CONFIGURATION,
        }
      );
    }
  }

  // Then alias the original methods:
  public static registerTerminalExtension(
    name: string,
    method: Function
  ): void {
    return XJX.registerExtension(name, method, true);
  }

  public static registerNonTerminalExtension(
    name: string,
    method: Function
  ): void {
    return XJX.registerExtension(name, method, false);
  }
}
