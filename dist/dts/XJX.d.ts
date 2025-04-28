import { Configuration } from "./core/types/config-types";
import { ValueTransformer } from "./core/transformers";
export declare class XJX {
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
