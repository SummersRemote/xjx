import { Configuration } from "../core/config";
import { NodeType } from "../core/dom";
import {
  logger,
  ProcessingError,
  validate,
  ValidationError,
} from "../core/error";
import { XNode, createElement, createTextNode, addChild } from "../core/xnode";
import {
  validateInput,
  Converter,
  JsonOptions,
  JsonValue,
  JsonObject,
  JsonArray,
} from "../core/converter";
import { createConverter } from "../core/converter";

/**
 * Create a JSON to XNode converter
 * @param config Configuration for the converter
 * @returns Converter implementation
 */
export function createJsonToXNodeConverter(
  config: Configuration
): Converter<JsonValue, XNode, JsonOptions> {
  return createConverter(
    config,
    (json: JsonValue, config: Configuration, options?: JsonOptions) => {
      // Validate input
      validateInput(
        json,
        "JSON source must be a valid object or array",
        (input) => input !== null && typeof input === "object"
      );

      try {
        logger.debug("Starting JSON to XNode conversion", {
          sourceType: Array.isArray(json) ? "array" : "object",
        });

        // Create converter instance
        const converter = new JsonToXNodeConverterImpl(config);

        // Apply any overridden options
        const effectiveConfig = { ...config };
        if (options) {
          Object.assign(effectiveConfig, options);
        }

        // Convert with effective config
        return converter.convert(json, { config: effectiveConfig });
      } catch (err) {
        throw new ProcessingError(
          `Failed to convert JSON to XNode: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      }
    }
  );
}

/**
 * Implementation of JSON to XNode converter
 */
class JsonToXNodeConverterImpl
  implements Converter<JsonValue, XNode, { config: Configuration }>
{
  private readonly config: Configuration;

  /**
   * Create a new converter
   * @param config Base configuration
   */
  constructor(config: Configuration) {
    this.config = config;
  }

  /**
   * Convert JSON to XNode
   * @param json JSON to convert
   * @param options Options including effective configuration
   * @returns XNode representation
   */
  convert(json: JsonValue, options?: { config: Configuration }): XNode {
    // Use provided config or default to instance config
    const config = options?.config || this.config;

    // Handle array input (create a wrapper element)
    if (Array.isArray(json)) {
      return this.convertJsonArray(json as JsonArray, config);
    }

    // Handle object input
    if (typeof json === "object" && json !== null) {
      return this.convertJsonObject(json as JsonObject, config);
    }

    // Handle primitive values
    return this.convertJsonPrimitive(json, config);
  }

  /**
   * Convert a JSON object to XNode
   * @param obj JSON object
   * @param config Configuration
   * @returns XNode representation
   */
  private convertJsonObject(obj: JsonObject, config: Configuration): XNode {
    // Get the root element name
    const rootName = Object.keys(obj)[0];

    if (!rootName) {
      throw new ValidationError("JSON object must have at least one property");
    }

    // Split the name into prefix and local parts if it contains a colon
    let prefix: string | undefined;
    let localName: string = rootName;

    if (config.preservePrefixedNames && rootName.includes(":")) {
      const parts = rootName.split(":");
      prefix = parts[0];
      localName = parts[1];
    }

    // Get the value for this property
    const value = obj[rootName];

    // Create the root element
    const rootNode = createElement(localName);

    // Set the prefix if we extracted one
    if (prefix) {
      rootNode.prefix = prefix;
    }

    // Process the value
    this.processJsonValue(rootNode, value, config);

    return rootNode;
  }

  /**
   * Convert a JSON array to XNode
   * @param array JSON array
   * @param config Configuration
   * @returns XNode representation
   */
  private convertJsonArray(array: JsonArray, config: Configuration): XNode {
    // Create a root array element
    const rootName = "array"; // Default name for arrays
    const rootNode = createElement(rootName);

    // Get the item name for array items
    const itemName = config.arrays.defaultItemName;

    // Process array items
    array.forEach((item) => {
      this.processArrayItem(rootNode, item, itemName, config);
    });

    return rootNode;
  }

  /**
   * Convert a JSON primitive value to XNode
   * @param value JSON primitive
   * @param config Configuration
   * @returns XNode representation
   */
  private convertJsonPrimitive(value: JsonValue, config: Configuration): XNode {
    // Create a default element
    const rootNode = createElement("value");

    // Set the value
    if (value !== undefined && value !== null) {
      rootNode.value = value;
    }

    return rootNode;
  }

  /**
   * Process a JSON value into an XNode element
   * @param element Target element
   * @param value JSON value
   * @param config Configuration
   */
  private processJsonValue(
    element: XNode,
    value: JsonValue,
    config: Configuration
  ): void {
    // Handle different types of values
    if (value === null) {
      // null value based on strategy
      this.processNullValue(element, config);
    } else if (typeof value === "object" && !Array.isArray(value)) {
      // Object value
      this.processObjectValue(element, value as JsonObject, config);
    } else if (Array.isArray(value)) {
      // Array value
      this.processArrayValue(element, value as JsonArray, config);
    } else {
      // Primitive value
      element.value = value;
    }
  }

  /**
   * Process a null value
   * @param element Target element
   * @param config Configuration
   */
  private processNullValue(element: XNode, config: Configuration): void {
    // Handle null values based on emptyElementStrategy
    switch (config.strategies.emptyElementStrategy) {
      case "null":
        element.value = null;
        break;

      case "string":
        element.value = "";
        break;

      case "object":
      default:
        // Leave as empty object
        break;
    }
  }

  /**
   * Process an object value
   * @param element Target element
   * @param obj Object value
   * @param config Configuration
   */
  private processObjectValue(
    element: XNode,
    obj: JsonObject,
    config: Configuration
  ): void {
    const { properties, prefixes } = config;
    const { attributeStrategy, textStrategy } = config.strategies;

    // Check if this is an element with attributes and/or text content
    let hasAttributes = false;
    let textContent: any = undefined;
    let remainingProperties = { ...obj };

    // Extract attributes based on strategy
    if (config.preserveAttributes) {
      switch (attributeStrategy) {
        case "property":
          // Attributes are in a dedicated property
          const attrs = obj[properties.attribute];
          if (attrs && typeof attrs === "object" && !Array.isArray(attrs)) {
            element.attributes = this.processAttributeObject(
              attrs as JsonObject,
              config
            );
            delete remainingProperties[properties.attribute];
            hasAttributes = true;
          }
          break;

        case "prefix":
          // Attributes are prefixed
          const attrPrefix = prefixes.attribute;
          Object.entries(obj).forEach(([key, value]) => {
            if (key.startsWith(attrPrefix)) {
              // Initialize attributes if needed
              if (!element.attributes) {
                element.attributes = {};
              }
              // Set attribute without prefix - apply preservePrefixedNames logic
              const attrName = key.substring(attrPrefix.length);
              const finalAttrName = this.processAttributeName(attrName, config);
              element.attributes[finalAttrName] = value;
              delete remainingProperties[key];
              hasAttributes = true;
            }
          });
          break;

        case "merge":
          // No special handling, attributes are mixed with content
          // We'll handle this after text extraction
          break;
      }
    }

    // Extract text content based on strategy
    if (config.preserveTextNodes) {
      if (obj[properties.text] !== undefined) {
        textContent = obj[properties.text];
        delete remainingProperties[properties.text];
      }
    }

    // For merge strategy, remaining properties after text extraction
    // could be attributes or child elements. Need to determine which is which.
    if (attributeStrategy === "merge" && config.preserveAttributes) {
      const childElements: Record<string, any> = {};
      const attributes: Record<string, any> = {};

      // Heuristic: primitives are likely attributes, objects/arrays are likely elements
      Object.entries(remainingProperties).forEach(([key, value]) => {
        if (value === null || typeof value !== "object") {
          // Apply preservePrefixedNames logic to attribute names
          const finalAttrName = this.processAttributeName(key, config);
          attributes[finalAttrName] = value;
        } else {
          childElements[key] = value;
        }
      });

      // Set attributes if we found any
      if (Object.keys(attributes).length > 0) {
        element.attributes = attributes;
        hasAttributes = true;

        // Update remaining properties to only include child elements
        remainingProperties = childElements;
      }
    }

    // Extract text content based on strategy
    if (config.preserveTextNodes) {
      if (obj[properties.text] !== undefined) {
        textContent = obj[properties.text];
        delete remainingProperties[properties.text];
      }
    }

    // For merge strategy, remaining properties after text extraction
    // could be attributes or child elements. Need to determine which is which.
    if (attributeStrategy === "merge" && config.preserveAttributes) {
      const childElements: Record<string, any> = {};
      const attributes: Record<string, any> = {};

      // Heuristic: primitives are likely attributes, objects/arrays are likely elements
      Object.entries(remainingProperties).forEach(([key, value]) => {
        if (value === null || typeof value !== "object") {
          attributes[key] = value;
        } else {
          childElements[key] = value;
        }
      });

      // Set attributes if we found any
      if (Object.keys(attributes).length > 0) {
        element.attributes = attributes;
        hasAttributes = true;

        // Update remaining properties to only include child elements
        remainingProperties = childElements;
      }
    }

    // Set text content if we found it
    if (textContent !== undefined) {
      if (
        Object.keys(remainingProperties).length === 0 ||
        textStrategy === "direct"
      ) {
        // Only text content (or direct strategy), set as node value
        element.value = textContent;
      } else {
        // Mixed content, add text as child node
        const textNode = createTextNode(String(textContent));
        addChild(element, textNode);
      }
    }

    // Process remaining properties as child elements
    Object.entries(remainingProperties).forEach(([key, value]) => {
      // Handle prefixed element names if configured
      let prefix: string | undefined;
      let localName: string = key;

      if (config.preservePrefixedNames && key.includes(":")) {
        const parts = key.split(":");
        prefix = parts[0];
        localName = parts[1];
      }

      // Create child element
      const childElement = createElement(localName);

      // Set prefix if extracted
      if (prefix) {
        childElement.prefix = prefix;
      }

      // Process its value
      this.processJsonValue(childElement, value, config);

      // Add to parent
      addChild(element, childElement);
    });
  }

  /**
   * Process attribute object from JSON
   * @param attrs Attributes object from JSON
   * @param config Configuration
   * @returns Processed attributes object
   */
  private processAttributeObject(
    attrs: JsonObject,
    config: Configuration
  ): Record<string, any> {
    const result: Record<string, any> = {};

    Object.entries(attrs).forEach(([key, value]) => {
      const finalAttrName = this.processAttributeName(key, config);
      result[finalAttrName] = value;
    });

    return result;
  }

  /**
   * Process attribute name based on configuration
   * @param attrName Original attribute name
   * @param config Configuration
   * @returns Processed attribute name
   */
  private processAttributeName(
    attrName: string,
    config: Configuration
  ): string {
    // The name in JSON might be prefixed or not, depending on how it was converted
    // We need to handle both cases based on preservePrefixedNames

    if (config.preservePrefixedNames) {
      // If we're preserving prefixed names, keep the name as-is
      return attrName;
    } else {
      // If we're not preserving prefixed names, strip any prefix
      if (attrName.includes(":")) {
        const parts = attrName.split(":");
        return parts[parts.length - 1]; // Return the local name part
      }
      return attrName;
    }
  }

  /**
   * Process an array value
   * @param element Target element
   * @param array Array value
   * @param config Configuration
   */
  private processArrayValue(
    element: XNode,
    array: JsonArray,
    config: Configuration
  ): void {
    // Determine the name to use for child elements
    let itemName =
      config.arrays.itemNames[element.name] || config.arrays.defaultItemName;

    // Process each item in the array
    array.forEach((item) => {
      this.processArrayItem(element, item, itemName, config);
    });
  }

  /**
   * Process an array item
   * @param parent Parent element
   * @param item Array item
   * @param itemName Name for child element
   * @param config Configuration
   */
  private processArrayItem(
    parent: XNode,
    item: JsonValue,
    itemName: string,
    config: Configuration
  ): void {
    if (item === null) {
      // Null item based on strategy
      if (config.strategies.emptyElementStrategy !== "object") {
        const childElement = createElement(itemName);
        this.processNullValue(childElement, config);
        addChild(parent, childElement);
      }
      return;
    }

    if (typeof item === "object" && !Array.isArray(item)) {
      // Item is an object
      const obj = item as JsonObject;

      // Check if this is a proper element with a single root
      const keys = Object.keys(obj);
      if (keys.length === 1) {
        // Use the object key as the element name
        const key = keys[0];

        // Handle prefixed names if needed
        let prefix: string | undefined;
        let localName: string = key;

        if (config.preservePrefixedNames && key.includes(":")) {
          const parts = key.split(":");
          prefix = parts[0];
          localName = parts[1];
        }

        // Create element
        const childElement = createElement(localName);

        // Set prefix if extracted
        if (prefix) {
          childElement.prefix = prefix;
        }

        this.processJsonValue(childElement, obj[key], config);
        addChild(parent, childElement);
      } else {
        // Multiple properties, use the default name and add properties as children
        const childElement = createElement(itemName);
        this.processJsonValue(childElement, obj, config);
        addChild(parent, childElement);
      }
    } else if (Array.isArray(item)) {
      // Nested array, create an element with the default name
      const childElement = createElement(itemName);
      this.processArrayValue(childElement, item as JsonArray, config);
      addChild(parent, childElement);
    } else {
      // Primitive value
      const childElement = createElement(itemName);
      childElement.value = item;
      addChild(parent, childElement);
    }
  }
}
