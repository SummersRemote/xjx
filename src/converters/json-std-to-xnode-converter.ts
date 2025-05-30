/**
 * JSON Standard to XNode converter implementation - Updated for new hook system
 */
import { LoggerFactory } from "../core/logger";
const logger = LoggerFactory.create();

import { Configuration } from "../core/config";
import { NodeType } from "../core/dom";
import { ProcessingError, ValidationError } from "../core/error";
import { XNode, createElement, createTextNode, addChild } from "../core/xnode";
import { 
  Converter, 
  SourceHooks,
  JsonValue,
  JsonObject,
  JsonArray,
  parseElementName,
  getAttributeName,
  processAttributeObject
} from "../core/converter";

/**
 * JSON Standard to XNode converter
 */
export const jsonToXNodeConverter: Converter<JsonValue, XNode> = {
  convert(json: JsonValue, config: Configuration): XNode {
    logger.debug('Starting JSON to XNode conversion', {
      sourceType: Array.isArray(json) ? 'array' : typeof json
    });

    // Handle array input (create a wrapper element)
    if (Array.isArray(json)) {
      return convertJsonArray(json, config);
    }

    // Handle object input
    if (typeof json === 'object' && json !== null) {
      return convertJsonObject(json as JsonObject, config);
    }

    // Handle primitive values
    return convertJsonPrimitive(json, config);
  }
};

/**
 * Convert JSON with source hooks support - FIXED TIMING
 * @param json JSON value
 * @param config Configuration
 * @param hooks Source hooks
 * @returns Converted XNode with hooks applied
 */
