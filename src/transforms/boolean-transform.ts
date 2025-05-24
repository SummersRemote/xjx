/**
 * BooleanTransform - Mode-aware boolean conversion
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
 * Options for boolean transformer
 */
export interface BooleanTransformOptions extends TransformOptions {
  /**
   * Values to consider as true (default: ["true", "yes", "1", "on"])
   */
  trueValues?: string[];
  
  /**
   * Values to consider as false (default: ["false", "no", "0", "off"])
   */
  falseValues?: string[];
  
  /**
   * Whether to ignore case when matching (default: true)
   */
  ignoreCase?: boolean;
  
  /**
   * String representation for true when serializing (default: "true")
   */
  trueString?: string;
  
  /**
   * String representation for false when serializing (default: "false")
   */
  falseString?: string;
}

/**
 * Default boolean values
 */
const DEFAULT_TRUE_VALUES = ['true', 'yes', '1', 'on'];
const DEFAULT_FALSE_VALUES = ['false', 'no', '0', 'off'];

/**
 * BooleanTransform class for converting between strings and booleans
 * 
 * PARSE mode (default): Converts string values to booleans
 *   "true", "yes", "1", "on" → true
 *   "false", "no", "0", "off" → false
 * 
 * SERIALIZE mode: Converts boolean values to strings
 *   true → "true" (or custom trueString)
 *   false → "false" (or custom falseString)
 * 
 * Example usage:
 * ```
 * new BooleanTransform() // Default PARSE mode
 * new BooleanTransform({ mode: ProcessingIntent.SERIALIZE })
 * new BooleanTransform({ 
 *   trueValues: ['yes', 'y'], 
 *   falseValues: ['no', 'n'] 
 * })
 * ```
 */
export class BooleanTransform implements Transform {
  private mode: ProcessingIntent;
  private trueValues: string[];
  private falseValues: string[];
  private ignoreCase: boolean;
  private trueString: string;
  private falseString: string;
  
  /**
   * Array of transform targets - this transform targets values only
   */
  public readonly targets = [TransformTarget.Value];
  
  /**
   * Type identifier for runtime type checking
   */
  public static readonly type = 'BooleanTransform';
  public readonly type = BooleanTransform.type;
  
  /**
   * Create a new BooleanTransform
   * @param options Options for customizing the transform behavior
   */
  constructor(options: BooleanTransformOptions = {}) {
    this.mode = options.mode || getDefaultMode();
    this.trueValues = options.trueValues || DEFAULT_TRUE_VALUES;
    this.falseValues = options.falseValues || DEFAULT_FALSE_VALUES;
    this.ignoreCase = options.ignoreCase !== false; // Default to true
    this.trueString = options.trueString || 'true';
    this.falseString = options.falseString || 'false';
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
        return this.parseToBoolean(value);
      } else {
        return this.serializeToString(value);
      }
    } catch (err) {
      logger.error(`Boolean transform error: ${err instanceof Error ? err.message : String(err)}`, {
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
   * Parse string value to boolean
   */
  private parseToBoolean(value: any): TransformResult<any> {
    // Already a boolean in parse mode - leave as is
    if (typeof value === 'boolean') {
      return createTransformResult(value);
    }
    
    // Convert to string for comparison
    const strValue = String(value);
    const compareValue = this.ignoreCase ? strValue.toLowerCase().trim() : strValue.trim();
    
    // Check for true values
    for (const trueVal of this.trueValues) {
      const compareTrue = this.ignoreCase ? trueVal.toLowerCase() : trueVal;
      if (compareValue === compareTrue) {
        return createTransformResult(true);
      }
    }
    
    // Check for false values
    for (const falseVal of this.falseValues) {
      const compareFalse = this.ignoreCase ? falseVal.toLowerCase() : falseVal;
      if (compareValue === compareFalse) {
        return createTransformResult(false);
      }
    }
    
    // No match: return original value unchanged
    return createTransformResult(value);
  }
  
  /**
   * Serialize boolean value to string
   */
  private serializeToString(value: any): TransformResult<any> {
    if (typeof value === 'boolean') {
      return createTransformResult(value ? this.trueString : this.falseString);
    }
    
    // Non-boolean in serialize mode - leave as is
    return createTransformResult(value);
  }
}

/**
 * Create a BooleanTransform instance
 * @param options Options for customizing the transform behavior
 * @returns A new BooleanTransform instance
 */
export function createBooleanTransform(options: BooleanTransformOptions = {}): BooleanTransform {
  return new BooleanTransform(options);
}