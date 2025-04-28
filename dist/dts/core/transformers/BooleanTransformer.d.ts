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
export declare class BooleanTransformer extends ValueTransformer {
    /**
     * Values to consider as true
     */
    private trueValues;
    /**
     * Values to consider as false
     */
    private falseValues;
    /**
     * Lowercase versions of true values for case-insensitive comparison
     */
    private trueValuesLower;
    /**
     * Lowercase versions of false values for case-insensitive comparison
     */
    private falseValuesLower;
    /**
     * Creates a new BooleanTransformer
     * @param options Transformer options
     */
    constructor(options?: BooleanTransformerOptions);
    /**
     * Transform a value from XML to JSON representation
     * @param value Value from XML
     * @param context Transformation context
     * @returns Transformed value for JSON
     */
    protected xmlToJson(value: any, context: TransformContext): any;
    /**
     * Transform a value from JSON to XML representation
     * @param value Value from JSON
     * @param context Transformation context
     * @returns Transformed value for XML
     */
    protected jsonToXml(value: any, context: TransformContext): any;
}
