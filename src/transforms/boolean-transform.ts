/**
 * BooleanTransform - Converts string values to booleans
 * Update in src/transforms/boolean-transform.ts
 */
import { 
  Transform, 
  TransformContext, 
  TransformResult, 
  TransformTarget, 
  createTransformResult,
  FORMATS
} from '../core/transform';
import { Common } from '../core/common';
  
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
   * Uses the target format to determine transformation direction:
   * - For JSON format: strings -> booleans
   * - For XML format: booleans -> strings
   * 
   * @param value Value to transform
   * @param context Transformation context
   * @returns Transformed value result
   */
  transform(value: any, context: TransformContext): TransformResult<any> {
    // Check if we're transforming to JSON or XML
    if (context.targetFormat === FORMATS.JSON) {
      // To JSON: Convert strings to booleans
      return this.stringToBoolean(value, context);
    } else if (context.targetFormat === FORMATS.XML) {
      // To XML: Convert booleans to strings
      return this.booleanToString(value, context);
    }
    
    // For any other format, keep as is
    return createTransformResult(value);
  }
  
  /**
   * Convert a string to boolean
   * @private
   */
  private stringToBoolean(value: any, context: TransformContext): TransformResult<any> {
    // Already a boolean, return as is
    if (typeof value === 'boolean') {
      return createTransformResult(value);
    }
    
    // Skip non-string values
    if (typeof value !== 'string') {
      return createTransformResult(value);
    }
    
    // Try to use Common for simple cases
    if (this.trueValues === DEFAULT_TRUE_VALUES && 
        this.falseValues === DEFAULT_FALSE_VALUES && 
        this.ignoreCase === true) {
      // Use the common utility function with default settings
      const boolValue = Common.toBoolean(value);
      
      // Only transform if it was actually converted to a boolean
      if (typeof boolValue === 'boolean' && 
          (boolValue === true || boolValue === false)) {
        return createTransformResult(boolValue);
      }
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
   * @private
   */
  private booleanToString(value: any, context: TransformContext): TransformResult<any> {
    // Only convert boolean values
    if (typeof value === 'boolean') {
      return createTransformResult(value ? 'true' : 'false');
    }
    
    // Otherwise return unchanged
    return createTransformResult(value);
  }
}