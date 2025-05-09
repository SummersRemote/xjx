/**
 * Common type definitions for XJX extensions
 * 
 * This file contains shared interfaces used by extension functions
 * to properly type the 'this' context.
 */
import { Configuration } from "./config-types";
import { Transform, XNode, TransformDirection } from "./transform-interfaces";
import { ConfigService } from "../services/config-service";

/**
 * Base context interface for extension functions
 * Provides typing for 'this' in extension methods
 */
export interface XJXContext {
  // Configuration is available in all contexts
  config: Configuration;
}

/**
 * Context for terminal extensions
 * Terminal extensions return a value (not the builder)
 */
export interface TerminalExtensionContext extends XJXContext {
  // These properties are available in the builder context
  xnode: XNode | null;
  direction: TransformDirection | null;
  transforms: Transform[];
  configProvider: ConfigService;
  
  // Common utility methods required by terminal extensions
  validateSource: () => void;
  deepClone: <T>(obj: T) => T;
  deepMerge: <T extends Record<string, any>>(target: T, source: Partial<T>) => T;
}

/**
 * Context for non-terminal extensions
 * Non-terminal extensions return the builder for chaining
 */
export interface NonTerminalExtensionContext extends XJXContext {
  // Properties that can be modified by extensions
  xnode: XNode | null;
  direction: TransformDirection | null;
  transforms: Transform[];
  configProvider: ConfigService;
  
  // Utility methods
  validateSource: () => void;
  deepClone: <T>(obj: T) => T;
  deepMerge: <T extends Record<string, any>>(target: T, source: Partial<T>) => T;
}