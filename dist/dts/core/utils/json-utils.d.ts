/**
 * JSONUtil - Utility functions for JSON processing
 */
import { Configuration } from "../types/config-types";
import { JSONValue, JSONObject, XMLJSONNode } from "../types/json-types";
export declare class JsonUtil {
    private config;
    /**
     * Constructor for JSONUtil
     * @param config Configuration options
     */
    constructor(config: Configuration);
    /**
     * Safely retrieves a value from a JSON object using a dot-separated path.
     * Automatically traverses into children arrays and flattens results.
     *
     * @param obj The input JSON object
     * @param path The dot-separated path string (e.g., "root.item.description.$val")
     * @param fallback Value to return if the path does not resolve
     * @returns Retrieved value or fallback
     */
    getPath(obj: JSONObject, path: string, fallback?: JSONValue): JSONValue;
    /**
     * Resolves a single path segment in the context of a JSON object.
     * Falls back to searching children for matching keys.
     *
     * @param obj The current object
     * @param segment The path segment to resolve
     * @returns Resolved value or undefined
     */
    private resolveSegment;
    /**
     * Converts a plain JSON object to the XML-like JSON structure.
     * Optionally wraps the result in a root element with attributes and namespaces.
     *
     * @param obj Standard JSON object
     * @param root Optional root element configuration (either a string or object with $ keys)
     * @returns XML-like JSON object
     */
    objectToXJX(obj: JSONValue, root?: string | JSONObject): XMLJSONNode;
    /**
     * Wraps a standard JSON value in the XML-like JSON structure
     * @param value Value to wrap
     * @returns Wrapped value
     */
    private wrapObject;
    /**
     * Check if a value is empty
     * @param value Value to check
     * @returns true if empty
     */
    isEmpty(value: JSONValue): boolean;
    /**
     * Safely stringify JSON for debugging
     * @param obj Object to stringify
     * @param indent Optional indentation level
     * @returns JSON string representation
     */
    safeStringify(obj: JSONValue, indent?: number): string;
    /**
     * Deep clone an object
     * @param obj Object to clone
     * @returns Cloned object
     */
    deepClone<T>(obj: T): T;
    /**
     * Deep merge two objects with proper type handling
     * @param target Target object
     * @param source Source object
     * @returns Merged object (target is modified)
     */
    deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T;
    /**
     * Generates a JSON schema that matches the current configuration
     * @returns JSON schema object
     */
    generateJsonSchema(): JSONObject;
    /**
     * Generate an example JSON object based on the schema
     * @param {string} rootName - Name of the root element
     * @returns {Record<string, any>} - Example JSON object
     */
    generateExample(rootName?: string): XMLJSONNode;
}
