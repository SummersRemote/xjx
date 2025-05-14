/**
 * Extension Registry
 * 
 * This module imports all core extensions to ensure they're registered.
 * It uses webpack-specific comments to prevent tree-shaking.
 */

// Import all core extensions so they're registered
// Terminal extensions
require(/* webpackMode: "eager" */ './instance/to-xml');
require(/* webpackMode: "eager" */ './instance/to-json');
require(/* webpackMode: "eager" */ './instance/to-json-string');

// Non-terminal extensions
require(/* webpackMode: "eager" */ './instance/from-xml');
require(/* webpackMode: "eager" */ './instance/from-json');
require(/* webpackMode: "eager" */ './instance/with-config');
require(/* webpackMode: "eager" */ './instance/with-transforms');

/**
 * Initialize extensions by importing them
 * This function doesn't actually need to do anything because the imports
 * have side effects that register the extensions
 */
export function loadExtensions(): void {
  // The requires above already registered the extensions
  // This function exists just to provide a clear API
}

/**
 * Load custom extensions from specific paths
 * @param paths Array of paths to extensions
 */
export function loadCustomExtensions(paths: string[]): void {
  // Load each extension by path
  for (const path of paths) {
    try {
      // Using require() to support webpack
      require(path);
    } catch (err) {
      console.error(`Failed to load extension from path: ${path}`, err);
    }
  }
}

// Type declarations for improved development experience
export interface XJX {
  // Instance properties
  xnode: any | null;
  transforms: any[];
  config: any;
  sourceFormat: string | null;
  
  // Utility methods
  validateSource(): void;
  deepClone<T>(obj: T): T;
  deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T;
  
  // Terminal extensions
  toXml(): string;
  toJson(): Record<string, any>;
  toJsonString(indent?: number): string;
  
  // Non-terminal extensions
  fromXml(source: string): XJX;
  fromJson(json: Record<string, any>): XJX;
  withConfig(config: any): XJX;
  withTransforms(...transforms: any[]): XJX;
}

// No need to augment the module definition here since each extension
// handles its own type augmentation