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
} from '../core/transform';
import { handleError, ErrorType } from '../core/error';
  
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

  /**
   * Optional format this transform applies to
   * If provided, the transform will only be applied for this format
   */
  format?: string;
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
 *      scientific: true
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
  private decimalSeparator: string;
  private thousandsSeparator: string;
  private format?: string;
  
  /**
   * Create a new number transformer
   * @param options Transformer options
   */
  constructor(options: NumberTransformOptions = {}) {
    this.integers = options.integers !== false; // Default to true
    this.decimals = options.decimals !== false; // Default to true
    this.scientific = options.scientific !== false; // Default to true
    this.decimalSeparator = options.decimalSeparator || '.';
    this.thousandsSeparator = options.thousandsSeparator || ',';
    this.format = options.format;
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
    try {
      // If format-specific and doesn't match current format, skip
      if (this.format !== undefined && this.format !== context.targetFormat) {
        return createTransformResult(value);
      }
      
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
    } catch (err) {
      return handleError(err, "transform number value", {
        data: { 
          value,
          valueType: typeof value,
          targetFormat: context.targetFormat,
          path: context.path
        },
        errorType: ErrorType.TRANSFORM,
        fallback: createTransformResult(value) // Return original value as fallback
      });
    }
  }
  
  /**
   * Convert a string to number
   * @private
   */
  private stringToNumber(value: any, context: TransformContext): TransformResult<any> {
    try {
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
    } catch (err) {
      return handleError(err, "convert string to number", {
        data: { 
          value,
          valueType: typeof value,
          path: context.path
        },
        errorType: ErrorType.TRANSFORM,
        fallback: createTransformResult(value) // Return original value as fallback
      });
    }
  }
  
  /**
   * Convert a number to string
   * @private
   */
  private numberToString(value: any, context: TransformContext): TransformResult<any> {
    try {
      // Only convert number values
      if (typeof value === 'number') {
        return createTransformResult(String(value));
      }
      
      // Otherwise return unchanged
      return createTransformResult(value);
    } catch (err) {
      return handleError(err, "convert number to string", {
        data: { 
          value,
          valueType: typeof value,
          path: context.path
        },
        errorType: ErrorType.TRANSFORM,
        fallback: createTransformResult(value) // Return original value as fallback
      });
    }
  }

  /**
   * Check if using default configuration
   * @returns True if using default configuration
   * @private
   */
  private isDefaultConfiguration(): boolean {
    try {
      return this.integers === true && 
             this.decimals === true && 
             this.scientific === true && 
             this.decimalSeparator === '.' &&
             this.thousandsSeparator === ',';
    } catch (err) {
      return handleError(err, "check default configuration", {
        fallback: true // Assume default configuration on error for safety
      });
    }
  }

  /**
   * Complex transformation with custom options
   * @param value Value to transform
   * @returns Transform result
   * @private
   */
  private transformComplex(value: any): TransformResult<any> {
    try {
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
    } catch (err) {
      return handleError(err, "transform complex number", {
        data: { value },
        errorType: ErrorType.TRANSFORM,
        fallback: createTransformResult(value) // Return original value as fallback
      });
    }
  }
}