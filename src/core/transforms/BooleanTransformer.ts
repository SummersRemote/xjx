/**
 * Boolean value transformer for the XJX library
 */
import { ValueTransformer, TransformContext } from './ValueTransformer';

/**
 * Interface for BooleanTransformer options
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
}

/**
 * Transforms string values to boolean types and vice versa
 */
export class BooleanTransformer extends ValueTransformer {
  /**
   * Values to consider as true
   */
  private trueValues: string[];
  
  /**
   * Values to consider as false
   */
  private falseValues: string[];
  
  /**
   * Lowercase versions of true values for case-insensitive comparison
   */
  private trueValuesLower: string[];
  
  /**
   * Lowercase versions of false values for case-insensitive comparison
   */
  private falseValuesLower: string[];
  
  /**
   * Creates a new BooleanTransformer
   * @param options Transformer options
   */
  constructor(options: BooleanTransformerOptions = {}) {
    super();
    
    // Set default values if not provided
    this.trueValues = options.trueValues || ['true'];
    this.falseValues = options.falseValues || ['false'];
    
    // Precompute lowercase versions for case-insensitive comparison
    this.trueValuesLower = this.trueValues.map(v => String(v).toLowerCase());
    this.falseValuesLower = this.falseValues.map(v => String(v).toLowerCase());
  }
  
  /**
   * Transform a value from XML to JSON representation
   * @param value Value from XML
   * @param context Transformation context
   * @returns Transformed value for JSON
   */
  protected xmlToJson(value: any, context: TransformContext): any {
    // Only process strings in XML-to-JSON direction
    if (typeof value !== 'string') return value;
    
    // Convert to lowercase for case-insensitive comparison
    const valueLower = value.toLowerCase();
    
    // Check against true values
    if (this.trueValuesLower.includes(valueLower)) {
      return true;
    }
    
    // Check against false values
    if (this.falseValuesLower.includes(valueLower)) {
      return false;
    }
    
    // If no transformation applies, return original value
    return value;
  }
  
  /**
   * Transform a value from JSON to XML representation
   * @param value Value from JSON
   * @param context Transformation context
   * @returns Transformed value for XML
   */
  protected jsonToXml(value: any, context: TransformContext): any {
    // Only process booleans in JSON-to-XML direction
    if (typeof value !== 'boolean') return value;
    
    // Convert to string representation
    return String(value);
  }
}