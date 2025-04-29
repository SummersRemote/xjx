/**
 * Number value transformer implementation
 * 
 * Transforms string values to numbers if they match number patterns,
 * including integer, decimal, and scientific notation
 */
import { 
    BaseValueTransformer
  } from './transformer-base';
  import { XNode, TransformContext } from '../types/transform-types';
  
  /**
   * Options for number transformer
   */
  export interface NumberTransformerOptions {
    /**
     * Paths to apply this transformer to (optional)
     * Uses path matching syntax (e.g., "root.items.*.value")
     */
    paths?: string | string[];
    
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
     * Whether to convert only string values (default: true)
     * If false, will attempt to convert values of any type
     */
    stringsOnly?: boolean;
    
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
   * Default options for number transformer
   */
  const DEFAULT_OPTIONS: NumberTransformerOptions = {
    integers: true,
    decimals: true,
    scientific: true,
    strictParsing: true,
    stringsOnly: true,
    decimalSeparator: '.',
    thousandsSeparator: ','
  };
  
  /**
   * Number transformer that converts string values to numbers
   * 
   * Example usage:
   * ```
   * const numberTransformer = new NumberTransformer({
   *   paths: ['root.items.*.price', 'root.items.*.quantity'],
   *   strictParsing: false
   * });
   * xjx.transformValue(TransformDirection.XML_TO_JSON, numberTransformer);
   * ```
   */
  export class NumberTransformer extends BaseValueTransformer {
    private options: NumberTransformerOptions;
    
    /**
     * Create a new number transformer
     * @param options Transformer options
     */
    constructor(options: NumberTransformerOptions = {}) {
      super(options.paths);
      this.options = { ...DEFAULT_OPTIONS, ...options };
    }
    
    /**
     * Transform a value to number if it matches criteria
     * @param value Value to transform
     * @param node Node containing the value
     * @param context Transformation context
     * @returns Number value if converted, otherwise original value
     */
    protected transformValue(value: any, node: XNode, context: TransformContext): any {
      // Skip if not a string and stringsOnly is true
      if (this.options.stringsOnly && typeof value !== 'string') {
        return value;
      }
      
      // Already a number, return as is
      if (typeof value === 'number') {
        return value;
      }
      
      // Convert value to string for parsing
      const strValue = String(value);
      
      // Skip empty strings
      if (!strValue.trim()) {
        return value;
      }
      
      // Remove thousands separators if specified
      let normalized = strValue;
      if (this.options.thousandsSeparator) {
        const thousandSepRegex = new RegExp(`\\${this.options.thousandsSeparator}`, 'g');
        normalized = normalized.replace(thousandSepRegex, '');
      }
      
      // Replace custom decimal separator with dot for parsing
      if (this.options.decimalSeparator && this.options.decimalSeparator !== '.') {
        const decimalSepRegex = new RegExp(`\\${this.options.decimalSeparator}`, 'g');
        normalized = normalized.replace(decimalSepRegex, '.');
      }
      
      // If strict parsing is enabled, only convert strings that look exactly like numbers
      if (this.options.strictParsing) {
        // Create regex based on enabled options
        let regexParts = [];
        
        if (this.options.integers) {
          regexParts.push('\\d+');
        }
        
        if (this.options.decimals) {
          regexParts.push('\\d*\\.\\d+');
        }
        
        if (this.options.scientific) {
          regexParts.push('\\d*\\.?\\d+[eE][+-]?\\d+');
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