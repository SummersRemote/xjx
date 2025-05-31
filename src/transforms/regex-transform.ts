/**
 * Regex node transform - Apply regular expression replacements to string node values
 */
import { XNode } from '../core/xnode';

/**
 * Detect if a string is a regular expression pattern
 * Matches patterns like: /pattern/flags
 * 
 * @param pattern String to check
 * @returns Object with the parsed regex and flags if it's a regex pattern, null otherwise
 */
function parseRegexPattern(pattern: string): { source: string, flags: string } | null {
  // Match /pattern/flags format
  const match = pattern.match(/^\/(.+)\/([gimuy]*)$/);
  if (match) {
    return {
      source: match[1],
      flags: match[2]
    };
  }
  return null;
}

/**
 * Create a node transformer that applies regex replacement to string values
 * 
 * @example
 * ```typescript
 * // Simple text replacement (global, case-sensitive)
 * xjx.fromXml(xml).map(regex('hello', 'hi')).toJson();
 * 
 * // Full regex with flags
 * xjx.fromXml(xml).map(regex('/hello/gi', 'hi')).toJson();
 * 
 * // Using RegExp object
 * xjx.fromXml(xml).map(regex(/hello/gi, 'hi')).toJson();
 * 
 * // Use with filtering for specific nodes
 * xjx.fromXml(xml)
 *    .filter(node => ['description', 'content'].includes(node.name))
 *    .map(regex(/\d+/, 'NUMBER'))
 *    .toJson();
 * ```
 * 
 * @param pattern Regular expression pattern (string or RegExp)
 * @param replacement Replacement string (can use capture groups)
 * @returns A node transformer function for use with map()
 */
export function regex(
  pattern: RegExp | string, 
  replacement: string
): (node: XNode) => XNode {
  
  // Create RegExp object based on input type
  let re: RegExp;
  
  if (pattern instanceof RegExp) {
    // Use the RegExp object as is
    re = pattern;
  } else if (typeof pattern === 'string') {
    // Check if the string is in /pattern/flags format
    const parsed = parseRegexPattern(pattern);
    if (parsed) {
      // Create RegExp from parsed pattern and flags
      re = new RegExp(parsed.source, parsed.flags);
    } else {
      // Simple text pattern - make it global and case-sensitive
      // Escape special regex characters
      const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      re = new RegExp(escaped, 'g');
    }
  } else {
    throw new Error('Pattern must be a string or RegExp');
  }
  
  return (node: XNode): XNode => {
    // Skip if node has no value or value is not a string
    if (node.value === undefined || typeof node.value !== 'string') {
      return node;
    }
    
    // Apply replacement
    const transformedValue = node.value.replace(re, replacement);
    
    // Return transformed node
    return { ...node, value: transformedValue };
  };
}