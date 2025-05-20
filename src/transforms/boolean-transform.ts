/**
 * BooleanTransform - Converts string values to booleans
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
 * Options for boolean transformer
 */
export interface BooleanTransformOptions {
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
}

/**
 * Default boolean values
 */
const DEFAULT_TRUE_VALUES = ['true', 'yes', '1', 'on'];
const DEFAULT_FALSE_VALUES = ['false', 'no', '0', 'off'];

/**
 * BooleanTransform class for converting string values to booleans
 * 
 * Example usage:
 * ```
 * XJX.fromXml(xml)
 *    .withTransforms(new BooleanTransform({
 *      trueValues: ['true', 'yes', '1', 'on', 'active'],
 *      falseValues: ['false', 'no', '0', 'off', 'inactive']
 *    }))
 *    .toJson();
 * ```
 */
export class BooleanTransform {
  private trueValues: string[];
  private falseValues: string[];
  private ignoreCase: boolean;
  
  /**
   * Array of transform targets - this transform targets values only
   */
  public readonly targets = [TransformTarget.Value];
  
  /**
   * Type identifier for runtime type checking
   */
  public static readonly type = 'BooleanTransform';
  
  /**
   * Type identifier instance property for runtime type checking
   */
  public readonly type = BooleanTransform.type;
  
  /**
   * Create a new BooleanTransform
   * @param options Options for customizing the transform behavior
   */
  constructor(options: BooleanTransformOptions = {}) {
    this.trueValues = options.trueValues || DEFAULT_TRUE_VALUES;
    this.falseValues = options.falseValues || DEFAULT_FALSE_VALUES;
    this.ignoreCase = options.ignoreCase !== false; // Default to true
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
        // To JSON: Convert strings to booleans
        return this.stringToBoolean(value);
      } else if (context.targetFormat === FORMAT.XML) {
        // To XML: Convert booleans to strings
        return this.booleanToString(value);
      }
      
      // For any other format, keep as is
      return createTransformResult(value);
    } catch (err) {
      logger.error(`Boolean transform error: ${err instanceof Error ? err.message : String(err)}`, {
        value,
        valueType: typeof value,
        path: context.path
      });
      
      // Return original value on error
      return createTransformResult(value);
    }
  }
  
  /**
   * Convert a string to boolean
   */
  private stringToBoolean(value: any): TransformResult<any> {
    // Already a boolean, return as is
    if (typeof value === 'boolean') {
      return createTransformResult(value);
    }
    
    // Skip non-string values
    if (typeof value !== 'string') {
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
    
    // No match, return original value
    return createTransformResult(value);
  }
  
  /**
   * Convert a boolean to string
   */
  private booleanToString(value: any): TransformResult<any> {
    // Only convert boolean values
    if (typeof value === 'boolean') {
      return createTransformResult(value ? 'true' : 'false');
    }
    
    // Otherwise return unchanged
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