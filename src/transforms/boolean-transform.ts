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
 * BooleanTransform - Converts string values to booleans
 * 
 * Example usage:
 * ```
 * XJX.fromXml(xml)
 *    .withTransforms(createBooleanTransform({
 *      trueValues: ['true', 'yes', '1', 'on', 'active'],
 *      falseValues: ['false', 'no', '0', 'off', 'inactive']
 *    }))
 *    .toJson();
 * ```
 */
export function createBooleanTransform(options: BooleanTransformOptions = {}) {
  // Get options with defaults
  const trueValues = options.trueValues || DEFAULT_TRUE_VALUES;
  const falseValues = options.falseValues || DEFAULT_FALSE_VALUES;
  const ignoreCase = options.ignoreCase !== false; // Default to true
  
  // Create the transform
  return {
    // Target values only
    targets: [TransformTarget.Value],
    
    // Transform implementation
    transform(value: any, context: TransformContext): TransformResult<any> {
      try {
        // Check if we're transforming to JSON or XML
        if (context.targetFormat === FORMAT.JSON) {
          // To JSON: Convert strings to booleans
          return stringToBoolean(value, trueValues, falseValues, ignoreCase);
        } else if (context.targetFormat === FORMAT.XML) {
          // To XML: Convert booleans to strings
          return booleanToString(value);
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
  };
}

/**
 * Convert a string to boolean
 */
function stringToBoolean(
  value: any, 
  trueValues: string[], 
  falseValues: string[],
  ignoreCase: boolean
): TransformResult<any> {
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
  const compareValue = ignoreCase ? strValue.toLowerCase().trim() : strValue.trim();
  
  // Check for true values
  for (const trueVal of trueValues) {
    const compareTrue = ignoreCase ? trueVal.toLowerCase() : trueVal;
    if (compareValue === compareTrue) {
      return createTransformResult(true);
    }
  }
  
  // Check for false values
  for (const falseVal of falseValues) {
    const compareFalse = ignoreCase ? falseVal.toLowerCase() : falseVal;
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
function booleanToString(value: any): TransformResult<any> {
  // Only convert boolean values
  if (typeof value === 'boolean') {
    return createTransformResult(value ? 'true' : 'false');
  }
  
  // Otherwise return unchanged
  return createTransformResult(value);
}