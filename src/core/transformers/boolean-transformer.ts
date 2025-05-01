/**
 * Boolean transformer implementation
 */
import { BaseValueTransformer, TransformerOptions } from './transformer-base';
import { XNode, TransformContext, TransformDirection, TransformResult, transformResult } from '../types/transform-types';

/**
 * Options for boolean transformer
 */
export interface BooleanTransformerOptions extends TransformerOptions {
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
 * Boolean transformer that converts string values to booleans
 * 
 * Example usage:
 * ```
 * const booleanTransformer = new BooleanTransformer({
 *   paths: ['root.items.*.active', 'root.settings.enabled'],
 *   trueValues: ['true', 'yes', '1', 'on', 'active', 'enabled'],
 *   falseValues: ['false', 'no', '0', 'off', 'inactive', 'disabled']
 * });
 * xjx.addValueTransformer(TransformDirection.XML_TO_JSON, booleanTransformer);
 * ```
 */
export class BooleanTransformer extends BaseValueTransformer {
  private trueValues: string[];
  private falseValues: string[];
  private ignoreCase: boolean;
  
  /**
   * Create a new boolean transformer
   */
  constructor(options: BooleanTransformerOptions = {}) {
    super(options);
    
    this.trueValues = options.trueValues || DEFAULT_TRUE_VALUES;
    this.falseValues = options.falseValues || DEFAULT_FALSE_VALUES;
    this.ignoreCase = options.ignoreCase !== false; // Default to true
  }
  
  /**
   * Transform a value to boolean if it matches criteria
   */
  protected transformValue(value: any, node: XNode, context: TransformContext): TransformResult<any> {
    // Already a boolean, return as is
    if (typeof value === 'boolean') {
      return transformResult(value);
    }
    
    // Convert to string for comparison
    const strValue = String(value);
    
    // Check for true values
    for (const trueVal of this.trueValues) {
      if (this.compareValues(strValue, trueVal)) {
        return transformResult(true);
      }
    }
    
    // Check for false values
    for (const falseVal of this.falseValues) {
      if (this.compareValues(strValue, falseVal)) {
        return transformResult(false);
      }
    }
    
    // No match, return original value
    return transformResult(value);
  }
  
  /**
   * Compare two values with case sensitivity option
   */
  private compareValues(a: string, b: string): boolean {
    if (this.ignoreCase) {
      return a.toLowerCase() === b.toLowerCase();
    }
    return a === b;
  }
}