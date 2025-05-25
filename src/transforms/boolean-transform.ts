/**
 * Boolean transform - Converts string values to booleans
 */
import { Transform, TransformOptions, TransformIntent, createTransform } from '../core/transform';

/**
 * Options for boolean transform
 */
export interface BooleanOptions extends TransformOptions {
  /**
   * Values to consider as true (default: ['true', 'yes', '1', 'on'])
   */
  trueValues?: string[];
  
  /**
   * Values to consider as false (default: ['false', 'no', '0', 'off'])
   */
  falseValues?: string[];
  
  /**
   * Whether to ignore case when matching (default: true)
   */
  ignoreCase?: boolean;
  
  /**
   * String representation for true when serializing (default: 'true')
   */
  trueString?: string;
  
  /**
   * String representation for false when serializing (default: 'false')
   */
  falseString?: string;
}

/**
 * Default values for boolean conversion
 */
const DEFAULT_TRUE_VALUES = ['true', 'yes', '1', 'on'];
const DEFAULT_FALSE_VALUES = ['false', 'no', '0', 'off'];

/**
 * Create a transform that converts between string values and booleans
 * 
 * @example
 * ```
 * // PARSE mode (default): Convert strings to booleans
 * xjx.transform(toBoolean());
 * 
 * // With custom values
 * xjx.transform(toBoolean({ 
 *   trueValues: ['yes', 'y'], 
 *   falseValues: ['no', 'n'] 
 * }));
 * 
 * // SERIALIZE mode: Convert booleans to strings
 * xjx.transform(toBoolean({ 
 *   intent: TransformIntent.SERIALIZE,
 *   trueString: 'YES',
 *   falseString: 'NO' 
 * }));
 * ```
 * 
 * @param options Boolean transform options
 * @returns A boolean transform function
 */
export function toBoolean(options: BooleanOptions = {} as BooleanOptions): Transform {
  const {
    trueValues = DEFAULT_TRUE_VALUES,
    falseValues = DEFAULT_FALSE_VALUES,
    ignoreCase = true,
    trueString = 'true',
    falseString = 'false',
    intent = TransformIntent.PARSE,
    ...transformOptions
  } = options;
  
  return createTransform((value: any) => {
    // Handle null/undefined
    if (value == null) {
      return value;
    }
    
    // SERIALIZE mode: convert boolean to string
    if (intent === TransformIntent.SERIALIZE && typeof value === 'boolean') {
      return value ? trueString : falseString;
    }
    
    // PARSE mode: convert string to boolean
    if (intent === TransformIntent.PARSE) {
      // Already a boolean, return as is
      if (typeof value === 'boolean') {
        return value;
      }
      
      // Convert to string for comparison
      const strValue = String(value).trim();
      const compareValue = ignoreCase ? strValue.toLowerCase() : strValue;
      
      // Check for true values
      for (const trueVal of trueValues) {
        const compareTrue = ignoreCase ? trueVal.toLowerCase() : trueVal;
        if (compareValue === compareTrue) {
          return true;
        }
      }
      
      // Check for false values
      for (const falseVal of falseValues) {
        const compareFalse = ignoreCase ? falseVal.toLowerCase() : falseVal;
        if (compareValue === compareFalse) {
          return false;
        }
      }
    }
    
    // No match or not applicable for the current intent, return original value
    return value;
  }, transformOptions);
}