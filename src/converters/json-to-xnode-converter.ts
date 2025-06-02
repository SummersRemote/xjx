/**
 * JSON to XNode unified converters - Standard and HiFi formats
 */
import { LoggerFactory } from "../core/logger";
const logger = LoggerFactory.create();

import { NodeType } from "../core/dom";
import { ProcessingError, ValidationError } from "../core/error";
import { XNode, createElement, createTextNode, createCDATANode, createCommentNode, createProcessingInstructionNode, addChild } from "../core/xnode";
import { 
  JsonValue,
  JsonObject,
  JsonArray,
  parseElementName,
  getAttributeName,
  processAttributeObject
} from "../core/converter";
import { UnifiedConverter } from "../core/pipeline";
import { PipelineContext } from "../core/context";

/**
 * Unified JSON Standard to XNode converter - replaces jsonToXNodeConverter and convertJsonWithHooks
 */
export const jsonToXNodeConverter: UnifiedConverter<JsonValue, XNode> = {
  name: 'jsonToXNode',
  inputType: 'JsonValue',
  outputType: 'XNode',
  
  validate(json: JsonValue, context: PipelineContext): void {
    context.validateInput(json !== null && typeof json === 'object', "JSON source must be an object or array");
  },
  
  execute(json: JsonValue, context: PipelineContext): XNode {
    logger.debug('Starting JSON to XNode conversion', {
      sourceType: Array.isArray(json) ? 'array' : typeof json
    });
    
    const config = context.config.get();
    let result: XNode;
    
    try {
      // Handle array input (create a wrapper element)
      if (Array.isArray(json)) {
        result = convertJsonArray(json, config);
      }
      // Handle object input
      else if (typeof json === 'object' && json !== null) {
        result = convertJsonObject(json as JsonObject, config);
      }
      // Handle primitive values
      else {
        result = convertJsonPrimitive(json, config);
      }
      
      // Register result for tracking
      context.resources.registerXNode(result);
      
      logger.debug('Successfully converted JSON to XNode', {
        rootNodeName: result.name,
        rootNodeType: result.type
      });
      
      return result;
      
    } catch (err) {
      throw new ProcessingError(`Failed to convert JSON to XNode: ${err instanceof Error ? err.message : String(err)}`);
    }
  },
  
  onError(error: Error, json: JsonValue, context: PipelineContext): XNode | null {
    logger.error('JSON to XNode conversion failed', { error });
    return null;
  }
};

/**
 * Unified JSON HiFi to XNode converter - replaces jsonHiFiToXNodeConverter and convertJsonHiFiWithHooks
 */
export const jsonHiFiToXNodeConverter: UnifiedConverter<JsonValue, XNode> = {
  name: 'jsonHiFiToXNode',
  inputType: 'JsonValue',
  outputType: 'XNode',
  
  validate(json: JsonValue, context: PipelineContext): void {
    context.validateInput(typeof json === 'object' && json !== null && !Array.isArray(json), "JSON HiFi input must be an object");
    
    const jsonObj = json as JsonObject;
    const rootName = Object.keys(jsonObj)[0];
    context.validateInput(!!rootName, "JSON HiFi object must have a root element");
    
    const rootObj = jsonObj[rootName];
    context.validateInput(
      typeof rootObj === 'object' && rootObj !== null && !Array.isArray(rootObj),
      "JSON HiFi root element must be an object"
    );
  },
  
  execute(json: JsonValue, context: PipelineContext): XNode {
    logger.debug('Starting JSON HiFi to XNode conversion');
    
    const config = context.config.get();
    const jsonObj = json as JsonObject;
    
    try {
      // Get root element name
      const rootName = Object.keys(jsonObj)[0];
      const rootObj = jsonObj[rootName] as JsonObject;
      
      // Process the root element
      const result = processHiFiElement(rootName, rootObj, config);
      
      // Register result for tracking
      context.resources.registerXNode(result);
      
      logger.debug('Successfully converted JSON HiFi to XNode', {
        rootNodeName: result.name,
        rootNodeType: result.type
      });
      
      return result;
      
    } catch (err) {
      throw new ProcessingError(`Failed to convert JSON HiFi to XNode: ${err instanceof Error ? err.message : String(err)}`);
    }
  },
  
  onError(error: Error, json: JsonValue, context: PipelineContext): XNode | null {
    logger.error('JSON HiFi to XNode conversion failed', { error });
    return null;
  }
};

// === JSON Standard Conversion Functions ===

