/**
 * Value transformation types and base class for the XJX library
 */

/**
 * Direction of the transformation
 */
type TransformDirection = 'xml-to-json' | 'json-to-xml';
/**
 * Context provided to value transformers
 */
interface TransformContext {
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
declare abstract class ValueTransformer {
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

/**
 * Type definitions for the XJX library
 */

/**
 * Configuration interface for the library
 */
interface Configuration {
    preserveNamespaces: boolean;
    preserveComments: boolean;
    preserveProcessingInstr: boolean;
    preserveCDATA: boolean;
    preserveTextNodes: boolean;
    preserveWhitespace: boolean;
    preserveAttributes: boolean;
    outputOptions: {
        prettyPrint: boolean;
        indent: number;
        compact: boolean;
        json: Record<string, any>;
        xml: {
            declaration: boolean;
        };
    };
    propNames: {
        namespace: string;
        prefix: string;
        attributes: string;
        value: string;
        cdata: string;
        comments: string;
        instruction: string;
        target: string;
        children: string;
    };
    valueTransforms?: ValueTransformer[];
}

declare class XJX {
    private config;
    private xmlToJsonConverter;
    private jsonToXmlConverter;
    private jsonUtil;
    private xmlUtil;
    /**
     * Constructor for XJX utility
     * @param config Configuration options
     */
    constructor(config?: Partial<Configuration>);
    /**
     * Convert XML string to JSON
     * @param xmlString XML content as string
     * @returns JSON object representing the XML content
     */
    xmlToJson(xmlString: string): Record<string, any>;
    /**
     * Convert JSON object back to XML string
     * @param jsonObj JSON object to convert
     * @returns XML string
     */
    jsonToXml(jsonObj: Record<string, any>): string;
    /**
     * Pretty print an XML string
     * @param xmlString XML string to format
     * @returns Formatted XML string
     */
    prettyPrintXml(xmlString: string): string;
    /**
     * Safely retrieves a value from a JSON object using a dot-separated path.
     * @param obj The input JSON object
     * @param path The dot-separated path string (e.g., "root.item.description.$val")
     * @param fallback Value to return if the path does not resolve
     * @returns The value at the specified path or the fallback value
     */
    getPath(obj: Record<string, any>, path: string, fallback?: any): any;
    /**
     * Validate XML string
     * @param xmlString XML string to validate
     * @returns Validation result
     */
    validateXML(xmlString: string): {
        isValid: boolean;
        message?: string;
    };
    /**
     * Generate a JSON schema based on the current configuration
     * @returns JSON schema object for validating XML-JSON documents
     */
    generateJsonSchema(): Record<string, any>;
    /**
     * Convert a standard JSON object to the XML-like JSON structure
     * @param obj Standard JSON object
     * @param root Optional root element configuration (string or object with properties)
     * @returns XML-like JSON object ready for conversion to XML
     */
    objectToXJX(obj: any, root?: string | Record<string, any>): Record<string, any>;
    /**
     * Generate an example JSON object that matches the current configuration
     * @param rootName Name of the root element
     * @returns Example JSON object
     */
    generateJsonExample(rootName?: string): Record<string, any>;
    /**
     * Add a value transformer to the configuration
     * @param transformer Value transformer to add
     * @returns This XJX instance for chaining
     */
    addTransformer(transformer: ValueTransformer): XJX;
    /**
     * Removes all value transformers from the configuration
     * @returns This XJX instance for chaining
     */
    clearTransformers(): XJX;
    /**
     * Clean up any resources
     */
    cleanup(): void;
}

/**
 * Default configuration for the XJX library
 */

/**
 * Default configuration
 */
declare const DEFAULT_CONFIG: Configuration;

/**
 * Error classes for the XJX library
 */
/**
 * Base error class
 */
declare class XJXError extends Error {
    constructor(message: string);
}

export { Configuration, DEFAULT_CONFIG, ValueTransformer, XJX, XJXError, XJX as default };
