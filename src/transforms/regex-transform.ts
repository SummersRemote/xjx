/**
 * RegexTransform - Performs regex replacements on values
 * 
 * Refactored to use the new static utilities.
 */
import { 
  Transform, 
  TransformContext, 
  TransformResult, 
  TransformTarget, 
  createTransformResult 
} from '../core/types/transform-interfaces';
import { ErrorUtils } from '../core/utils/error-utils';

/**
 * Options for regex transformer
 */
export interface RegexOptions {
  /**
   * The pattern to search for
   * Can be a RegExp (with flags) or a string
   */
  pattern: RegExp | string;
  
  /**
   * The replacement string
   * Can use RegExp capture groups with $1, $2, etc.
   */
  replacement: string;
}

/**
 * RegexTransform - Performs regex replacements on text and attribute values
 * 
 * Example usage:
 * ```
 * // Simple string replacement
 * XJX.fromXml(xml)
 *    .withTransforms(new RegexTransform({
 *      pattern: "foo",
 *      replacement: "bar"
 *    }))
 *    .toJson();
 * 
 * // RegExp with flags for case-insensitive global replacement
 * XJX.fromXml(xml)
 *    .withTransforms(new RegexTransform({
 *      pattern: /(https?:\/\/[\w-]+(\.[\w-]+)+[\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])/gi,
 *      replacement: '<a href="$1">$1</a>'
 *    }))
 *    .toJson();
 * ```
 */
export class RegexTransform implements Transform {
  // Target text values, CDATA, and comments
  targets = [
    TransformTarget.Value, 
    TransformTarget.Text, 
    TransformTarget.CDATA, 
    TransformTarget.Comment
  ];
  
  private regex: RegExp;
  private replacement: string;
  
  /**
   * Create a new regex transformer
   * @param options Transformer options
   */
  constructor(options: RegexOptions) {
    ErrorUtils.validate(
      !!options.pattern,
      'RegexTransform requires a pattern option',
      'general'
    );
    
    ErrorUtils.validate(
      options.replacement !== undefined,
      'RegexTransform requires a replacement option',
      'general'
    );
    
    this.replacement = options.replacement;
    
    // Create regex from pattern
    if (options.pattern instanceof RegExp) {
      // Use the RegExp directly with its flags
      this.regex = options.pattern;
    } else {
      // For string patterns, create a RegExp with global flag by default
      // This ensures all occurrences are replaced
      const escapedPattern = this.escapeRegExp(options.pattern);
      this.regex = new RegExp(escapedPattern, 'g');
    }
  }
  
  /**
   * Transform a string value using the configured regex replacement
   * @param value Value to transform
   * @param context Transformation context
   * @returns Transformed value result
   */
  transform(value: any, context: TransformContext): TransformResult<any> {
    // Skip non-string values
    if (typeof value !== 'string') {
      return createTransformResult(value);
    }
    
    // Perform the replacement
    const result = value.replace(this.regex, this.replacement);
    
    // Only return the new value if something changed
    return createTransformResult(result !== value ? result : value);
  }
  
  /**
   * Escape special characters in a string for use in a RegExp
   * @param string String to escape
   * @returns Escaped string
   * @private
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}