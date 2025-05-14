/**
 * XJX - Main class with entry points to fluent API and extension registration
 * 
 * Provides static utilities and extension registration for the XJX library.
 */
import { Configuration, Config } from './core/config';
import { XjxBuilder } from './xjx-builder';
import { XmlParser, XmlSerializer } from './core/xml';
import { DOM } from './core/dom';
import { 
  TerminalExtensionContext, 
  NonTerminalExtensionContext 
} from './core/extension';
import { Transform, FormatId, FORMATS } from './core/transform';
import { XNode } from './core/xnode';
import { logger, validate, ValidationError, ConfigurationError, EnvironmentError } from './core/error';

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
  public static validateXml(xmlString: string): { isValid: boolean; message?: string } {
    try {
      // API boundary validation
      validate(typeof xmlString === "string", "XML string must be a string");
      
      logger.debug('Validating XML string', { length: xmlString.length });
      return XmlParser.validate(xmlString);
    } catch (err) {
      if (err instanceof ValidationError) {
        logger.error('XML validation parameter error', err);
        throw err;
      } else {
        logger.error('XML validation failed unexpectedly', err);
        return { isValid: false, message: String(err) };
      }
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
      validate(Number.isInteger(indent) && indent >= 0, "Indent must be a non-negative integer");
      
      logger.debug('Pretty printing XML string', { 
        length: xmlString.length, 
        indent 
      });
      
      return XmlSerializer.prettyPrint(xmlString, indent);
    } catch (err) {
      if (err instanceof ValidationError) {
        logger.error('XML pretty print parameter error', err);
        throw err;
      } else {
        logger.error('XML pretty print failed unexpectedly', err);
        // Return the original XML as fallback in case of error
        return xmlString;
      }
    }
  }
  
  /**
   * Reset global configuration to defaults
   */
  public static resetConfig(): void {
    try {
      logger.debug('Resetting global configuration to defaults');
      this.globalConfig = Config.getDefault();
      logger.debug('Global configuration reset complete');
    } catch (err) {
      const error = new ConfigurationError('Failed to reset configuration', null);
      logger.error('Failed to reset configuration', error);
      throw error;
    }
  }
  
  /**
   * Update global configuration
   * @param config Configuration to apply
   */
  public static updateConfig(config: Partial<Configuration>): void {
    try {
      // API boundary validation
      validate(config !== null && typeof config === 'object', "Configuration must be an object");
      
      logger.debug('Updating global configuration', { 
        configKeys: Object.keys(config) 
      });
      
      this.globalConfig = Config.merge(this.globalConfig, config);
      
      logger.debug('Global configuration updated successfully');
    } catch (err) {
      if (err instanceof ValidationError) {
        logger.error('Configuration update parameter error', err);
        throw err;
      } else if (err instanceof ConfigurationError) {
        logger.error('Configuration update error', err);
        throw err;
      } else {
        const error = new ConfigurationError('Failed to update configuration', config);
        logger.error('Failed to update configuration', error);
        throw error;
      }
    }
  }
  
  /**
   * Get current global configuration (deep clone to prevent mutation)
   * @returns Current configuration
   */
  public static getConfig(): Configuration {
    try {
      logger.debug('Getting a copy of the global configuration');
      return Config.getDefault();
    } catch (err) {
      const error = new ConfigurationError('Failed to get configuration', null);
      logger.error('Failed to get configuration', error);
      throw error;
    }
  }
  
  /**
   * Get mutable reference to global configuration (for backward compatibility)
   * @returns Reference to global configuration
   */
  public static getMutableConfig(): Configuration {
    try {
      logger.debug('Getting mutable reference to global configuration');
      return this.globalConfig;
    } catch (err) {
      const error = new ConfigurationError('Failed to get mutable configuration', null);
      logger.error('Failed to get mutable configuration', error);
      throw error;
    }
  }
  
  /**
   * Cleanup resources (e.g., DOM adapter)
   */
  public static cleanup(): void {
    try {
      logger.debug('Cleaning up resources');
      DOM.cleanup();
      logger.debug('Cleanup completed successfully');
    } catch (err) {
      const error = new EnvironmentError('Failed to clean up resources', null);
      logger.error('Failed to clean up resources', error);
      throw error;
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
      
      logger.debug('Creating builder from XML source', { length: xml.length });
      return new XjxBuilder().fromXml(xml);
    } catch (err) {
      if (err instanceof ValidationError) {
        logger.error('fromXml parameter error', err);
        throw err;
      } else {
        logger.error('fromXml failed unexpectedly', err);
        throw err;
      }
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
      validate(json !== null && typeof json === 'object', "JSON source must be an object");
      validate(!Array.isArray(json), "JSON source cannot be an array");
      validate(Object.keys(json).length > 0, "JSON source cannot be empty");
      
      logger.debug('Creating builder from JSON source', { 
        keys: Object.keys(json) 
      });
      
      return new XjxBuilder().fromJson(json);
    } catch (err) {
      if (err instanceof ValidationError) {
        logger.error('fromJson parameter error', err);
        throw err;
      } else {
        logger.error('fromJson failed unexpectedly', err);
        throw err;
      }
    }
  }
  
  /**
   * Create a builder with custom configuration
   * @param config Configuration to apply
   * @returns XjxBuilder instance
   */
  public static withConfig(config: Partial<Configuration>): XjxBuilder {
    try {
      // API boundary validation
      validate(config !== null && typeof config === 'object', "Configuration must be an object");
      
      logger.debug('Creating builder with custom configuration', { 
        configKeys: Object.keys(config) 
      });
      
      return new XjxBuilder().withConfig(config);
    } catch (err) {
      if (err instanceof ValidationError) {
        logger.error('withConfig parameter error', err);
        throw err;
      } else if (err instanceof ConfigurationError) {
        logger.error('withConfig configuration error', err);
        throw err;
      } else {
        logger.error('withConfig failed unexpectedly', err);
        throw err;
      }
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
          transform !== null && typeof transform === 'object',
          `Transform at index ${i} must be an object`
        );
        
        validate(
          Array.isArray(transform.targets) && transform.targets.length > 0,
          `Transform at index ${i} must have a targets array`
        );
        
        validate(
          typeof transform.transform === 'function',
          `Transform at index ${i} must have a transform method`
        );
      }
      
      logger.debug('Creating builder with transforms', { 
        transformCount: transforms.length 
      });
      
      return new XjxBuilder().withTransforms(...transforms);
    } catch (err) {
      if (err instanceof ValidationError) {
        logger.error('withTransforms parameter error', err);
        throw err;
      } else {
        logger.error('withTransforms failed unexpectedly', err);
        throw err;
      }
    }
  }
  
  /**
   * Register a terminal extension method (returns a value)
   * @param name Extension name
   * @param method Implementation function that properly uses this: TerminalExtensionContext
   */
  public static registerTerminalExtension(name: string, method: (this: TerminalExtensionContext, ...args: any[]) => any): void {
    try {
      // API boundary validation
      validate(typeof name === "string" && name.length > 0, "Extension name must be a non-empty string");
      validate(typeof method === "function", "Extension method must be a function");
      
      logger.debug('Registering terminal extension', { name });
      
      // Register on XJX class
      (XJX as any)[name] = function(...args: any[]) {
        try {
          // For static usage, we need to create a builder to get the full context
          // Use type assertion to conform to the TerminalExtensionContext interface
          const builder = new XjxBuilder();
          return method.apply(builder as unknown as TerminalExtensionContext, args);
        } catch (err) {
          logger.error(`Error in static terminal extension: ${name}`, err);
          throw err;
        }
      };
      
      // Register on XjxBuilder class for fluent API
      (XjxBuilder.prototype as any)[name] = function(...args: any[]) {
        try {
          // When called through the builder, use type assertion to match interface
          return method.apply(this as unknown as TerminalExtensionContext, args);
        } catch (err) {
          logger.error(`Error in builder terminal extension: ${name}`, err);
          throw err;
        }
      };
      
      logger.debug('Successfully registered terminal extension', { name });
    } catch (err) {
      if (err instanceof ValidationError) {
        logger.error('Terminal extension registration parameter error', err);
        throw err;
      } else {
        logger.error('Terminal extension registration failed', err);
        throw err;
      }
    }
  }
  
  /**
   * Register a non-terminal extension method (returns this for chaining)
   * @param name Extension name
   * @param method Implementation function that properly uses this: NonTerminalExtensionContext
   */
  public static registerNonTerminalExtension(name: string, method: (this: NonTerminalExtensionContext, ...args: any[]) => any): void {
    try {
      // API boundary validation
      validate(typeof name === "string" && name.length > 0, "Extension name must be a non-empty string");
      validate(typeof method === "function", "Extension method must be a function");
      
      logger.debug('Registering non-terminal extension', { name });
      
      // Register on XJX class as a factory method that creates a new builder
      (XJX as any)[name] = function(...args: any[]) {
        try {
          // For static usage, create and return a builder
          const builder = new XjxBuilder();
          method.apply(builder as unknown as NonTerminalExtensionContext, args);
          return builder;
        } catch (err) {
          logger.error(`Error in static non-terminal extension: ${name}`, err);
          throw err;
        }
      };
      
      // Register on XjxBuilder class for fluent API
      (XjxBuilder.prototype as any)[name] = function(...args: any[]) {
        try {
          // When called through the builder, use type assertion to match interface
          method.apply(this as unknown as NonTerminalExtensionContext, args);
          return this; // Always return this for chaining
        } catch (err) {
          logger.error(`Error in builder non-terminal extension: ${name}`, err);
          throw err;
        }
      };
      
      logger.debug('Successfully registered non-terminal extension', { name });
    } catch (err) {
      if (err instanceof ValidationError) {
        logger.error('Non-terminal extension registration parameter error', err);
        throw err;
      } else {
        logger.error('Non-terminal extension registration failed', err);
        throw err;
      }
    }
  }
}