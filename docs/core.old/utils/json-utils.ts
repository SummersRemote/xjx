/**
 * JSON - Static utility for JSON operations
 * 
 * Provides utilities for working with JSON structures in the XJX library.
 */
import { Configuration } from "../types/config-types";
import { ErrorHandler } from "./error-utils";
import { Common } from "./common-utils";
import {
  JSONValue,
  JSONObject,
  JSONArray,
  XMLJSONNode,
  XMLJSONElement,
} from "../types/json-types";

export class JSON {
  /**
   * Converts a plain JSON object to the XML-like JSON structure.
   * Optionally wraps the result in a root element with attributes and namespaces.
   *
   * @param obj Standard JSON object
   * @param config Configuration object
   * @param root Optional root element configuration (either a string or object with $ keys)
   * @returns XML-like JSON object
   */
  public static objectToXJX(
    obj: JSONValue, 
    config: Configuration,
    root?: string | JSONObject
  ): XMLJSONNode {
    const wrappedObject = JSON.wrapObject(obj, config);

    if (typeof root === "string") {
      // Root is a simple string: wrap result with this root tag
      return { [root]: wrappedObject as XMLJSONElement };
    }

    if (root && typeof root === "object" && !Array.isArray(root)) {
      // Handle root with config-based keys
      const elementName = ((root as JSONObject).name as string) || "root"; // Default to "root" if no name is provided
      const prefix =
        ((root as JSONObject)[config.propNames.prefix] as string) || "";
      const qualifiedName = prefix ? `${prefix}:${elementName}` : elementName;

      const result: XMLJSONNode = {
        [qualifiedName]: {} as XMLJSONElement,
      };

      const rootElement = result[qualifiedName];

      // Add attributes to the root element if defined
      const attrsKey = config.propNames.attributes;
      if (root[attrsKey] && Array.isArray(root[attrsKey])) {
        rootElement[attrsKey] = root[attrsKey] as JSONArray;
      }

      // Merge existing children with the new generated children
      const childrenKey = config.propNames.children;
      const children = root[childrenKey]
        ? (root[childrenKey] as JSONArray)
        : [];
      rootElement[childrenKey] = [
        ...children,
        { [elementName]: wrappedObject as XMLJSONElement },
      ] as unknown as XMLJSONNode[];

      // Add namespace and prefix if defined
      const nsKey = config.propNames.namespace;
      if (root[nsKey]) {
        rootElement[nsKey] = root[nsKey] as JSONValue;
      }

      if (prefix && root[nsKey]) {
        rootElement[`xmlns:${prefix}`] = root[nsKey] as JSONValue;
      }

      return result;
    }

    // Default behavior if no root is provided
    return wrappedObject as unknown as XMLJSONNode;
  }

  /**
   * Wraps a standard JSON value in the XML-like JSON structure
   * @param value Value to wrap
   * @param config Configuration object
   * @returns Wrapped value
   * @private
   */
  private static wrapObject(value: JSONValue, config: Configuration): JSONObject {
    const valKey = config.propNames.value;
    const childrenKey = config.propNames.children;

    if (
      value === null ||
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return { [valKey]: value };
    }

    if (Array.isArray(value)) {
      // For arrays, wrap each item and return as a children-style array of repeated elements
      return {
        [childrenKey]: value.map((item) => {
          return JSON.wrapObject(item, config);
        }),
      };
    }

    if (typeof value === "object" && value !== null) {
      // It's an object: wrap its properties in children
      const children = Object.entries(value as JSONObject).map(
        ([key, val]) => ({
          [key]: JSON.wrapObject(val, config),
        })
      );

      return { [childrenKey]: children };
    }

    return {}; // Empty object for unsupported types
  }

