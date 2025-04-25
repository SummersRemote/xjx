/**
 * Number value transformer for the XJX library
 */
import { ValueTransformer, TransformContext } from './ValueTransformer';

/**
 * Interface for NumberTransformer options
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
   * Integer format in XML (if specified)
   */
  integerFormat?: RegExp | string;
  
  /**
   * Float format in XML (if specified)
   */
  floatFormat?: RegExp | string;
}

/**
 * Transforms string values to number types and vice versa
 */
export class NumberTransformer extends ValueTransformer {
  /**
   * Whether to parse integers
   */
  private parseIntegers: boolean;
  
  /**
   * Whether to parse floating point numbers
   */
  private parseFloats: boolean;
  
  /**
   * Integer format in XML (if specified)
   */
  private integerFormat?: RegExp;
  
  /**
   * Float format in XML (if specified)
   */
  private floatFormat?: RegExp;
  
  /**
   * Creates a new NumberTransformer
   * @param options Transformer options
   */
  constructor(options: NumberTransformerOptions = {}) {
    super();
    
    // Set default values if not provided
    this.parseIntegers = options.parseIntegers !== false;
    this.parseFloats = options.parseFloats !== false;
    
    // Compile regex patterns if provided as strings
    if (options.integerFormat) {
      this.integerFormat = options.integerFormat instanceof RegExp 
        ? options.integerFormat 
        : new RegExp(options.integerFormat);
    } else {
      this.integerFormat = /^-?\d+$/;
    }
    
    if (options.floatFormat) {
      this.floatFormat = options.floatFormat instanceof RegExp 
        ? options.floatFormat 
        : new RegExp(options.floatFormat);
    } else {
      this.floatFormat = /^-?\d*\.\d+$/;
    }
  }
  
  /**
   * Transform a value from XML to JSON representation
   * @param value Value from XML
   * @param context Transformation context
   * @returns Transformed value for JSON
   */
  protected xmlToJson(value: any, context: TransformContext): any {
    // Only process strings in XML-to-JSON direction
    if (typeof value !== 'string') return value;
    
    const trimmed = value.trim();
    
    // Check for integers
    if (this.parseIntegers && this.integerFormat!.test(trimmed)) {
      return parseInt(trimmed, 10);
    }
    
    // Check for floating point numbers
    if (this.parseFloats && (this.floatFormat!.test(trimmed) || /^-?\d+\.\d+$/.test(trimmed))) {
      return parseFloat(trimmed);
    }
    
    // If no transformation applies, return original value
    return value;
  }
  
  /**
   * Transform a value from JSON to XML representation
   * @param value Value from JSON
   * @param context Transformation context
   * @returns Transformed value for XML
   */
  protected jsonToXml(value: any, context: TransformContext): any {
    // Only process numbers in JSON-to-XML direction
    if (typeof value !== 'number') return value;
    
    // Convert to string representation
    return String(value);
  }
}