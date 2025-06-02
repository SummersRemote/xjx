/**
 * Boolean node transform - Converts string node values and/or attributes to booleans
 */
import { XNode } from '../core/xnode';
import { Transform } from "../core/functional";

/**
 * Options for boolean node transform
 */
export interface BooleanTransformOptions {
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
   * Whether to transform node attributes (default: false)
   */
  transformAttr?: boolean;

  /**
   * Whether to transform node value (default: true)
   */
  transformVal?: boolean;
}

/**
 * Default values for boolean conversion
 */
const DEFAULT_TRUE_VALUES = ['true', 'yes', '1', 'on'];
const DEFAULT_FALSE_VALUES = ['false', 'no', '0', 'off'];

/**
 * Create a node transformer that converts string values and/or attributes to booleans
 * 
 * @example
 * ```typescript
 * // Transform only node values (current behavior)
 * xjx.fromXml(xml).map(toBoolean()).toJson();
 * 
 * // Transform only attributes
 * xjx.fromXml(xml).map(toBoolean({ transformAttr: true, transformVal: false })).toJson();
 * 
 * // Transform both values and attributes
 * xjx.fromXml(xml).map(toBoolean({ transformAttr: true, transformVal: true })).toJson();
 * 
 * // Custom true/false values for attributes
 * xjx.fromXml(xml)
 *    .filter(node => ['active', 'enabled', 'visible'].includes(node.name))
 *    .map(toBoolean({ 
 *      transformAttr: true,
 *      trueValues: ['yes', 'y', '1'], 
 *      falseValues: ['no', 'n', '0'] 
 *    }))
 *    .toJson();
 * ```
 * 
 * @param options Boolean transform options
 * @returns A node transformer function for use with map()
 */
export function toBoolean(options: BooleanTransformOptions = {}): Transform {
  const {
    trueValues = DEFAULT_TRUE_VALUES,
    falseValues = DEFAULT_FALSE_VALUES,
    ignoreCase = true,
    transformAttr = false,
    transformVal = true
  } = options;
  
  // Pre-process values for case insensitive comparison
  const normalizedTrueValues = ignoreCase 
    ? trueValues.map(v => v.toLowerCase()) 
    : trueValues;
  const normalizedFalseValues = ignoreCase 
    ? falseValues.map(v => v.toLowerCase()) 
    : falseValues;
  
  const transformOptions = {
    normalizedTrueValues,
    normalizedFalseValues,
    ignoreCase
  };
  
  return (node: XNode): XNode => {
    let result = { ...node };

    // Transform node value if enabled
    if (transformVal && node.value !== undefined) {
      const transformedValue = transformBooleanValue(node.value, transformOptions);
      if (transformedValue !== null) {
        result.value = transformedValue;
      }
    }

    // Transform attributes if enabled
    if (transformAttr && node.attributes) {
      const transformedAttributes: Record<string, any> = {};
      
      for (const [key, value] of Object.entries(node.attributes)) {
        const transformedValue = transformBooleanValue(value, transformOptions);
        transformedAttributes[key] = transformedValue !== null ? transformedValue : value;
      }
      
      result.attributes = transformedAttributes;
    }

    return result;
  };
}

/**
 * Transform a single value to boolean
 */
function transformBooleanValue(
  value: any,
  options: {
    normalizedTrueValues: string[];
    normalizedFalseValues: string[];
    ignoreCase: boolean;
  }
): boolean | null {
  // Skip if value is not a string
  if (typeof value !== 'string') {
    return null;
  }
  
  const strValue = value.trim();
  if (!strValue) {
    return null;
  }
  
  const compareValue = options.ignoreCase ? strValue.toLowerCase() : strValue;
  
  // Check for true values
  if (options.normalizedTrueValues.includes(compareValue)) {
    return true;
  }
  
  // Check for false values
  if (options.normalizedFalseValues.includes(compareValue)) {
    return false;
  }
  
  // No match, return null (no transformation)
  return null;
}