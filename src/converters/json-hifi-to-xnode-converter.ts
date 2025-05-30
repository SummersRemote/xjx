/**
 * JSON HiFi to XNode converter implementation
 */
import { LoggerFactory } from "../core/logger";
const logger = LoggerFactory.create();

import { Configuration } from '../core/config';
import { ProcessingError, ValidationError } from '../core/error';

import { 
  XNode, 
  createElement, 
  createTextNode, 
  createCDATANode, 
  createCommentNode, 
  createProcessingInstructionNode, 
  addChild 
} from '../core/xnode';
import { 
  Converter, 
  TransformHooks, 
  JsonValue, 
  JsonObject, 
  JsonArray,
  parseElementName,
  applyTransformHooks
} from '../core/converter';

/**
 * JSON HiFi to XNode converter
 */
export const jsonHiFiToXNodeConverter: Converter<JsonValue, XNode> = {
  convert(
    json: JsonValue, 
    config: Configuration, 
    hooks?: TransformHooks
  ): XNode {
    // Verify we have an object
    if (typeof json !== 'object' || json === null || Array.isArray(json)) {
      throw new ValidationError("JSON HiFi input must be an object");
    }
    
    const jsonObj = json as JsonObject;
    
    // Get root element name
    const rootName = Object.keys(jsonObj)[0];
    if (!rootName) {
      throw new ValidationError("JSON HiFi object must have a root element");
    }
    
    // Get root object
    const rootObj = jsonObj[rootName];
    if (typeof rootObj !== 'object' || rootObj === null || Array.isArray(rootObj)) {
      throw new ValidationError("JSON HiFi root element must be an object");
    }
    
    logger.debug('Starting JSON HiFi to XNode conversion', {
      rootElement: rootName,
      hasTransformHooks: !!(hooks && (hooks.beforeTransform || hooks.transform || hooks.afterTransform))
    });
    
    // Process the root element
    return processElement(rootName, rootObj as JsonObject, config, hooks);
  }
};

/**
 * Process a JSON HiFi element
 */
function processElement(
  name: string, 
  obj: JsonObject, 
  config: Configuration,
  hooks?: TransformHooks,
  parent?: XNode
): XNode {
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
  
  // Apply transform hooks
  element = applyTransformHooks(element, hooks);
  
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
  if (obj[properties.attribute] && Array.isArray(obj[properties.attribute]) && 
      config.preserveAttributes) {
    processAttributes(element, obj[properties.attribute] as JsonArray, config);
  }
  
  // Process value
  if (obj[properties.value] !== undefined && config.preserveTextNodes) {
    element.value = obj[properties.value];
  }
  
  // Process children
  if (obj[properties.children] && Array.isArray(obj[properties.children])) {
    processChildren(element, obj[properties.children] as JsonArray, config, hooks);
  }
  
  // Process metadata if present
  if (obj.metadata && typeof obj.metadata === 'object' && !Array.isArray(obj.metadata)) {
    element.metadata = { ...obj.metadata as Record<string, any> };
  }
  
  return element;
}

/**
 * Process attributes from JSON HiFi format
 */
function processAttributes(element: XNode, attrs: JsonArray, config: Configuration): void {
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

/**
 * Process children from JSON HiFi format
 */
function processChildren(
  parent: XNode, 
  children: JsonArray, 
  config: Configuration,
  hooks?: TransformHooks
): void {
  const { properties } = config;
  
  // Process each child in order (important for mixed content)
  children.forEach(child => {
    if (child === null) return; // Skip null children
    
    // Check if this is a special node
    if (typeof child === 'object' && !Array.isArray(child)) {
      const childObj = child as JsonObject;
      
      // Text node
      if (childObj[properties.value] !== undefined && config.preserveTextNodes) {
        let textNode = createTextNode(String(childObj[properties.value]));
        textNode = applyTransformHooks(textNode, hooks);
        addChild(parent, textNode);
        return;
      }
      
      // CDATA node
      if (childObj[properties.cdata] !== undefined && config.preserveCDATA) {
        let cdataNode = createCDATANode(String(childObj[properties.cdata]));
        cdataNode = applyTransformHooks(cdataNode, hooks);
        addChild(parent, cdataNode);
        return;
      }
      
      // Comment node
      if (childObj[properties.comment] !== undefined && config.preserveComments) {
        let commentNode = createCommentNode(String(childObj[properties.comment]));
        commentNode = applyTransformHooks(commentNode, hooks);
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
            let piNode = createProcessingInstructionNode(String(target), String(value));
            piNode = applyTransformHooks(piNode, hooks);
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
          const childNode = processElement(elementName, elementObj as JsonObject, config, hooks, parent);
          addChild(parent, childNode);
          return;
        }
      }
    }
    
    // If we get here, try to convert as raw text
    if (config.preserveTextNodes) {
      let textNode = createTextNode(String(child));
      textNode = applyTransformHooks(textNode, hooks);
      addChild(parent, textNode);
    }
  });
}