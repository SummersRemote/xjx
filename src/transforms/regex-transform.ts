/**
 * Regex node transform - Apply regular expression replacements to string node values and/or attributes
 */
import { XNode } from '../core/xnode';
import { Transform } from "../core/functional";

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
 * Create a node transformer that applies regex replacement to string values and/or attributes
 * 
 * @example
 * ```typescript
 * // Transform only node values (current behavior)
 * xjx.fromXml(xml).map(regex('hello', 'hi')).toJson();
 * 
 * // Transform only attributes
 * xjx.fromXml(xml).map(regex(/\d+/, 'NUMBER', { transformAttr: true, transformVal: false })).toJson();
 * 
 * // Transform both values and attributes
 * xjx.fromXml(xml).map(regex('/hello/gi', 'hi', { transformAttr: true, transformVal: true })).toJson();
 * 
 * // Clean currency symbols from price attributes
 * xjx.fromXml(xml)
 *    .filter(node => ['price', 'total'].includes(node.name))
 *    .map(regex(/[$,]/g, '', { transformAttr: true }))
 *    .toJson();
 * ```
 * 
 * @param pattern Regular expression pattern (string or RegExp)
 * @param replacement Replacement string (can use capture groups)
 * @param options Transform options for targeting attributes and/or values
 * @returns A node transformer function for use with map()
 */
export function regex(
  pattern: RegExp | string, 
  replacement: string,
  options: {
    transformAttr?: boolean;
    transformVal?: boolean;
  } = {}
): Transform {
  
  const {
    transformAttr = false,
    transformVal = true
  } = options;
  
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
    let result = { ...node };

    // Transform node value if enabled
    if (transformVal && node.value !== undefined && typeof node.value === 'string') {
      result.value = node.value.replace(re, replacement);
    }

    // Transform attributes if enabled
    if (transformAttr && node.attributes) {
      const transformedAttributes: Record<string, any> = {};
      
      for (const [key, value] of Object.entries(node.attributes)) {
        if (typeof value === 'string') {
          transformedAttributes[key] = value.replace(re, replacement);
        } else {
          transformedAttributes[key] = value;
        }
      }
      
      result.attributes = transformedAttributes;
    }

    return result;
  };
}