/**
 * Common type definitions for XJX extensions
 * 
 * This file contains shared interfaces used by extension functions
 * to properly type the 'this' context.
 */
import { Configuration } from "../core/types/config-types";
import { Transform } from "../core/types/transform-interfaces";
import { XjxBuilder } from "../fluent/xjx-builder";

/**
 * Context interface for extension functions
 * Provides typing for 'this' in extension methods
 */
export interface XJXContext {
  // Always available in both static and fluent contexts
  config: Configuration;
  
  // Allow for other properties that might be present
  [key: string]: any;
}

/**
 * Context for terminal extensions
 * Terminal extensions return a value (not the builder)
 */
export interface TerminalExtensionContext extends XJXContext {
  // Terminal extensions have the same context as regular extensions
}

/**
 * Context for non-terminal extensions
 * Non-terminal extensions return the builder for chaining
 * 
 * Note: This interface only includes public methods of XjxBuilder
 * that extensions should use - it doesn't reflect private properties
 */
export interface NonTerminalExtensionContext extends XJXContext {
  // Public methods used by non-terminal extensions
  withTransforms: (...transforms: Transform[]) => XjxBuilder;
  withConfig: (config: Partial<Configuration>) => XjxBuilder;
  fromXml: (source: string) => XjxBuilder;
  fromJson: (source: Record<string, any>) => XjxBuilder;
}