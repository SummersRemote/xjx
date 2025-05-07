/**
 * StringReplaceTransform - Performs text replacements using strings or RegExp
 */
import { 
    Transform, 
    TransformContext, 
    TransformResult, 
    TransformTarget, 
    createTransformResult 
  } from '../../core/types/transform-interfaces';
  import { XJXError } from '../../core/types/error-types';
  
  /**
   * Options for string replace transformer
   */
  export interface StringReplaceOptions {
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
   * StringReplaceTransform - Performs regex/string replacements on text values
   * 
   * Example usage:
   * ```
   * XJX.fromXml(xml)
   *    .withTransforms(new StringReplaceTransform({
   *      pattern: /(https?:\/\/[\w-]+(\.[\w-]+)+[\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])/g,
   *      replacement: '<a href="$1">$1</a>'
   *    }))
   *    .toJson();
   * ```
   */
  export class StringReplaceTransform implements Transform {
    // Target text values, CDATA, and comments
    targets = [
      TransformTarget.Value, 
      TransformTarget.Text, 
      TransformTarget.CDATA, 
      TransformTarget.Comment
    ];
    
    private pattern: string | RegExp;
    private replacement: string;
    private regex: RegExp;
    
    /**
     * Create a new string replace transformer
     */
    constructor(options: StringReplaceOptions) {
      if (!options.pattern) {
        throw new XJXError('StringReplaceTransform requires a pattern option');
      }
      if (options.replacement === undefined) {
        throw new XJXError('StringReplaceTransform requires a replacement option');
      }
      
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