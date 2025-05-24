/**
 * RegexTransform - Mode-aware regex transformation
 */
import {
  TransformContext,
  TransformResult,
  TransformTarget,
  createTransformResult,
  Transform,
  TransformOptions,
  ProcessingIntent,
  getDefaultMode
} from "../core/transform";
import { logger, validate } from "../core/error";

/**
 * Options for regex transformer
 */
export interface RegexTransformOptions extends TransformOptions {
  /**
   * The pattern to search for
   * Can be a RegExp (with flags), a string, or a string in the format "/pattern/flags"
   */
  pattern: RegExp | string;

  /**
   * The replacement string
   * Can use RegExp capture groups with $1, $2, etc.
   */
  replacement: string;

  /**
   * Whether to only apply to values that match the pattern (default: false)
   * When true, non-matching values are left unchanged
   */
  matchOnly?: boolean;
}

/**
 * RegexTransform class for applying regex transformations
 * 
 * PARSE mode (default): Converts non-strings to strings, then applies regex
 *   Useful for: Data cleanup, format standardization
 * 
 * SERIALIZE mode: Only applies to existing strings, leaves other types unchanged
 *   Useful for: Final formatting, display preparation
 * 
 * Example usage:
 * ```
 * new RegexTransform({
 *   pattern: /(\d{4})-(\d{2})-(\d{2})/,
 *   replacement: '$2/$3/$1' // YYYY-MM-DD to MM/DD/YYYY
 * })
 * 
 * new RegexTransform({
 *   pattern: 'hello',
 *   replacement: 'hi',
 *   mode: ProcessingIntent.SERIALIZE // Only apply to existing strings
 * })
 * ```
 */
export class RegexTransform implements Transform {
  private mode: ProcessingIntent;
  private regex: RegExp;
  private replacement: string;
  private matchOnly: boolean;
  
  /**
   * Array of transform targets - this transform targets text values, CDATA, and comments
   */
  public readonly targets = [
    TransformTarget.Value,
    TransformTarget.Text,
    TransformTarget.CDATA,
    TransformTarget.Comment,
  ];
  
  /**
   * Type identifier for runtime type checking
   */
  public static readonly type = 'RegexTransform';
  public readonly type = RegexTransform.type;
  
  /**
   * Create a new RegexTransform
   * @param options Options for customizing the transform behavior
   */
  constructor(options: RegexTransformOptions) {
    // Validate required options
    validate(!!options.pattern, "RegexTransform requires a pattern option");
    validate(options.replacement !== undefined, "RegexTransform requires a replacement option");
    
    this.mode = options.mode || getDefaultMode();
    this.regex = this.processPattern(options.pattern);
    this.replacement = options.replacement;
    this.matchOnly = options.matchOnly || false;
    
    logger.debug('Created RegexTransform', {
      pattern: this.regex.source,
      flags: this.regex.flags,
      replacement: this.replacement,
      mode: this.mode,
      matchOnly: this.matchOnly
    });
  }
  
  /**
   * Transform implementation - uses processing intent for string conversion behavior
   * @param value Value to transform
   * @param context Transform context
   * @returns Transform result
   */
  transform(value: any, context: TransformContext): TransformResult<any> {
    try {
      // Handle null/undefined
      if (value == null) {
        return createTransformResult(value);
      }
      
      // Apply mode-based logic
      if (this.mode === ProcessingIntent.PARSE) {
        // Parse mode: Convert to string if needed, then apply regex
        return this.applyWithStringConversion(value);
      } else {
        // Serialize mode: Only apply to existing strings
        return this.applyToStringsOnly(value);
      }
    } catch (err) {
      logger.error(`Regex transform error: ${err instanceof Error ? err.message : String(err)}`, {
        value,
        valueType: typeof value,
        mode: this.mode,
        pattern: this.regex.source,
        path: context.path
      });
      
      // Return original value on error
      return createTransformResult(value);
    }
  }
  
  /**
   * Apply regex with string conversion (PARSE mode)
   */
  private applyWithStringConversion(value: any): TransformResult<any> {
    // Convert to string if needed
    const stringValue = String(value);
    
    // Apply regex transformation
    return this.applyRegexToString(stringValue);
  }
  
  /**
   * Apply regex only to existing strings (SERIALIZE mode)
   */
  private applyToStringsOnly(value: any): TransformResult<any> {
    if (typeof value === 'string') {
      return this.applyRegexToString(value);
    } else {
      // Non-string values are left unchanged in serialize mode
      return createTransformResult(value);
    }
  }
  
  /**
   * Apply regex transformation to a string value
   */
  private applyRegexToString(stringValue: string): TransformResult<any> {
    // Check if we should only apply to matching values
    if (this.matchOnly && !this.regex.test(stringValue)) {
      return createTransformResult(stringValue);
    }
    
    // Perform the replacement
    const result = stringValue.replace(this.regex, this.replacement);
    
    // Return the result
    return createTransformResult(result);
  }
  
  /**
   * Process pattern to create a RegExp
   */
  private processPattern(pattern: RegExp | string): RegExp {
    if (pattern instanceof RegExp) {
      // Use the RegExp directly but create a new instance to avoid mutation
      return new RegExp(pattern.source, pattern.flags);
    } else if (typeof pattern === "string") {
      const parsed = this.parseRegExpString(pattern);
      if (parsed) {
        try {
          return new RegExp(parsed.source, parsed.flags || "g");
        } catch (err) {
          // If parsing as regex fails, treat as literal string
          const escapedPattern = this.escapeRegExp(pattern);
          return new RegExp(escapedPattern, "g");
        }
      } else {
        // Not in /pattern/flags format, treat as literal string
        const escapedPattern = this.escapeRegExp(pattern);
        return new RegExp(escapedPattern, "g");
      }
    } else {
      throw new Error("RegexTransform pattern must be a RegExp or string");
    }
  }
  
  /**
   * Escape special characters in a string for use in a RegExp
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  
  /**
   * Parses a string in the format /pattern/flags, respecting escaped slashes
   */
  private parseRegExpString(input: string): { source: string; flags: string } | null {
    if (!input.startsWith("/")) return null;

    let i = 1;
    let inEscape = false;
    while (i < input.length) {
      const char = input[i];

      if (!inEscape && char === "/") {
        // End of pattern, everything after is flags
        const source = input.slice(1, i);
        const flags = input.slice(i + 1);
        return { source, flags };
      }

      inEscape = !inEscape && char === "\\";
      i++;
    }

    // If no closing / found
    return null;
  }
}

/**
 * Create a RegexTransform instance
 * @param options Options for customizing the transform behavior
 * @returns A new RegexTransform instance
 */
export function createRegexTransform(options: RegexTransformOptions): RegexTransform {
  return new RegexTransform(options);
}