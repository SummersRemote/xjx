/**
 * Boolean value transformer implementation
 * 
 * Transforms string values to boolean if they match common boolean patterns
 */
import { 
    BaseValueTransformer
  } from './transformer-base';
  import { XNode, TransformContext } from '../types/transform-types';
  
  /**
   * Options for boolean transformer
   */
  export interface BooleanTransformerOptions {
    /**
     * Paths to apply this transformer to (optional)
     * Uses path matching syntax (e.g., "root.items.*.active")
     */
    paths?: string | string[];
    
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
     * Whether to convert only string values (default: true)
     * If false, will attempt to convert values of any type
     */
    stringsOnly?: boolean;
  }
  
  /**
   * Default options for boolean transformer
   */
  const DEFAULT_OPTIONS: BooleanTransformerOptions = {
    trueValues: ['true', 'yes', '1', 'on'],
    falseValues: ['false', 'no', '0', 'off'],
    ignoreCase: true,
    stringsOnly: true
  };
  
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
   * xjx.transformValue(TransformDirection.XML_TO_JSON, booleanTransformer);
   * ```
   */
  export class BooleanTransformer extends BaseValueTransformer {
    private options: BooleanTransformerOptions;
    
    /**
     * Create a new boolean transformer
     * @param options Transformer options
     */
    constructor(options: BooleanTransformerOptions = {}) {
      super(options.paths);
      this.options = { ...DEFAULT_OPTIONS, ...options };
    }
    
    /**
     * Transform a value to boolean if it matches criteria
     * @param value Value to transform
     * @param node Node containing the value
     * @param context Transformation context
     * @returns Boolean value if converted, otherwise original value
     */
    protected transformValue(value: any, node: XNode, context: TransformContext): any {
      // Skip if not a string and stringsOnly is true
      if (this.options.stringsOnly && typeof value !== 'string') {
        return value;
      }
      
      // Convert value to string for comparison
      const strValue = String(value);
      
      // Check for true values
      for (const trueVal of this.options.trueValues || []) {
        if (this.compareValues(strValue, trueVal)) {
          return true;
        }
      }
      
      // Check for false values
      for (const falseVal of this.options.falseValues || []) {
        if (this.compareValues(strValue, falseVal)) {
          return false;
        }
      }
      
      // No match, return original value
      return value;
    }
    
    /**
     * Compare two values with case sensitivity option
     * @param a First value
     * @param b Second value
     * @returns Whether the values are equal
     */
    private compareValues(a: string, b: string): boolean {
      if (this.options.ignoreCase) {
        return a.toLowerCase() === b.toLowerCase();
      }
      return a === b;
    }
  }