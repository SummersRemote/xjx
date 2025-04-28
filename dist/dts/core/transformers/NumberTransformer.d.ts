/**
 * Number value transformer for the XJX library
 */
import { ValueTransformer, TransformContext } from './ValueTransformer';
/**
 * Interface for NumberTransformer options
 */
export interface NumberTransformerOptions {
    /**
     * Whether to parse integers
     */
    parseIntegers?: boolean;
    /**
     * Whether to parse floating point numbers
     */
    parseFloats?: boolean;
    /**
     * Integer format in XML (if specified)
     */
    integerFormat?: RegExp | string;
    /**
     * Float format in XML (if specified)
     */
    floatFormat?: RegExp | string;
}
/**
 * Transforms string values to number types and vice versa
 */
export declare class NumberTransformer extends ValueTransformer {
    /**
     * Whether to parse integers
     */
    private parseIntegers;
    /**
     * Whether to parse floating point numbers
     */
    private parseFloats;
    /**
     * Integer format in XML (if specified)
     */
    private integerFormat?;
    /**
     * Float format in XML (if specified)
     */
    private floatFormat?;
    /**
     * Creates a new NumberTransformer
     * @param options Transformer options
     */
    constructor(options?: NumberTransformerOptions);
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
