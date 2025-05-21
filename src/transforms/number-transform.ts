/**
 * NumberTransform - Converts string values to numbers
 */
import { 
  TransformContext, 
  TransformResult, 
  TransformTarget,
  createTransformResult,
  FORMAT
} from '../core/transform';
import { logger } from '../core/error';

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
 * NumberTransform class for converting string values to numbers
 * 
 * Example usage:
 * ```
 * XJX.fromXml(xml)
 *    .withTransforms(new NumberTransform({
 *      decimals: true,
 *      scientific: true
 *    }))
 *    .toJson();
 * ```
 */
export class NumberTransform {
  private integers: boolean;
  private decimals: boolean;
  private scientific: boolean;
  private decimalSeparator: string;
  private thousandsSeparator: string;
  
  /**
   * Array of transform targets - this transform targets values only
   */
  public readonly targets = [TransformTarget.Value];
  
  /**
   * Create a new NumberTransform
   * @param options Options for customizing the transform behavior
   */
  constructor(options: NumberTransformOptions = {}) {
    this.integers = options.integers !== false; // Default to true
    this.decimals = options.decimals !== false; // Default to true
    this.scientific = options.scientific !== false; // Default to true
    this.decimalSeparator = options.decimalSeparator || '.';
    this.thousandsSeparator = options.thousandsSeparator || ',';
  }
  
  /**
   * Transform implementation
   * @param value Value to transform
   * @param context Transform context
   * @returns Transform result
   */
  transform(value: any, context: TransformContext): TransformResult<any> {
    try {
      // Check if we're transforming to JSON or XML
      if (context.targetFormat === FORMAT.JSON) {
        // To JSON: Convert strings to numbers
        return this.stringToNumber(value);
      } else if (context.targetFormat === FORMAT.XML) {
        // To XML: Convert numbers to strings
        return this.numberToString(value);
      }
      
      // For any other format, keep as is
      return createTransformResult(value);
    } catch (err) {
      logger.error(`Number transform error: ${err instanceof Error ? err.message : String(err)}`, {
        value,
        valueType: typeof value,
        path: context.path
      });
      
      // Return original value on error
      return createTransformResult(value);
    }
  }
  
  /**
   * Convert a string to number
   */
  private stringToNumber(value: any): TransformResult<any> {
    // Already a number, return as is
    if (typeof value === 'number') {
      return createTransformResult(value);
    }
    
    // Skip non-string values
    if (typeof value !== 'string') {
      return createTransformResult(value);
    }
    
    // Try simple conversion first
    if (this.isDefaultConfiguration()) {
      const trimmed = value.trim();
      const parsed = Number(trimmed);
      
      if (!isNaN(parsed)) {
        return createTransformResult(parsed);
      }
    }
    
    // For more complex cases or custom options, use the full implementation
    return this.transformComplex(value);
  }
  
  /**
   * Check if using default configuration
   */
  private isDefaultConfiguration(): boolean {
    return this.integers === true && 
           this.decimals === true && 
           this.scientific === true && 
           this.decimalSeparator === '.' &&
           this.thousandsSeparator === ',';
  }
  
  /**
   * Convert a number to string
   */
  private numberToString(value: any): TransformResult<any> {
    // Only convert number values
    if (typeof value === 'number') {
      return createTransformResult(String(value));
    }
    
    // Otherwise return unchanged
    return createTransformResult(value);
  }
  
  /**
   * Complex transformation with custom options
   */
  private transformComplex(value: any): TransformResult<any> {
    const strValue = String(value).trim();
    if (!strValue) return createTransformResult(value);
  
    let patternParts: string[] = [];
    let escapedDecimal = this.decimalSeparator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let escapedThousands = this.thousandsSeparator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
    // Build integer pattern with proper thousands separator grouping
    if (this.integers) {
      let intPattern = `(?:-?(?:\\d{1,3}(?:${escapedThousands}\\d{3})*))`;
      patternParts.push(intPattern);
    }
  
    // Build decimal pattern
    if (this.decimals) {
      let decPattern = `(?:-?(?:\\d{1,3}(?:${escapedThousands}\\d{3})*|\\d*)${escapedDecimal}\\d+)`;
      patternParts.push(decPattern);
    }
  
    // Build scientific notation pattern (with optional decimal)
    if (this.scientific) {
      let sciPattern = `(?:-?(?:\\d+(?:${escapedDecimal}\\d+)?|\\d*${escapedDecimal}\\d+)[eE][+-]?\\d+)`;
      patternParts.push(sciPattern);
    }
  
    const fullPattern = `^(${patternParts.join('|')})$`;
    const regex = new RegExp(fullPattern);
  
    if (!regex.test(strValue)) {
      return createTransformResult(value);
    }
  
    // Normalize to JS-parsable format
    let normalized = strValue;
  
    if (this.thousandsSeparator) {
      const sepRegex = new RegExp(escapedThousands, 'g');
      normalized = normalized.replace(sepRegex, '');
    }
  
    if (this.decimalSeparator !== '.') {
      const decRegex = new RegExp(escapedDecimal, 'g');
      normalized = normalized.replace(decRegex, '.');
    }
  
    const parsed = parseFloat(normalized);
    return createTransformResult(isNaN(parsed) ? value : parsed);
  }
}

/**
 * Create a NumberTransform instance
 * @param options Options for customizing the transform behavior
 * @returns A new NumberTransform instance
 */
export function createNumberTransform(options: NumberTransformOptions = {}): NumberTransform {
  return new NumberTransform(options);
}