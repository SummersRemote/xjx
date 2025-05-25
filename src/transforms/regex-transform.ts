/**
 * Regex transform - Apply regular expression replacements to string values
 */
import { Transform, TransformOptions, TransformIntent, createTransform } from '../core/transform';

/**
 * Options for regex transform
 */
export interface RegexOptions extends TransformOptions {
  /**
   * Whether to only apply to values that match the pattern (default: false)
   * When true, non-matching values are left unchanged
   */
  matchOnly?: boolean;
  
  /**
   * Regular expression flags (default: 'g')
   * Only used when pattern is a string
   */
  flags?: string;
}

/**
 * Create a transform that applies a regex replacement
 * 
 * @example
 * ```
 * // PARSE mode (default): Apply to all string values
 * xjx.transform(regex(/\s+/g, ''));
 * 
 * // Add currency symbol
 * xjx.transform(regex(/^(\d+(\.\d+)?)$/, '$$1'));
 * 
 * // With string pattern and custom flags
 * xjx.transform(regex('hello', 'hi', { flags: 'gi' }));
 * 
 * // Only transform matching values
 * xjx.transform(regex(/^\d+$/, 'NUMBER', { matchOnly: true }));
 * 
 * // SERIALIZE mode: Only apply to string values
 * xjx.transform(regex(/\d{4}-\d{2}-\d{2}/, 'DATE', { 
 *   intent: TransformIntent.SERIALIZE 
 * }));
 * ```
 * 
 * @param pattern Regular expression pattern (string or RegExp)
 * @param replacement Replacement string (can use capture groups)
 * @param options Regex transform options
 * @returns A regex transform function
 */
export function regex(
  pattern: RegExp | string, 
  replacement: string,
  options: RegexOptions = {}
): Transform {
  const {
    matchOnly = false,
    flags = 'g',
    intent = TransformIntent.PARSE,
    ...transformOptions
  } = options;
  
  // Create RegExp object
  const re = pattern instanceof RegExp 
    ? new RegExp(pattern.source, pattern.flags) 
    : new RegExp(pattern, flags);
  
  return createTransform((value: any) => {
    // Handle null/undefined
    if (value == null) {
      return value;
    }
    
    // Only transform strings
    if (typeof value !== 'string') {
      return value;
    }
    
    // In SERIALIZE mode, only transform if the intent is to produce a string representation
    // In PARSE mode, always transform strings
    if (intent === TransformIntent.SERIALIZE && typeof value !== 'string') {
      return value;
    }
    
    // Check if we should only transform matching values
    if (matchOnly && !re.test(value)) {
      // Reset lastIndex since test() advances it
      re.lastIndex = 0;
      return value;
    }
    
    // Apply replacement
    return value.replace(re, replacement);
  }, transformOptions);
}

/**
 * Extended regex transform with support for multiple patterns
 * 
 * @example
 * ```
 * // Apply multiple replacements in sequence
 * xjx.transform(regexMulti([
 *   { pattern: /\s+/g, replacement: ' ' },  // Normalize whitespace
 *   { pattern: /[^\w\s]/g, replacement: '' }, // Remove special chars
 *   { pattern: /^\s+|\s+$/g, replacement: '' } // Trim
 * ]));
 * ```
 * 
 * @param patterns Array of pattern and replacement pairs
 * @param options Regex transform options
 * @returns A regex transform function
 */
export function regexMulti(
  patterns: Array<{ pattern: RegExp | string, replacement: string, flags?: string }>,
  options: RegexOptions = {}
): Transform {
  const { 
    matchOnly = false, 
    intent = TransformIntent.PARSE,
    ...transformOptions 
  } = options;
  
  // Create RegExp objects for all patterns
  const regexps = patterns.map(({ pattern, replacement, flags = 'g' }) => {
    const re = pattern instanceof RegExp 
      ? new RegExp(pattern.source, pattern.flags) 
      : new RegExp(pattern, flags);
    
    return { re, replacement };
  });
  
  return createTransform((value: any) => {
    // Handle null/undefined
    if (value == null) {
      return value;
    }
    
    // Only transform strings
    if (typeof value !== 'string') {
      return value;
    }
    
    // In SERIALIZE mode, only transform if the intent is to produce a string representation
    // In PARSE mode, always transform strings
    if (intent === TransformIntent.SERIALIZE && typeof value !== 'string') {
      return value;
    }
    
    // Apply each pattern in sequence
    let result = value;
    
    for (const { re, replacement } of regexps) {
      // Check if we should only transform matching values
      if (matchOnly && !re.test(result)) {
        // Reset lastIndex since test() advances it
        re.lastIndex = 0;
        continue;
      }
      
      // Apply replacement
      result = result.replace(re, replacement);
    }
    
    return result;
  }, transformOptions);
}