/**
 * String replacement transformer for the XJX library
 */
import { ValueTransformer, TransformContext } from './ValueTransformer';
/**
 * Interface for StringReplaceTransformer options
 */
export interface StringReplaceTransformerOptions {
    /**
     * Regex pattern in string form "/pattern/flags"
     */
    pattern?: string;
    /**
     * Replacement string
     */
    replacement?: string;
}
/**
 * Transforms string values by applying regex replacements
 */
export declare class StringReplaceTransformer extends ValueTransformer {
    /**
     * Regex pattern to match
     */
    private regex;
    /**
     * Replacement string
     */
    private replacement;
    /**
     * Creates a StringReplaceTransformer
     * @param options Configuration options
     */
    constructor(options?: StringReplaceTransformerOptions);
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
