/**
 * Value transformation types and base class for the XJX library
 */
import { Configuration } from '../types/types';
/**
 * Direction of the transformation
 */
export type TransformDirection = 'xml-to-json' | 'json-to-xml';
/**
 * Context provided to value transformers
 */
export interface TransformContext {
    direction: TransformDirection;
    nodeName: string;
    nodeType: number;
    namespace?: string;
    prefix?: string;
    path: string;
    isAttribute: boolean;
    attributeName?: string;
    parent?: TransformContext;
    config: Configuration;
}
/**
 * Abstract base class for value transformers
 */
export declare abstract class ValueTransformer {
    /**
     * Process a value, transforming it if applicable
     * @param value Value to potentially transform
     * @param context Context including direction and other information
     * @returns Transformed value or original if not applicable
     */
    process(value: any, context: TransformContext): any;
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
