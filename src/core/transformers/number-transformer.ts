/**
 * NumberTransformer 
 * 
 * Converts string values to numbers and vice versa
 */
import { TransformContext, XNode } from '../types/transform-types';
import { BaseValueTransformer } from './transformer-base';

/**
 * Options for NumberTransformer
 */
export interface NumberTransformerOptions {
  /**
   * Whether to parse integers
   */
  parseIntegers?: boolean;
  
  /**
   * Whether to parse floating point numbers
   */
  parseFloats?: boolean;
  
  /**
   * Regular expression pattern for integers
   */
  integerPattern?: RegExp;
  
  /**
   * Regular expression pattern for floats
   */
  floatPattern?: RegExp;
  
  /**
   * Optional paths to apply the transformation to
   */
  paths?: string | string[];
}

/**
 * Transformer that converts string values to numeric types and vice versa
 */
export class NumberTransformer extends BaseValueTransformer {
  /**
   * Whether to parse integers
   */
  private parseIntegers: boolean;
  
  /**
   * Whether to parse floating point numbers
   */
  private parseFloats: boolean;
  
  /**
   * Regular expression pattern for integers
   */
  private integerPattern: RegExp;
  
  /**
   * Regular expression pattern for floats
   */
  private floatPattern: RegExp;
  
  /**
   * Create a new NumberTransformer
   * @param options Configuration options
   */
  constructor(options: NumberTransformerOptions = {}) {
    super(options.paths);
    
    // Set default values if not provided
    this.parseIntegers = options.parseIntegers !== false;
    this.parseFloats = options.parseFloats !== false;
    this.integerPattern = options.integerPattern || /^-?\d+$/;
    this.floatPattern = options.floatPattern || /^-?\d*\.\d+$/;
  }
  
  /**
   * Transform a value
   * @param value Value to transform
   * @param node Node containing the value
   * @param context Transformation context
   * @returns Transformed value
   */
  protected transformValue(value: any, node: XNode, context: TransformContext): any {
    // XML to JSON: Convert string to number
    if (context.direction === 'xml-to-json' && typeof value === 'string') {
      const trimmed = value.trim();
      
      // Parse integers
      if (this.parseIntegers && this.integerPattern.test(trimmed)) {
        return parseInt(trimmed, 10);
      }
      
      // Parse floats
      if (this.parseFloats && (this.floatPattern.test(trimmed) || /^-?\d+\.\d+$/.test(trimmed))) {
        return parseFloat(trimmed);
      }
    }
    
    // JSON to XML: Convert number to string
    if (context.direction === 'json-to-xml' && typeof value === 'number') {
      return String(value);
    }
    
    // Return unchanged value if no transformation applies
    return value;
  }
}

// Export the class
export default NumberTransformer;