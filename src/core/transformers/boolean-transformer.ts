/**
 * BooleanTransformer 
 * 
 * Converts string values to booleans and vice versa
 */
import { TransformContext, XNode } from '../types/transform-types';
import { BaseValueTransformer } from './transformer-base';

/**
 * Options for BooleanTransformer
 */
export interface BooleanTransformerOptions {
  /**
   * Values to consider as true
   */
  trueValues?: string[];
  
  /**
   * Values to consider as false
   */
  falseValues?: string[];
  
  /**
   * Optional paths to apply the transformation to
   */
  paths?: string | string[];
}

/**
 * Transformer that converts string values to boolean types and vice versa
 */
export class BooleanTransformer extends BaseValueTransformer {
  /**
   * Values to consider as true
   */
  private trueValues: string[];
  
  /**
   * Values to consider as false
   */
  private falseValues: string[];
  
  /**
   * Create a new BooleanTransformer
   * @param options Configuration options
   */
  constructor(options: BooleanTransformerOptions = {}) {
    super(options.paths);
    
    // Set default values if not provided
    this.trueValues = options.trueValues || ['true', 'yes', '1', 'on'];
    this.falseValues = options.falseValues || ['false', 'no', '0', 'off'];
  }
  
  /**
   * Transform a value
   * @param value Value to transform
   * @param node Node containing the value
   * @param context Transformation context
   * @returns Transformed value
   */
  protected transformValue(value: any, node: XNode, context: TransformContext): any {
    // XML to JSON: Convert string to boolean
    if (context.direction === 'xml-to-json' && typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      
      // Check for true values
      if (this.trueValues.map(v => v.toLowerCase()).includes(lowerValue)) {
        return true;
      }
      
      // Check for false values
      if (this.falseValues.map(v => v.toLowerCase()).includes(lowerValue)) {
        return false;
      }
    }
    
    // JSON to XML: Convert boolean to string
    if (context.direction === 'json-to-xml' && typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    
    // Return unchanged value if no transformation applies
    return value;
  }
}

// Export the class
export default BooleanTransformer;