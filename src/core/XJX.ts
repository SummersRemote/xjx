/**
 * XJX - Main class with fluent API
 */
import { Configuration } from './types/config-types';
import { XjxBuilder } from '../fluent/xjx-builder';
import { XmlUtil } from './utils/xml-utils';
import { ConfigProvider } from './config/config-provider';
import { DOMAdapter } from './adapters/dom-adapter';
import { TerminalExtensionContext, NonTerminalExtensionContext } from '../extensions/types';

/**
 * Main XJX class - provides access to the fluent API
 */
export class XJX {
  private static configProvider = ConfigProvider.getInstance();
  private static xmlUtil = new XmlUtil(XJX.configProvider.getConfig());
  
  /**
   * Create a builder starting with XML source
   * @param source XML string
   */
  public static fromXml(source: string): XjxBuilder {
    return new XjxBuilder().fromXml(source);
  }
  
  /**
   * Create a builder starting with JSON source
   * @param source JSON object
   */
  public static fromJson(source: Record<string, any>): XjxBuilder {
    return new XjxBuilder().fromJson(source);
  }
  
  /**
   * Create a builder with configuration
   * @param config Configuration to apply
   */
  public static withConfig(config: Partial<Configuration>): XjxBuilder {
    return new XjxBuilder().withConfig(config);
  }
  
  /**
   * Utility method to validate XML string
   * @param xmlString XML string to validate
   */
  public static validateXml(xmlString: string): { isValid: boolean; message?: string } {
    return XJX.xmlUtil.validateXML(xmlString);
  }
  
  /**
   * Utility method to pretty print XML string
   * @param xmlString XML string to format
   */
  public static prettyPrintXml(xmlString: string): string {
    return XJX.xmlUtil.prettyPrintXml(xmlString);
  }
  
  /**
   * Reset global configuration to defaults
   */
  public static resetConfig(): void {
    XJX.configProvider.resetToDefaults();
    XJX.xmlUtil = new XmlUtil(XJX.configProvider.getConfig());
  }
  
  /**
   * Update global configuration
   * @param config Configuration to apply
   */
  public static updateConfig(config: Partial<Configuration>): void {
    XJX.configProvider.updateConfig(config);
    XJX.xmlUtil = new XmlUtil(XJX.configProvider.getConfig());
  }
  
  /**
   * Get current global configuration
   */
  public static getConfig(): Configuration {
    return XJX.configProvider.getConfig();
  }
  
  /**
   * Cleanup resources (e.g., DOM adapter)
   */
  public static cleanup(): void {
    DOMAdapter.cleanup();
  }
  
  /**
   * Register a terminal extension method (returns a value)
   * @param name Extension name
   * @param method Implementation function that properly uses this: TerminalExtensionContext
   */
  public static registerTerminalExtension(name: string, method: (this: TerminalExtensionContext, ...args: any[]) => any): void {
    // Register on XJX class
    (XJX as any)[name] = function(...args: any[]) {
      // For static usage, create a context with default config
      const context: TerminalExtensionContext = {
        config: XJX.getConfig()
      };
      return method.apply(context, args);
    };
    
    // Register on XjxBuilder class for fluent API
    (XjxBuilder.prototype as any)[name] = function(...args: any[]) {
      return method.apply(this, args);
    };
  }
  
  /**
   * Register a non-terminal extension method (returns this for chaining)
   * @param name Extension name
   * @param method Implementation function that properly uses this: NonTerminalExtensionContext
   */
  public static registerNonTerminalExtension(name: string, method: (this: NonTerminalExtensionContext, ...args: any[]) => any): void {
    // Register on XJX class
    (XJX as any)[name] = function(...args: any[]) {
      // For static usage, create and return a builder
      const builder = new XjxBuilder();
      method.apply(builder, args);
      return builder;
    };
    
    // Register on XjxBuilder class for fluent API
    (XjxBuilder.prototype as any)[name] = function(...args: any[]) {
      method.apply(this, args);
      return this; // Always return this for chaining
    };
  }
}