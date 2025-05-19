/**
 * BooleanTransform - Converts string values to booleans
 * 
 * Simplified implementation using the BaseTransform from core
 */
import { 
  TransformContext, 
  TransformResult, 
  TransformTarget,
  BaseTransform,
  FORMAT
} from '../core/transform';
// import { Common } from '../core/common';
import { handleError, ErrorType } from '../core/error';
  
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
export class BooleanTransform extends BaseTransform {
  private trueValues: string[];
  private falseValues: string[];
  private ignoreCase: boolean;
  
  /**
   * Create a new boolean transformer
   * @param options Transformer options
   */
  constructor(options: BooleanTransformOptions = {}) {
    // Initialize with Value target
    super([TransformTarget.Value]);
    
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
    try {
      // Validate context using base class method
      this.validateContext(context);
      
      // Check if we're transforming to JSON or XML
      if (context.targetFormat === FORMAT.JSON) {
        // To JSON: Convert strings to booleans
        return this.stringToBoolean(value, context);
      } else if (context.targetFormat === FORMAT.XML) {
        // To XML: Convert booleans to strings
        return this.booleanToString(value, context);
      }
      
      // For any other format, keep as is
      return this.success(value);
    } catch (err) {
      return handleError(err, "transform boolean value", {
        data: { 
          value,
          valueType: typeof value,
          targetFormat: context.targetFormat,
          path: context.path
        },
        errorType: ErrorType.TRANSFORM,
        fallback: this.success(value) // Return original value as fallback
      });
    }
  }
  
  /**
   * Convert a string to boolean
   * @private
   */
  private stringToBoolean(value: any, context: TransformContext): TransformResult<any> {
    try {
      // Already a boolean, return as is
      if (typeof value === 'boolean') {
        return this.success(value);
      }
      
      // Skip non-string values
      if (typeof value !== 'string') {
        return this.success(value);
      }
      
      // // Try to use Common for simple cases
      // if (this.trueValues === DEFAULT_TRUE_VALUES && 
      //     this.falseValues === DEFAULT_FALSE_VALUES && 
      //     this.ignoreCase === true) {
      //   // Use the common utility function with default settings
      //   const boolValue = Common.toBoolean(value);
        
      //   // Only transform if it was actually converted to a boolean
      //   if (typeof boolValue === 'boolean' && 
      //       (boolValue === true || boolValue === false)) {
      //     return this.success(boolValue);
      //   }
      // }
      
      // Convert to string for comparison
      const strValue = String(value);
      const compareValue = this.ignoreCase ? strValue.toLowerCase().trim() : strValue.trim();
      
      // Check for true values
      for (const trueVal of this.trueValues) {
        const compareTrue = this.ignoreCase ? trueVal.toLowerCase() : trueVal;
        if (compareValue === compareTrue) {
          return this.success(true);
        }
      }
      
      // Check for false values
      for (const falseVal of this.falseValues) {
        const compareFalse = this.ignoreCase ? falseVal.toLowerCase() : falseVal;
        if (compareValue === compareFalse) {
          return this.success(false);
        }
      }
      
      // No match, return original value
      return this.success(value);
    } catch (err) {
      return handleError(err, "convert string to boolean", {
        data: { 
          value,
          valueType: typeof value,
          path: context.path
        },
        errorType: ErrorType.TRANSFORM,
        fallback: this.success(value) // Return original value as fallback
      });
    }
  }
  
  /**
   * Convert a boolean to string
   * @private
   */
  private booleanToString(value: any, context: TransformContext): TransformResult<any> {
    try {
      // Only convert boolean values
      if (typeof value === 'boolean') {
        return this.success(value ? 'true' : 'false');
      }
      
      // Otherwise return unchanged
      return this.success(value);
    } catch (err) {
      return handleError(err, "convert boolean to string", {
        data: { 
          value,
          valueType: typeof value,
          path: context.path
        },
        errorType: ErrorType.TRANSFORM,
        fallback: this.success(value) // Return original value as fallback
      });
    }
  }
}