/**
 * NumberTransform - Converts string values to numbers
 * 
 * Updated to use target format instead of direction.
 */
import { 
  Transform, 
  TransformContext, 
  TransformResult, 
  TransformTarget, 
  createTransformResult,
  FORMATS
} from '../core/types/transform-interfaces';
import { CommonUtils } from '../core/utils/common-utils';
  
/**
 * Options for number transformer
 */
export interface NumberTransformOptions {
  /**
   * Whether to convert integers (default: true)
   */
  integers?: boolean;
  
  /**
   * Whether to convert decimals (default: true)
   */
  decimals?: boolean;
  
  /**
   * Whether to convert scientific notation (default: true)
   */
  scientific?: boolean;
  
  /**
   * Only convert strings that look exactly like numbers
   * If false, will extract numbers from strings with non-numeric characters
   * (default: true)
   */
  strictParsing?: boolean;
  
  /**
   * Decimal separator character (default: ".")
   */
  decimalSeparator?: string;
  
  /**
   * Thousands separator character (default: ",")
   * Will be removed before parsing
   */
  thousandsSeparator?: string;
}

/**
 * NumberTransform - Converts string values to numbers
 * 
 * Example usage:
 * ```
 * XJX.fromXml(xml)
 *    .withTransforms(new NumberTransform({
 *      integers: true,
 *      decimals: true,
 *      strictParsing: true
 *    }))
 *    .toJson();
 * ```
 */
export class NumberTransform implements Transform {
  // Target value and attribute values
  targets = [TransformTarget.Value];
  
  private integers: boolean;
  private decimals: boolean;
  private scientific: boolean;
  private strictParsing: boolean;
  private decimalSeparator: string;
  private thousandsSeparator: string;
  
  /**
   * Create a new number transformer
   * @param options Transformer options
   */
  constructor(options: NumberTransformOptions = {}) {
    this.integers = options.integers !== false; // Default to true
    this.decimals = options.decimals !== false; // Default to true
    this.scientific = options.scientific !== false; // Default to true
    this.strictParsing = options.strictParsing !== false; // Default to true
    this.decimalSeparator = options.decimalSeparator || '.';
    this.thousandsSeparator = options.thousandsSeparator || ',';
  }
  
  /**
   * Transform a value to number if it matches criteria
   * 
   * Uses the target format to determine transformation direction:
   * - For JSON format: strings -> numbers
   * - For XML format: numbers -> strings
   * 
   * @param value Value to transform
   * @param context Transformation context
   * @returns Transformed value result
   */
  transform(value: any, context: TransformContext): TransformResult<any> {
    // Check if we're transforming to JSON or XML
    if (context.targetFormat === FORMATS.JSON) {
      // To JSON: Convert strings to numbers
      return this.stringToNumber(value, context);
    } else if (context.targetFormat === FORMATS.XML) {
      // To XML: Convert numbers to strings
      return this.numberToString(value, context);
    }
    
    // For any other format, keep as is
    return createTransformResult(value);
  }
  
  /**
   * Convert a string to number
   * @private
   */
  private stringToNumber(value: any, context: TransformContext): TransformResult<any> {
    // Already a number, return as is
    if (typeof value === 'number') {
      return createTransformResult(value);
    }
    
    // Try to use CommonUtils for simple cases
    if (this.isDefaultConfiguration()) {
      // Use the common utility function with default settings
      const numValue = CommonUtils.toNumber(value);
      
      // Only transform if it was actually a number
      if (typeof numValue === 'number' && !isNaN(numValue)) {
        // When using strict parsing, check that the original was a clean number
        if (this.strictParsing) {
          const strValue = String(value).trim();
          // Simple regex to check for clean numeric format
          if (/^-?(\d+|\d*\.\d+|\d+\.\d*)(e[+-]?\d+)?$/i.test(strValue)) {
            return createTransformResult(numValue);
          }
        } else {
          return createTransformResult(numValue);
        }
      }
    }
    
    // For more complex cases or custom options, use the full implementation
    return this.transformComplex(value);
  }
  
  /**
   * Convert a number to string
   * @private
   */
  private numberToString(value: any, context: TransformContext): TransformResult<any> {
    // Only convert number values
    if (typeof value === 'number') {
      return createTransformResult(String(value));
    }
    
    // Otherwise return unchanged
    return createTransformResult(value);
  }

  /**
   * Check if using default configuration
   * @returns True if using default configuration
   * @private
   */
  private isDefaultConfiguration(): boolean {
    return this.integers === true && 
           this.decimals === true && 
           this.scientific === true && 
           this.strictParsing === true && 
           this.decimalSeparator === '.' &&
           this.thousandsSeparator === ',';
  }

  /**
   * Complex transformation with custom options
   * @param value Value to transform
   * @returns Transform result
   * @private
   */
  private transformComplex(value: any): TransformResult<any> {
    // Convert to string for parsing
    const strValue = String(value);
    
    // Skip empty strings
    if (!strValue.trim()) {
      return createTransformResult(value);
    }
    
    // Remove thousands separators
    let normalized = strValue;
    if (this.thousandsSeparator) {
      const thousandSepRegex = new RegExp(`\\${this.thousandsSeparator}`, 'g');
      normalized = normalized.replace(thousandSepRegex, '');
    }
    
    // Replace custom decimal separator with dot
    if (this.decimalSeparator && this.decimalSeparator !== '.') {
      const decimalSepRegex = new RegExp(`\\${this.decimalSeparator}`, 'g');
      normalized = normalized.replace(decimalSepRegex, '.');
    }
    
    // If strict parsing is enabled, check if the value is a valid number
    if (this.strictParsing) {
      // Create regex based on enabled options
      let regexParts = [];
      
      if (this.integers) {
        regexParts.push('-?\\d+');
      }
      
      if (this.decimals) {
        regexParts.push('-?\\d*\\.\\d+');
      }
      
      if (this.scientific) {
        regexParts.push('-?\\d*\\.?\\d+[eE][+-]?\\d+');
      }
      
      // Combine regexes with OR operator
      const regex = new RegExp(`^(${regexParts.join('|')})$`);
      
      if (!regex.test(normalized)) {
        return createTransformResult(value);
      }
    }
    
    // Parse the number
    const parsed = parseFloat(normalized);
    
    // Return the parsed number if it's valid, otherwise original value
    return createTransformResult(isNaN(parsed) ? value : parsed);
  }
}