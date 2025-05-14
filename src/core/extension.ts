/**
 * Extension system for the XJX library
 */
import { Configuration } from './config';
import { Transform, FormatId } from './transform';
import { XNode } from './xnode';
import { logger, validate, ValidationError } from './error';

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
  sourceFormat: FormatId | null;
  transforms: Transform[];
  
  // Common utility methods required by terminal extensions
  validateSource: () => void;
  deepClone: <T>(obj: T) => T;
  deepMerge: <T extends Record<string, any>>(target: T, source: Partial<T>) => T;
}

/**
 * Context for non-terminal extensions
 */
export interface NonTerminalExtensionContext extends XJXContext {
  // Properties that can be modified by extensions
  xnode: XNode | null;
  sourceFormat: FormatId | null;
  transforms: Transform[];
  
  // Utility methods
  validateSource: () => void;
  deepClone: <T>(obj: T) => T;
  deepMerge: <T extends Record<string, any>>(target: T, source: Partial<T>) => T;
}

/**
 * Extension registration utilities
 * 
 * Note: The actual registration logic is implemented in the XJX class.
 * This interface is provided for documentation purposes.
 */
export class Extension {
  /**
   * Register a terminal extension method (returns a value)
   * @param name Extension name (e.g., 'toXml')
   * @param method Implementation function
   */
  static registerTerminal(name: string, method: (this: TerminalExtensionContext, ...args: any[]) => any): void {
    try {
      // VALIDATION: Check for valid inputs
      validate(typeof name === "string" && name.length > 0, "Extension name must be a non-empty string");
      validate(typeof method === "function", "Extension method must be a function");
      
      logger.debug('Terminal extension registration requested', { name });
      
      // Note: Actual implementation is in XJX class
      // This method would typically call the actual implementation
      
      logger.debug('Terminal extension registered', { name });
    } catch (err) {
      if (err instanceof ValidationError) {
        logger.error('Failed to register terminal extension due to validation error', err);
        throw err;
      } else {
        logger.error(`Failed to register terminal extension: ${name}`, err);
        throw err;
      }
    }
  }

  /**
   * Register a non-terminal extension method (returns this for chaining)
   * @param name Extension name (e.g., 'withConfig')
   * @param method Implementation function
   */
  static registerNonTerminal(name: string, method: (this: NonTerminalExtensionContext, ...args: any[]) => any): void {
    try {
      // VALIDATION: Check for valid inputs
      validate(typeof name === "string" && name.length > 0, "Extension name must be a non-empty string");
      validate(typeof method === "function", "Extension method must be a function");
      
      logger.debug('Non-terminal extension registration requested', { name });
      
      // Note: Actual implementation is in XJX class
      // This method would typically call the actual implementation
      
      logger.debug('Non-terminal extension registered', { name });
    } catch (err) {
      if (err instanceof ValidationError) {
        logger.error('Failed to register non-terminal extension due to validation error', err);
        throw err;
      } else {
        logger.error(`Failed to register non-terminal extension: ${name}`, err);
        throw err;
      }
    }
  }
}