import { Configuration } from "./core/types/types";
import { ValueTransformer } from "./core/transforms";
export declare class XJX {
    private config;
    private xmltojson;
    private jsontoxml;
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
