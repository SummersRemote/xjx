/**
 * NumberTransform - Converts string values to numbers
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
   * @param value Value to transform
   * @param context Transformation context
   * @returns Transformed value result
   */
  transform(value: any, context: TransformContext): TransformResult<any> {
    // Already a number, return as is
    if (typeof value === 'number') {
      return createTransformResult(value);
    }
    
    // Handle elements with attributes specially
    if (value && typeof value === 'object') {
      const textKey = context.config.propNames.textKey;
      
      // If this is an object with text key, apply transformation to the text value
      if (value[textKey] !== undefined) {
        const result = this.transformValue(value[textKey]);
        if (result !== value[textKey]) {
          const newValue = { ...value };
          newValue[textKey] = result;
          return createTransformResult(newValue);
        }
      }
      
      return createTransformResult(value);
    }
    
    // For simple strings, just transform directly
    return createTransformResult(this.transformValue(value));
  }

  // Helper method to transform individual values
  private transformValue(value: any): any {
    // Skip non-string values if they're not numbers already
    if (typeof value === 'number') {
      return value;
    }
    
    if (typeof value !== 'string') {
      return value;
    }
    
    // Use the default utility or complex implementation based on configuration
    if (this.isDefaultConfiguration()) {
      const numValue = CommonUtils.toNumber(value);
      
      if (typeof numValue === 'number' && !isNaN(numValue)) {
        if (this.strictParsing) {
          const strValue = String(value).trim();
          if (/^-?(\d+|\d*\.\d+|\d+\.\d*)(e[+-]?\d+)?$/i.test(strValue)) {
            return numValue;
          }
        } else {
          return numValue;
        }
      }
    }
    
    return this.transformComplex(value);
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
   * @returns Transformed value
   * @private
   */
  private transformComplex(value: any): any {
    // Convert to string for parsing
    const strValue = String(value);
    
    // Skip empty strings
    if (!strValue.trim()) {
      return value;
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
        return value;
      }
    }
    
    // Parse the number
    const parsed = parseFloat(normalized);
    
    // Return the parsed number if it's valid, otherwise original value
    return isNaN(parsed) ? value : parsed;
  }
}