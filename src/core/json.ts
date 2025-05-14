/**
 * JSON utilities and type definitions
 */
import { Common } from './common';
import { Configuration } from './config';
import { logger, validate, ValidationError, SerializeError, ParseError } from './error';

/**
 * Basic JSON primitive types
 */
export type JSONPrimitive = string | number | boolean | null;

/**
 * JSON array type (recursive definition)
 */
export type JSONArray = JSONValue[];

/**
 * JSON object type (recursive definition)
 */
export interface JSONObject {
  [key: string]: JSONValue;
}

/**
 * Combined JSON value type that can be any valid JSON structure
 */
export type JSONValue = JSONPrimitive | JSONArray | JSONObject;

/**
 * Type for XML-in-JSON structure based on the library's configuration
 * This is a generic template that will use the actual property names from config
 */
export interface XMLJSONNode {
  [tagName: string]: XMLJSONElement;
}

/**
 * Structure of an XML element in JSON representation
 */
export interface XMLJSONElement {
  // These fields will match the propNames in Configuration
  [key: string]: JSONValue | XMLJSONNode[];
}

/**
 * JSON utilities
 */
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
  static objectToXJX(
    obj: JSONValue, 
    config: Configuration,
    root?: string | JSONObject
  ): XMLJSONNode {
    try {
      // VALIDATION: Check for valid inputs
      validate(obj !== undefined, "Object must be provided");
      validate(config !== null && typeof config === 'object', "Configuration must be a valid object");
      
      const wrappedObject = JSON.wrapObject(obj, config);

      if (typeof root === "string") {
        // Root is a simple string: wrap result with this root tag
        logger.debug('Wrapping object with simple root tag', { root });
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

        logger.debug('Wrapped object with complex root element', { 
          elementName,
          prefix,
          hasNamespace: !!root[nsKey]
        });
        
        return result;
      }

      // Default behavior if no root is provided
      logger.debug('Using wrapped object as-is (no root provided)');
      return wrappedObject as unknown as XMLJSONNode;
    } catch (err) {
      if (err instanceof ValidationError) {
        logger.error('Failed to convert object to XJX due to validation error', err);
        throw err;
      } else {
        const error = new SerializeError('Failed to convert object to XML-like JSON structure', { obj, root });
        logger.error('Failed to convert object to XJX', error);
        throw error;
      }
    }
  }

  /**
   * Wraps a standard JSON value in the XML-like JSON structure
   * @param value Value to wrap
   * @param config Configuration object
   * @returns Wrapped value
   * @private
   */
  private static wrapObject(value: JSONValue, config: Configuration): JSONObject {
    try {
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
    } catch (err) {
      logger.error('Failed to wrap object', err);
      throw err;
    }
  }

  /**
   * Recursively compacts a JSON structure by removing empty objects and arrays
   * Empty means: {}, [], null, undefined
   * Preserves all primitive values including empty strings, 0, false, etc.
   *
   * @param value JSON value to compact
   * @returns Compacted JSON value or undefined if the value is completely empty
   */
  static compact(value: JSONValue): JSONValue | undefined {
    try {
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
          const compactedItem = JSON.compact(item);
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
        const compactedValue = JSON.compact(propValue);
        if (compactedValue !== undefined) {
          compactedObj[key] = compactedValue;
          hasProperties = true;
        }
      }

      logger.debug('Compacted JSON object', { 
        originalKeys: Object.keys(value as JSONObject).length,
        compactedKeys: hasProperties ? Object.keys(compactedObj).length : 0
      });
      
      return hasProperties ? compactedObj : undefined;
    } catch (err) {
      logger.error('Failed to compact JSON', err);
      throw err;
    }
  }

  /**
   * Safely stringify JSON for debugging
   * @param obj Object to stringify
   * @param indent Optional indentation level
   * @returns JSON string representation
   */
  static safeStringify(obj: JSONValue, indent: number = 2): string {
    try {
      // VALIDATION: Check for valid input
      validate(Number.isInteger(indent) && indent >= 0, "Indent must be a non-negative integer");
      
      return global.JSON.stringify(obj, null, indent);
    } catch (err) {
      logger.debug('Could not stringify object', err);
      return "[Cannot stringify object]";
    }
  }

  /**
   * Safely parse a JSON string
   * @param text JSON string to parse
   * @returns Parsed object or null if parsing fails
   */
  static safeParse(text: string): JSONValue | null {
    try {
      // VALIDATION: Check for valid input
      validate(typeof text === "string", "Text must be a string");
      
      return global.JSON.parse(text);
    } catch (err) {
      logger.debug('Could not parse JSON string', err);
      return null;
    }
  }

  /**
   * Validate that a value is a valid JSON object
   * @param value Value to validate
   * @returns True if the value is a valid JSON object
   */
  static isValidObject(value: any): boolean {
    try {
      return value !== null && 
           typeof value === 'object' && 
           !Array.isArray(value);
    } catch (err) {
      logger.error('Error validating JSON object', err);
      return false;
    }
  }

  /**
   * Validate that a value is a valid JSON array
   * @param value Value to validate
   * @returns True if the value is a valid JSON array
   */
  static isValidArray(value: any): boolean {
    try {
      return Array.isArray(value);
    } catch (err) {
      logger.error('Error validating JSON array', err);
      return false;
    }
  }

  /**
   * Validate that a value is a valid JSON primitive
   * @param value Value to validate
   * @returns True if the value is a valid JSON primitive
   */
  static isValidPrimitive(value: any): boolean {
    try {
      return value === null || 
           typeof value === 'string' || 
           typeof value === 'number' || 
           typeof value === 'boolean';
    } catch (err) {
      logger.error('Error validating JSON primitive', err);
      return false;
    }
  }

  /**
   * Validate that a value is a valid JSON value
   * @param value Value to validate
   * @returns True if the value is a valid JSON value
   */
  static isValidValue(value: any): boolean {
    try {
      if (JSON.isValidPrimitive(value)) {
        return true;
      }

      if (JSON.isValidArray(value)) {
        return (value as any[]).every(item => JSON.isValidValue(item));
      }

      if (JSON.isValidObject(value)) {
        return Object.values(value).every(item => JSON.isValidValue(item));
      }

      return false;
    } catch (err) {
      logger.error('Error validating JSON value', err);
      return false;
    }
  }

  /**
   * Get a value from a JSON object using a path
   * @param obj Object to get value from
   * @param path Path to value (dot notation)
   * @param defaultValue Default value if path not found
   * @returns Value at path or default value
   */
  static getPath<T>(obj: JSONValue, path: string, defaultValue?: T): T | undefined {
    try {
      // VALIDATION: Check for valid input
      validate(typeof path === "string", "Path must be a string");
      
      return Common.getPath(obj, path, defaultValue);
    } catch (err) {
      if (err instanceof ValidationError) {
        logger.error('Failed to get path due to validation error', err);
        throw err;
      } else {
        logger.error('Failed to get path from JSON object', err);
        return defaultValue;
      }
    }
  }

  /**
   * Set a value in a JSON object using a path
   * @param obj Object to set value in
   * @param path Path to value (dot notation)
   * @param value Value to set
   * @returns New object with value set (original object is not modified)
   */
  static setPath<T extends JSONValue>(obj: T, path: string, value: JSONValue): T {
    try {
      // VALIDATION: Check for valid input
      validate(typeof path === "string", "Path must be a string");
      
      return Common.setPath(obj, path, value);
    } catch (err) {
      if (err instanceof ValidationError) {
        logger.error('Failed to set path due to validation error', err);
        throw err;
      } else {
        const error = new SerializeError(`Failed to set path ${path} in JSON object`, { obj, path, value });
        logger.error('Failed to set path in JSON object', error);
        throw error;
      }
    }
  }
}