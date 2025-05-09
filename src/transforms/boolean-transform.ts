/**
 * BooleanTransform - Converts string values to booleans
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
 * BooleanTransform - Converts string values to booleans
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
export class BooleanTransform implements Transform {
  // Target value and attribute values
  targets = [TransformTarget.Value];
  
  private trueValues: string[];
  private falseValues: string[];
  private ignoreCase: boolean;
  
  /**
   * Create a new boolean transformer
   * @param options Transformer options
   */
  constructor(options: BooleanTransformOptions = {}) {
    this.trueValues = options.trueValues || DEFAULT_TRUE_VALUES;
    this.falseValues = options.falseValues || DEFAULT_FALSE_VALUES;
    this.ignoreCase = options.ignoreCase !== false; // Default to true
  }
  
  /**
   * Transform a value to boolean if it matches criteria
   * 
   * No need to check context type - the pipeline handles that
   * @param value Value to transform
   * @param context Transformation context
   * @returns Transformed value result
   */
  transform(value: any, context: TransformContext): TransformResult<any> {
    // Already a boolean, return as is
    if (typeof value === 'boolean') {
      return createTransformResult(value);
    }
    
    // Try to use CommonUtils for simple cases
    if (this.trueValues === DEFAULT_TRUE_VALUES && 
        this.falseValues === DEFAULT_FALSE_VALUES && 
        this.ignoreCase === true) {
      // Use the common utility function with default settings
      const boolValue = CommonUtils.toBoolean(value);
      
      // Only transform if it was actually converted to a boolean
      if (typeof boolValue === 'boolean' && 
          (boolValue === true || boolValue === false)) {
        return createTransformResult(boolValue);
      }
    }
    
    // Skip non-string values
    if (typeof value !== 'string') {
      return createTransformResult(value);
    }
    
    // Convert to string for comparison
    const strValue = String(value);
    
    // Check for true values
    for (const trueVal of this.trueValues) {
      if (this.compareValues(strValue, trueVal)) {
        return createTransformResult(true);
      }
    }
    
    // Check for false values
    for (const falseVal of this.falseValues) {
      if (this.compareValues(strValue, falseVal)) {
        return createTransformResult(false);
      }
    }
    
    // No match, return original value
    return createTransformResult(value);
  }
  
  /**
   * Compare two values with case sensitivity option
   * @param a First value
   * @param b Second value
   * @returns True if values match
   * @private
   */
  private compareValues(a: string, b: string): boolean {
    if (this.ignoreCase) {
      return a.toLowerCase() === b.toLowerCase();
    }
    return a === b;
  }
}