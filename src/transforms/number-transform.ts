/**
 * NumberTransform - Mode-aware number conversion
 */
import { 
  TransformContext, 
  TransformResult, 
  TransformTarget,
  createTransformResult,
  Transform,
  TransformOptions,
  ProcessingIntent,
  getDefaultMode,
  shouldParse
} from '../core/transform';
import { logger } from '../core/error';

/**
 * Options for number transformer
 */
export interface NumberTransformOptions extends TransformOptions {
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
   * Precision for number formatting when serializing (default: undefined = no rounding)
   */
  precision?: number;
}

/**
 * NumberTransform class for converting between strings and numbers
 * 
 * PARSE mode (default): Converts string values to numbers
 *   "123" → 123, "45.67" → 45.67, "1,234.56" → 1234.56
 * 
 * SERIALIZE mode: Converts number values to strings
 *   123 → "123", 45.67 → "45.67"
 * 
 * Example usage:
 * ```
 * new NumberTransform() // Default PARSE mode
 * new NumberTransform({ mode: ProcessingIntent.SERIALIZE })
 * new NumberTransform({ 
 *   precision: 2, 
 *   thousandsSeparator: ',' 
 * })
 * ```
 */
export class NumberTransform implements Transform {
  private mode: ProcessingIntent;
  private integers: boolean;
  private decimals: boolean;
  private scientific: boolean;
  private decimalSeparator: string;
  private thousandsSeparator: string;
  private precision?: number;
  
  /**
   * Array of transform targets - this transform targets values only
   */
  public readonly targets = [TransformTarget.Value];
  
  /**
   * Type identifier for runtime type checking
   */
  public static readonly type = 'NumberTransform';
  public readonly type = NumberTransform.type;
  
  /**
   * Create a new NumberTransform
   * @param options Options for customizing the transform behavior
   */
  constructor(options: NumberTransformOptions = {}) {
    this.mode = options.mode || getDefaultMode();
    this.integers = options.integers !== false; // Default to true
    this.decimals = options.decimals !== false; // Default to true
    this.scientific = options.scientific !== false; // Default to true
    this.decimalSeparator = options.decimalSeparator || '.';
    this.thousandsSeparator = options.thousandsSeparator || ',';
    this.precision = options.precision;
  }
  
  /**
   * Transform implementation - uses processing intent to determine direction
   * @param value Value to transform
   * @param context Transform context
   * @returns Transform result
   */
  transform(value: any, context: TransformContext): TransformResult<any> {
    try {
      // Handle null/undefined
      if (value == null) {
        return createTransformResult(value);
      }
      
      // Determine direction based on mode and value type
      if (shouldParse(this.mode, value)) {
        return this.parseToNumber(value);
      } else {
        return this.serializeToString(value);
      }
    } catch (err) {
      logger.error(`Number transform error: ${err instanceof Error ? err.message : String(err)}`, {
        value,
        valueType: typeof value,
        mode: this.mode,
        path: context.path
      });
      
      // Return original value on error
      return createTransformResult(value);
    }
  }
  
  /**
   * Parse string value to number
   */
  private parseToNumber(value: any): TransformResult<any> {
    // Already a number in parse mode - leave as is
    if (typeof value === 'number') {
      return createTransformResult(value);
    }
    
    // Convert to string for parsing
    const strValue = String(value).trim();
    if (!strValue) {
      return createTransformResult(value);
    }
    
    // Quick parse for simple cases (optimization)
    if (this.isSimpleConfiguration()) {
      const parsed = Number(strValue);
      if (!isNaN(parsed)) {
        return createTransformResult(parsed);
      }
    }
    
    // Complex parsing with custom separators
    return this.parseComplexNumber(strValue);
  }
  
  /**
   * Serialize number value to string
   */
  private serializeToString(value: any): TransformResult<any> {
    if (typeof value === 'number') {
      let result = value;
      
      // Apply precision if specified
      if (this.precision !== undefined) {
        result = Number(result.toFixed(this.precision));
      }
      
      return createTransformResult(String(result));
    }
    
    // Non-number in serialize mode - leave as is
    return createTransformResult(value);
  }
  
  /**
   * Check if using simple configuration for optimization
   */
  private isSimpleConfiguration(): boolean {
    return this.integers === true && 
           this.decimals === true && 
           this.scientific === true && 
           this.decimalSeparator === '.' &&
           this.thousandsSeparator === ',' &&
           this.precision === undefined;
  }
  
  /**
   * Parse complex numbers with custom separators and validation
   */
  private parseComplexNumber(strValue: string): TransformResult<any> {
    // Build regex pattern based on configuration
    const patterns: string[] = [];
    const escapedDecimal = this.escapeRegex(this.decimalSeparator);
    const escapedThousands = this.escapeRegex(this.thousandsSeparator);
    
    // Integer pattern
    if (this.integers) {
      patterns.push(`-?(?:\\d{1,3}(?:${escapedThousands}\\d{3})*|\\d+)`);
    }
    
    // Decimal pattern
    if (this.decimals) {
      patterns.push(`-?(?:\\d{1,3}(?:${escapedThousands}\\d{3})*|\\d*)${escapedDecimal}\\d+`);
    }
    
    // Scientific notation pattern
    if (this.scientific) {
      patterns.push(`-?(?:\\d+(?:${escapedDecimal}\\d+)?|\\d*${escapedDecimal}\\d+)[eE][+-]?\\d+`);
    }
    
    if (patterns.length === 0) {
      return createTransformResult(strValue);
    }
    
    const fullPattern = `^(${patterns.join('|')})$`;
    const regex = new RegExp(fullPattern);
    
    if (!regex.test(strValue)) {
      return createTransformResult(strValue);
    }
    
    // Normalize for JavaScript parsing
    let normalized = strValue;
    
    // Remove thousands separators
    if (this.thousandsSeparator) {
      const sepRegex = new RegExp(this.escapeRegex(this.thousandsSeparator), 'g');
      normalized = normalized.replace(sepRegex, '');
    }
    
    // Replace decimal separator
    if (this.decimalSeparator !== '.') {
      const decRegex = new RegExp(this.escapeRegex(this.decimalSeparator), 'g');
      normalized = normalized.replace(decRegex, '.');
    }
    
    const parsed = parseFloat(normalized);
    if (isNaN(parsed)) {
      return createTransformResult(strValue);
    }
    
    return createTransformResult(parsed);
  }
  
  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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