export function convertJsonWithHooks(
  json: JsonValue,
  config: Configuration,
  hooks?: SourceHooks<JsonValue>
): XNode {
  let processedJson = json;
  
  // Apply beforeTransform hook to raw JSON
  if (hooks?.beforeTransform) {
    try {
      const beforeResult = hooks.beforeTransform(processedJson);
      if (beforeResult !== undefined && beforeResult !== null) {
        processedJson = beforeResult;
      }
    } catch (err) {
      logger.warn(`Error in JSON source beforeTransform: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  
  // Convert JSON to XNode (fully populated)
  const xnode = jsonToXNodeConverter.convert(processedJson, config);
  
  // Apply afterTransform hook to fully populated XNode
  let processedXNode = xnode;
  if (hooks?.afterTransform) {
    try {
      const afterResult = hooks.afterTransform(processedXNode);
      if (afterResult && typeof afterResult === 'object' && typeof afterResult.name === 'string') {
        processedXNode = afterResult;
      }
    } catch (err) {
      logger.warn(`Error in JSON source afterTransform: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  
  return processedXNode;
}

/**
 * Convert a JSON object to XNode
 */
function convertJsonObject(
  obj: JsonObject, 
  config: Configuration
): XNode {
  // Get the root element name
  const rootName = Object.keys(obj)[0];
  if (!rootName) {
    throw new ValidationError("JSON object must have at least one property");
  }

  // Parse element name for prefix handling
  const { prefix, localName } = parseElementName(rootName, config.preservePrefixedNames);
  
  // Create the root element
  let rootNode = createElement(localName);
  if (prefix) {
    rootNode.prefix = prefix;
  }

  // Get the value for this property
  const value = obj[rootName];

  // Process the value
  processJsonValue(rootNode, value, config);

  return rootNode;
}

/**
 * Convert a JSON array to XNode
 */
function convertJsonArray(
  array: JsonArray, 
  config: Configuration
): XNode {
  // Create a root array element
  let rootNode = createElement("array");

  // Get the item name for array items
  const itemName = config.arrays.defaultItemName;

  // Process array items
  array.forEach((item) => {
    processArrayItem(rootNode, item, itemName, config);
  });

  return rootNode;
}

/**
 * Convert a JSON primitive value to XNode
 */
function convertJsonPrimitive(
  value: JsonValue, 
  config: Configuration
): XNode {
  let rootNode = createElement("value");

  if (value !== undefined && value !== null) {
    rootNode.value = value;
  }

  return rootNode;
}

/**
 * Process a JSON value into an XNode element
 */
function processJsonValue(
  element: XNode,
  value: JsonValue,
  config: Configuration
): void {
  if (value === null) {
    processNullValue(element, config);
  } else if (typeof value === 'object' && !Array.isArray(value)) {
    processObjectValue(element, value as JsonObject, config);
  } else if (Array.isArray(value)) {
    processArrayValue(element, value as JsonArray, config);
  } else {
    element.value = value;
  }
}

/**
 * Process a null value
 */
function processNullValue(element: XNode, config: Configuration): void {
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
 */
function processObjectValue(
  element: XNode,
  obj: JsonObject,
  config: Configuration
): void {
  const { properties, prefixes } = config;
  const { attributeStrategy, textStrategy } = config.strategies;

  let hasAttributes = false;
  let textContent: any = undefined;
  let remainingProperties = { ...obj };

  // Extract attributes based on strategy
  if (config.preserveAttributes) {
    switch (attributeStrategy) {
      case "property":
        const attrs = obj[properties.attribute];
        if (attrs && typeof attrs === 'object' && !Array.isArray(attrs)) {
          element.attributes = processAttributeObject(attrs as JsonObject, config);
          delete remainingProperties[properties.attribute];
          hasAttributes = true;
        }
        break;

      case "prefix":
        const attrPrefix = prefixes.attribute;
        Object.entries(obj).forEach(([key, value]) => {
          if (key.startsWith(attrPrefix)) {
            if (!element.attributes) {
              element.attributes = {};
            }
            const attrName = key.substring(attrPrefix.length);
            const finalAttrName = getAttributeName(attrName, config.preservePrefixedNames);
            element.attributes[finalAttrName] = value;
            delete remainingProperties[key];
            hasAttributes = true;
          }
        });
        break;

      case "merge":
        // Will be processed after text extraction
        break;
    }
  }

  // Extract text content
  if (config.preserveTextNodes) {
    if (obj[properties.value] !== undefined) {
      textContent = obj[properties.value];
      delete remainingProperties[properties.value];
    }
  }

  // Handle merge strategy for attributes
  if (attributeStrategy === "merge" && config.preserveAttributes) {
    const childElements: Record<string, any> = {};
    const attributes: Record<string, any> = {};

    Object.entries(remainingProperties).forEach(([key, value]) => {
      if (value === null || typeof value !== 'object') {
        const finalAttrName = getAttributeName(key, config.preservePrefixedNames);
        attributes[finalAttrName] = value;
      } else {
        childElements[key] = value;
      }
    });

    if (Object.keys(attributes).length > 0) {
      element.attributes = attributes;
      hasAttributes = true;
      remainingProperties = childElements;
    }
  }

  // Set text content
  if (textContent !== undefined) {
    if (Object.keys(remainingProperties).length === 0 || textStrategy === "direct") {
      element.value = textContent;
    } else {
      const textNode = createTextNode(String(textContent));
      addChild(element, textNode);
    }
  }

  // Process remaining properties as child elements
  Object.entries(remainingProperties).forEach(([key, value]) => {
    const { prefix, localName } = parseElementName(key, config.preservePrefixedNames);
    
    let childElement = createElement(localName);
    if (prefix) {
      childElement.prefix = prefix;
    }

    processJsonValue(childElement, value, config);
    addChild(element, childElement);
  });
}

/**
 * Process an array value
 */
function processArrayValue(
  element: XNode,
  array: JsonArray,
  config: Configuration
): void {
  // Determine the name to use for child elements
  let itemName = config.arrays.itemNames[element.name] || config.arrays.defaultItemName;

  // Process each item in the array
  array.forEach((item) => {
    processArrayItem(element, item, itemName, config);
  });
}

/**
 * Process an array item
 */
function processArrayItem(
  parent: XNode,
  item: JsonValue,
  itemName: string,
  config: Configuration
): void {
  if (item === null) {
    if (config.strategies.emptyElementStrategy !== "object") {
      let childElement = createElement(itemName);
      processNullValue(childElement, config);
      addChild(parent, childElement);
    }
    return;
  }

  if (typeof item === 'object' && !Array.isArray(item)) {
    const obj = item as JsonObject;
    const keys = Object.keys(obj);
    
    if (keys.length === 1) {
      // Use the object key as the element name
      const key = keys[0];
      const { prefix, localName } = parseElementName(key, config.preservePrefixedNames);

      let childElement = createElement(localName);
      if (prefix) {
        childElement.prefix = prefix;
      }

      processJsonValue(childElement, obj[key], config);
      addChild(parent, childElement);
    } else {
      // Multiple properties, use the default name
      let childElement = createElement(itemName);
      processJsonValue(childElement, obj, config);
      addChild(parent, childElement);
    }
  } else if (Array.isArray(item)) {
    // Nested array
    let childElement = createElement(itemName);
    processArrayValue(childElement, item as JsonArray, config);
    addChild(parent, childElement);
  } else {
    // Primitive value
    let childElement = createElement(itemName);
    childElement.value = item;
    addChild(parent, childElement);
  }
}