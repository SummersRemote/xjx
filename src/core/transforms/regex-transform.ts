/**
 * RegexTransform - Performs regex replacements on values
 */
import { 
  Transform, 
  TransformContext, 
  TransformResult, 
  TransformTarget, 
  createTransformResult 
} from '../types/transform-interfaces';
import { XJXError } from '../types/error-types';

/**
 * Options for value regex transformer
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
   * Create a new value regex transformer
   */
  constructor(options: RegexOptions) {
    if (!options.pattern) {
      throw new XJXError('RegexTransform requires a pattern option');
    }
    
    if (options.replacement === undefined) {
      throw new XJXError('RegexTransform requires a replacement option');
    }
    
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
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}