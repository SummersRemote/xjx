/**
 * Regex transform - Apply regular expression replacements to string values
 */
import { Transform, TransformOptions, TransformIntent, createTransform } from '../core/transform';

/**
 * Options for regex transform
 */
export interface RegexOptions extends TransformOptions {
  // Only inherits standard TransformOptions
}

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
 * Create a transform that applies a regex replacement
 * 
 * @example
 * ```
 * // Simple text replacement (global, case-sensitive)
 * xjx.transform(regex('hello', 'hi'));
 * 
 * // Full regex with flags
 * xjx.transform(regex('/hello/gi', 'hi'));
 * 
 * // Using RegExp object
 * xjx.transform(regex(/hello/gi, 'hi'));
 * 
 * // SERIALIZE mode: Only apply when serializing
 * xjx.transform(regex(/\d{4}-\d{2}-\d{2}/, 'DATE', { 
 *   intent: TransformIntent.SERIALIZE 
 * }));
 * ```
 * 
 * @param pattern Regular expression pattern (string or RegExp)
 * @param replacement Replacement string (can use capture groups)
 * @param options Transform options
 * @returns A regex transform function
 */
export function regex(
  pattern: RegExp | string, 
  replacement: string,
  options: RegexOptions = {}
): Transform {
  const {
    intent = TransformIntent.PARSE,
    ...restOptions
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
  
  // Include all options in transformOptions, including intent
  const transformOptions = {
    ...restOptions,
    intent
  };
  
  return createTransform((value: any, context?: any) => {
    // Handle null/undefined
    if (value == null) {
      return value;
    }
    
    // Only transform strings
    if (typeof value !== 'string') {
      return value;
    }
    
    // Get the current intent (from context or from options)
    const currentIntent = context?.intent || intent;
    
    // In SERIALIZE mode, only transform if the intent matches
    if (currentIntent === TransformIntent.SERIALIZE && intent !== TransformIntent.SERIALIZE) {
      return value;
    }
    
    // Apply replacement
    return value.replace(re, replacement);
  }, transformOptions);
}
