/**
 * Configuration utility functions - Replaces ConfigurationHelper methods with logic
 * Direct property access approach for simplicity and consistency
 */
import { Configuration } from './config';

/**
 * Get fragment root name as string from configuration
 */
export function getFragmentRootName(config: Configuration): string {
  const fragmentRoot = config.fragmentRoot;
  return typeof fragmentRoot === "string" ? fragmentRoot : fragmentRoot.name || "results";
}

/**
 * Get array item name for JSON conversion with fallback
 */
export function getJsonArrayItemName(config: Configuration, parentPropertyName: string): string {
  return config.json.arrayItemNames[parentPropertyName] || config.json.defaultItemName;
}

/**
 * Get format-specific pretty print setting
 */
export function shouldPrettyPrint(config: Configuration, format: 'xml' | 'json'): boolean {
  switch (format) {
    case 'xml': return config.xml.prettyPrint;
    case 'json': return config.json.prettyPrint;
    default: return config.formatting.pretty;
  }
}