  /**
   * Recursively compacts a JSON structure by removing empty objects and arrays
   * Empty means: {}, [], null, undefined
   * Preserves all primitive values including empty strings, 0, false, etc.
   *
   * @param value JSON value to compact
   * @returns Compacted JSON value or undefined if the value is completely empty
   */
  public static compactJson(value: JSONValue): JSONValue | undefined {
    // Handle null/undefined
    if (value === null || value === undefined) {
      return undefined;
    }

    // Preserve primitive values (including empty strings, zeros, and booleans)
    if (typeof value !== "object") {
      return value;
    }

    // Handle arrays
    if (Array.isArray(value)) {
      const compactedArray: JSONValue[] = [];

      for (const item of value) {
        const compactedItem = JSON.compactJson(item);
        if (compactedItem !== undefined) {
          compactedArray.push(compactedItem);
        }
      }

      return compactedArray.length > 0 ? compactedArray : undefined;
    }

    // Handle objects
    const compactedObj: JSONObject = {};
    let hasProperties = false;

    for (const [key, propValue] of Object.entries(value as JSONObject)) {
      const compactedValue = JSON.compactJson(propValue);
      if (compactedValue !== undefined) {
        compactedObj[key] = compactedValue;
        hasProperties = true;
      }
    }

    return hasProperties ? compactedObj : undefined;
  }

  /**
   * Safely stringify JSON for debugging
   * @param obj Object to stringify
   * @param indent Optional indentation level
   * @returns JSON string representation
   */
  public static safeStringify(obj: JSONValue, indent: number = 2): string {
    try {
      return JSON.stringify(obj, null, indent);
    } catch (error) {
      return "[Cannot stringify object]";
    }
  }

  /**
   * Safely parse a JSON string
   * @param text JSON string to parse
   * @returns Parsed object or null if parsing fails
   */
  public static safeParse(text: string): JSONValue | null {
    try {
      return JSON.parse(text);
    } catch (error) {
      return null;
    }
  }

  /**
   * Validate that a value is a valid JSON object
   * @param value Value to validate
   * @returns True if the value is a valid JSON object
   */
  public static isValidJsonObject(value: any): boolean {
    return value !== null && 
           typeof value === 'object' && 
           !Array.isArray(value);
  }

  /**
   * Validate that a value is a valid JSON array
   * @param value Value to validate
   * @returns True if the value is a valid JSON array
   */
  public static isValidJsonArray(value: any): boolean {
    return Array.isArray(value);
  }

  /**
   * Validate that a value is a valid JSON primitive
   * @param value Value to validate
   * @returns True if the value is a valid JSON primitive
   */
  public static isValidJsonPrimitive(value: any): boolean {
    return value === null || 
           typeof value === 'string' || 
           typeof value === 'number' || 
           typeof value === 'boolean';
  }

  /**
   * Validate that a value is a valid JSON value
   * @param value Value to validate
   * @returns True if the value is a valid JSON value
   */
  public static isValidJsonValue(value: any): boolean {
    if (JSON.isValidJsonPrimitive(value)) {
      return true;
    }

    if (JSON.isValidJsonArray(value)) {
      return (value as any[]).every(item => JSON.isValidJsonValue(item));
    }

    if (JSON.isValidJsonObject(value)) {
      return Object.values(value).every(item => JSON.isValidJsonValue(item));
    }

    return false;
  }

  /**
   * Get a value from a JSON object using a path
   * @param obj Object to get value from
   * @param path Path to value (dot notation)
   * @param defaultValue Default value if path not found
   * @returns Value at path or default value
   */
  public static getPath<T>(obj: JSONValue, path: string, defaultValue?: T): T | undefined {
    return Common.getPath(obj, path, defaultValue);
  }

  /**
   * Set a value in a JSON object using a path
   * @param obj Object to set value in
   * @param path Path to value (dot notation)
   * @param value Value to set
   * @returns New object with value set (original object is not modified)
   */
  public static setPath<T extends JSONValue>(obj: T, path: string, value: JSONValue): T {
    if (!obj || typeof obj !== 'object') {
      // Cannot set path on a primitive
      return obj;
    }

    const result = Common.deepClone(obj);
    const segments = path.split('.');
    let current: any = result;

    // Navigate to the parent of the property to set
    for (let i = 0; i < segments.length - 1; i++) {
      const segment = segments[i];

      // Create parent objects if they don't exist
      if (current[segment] === undefined || current[segment] === null) {
        current[segment] = {};
      } else if (typeof current[segment] !== 'object' || Array.isArray(current[segment])) {
        // Cannot set property on a non-object
        return obj;
      }

      current = current[segment];
    }

    // Set the value
    current[segments[segments.length - 1]] = value;
    return result;
  }
}