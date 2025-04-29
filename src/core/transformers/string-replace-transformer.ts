/**
 * String replace transformer implementation
 * 
 * Replaces text in string values using regex or simple string replacement
 */
import { 
    BaseValueTransformer
  } from './transformer-base';
  import { XNode, TransformContext } from '../types/transform-types';
  
  /**
   * Options for string replace transformer
   */
  export interface StringReplaceOptions {
    /**
     * Paths to apply this transformer to (optional)
     * Uses path matching syntax (e.g., "root.items.*.description")
     */
    paths?: string | string[];
    
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
    
    /**
     * Only apply to string values (default: true)
     */
    stringsOnly?: boolean;
  }
  
  /**
   * Default options for string replace transformer
   */
  const DEFAULT_OPTIONS: Partial<StringReplaceOptions> = {
    ignoreCase: false,
    replaceAll: true,
    stringsOnly: true
  };
  
  /**
   * String replace transformer that performs regex/string replacements on text values
   * 
   * Example usage:
   * ```
   * const urlLinkifier = new StringReplaceTransformer({
   *   paths: ['root.content.*.text'],
   *   pattern: /(https?:\/\/[\w-]+(\.[\w-]+)+[\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])/g,
   *   replacement: '<a href="$1">$1</a>'
   * });
   * xjx.transformValue(TransformDirection.XML_TO_JSON, urlLinkifier);
   * ```
   */
  export class StringReplaceTransformer extends BaseValueTransformer {
    private options: StringReplaceOptions;
    private regex: RegExp;
    
    /**
     * Create a new string replace transformer
     * @param options Transformer options
     */
    constructor(options: StringReplaceOptions) {
      // Validate required options
      if (!options.pattern) {
        throw new Error('StringReplaceTransformer requires a pattern option');
      }
      if (options.replacement === undefined) {
        throw new Error('StringReplaceTransformer requires a replacement option');
      }
      
      super(options.paths);
      this.options = { ...DEFAULT_OPTIONS, ...options };
      
      // Create regex from pattern
      if (options.pattern instanceof RegExp) {
        this.regex = options.pattern;
      } else {
        // For string patterns, create a regex based on options
        const flags = this.options.ignoreCase ? 'gi' : 'g';
        const escapedPattern = this.escapeRegExp(options.pattern);
        this.regex = new RegExp(escapedPattern, flags);
      }
      
      // If not replacing all, modify the regex to not have the global flag
      if (this.options.replaceAll === false && this.regex.flags.includes('g')) {
        const flags = this.regex.flags.replace('g', '');
        this.regex = new RegExp(this.regex.source, flags);
      }
    }
    
    /**
     * Transform a string value using the configured replacement
     * @param value Value to transform
     * @param node Node containing the value
     * @param context Transformation context
     * @returns Transformed string if replaced, otherwise original value
     */
    protected transformValue(value: any, node: XNode, context: TransformContext): any {
      // Skip non-string values if stringsOnly is enabled
      if (this.options.stringsOnly && typeof value !== 'string') {
        return value;
      }
      
      // Convert to string for replacement
      const strValue = String(value);
      
      // Perform the replacement
      const result = strValue.replace(this.regex, this.options.replacement);
      
      // Only return the new value if something changed
      return result !== strValue ? result : value;
    }
    
    /**
     * Escape special characters in a string for use in a RegExp
     * @param string String to escape
     * @returns Escaped string
     */
    private escapeRegExp(string: string): string {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
  }