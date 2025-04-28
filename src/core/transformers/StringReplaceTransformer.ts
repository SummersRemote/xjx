/**
 * String replacement transformer for the XJX library
 */
import { ValueTransformer, TransformContext } from './ValueTransformer';

/**
 * Interface for StringReplaceTransformer options
 */
export interface StringReplaceTransformerOptions {
  /**
   * Regex pattern in string form "/pattern/flags"
   */
  pattern?: string;
  
  /**
   * Replacement string
   */
  replacement?: string;
}

/**
 * Transforms string values by applying regex replacements
 */
export class StringReplaceTransformer extends ValueTransformer {
  /**
   * Regex pattern to match
   */
  private regex: RegExp;
  
  /**
   * Replacement string
   */
  private replacement: string;
  
  /**
   * Creates a StringReplaceTransformer
   * @param options Configuration options
   */
  constructor(options: StringReplaceTransformerOptions = {}) {
    super();
    
    this.replacement = options.replacement || '';
    
    // Parse and compile the regex from string representation
    try {
      // Extract pattern and flags from the string format "/pattern/flags"
      const patternStr = options.pattern || '';
      const matches = patternStr.match(/^\/(.*?)\/([gimyus]*)$/);
      
      if (matches) {
        const [, pattern, flags] = matches;
        this.regex = new RegExp(pattern, flags);
      } else {
        // If not in /pattern/flags format, treat the whole string as a literal pattern
        this.regex = new RegExp(patternStr);
      }
    } catch (error) {
      console.error(`Invalid regex pattern: ${error instanceof Error ? error.message : String(error)}`);
      // Create a safe fallback regex that won't match anything
      this.regex = new RegExp('(?!)');
    }
  }
  
  /**
   * Transform a value from XML to JSON representation
   * @param value Value from XML
   * @param context Transformation context
   * @returns Transformed value for JSON
   */
  protected xmlToJson(value: any, context: TransformContext): any {
    // Only process string values
    if (typeof value !== 'string') return value;
    
    try {
      // Apply the regex replacement
      return value.replace(this.regex, this.replacement);
    } catch (error) {
      console.error(`Error applying string replacement: ${error instanceof Error ? error.message : String(error)}`);
      return value;
    }
  }
  
  /**
   * Transform a value from JSON to XML representation
   * @param value Value from JSON
   * @param context Transformation context
   * @returns Transformed value for XML
   */
  protected jsonToXml(value: any, context: TransformContext): any {
    // Only process string values
    if (typeof value !== 'string') return value;
    
    try {
      // Apply the regex replacement
      return value.replace(this.regex, this.replacement);
    } catch (error) {
      console.error(`Error applying string replacement: ${error instanceof Error ? error.message : String(error)}`);
      return value;
    }
  }
}