function convertJsonObject(obj: JsonObject, config: any): XNode {
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

function convertJsonArray(array: JsonArray, config: any): XNode {
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

function convertJsonPrimitive(value: JsonValue, config: any): XNode {
  let rootNode = createElement("value");

  if (value !== undefined && value !== null) {
    rootNode.value = value;
  }

  return rootNode;
}

function processJsonValue(element: XNode, value: JsonValue, config: any): void {
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

function processNullValue(element: XNode, config: any): void {
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

function processObjectValue(element: XNode, obj: JsonObject, config: any): void {
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

function processArrayValue(element: XNode, array: JsonArray, config: any): void {
  // Determine the name to use for child elements
  let itemName = config.arrays.itemNames[element.name] || config.arrays.defaultItemName;

  // Process each item in the array
  array.forEach((item) => {
    processArrayItem(element, item, itemName, config);
  });
}

function processArrayItem(parent: XNode, item: JsonValue, itemName: string, config: any): void {
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

// === JSON HiFi Conversion Functions ===

function processHiFiElement(name: string, obj: JsonObject, config: any, parent?: XNode): XNode {
  // Parse element name for prefix handling
  const { prefix, localName } = parseElementName(name, config.preservePrefixedNames);
  
  // Create the element
  let element = createElement(localName);
  
  // Set parent reference if provided
  if (parent) {
    element.parent = parent;
  }
  
  // Set the prefix if we extracted one
  if (prefix) {
    element.prefix = prefix;
  }
  
  const { properties } = config;
  
  // Process namespace information
  if (obj[properties.namespace] && config.preserveNamespaces) {
    element.namespace = String(obj[properties.namespace]);
  }
  
  if (obj[properties.prefix] && config.preserveNamespaces) {
    element.prefix = String(obj[properties.prefix]);
  }
  
  // Process namespace declarations
  if (obj.namespaceDeclarations && typeof obj.namespaceDeclarations === 'object' && 
      !Array.isArray(obj.namespaceDeclarations) && config.preserveNamespaces) {
    element.namespaceDeclarations = {};
    
    // Copy all namespace declarations
    Object.entries(obj.namespaceDeclarations).forEach(([prefix, uri]) => {
      element.namespaceDeclarations![prefix] = String(uri);
    });
    
    // Set default namespace flag if present
    if (obj.isDefaultNamespace === true) {
      element.isDefaultNamespace = true;
    }
  }
  
  // Process attributes
  if (obj[properties.attribute] && Array.isArray(obj[properties.attribute]) && config.preserveAttributes) {
    processHiFiAttributes(element, obj[properties.attribute] as JsonArray, config);
  }
  
  // Process value
  if (obj[properties.value] !== undefined && config.preserveTextNodes) {
    element.value = obj[properties.value];
  }
  
  // Process children
  if (obj[properties.children] && Array.isArray(obj[properties.children])) {
    processHiFiChildren(element, obj[properties.children] as JsonArray, config);
  }
  
  // Process metadata if present
  if (obj.metadata && typeof obj.metadata === 'object' && !Array.isArray(obj.metadata)) {
    element.metadata = { ...obj.metadata as Record<string, any> };
  }
  
  return element;
}

function processHiFiAttributes(element: XNode, attrs: JsonArray, config: any): void {
  const { properties } = config;
  
  // Initialize attributes object if needed
  const attributes = (element.attributes ??= {});
  
  // Process each attribute in the array
  attrs.forEach(attr => {
    if (typeof attr !== 'object' || attr === null || Array.isArray(attr)) {
      return; // Skip invalid attributes
    }
    
    const attrObj = attr as JsonObject;
    const attrName = Object.keys(attrObj)[0];
    
    if (!attrName) return; // Skip empty attributes
    
    const attrValue = attrObj[attrName];
    
    // Check if this is a simple or complex attribute
    if (typeof attrValue === 'object' && attrValue !== null && !Array.isArray(attrValue)) {
      // Complex attribute with properties
      const attrProps = attrValue as JsonObject;
      
      // Get the actual value
      const value = attrProps[properties.value];
      
      // Check if this is a namespaced attribute
      let finalAttrName = attrName;
      if (config.preserveNamespaces && attrProps[properties.prefix]) {
        finalAttrName = `${attrProps[properties.prefix]}:${attrName}`;
      }
      
      // Set the attribute
      attributes[finalAttrName] = value;
    } else {
      // Simple attribute
      attributes[attrName] = attrValue;
    }
  });
}

function processHiFiChildren(parent: XNode, children: JsonArray, config: any): void {
  const { properties } = config;
  
  // Process each child in order (important for mixed content)
  children.forEach(child => {
    if (child === null) return; // Skip null children
    
    // Check if this is a special node
    if (typeof child === 'object' && !Array.isArray(child)) {
      const childObj = child as JsonObject;
      
      // Text node
      if (childObj[properties.value] !== undefined && config.preserveTextNodes) {
        const textNode = createTextNode(String(childObj[properties.value]));
        addChild(parent, textNode);
        return;
      }
      
      // CDATA node
      if (childObj[properties.cdata] !== undefined && config.preserveCDATA) {
        const cdataNode = createCDATANode(String(childObj[properties.cdata]));
        addChild(parent, cdataNode);
        return;
      }
      
      // Comment node
      if (childObj[properties.comment] !== undefined && config.preserveComments) {
        const commentNode = createCommentNode(String(childObj[properties.comment]));
        addChild(parent, commentNode);
        return;
      }
      
      // Processing instruction
      if (childObj[properties.processingInstr] !== undefined && config.preserveProcessingInstr) {
        const piObj = childObj[properties.processingInstr];
        if (piObj && typeof piObj === 'object' && !Array.isArray(piObj)) {
          const piProps = piObj as JsonObject;
          const target = piProps[properties.target];
          const value = piProps[properties.value] || '';
          
          if (target) {
            const piNode = createProcessingInstructionNode(String(target), String(value));
            addChild(parent, piNode);
            return;
          }
        }
      }
      
      // Regular element node
      const elementName = Object.keys(childObj)[0];
      if (elementName) {
        const elementObj = childObj[elementName];
        if (typeof elementObj === 'object' && elementObj !== null && !Array.isArray(elementObj)) {
          const childNode = processHiFiElement(elementName, elementObj as JsonObject, config, parent);
          addChild(parent, childNode);
          return;
        }
      }
    }
    
    // If we get here, try to convert as raw text
    if (config.preserveTextNodes) {
      const textNode = createTextNode(String(child));
      addChild(parent, textNode);
    }
  });
}