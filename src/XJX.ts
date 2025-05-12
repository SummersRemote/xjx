/**
 * XJX - Main class with entry points to fluent API and extension registration
 * 
 * Provides static utilities and extension registration for the XJX library.
 */
import { Configuration } from './core/types/config-types';
import { XjxBuilder } from './xjx-builder';
import { XmlUtils } from './core/utils/xml-utils';
import { ConfigService } from './core/services/config-service';
import { DomUtils } from './core/utils/dom-utils';
import { 
  TerminalExtensionContext, 
  NonTerminalExtensionContext 
} from './core/types/extension-types';
import { Transform } from './core/types/transform-interfaces';

/**
 * Main XJX class - provides access to the fluent API and manages extensions
 */
export class XJX {
  /**
   * Utility method to validate XML string
   * @param xmlString XML string to validate
   * @returns Validation result with isValid flag and optional error message
   */
  public static validateXml(xmlString: string): { isValid: boolean; message?: string } {
    return XmlUtils.validateXML(xmlString);
  }
  
  /**
   * Utility method to pretty print XML string
   * @param xmlString XML string to format
   * @param indent Optional indentation level (default: 2)
   * @returns Formatted XML string
   */
  public static prettyPrintXml(xmlString: string, indent: number = 2): string {
    return XmlUtils.prettyPrintXml(xmlString, indent);
  }
  
  /**
   * Reset global configuration to defaults
   */
  public static resetConfig(): void {
    ConfigService.getInstance().resetToDefaults();
  }
  
  /**
   * Update global configuration
   * @param config Configuration to apply
   */
  public static updateConfig(config: Partial<Configuration>): void {
    ConfigService.getInstance().updateConfig(config);
  }
  
  /**
   * Get current global configuration
   * @returns Current configuration
   */
  public static getConfig(): Configuration {
    return ConfigService.getInstance().getConfig();
  }
  
  /**
   * Cleanup resources (e.g., DOM adapter)
   */
  public static cleanup(): void {
    DomUtils.cleanup();
  }
  
  /**
   * Create a builder for XML to JSON transformations
   * @param xml XML string to transform
   * @returns XjxBuilder instance
   */
  public static fromXml(xml: string): XjxBuilder {
    return new XjxBuilder().fromXml(xml);
  }
  
  /**
   * Create a builder for JSON to XML transformations
   * @param json JSON object to transform
   * @returns XjxBuilder instance
   */
  public static fromJson(json: Record<string, any>): XjxBuilder {
    return new XjxBuilder().fromJson(json);
  }
  
  /**
   * Create a builder with custom configuration
   * @param config Configuration to apply
   * @returns XjxBuilder instance
   */
  public static withConfig(config: Partial<Configuration>): XjxBuilder {
    return new XjxBuilder().withConfig(config);
  }
  
  /**
   * Create a builder with transforms
   * @param transforms Transforms to apply
   * @returns XjxBuilder instance
   */
  public static withTransforms(...transforms: Transform[]): XjxBuilder {
    return new XjxBuilder().withTransforms(...transforms);
  }
  
  /**
   * Register a terminal extension method (returns a value)
   * @param name Extension name
   * @param method Implementation function that properly uses this: TerminalExtensionContext
   */
  public static registerTerminalExtension(name: string, method: (this: TerminalExtensionContext, ...args: any[]) => any): void {
    // Register on XJX class
    (XJX as any)[name] = function(...args: any[]) {
      // For static usage, we need to create a builder to get the full context
      // Use type assertion to conform to the TerminalExtensionContext interface
      const builder = new XjxBuilder();
      return method.apply(builder as unknown as TerminalExtensionContext, args);
    };
    
    // Register on XjxBuilder class for fluent API
    (XjxBuilder.prototype as any)[name] = function(...args: any[]) {
      // When called through the builder, use type assertion to match interface
      return method.apply(this as unknown as TerminalExtensionContext, args);
    };
  }
  
  /**
   * Register a non-terminal extension method (returns this for chaining)
   * @param name Extension name
   * @param method Implementation function that properly uses this: NonTerminalExtensionContext
   */
  public static registerNonTerminalExtension(name: string, method: (this: NonTerminalExtensionContext, ...args: any[]) => any): void {
    // Register on XJX class as a factory method that creates a new builder
    (XJX as any)[name] = function(...args: any[]) {
      // For static usage, create and return a builder
      const builder = new XjxBuilder();
      method.apply(builder as unknown as NonTerminalExtensionContext, args);
      return builder;
    };
    
    // Register on XjxBuilder class for fluent API
    (XjxBuilder.prototype as any)[name] = function(...args: any[]) {
      // When called through the builder, use type assertion to match interface
      method.apply(this as unknown as NonTerminalExtensionContext, args);
      return this; // Always return this for chaining
    };
  }
}