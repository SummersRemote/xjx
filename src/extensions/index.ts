/**
 * Extension Registry
 * 
 * This module imports all core extensions to ensure they're registered.
 */

// Import all core extensions
// Terminal extensions
import './terminal/to-xml';
import './terminal/to-json';
import './terminal/to-json-string';

// Non-terminal extensions
import './nonterminal/from-xml';
import './nonterminal/from-json';
import './nonterminal/with-config';
import './nonterminal/with-transforms';

// Export types only for developer experience
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