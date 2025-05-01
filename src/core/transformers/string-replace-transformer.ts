/**
 * String replace transformer implementation (simplified)
 * Path matching feature has been removed
 */
import { BaseValueTransformer, TransformerOptions } from './transformer-base';
import { XNode, TransformContext, TransformResult, transformResult } from '../types/transform-types';

/**
 * Options for string replace transformer
 */
export interface StringReplaceOptions extends TransformerOptions {
  /**
   * The pattern to search for
   * Can be a string or RegExp
   */
  pattern: string | RegExp;
  
  /**
   * The replacement string
   * Can use RegExp capture groups with $1, $2, etc.
   */
  replacement: string;
  
  /**
   * Whether to ignore case (for string patterns only, default: false)
   * For RegExp patterns, use the 'i' flag instead
   */
  ignoreCase?: boolean;
  
  /**
   * Whether to replace all occurrences (default: true)
   * If false, only replaces the first occurrence
   */
  replaceAll?: boolean;
}

/**
 * String replace transformer that performs regex/string replacements on text values
 * 
 * Example usage:
 * ```
 * const urlLinkifier = new StringReplaceTransformer({
 *   pattern: /(https?:\/\/[\w-]+(\.[\w-]+)+[\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])/g,
 *   replacement: '<a href="$1">$1</a>'
 * });
 * xjx.addValueTransformer(TransformDirection.XML_TO_JSON, urlLinkifier);
 * ```
 */
export class StringReplaceTransformer extends BaseValueTransformer {
  private pattern: string | RegExp;
  private replacement: string;
  private regex: RegExp;
  
  /**
   * Create a new string replace transformer
   */
  constructor(options: StringReplaceOptions) {
    if (!options.pattern) {
      throw new Error('StringReplaceTransformer requires a pattern option');
    }
    if (options.replacement === undefined) {
      throw new Error('StringReplaceTransformer requires a replacement option');
    }
    
    super(options);
    
    this.pattern = options.pattern;
    this.replacement = options.replacement;
    
    // Create regex from pattern
    if (options.pattern instanceof RegExp) {
      this.regex = options.pattern;
    } else {
      const ignoreCase = options.ignoreCase === true;
      const replaceAll = options.replaceAll !== false; // Default to true
      
      const flags = (ignoreCase ? 'i' : '') + (replaceAll ? 'g' : '');
      const escapedPattern = this.escapeRegExp(options.pattern);
      this.regex = new RegExp(escapedPattern, flags);
    }
  }
  
  /**
   * Transform a string value using the configured replacement
   */
  protected transformValue(value: any, node: XNode, context: TransformContext): TransformResult<any> {
    // Skip non-string values
    if (typeof value !== 'string') {
      return transformResult(value);
    }
    
    // Perform the replacement
    const result = value.replace(this.regex, this.replacement);
    
    // Only return the new value if something changed
    return transformResult(result !== value ? result : value);
  }
  
  /**
   * Escape special characters in a string for use in a RegExp
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}