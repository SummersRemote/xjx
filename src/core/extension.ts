/**
 * Extension system for the XJX library
 */
import { Configuration } from './config';
import { Transform } from "./functional";
import { XNode } from './xnode';

/**
 * Base context interface for extension functions
 */
export interface XJXContext {
  // Configuration is available in all contexts
  config: Configuration;
}

/**
 * Context for terminal extensions
 */
export interface TerminalExtensionContext extends XJXContext {
  // These properties are available in the builder context
  xnode: XNode | null;
  transforms: Transform[];
  
  // Common utility methods required by terminal extensions
  validateSource: () => void;
  deepClone: <T>(obj: T) => T;
  deepMerge: <T extends Record<string, any>>(target: T, source: Partial<T>) => T;
  cloneNode: (node: XNode, deep?: boolean) => XNode;
}

/**
 * Context for non-terminal extensions
 */
export interface NonTerminalExtensionContext extends XJXContext {
  // Properties that can be modified by extensions
  xnode: XNode | null;
  transforms: Transform[];
  
  // Utility methods
  validateSource: () => void;
  deepClone: <T>(obj: T) => T;
  deepMerge: <T extends Record<string, any>>(target: T, source: Partial<T>) => T;
  cloneNode: (node: XNode, deep?: boolean) => XNode;
}

/**
 * Extension registration utilities
 */
export class Extension {
  /**
   * Register a terminal extension method (returns a value)
   * @param name Extension name (e.g., 'toXml')
   * @param method Implementation function
   * 
   * @example
   * ```
   * Extension.registerTerminal('toYaml', function(this: TerminalExtensionContext): string {
   *   // Implementation...
   *   return yamlString;
   * });
   * ```
   */
  static registerTerminal(name: string, method: (this: TerminalExtensionContext, ...args: any[]) => any): void {
    // This method is for documentation purposes
    // The actual implementation is in the XJX class
    throw new Error('Use XJX.registerTerminalExtension instead');
  }

  /**
   * Register a non-terminal extension method (returns this for chaining)
   * @param name Extension name (e.g., 'withConfig')
   * @param method Implementation function
   * 
   * @example
   * ```
   * Extension.registerNonTerminal('withFormat', function(this: NonTerminalExtensionContext, format: string): void {
   *   // Implementation...
   * });
   * ```
   */
  static registerNonTerminal(name: string, method: (this: NonTerminalExtensionContext, ...args: any[]) => void): void {
    // This method is for documentation purposes
    // The actual implementation is in the XJX class
    throw new Error('Use XJX.registerNonTerminalExtension instead');
  }
}