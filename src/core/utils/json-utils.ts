/**
 * JSONUtil - Utility functions for JSON processing
 */
import { Configuration } from "../types/config-types";
import {
  JSONValue,
  JSONObject,
  JSONArray,
  XMLJSONNode,
  XMLJSONElement,
} from "../types/json-types";

export class JsonUtil {
  protected config: Configuration;

  /**
   * Constructor for JSONUtil
   * @param config Configuration options
   */
  constructor(config: Configuration) {
    this.config = config;
  }

  /**
   * Converts a plain JSON object to the XML-like JSON structure.
   * Optionally wraps the result in a root element with attributes and namespaces.
   *
   * @param obj Standard JSON object
   * @param root Optional root element configuration (either a string or object with $ keys)
   * @returns XML-like JSON object
   */
  objectToXJX(obj: JSONValue, root?: string | JSONObject): XMLJSONNode {
    const wrappedObject = this.wrapObject(obj);

    if (typeof root === "string") {
      // Root is a simple string: wrap result with this root tag
      return { [root]: wrappedObject as XMLJSONElement };
    }

    if (root && typeof root === "object" && !Array.isArray(root)) {
      // Handle root with config-based keys
      const elementName = ((root as JSONObject).name as string) || "root"; // Default to "root" if no name is provided
      const prefix =
        ((root as JSONObject)[this.config.propNames.prefix] as string) || "";
      const qualifiedName = prefix ? `${prefix}:${elementName}` : elementName;

      const result: XMLJSONNode = {
        [qualifiedName]: {} as XMLJSONElement,
      };

      const rootElement = result[qualifiedName];

      // Add attributes to the root element if defined
      const attrsKey = this.config.propNames.attributes;
      if (root[attrsKey] && Array.isArray(root[attrsKey])) {
        rootElement[attrsKey] = root[attrsKey] as JSONArray;
      }

      // Merge existing children with the new generated children
      const childrenKey = this.config.propNames.children;
      const children = root[childrenKey]
        ? (root[childrenKey] as JSONArray)
        : [];
      rootElement[childrenKey] = [
        ...children,
        { [elementName]: wrappedObject as XMLJSONElement },
      ] as unknown as XMLJSONNode[];

      // Add namespace and prefix if defined
      const nsKey = this.config.propNames.namespace;
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
   * @returns Wrapped value
   */
  private wrapObject(value: JSONValue): JSONObject {
    const valKey = this.config.propNames.value;
    const childrenKey = this.config.propNames.children;

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
          return this.wrapObject(item);
        }),
      };
    }

    if (typeof value === "object" && value !== null) {
      // It's an object: wrap its properties in children
      const children = Object.entries(value as JSONObject).map(
        ([key, val]) => ({
          [key]: this.wrapObject(val),
        })
      );

      return { [childrenKey]: children };
    }

    return {}; // Empty object for unsupported types
  }

  /**
   * Check if a value is empty
   * @param value Value to check
   * @returns true if empty
   */
  isEmpty(value: JSONValue): boolean {
    if (value == null) return true;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === "object")
      return Object.keys(value as JSONObject).length === 0;
    return false;
  }

  /**
   * Safely stringify JSON for debugging
   * @param obj Object to stringify
   * @param indent Optional indentation level
   * @returns JSON string representation
   */
  safeStringify(obj: JSONValue, indent: number = 2): string {
    try {
      return JSON.stringify(obj, null, indent);
    } catch (error) {
      return "[Cannot stringify object]";
    }
  }

  /**
   * Deep clone an object
   * @param obj Object to clone
   * @returns Cloned object
   */
  deepClone<T>(obj: T): T {
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch (error) {
      throw new Error(
        `Failed to deep clone object: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Deep merge two objects with proper type handling
   * @param target Target object
   * @param source Source object
   * @returns Merged object (target is modified)
   */
  deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
    if (!source || typeof source !== "object" || source === null) {
      return target;
    }

    if (!target || typeof target !== "object" || target === null) {
      return source as T;
    }

    Object.keys(source).forEach((key) => {
      const sourceValue = source[key as keyof Partial<T>];
      const targetValue = target[key as keyof T];

      // If both source and target values are objects, recursively merge them
      if (
        sourceValue !== null &&
        targetValue !== null &&
        typeof sourceValue === "object" &&
        typeof targetValue === "object" &&
        !Array.isArray(sourceValue) &&
        !Array.isArray(targetValue)
      ) {
        // Recursively merge the nested objects
        (target as Record<string, any>)[key] = this.deepMerge(
          targetValue as Record<string, any>,
          sourceValue as Record<string, any>
        );
      } else {
        // Otherwise just replace the value
        (target as Record<string, any>)[key] = sourceValue;
      }
    });

    return target;
  }
}