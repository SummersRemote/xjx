/**
 * NumberTransform - Converts string values to numbers
 */
import { 
    Transform, 
    TransformContext, 
    TransformResult, 
    TransformTarget, 
    transformResult 
  } from '../../core/types/transform-interfaces';
  
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
     */
    transform(value: any, context: TransformContext): TransformResult<any> {
      // Already a number, return as is
      if (typeof value === 'number') {
        return transformResult(value);
      }
      
      // Convert to string for parsing
      const strValue = String(value);
      
      // Skip empty strings
      if (!strValue.trim()) {
        return transformResult(value);
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
          return transformResult(value);
        }
      }
      
      // Parse the number
      const parsed = parseFloat(normalized);
      
      // Return the parsed number if it's valid, otherwise original value
      return transformResult(isNaN(parsed) ? value : parsed);
    }
  }