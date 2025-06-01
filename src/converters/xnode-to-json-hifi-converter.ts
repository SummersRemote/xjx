/**
 * XNode to JSON unified converters - Standard and HiFi formats
 */
import { LoggerFactory } from "../core/logger";
const logger = LoggerFactory.create();

import { NodeType } from '../core/dom';
import { ProcessingError } from '../core/error';
import { XNode, getTextContent } from '../core/xnode';
import { 
  JsonValue, 
  JsonObject, 
  JsonArray,
  getElementName,
  getAttributeName
} from '../core/converter';
import { UnifiedConverter } from '../core/pipeline';
import { PipelineContext } from '../core/context';
import { removeEmptyElements } from '../core/json-utils';

/**
 * Unified XNode to JSON Standard converter - replaces xnodeToJsonConverter and convertXNodeToJsonWithHooks
 */
export const xnodeToJsonConverter: UnifiedConverter<XNode, JsonValue> = {
  name: 'xnodeToJson',
  inputType: 'XNode',
  outputType: 'JsonValue',
  
  validate(node: XNode, context: PipelineContext): void {
    context.validateInput(!!node, "XNode cannot be null or undefined");
    context.validateInput(typeof node.name === 'string', "XNode must have a valid name");
  },
  
  execute(node: XNode, context: PipelineContext): JsonValue {
    logger.debug('Starting XNode to JSON conversion', {
      nodeName: node.name,
      nodeType: node.type
    });

    const config = context.config.get();
    let result: JsonValue;

    try {
      // Handle non-element nodes
      if (node.type !== NodeType.ELEMENT_NODE) {
        result = processNonElementNode(node, config);
      } else {
        // Process element node
        result = processElementNode(node, config);
      }

      // Apply remove empty elements strategy if configured
      if (config.strategies.emptyElementStrategy === 'remove') {
        const processedResult = removeEmptyElements(result, config);
        result = processedResult === undefined ? {} : processedResult;
      }

      logger.debug('Successfully converted XNode to JSON', {
        resultType: typeof result
      });

      return result;
      
    } catch (err) {
      throw new ProcessingError(`Failed to convert XNode to JSON: ${err instanceof Error ? err.message : String(err)}`);
    }
  },
  
  onError(error: Error, node: XNode, context: PipelineContext): JsonValue | null {
    logger.error('XNode to JSON conversion failed', { error, nodeName: node?.name });
    return null;
  }
};

/**
 * Unified XNode to JSON HiFi converter - replaces xnodeToJsonHiFiConverter and convertXNodeToJsonHiFiWithHooks
 */
export const xnodeToJsonHiFiConverter: UnifiedConverter<XNode, JsonValue> = {
  name: 'xnodeToJsonHiFi',
  inputType: 'XNode',
  outputType: 'JsonValue',
  
  validate(node: XNode, context: PipelineContext): void {
    context.validateInput(!!node, "XNode cannot be null or undefined");
    context.validateInput(typeof node.name === 'string', "XNode must have a valid name");
  },
  
  execute(node: XNode, context: PipelineContext): JsonValue {
    logger.debug('Starting XNode to JSON HiFi conversion', {
      nodeName: node.name,
      nodeType: node.type
    });

    const config = context.config.get();
    let result: JsonValue;

    try {
      // Process based on node type
      if (node.type !== NodeType.ELEMENT_NODE) {
        // Handle non-element nodes
        result = processHiFiSpecialNode(node, config);
      } else {
        // Process element node
        result = processHiFiElementNode(node, config);
      }

      // Apply remove empty elements strategy if configured
      if (config.strategies.emptyElementStrategy === 'remove') {
        const processedResult = removeEmptyElements(result, config);
        result = processedResult === undefined ? {} : processedResult;
      }

      logger.debug('Successfully converted XNode to JSON HiFi', {
        resultType: typeof result
      });

      return result;
      
    } catch (err) {
      throw new ProcessingError(`Failed to convert XNode to JSON HiFi: ${err instanceof Error ? err.message : String(err)}`);
    }
  },
  
  onError(error: Error, node: XNode, context: PipelineContext): JsonValue | null {
    logger.error('XNode to JSON HiFi conversion failed', { error, nodeName: node?.name });
    return null;
  }
};

// === JSON Standard Conversion Functions ===

function processNonElementNode(node: XNode, config: any): JsonValue {
  switch (node.type) {
    case NodeType.TEXT_NODE:
      return config.preserveTextNodes ? node.value : null;
      
    case NodeType.CDATA_SECTION_NODE:
      return config.preserveCDATA ? node.value : null;
      
    case NodeType.COMMENT_NODE:
    case NodeType.PROCESSING_INSTRUCTION_NODE:
      // Typically not included in standard JSON
      return null;
      
    default:
      return null;
  }
}

function processElementNode(node: XNode, config: any): JsonValue {
  const result: JsonObject = {};
  
  // Get the element name with prefix if configured
  const elementName = getElementName(node.name, node.prefix, config.preservePrefixedNames);
  
  // Process with either direct value or children
  if (hasOnlyTextContent(node)) {
    result[elementName] = processElementWithTextOnly(node, config);
  } else if (node.children && node.children.length > 0) {
    result[elementName] = processElementWithChildren(node, config);
  } else {
    // Empty element
    result[elementName] = processEmptyElement(node, config);
  }
  
  return result;
}

function hasOnlyTextContent(node: XNode): boolean {
  // Check if node has a direct value
  if (node.value !== undefined) {
    return true;
  }
  
  // Check if node has only text children
  if (!node.children || node.children.length === 0) {
    return false;
  }
  
  return node.children.every(child => 
    child.type === NodeType.TEXT_NODE || child.type === NodeType.CDATA_SECTION_NODE
  );
}

function processElementWithTextOnly(node: XNode, config: any): JsonValue {
  // Get text content
  const text = node.value !== undefined ? node.value : getTextContent(node);
  
  // Get attributes
  const hasAttributes = node.attributes && Object.keys(node.attributes).length > 0 && config.preserveAttributes;
  
  // If no attributes and direct text strategy, return the text directly
  if (!hasAttributes && config.strategies.textStrategy === 'direct') {
    return text;
  }
  
  // Create object for element
  const result: JsonObject = {};
  
  // Add attributes based on strategy
  if (hasAttributes) {
    addAttributes(result, node, config);
  }
  
  // Add text content
  result[config.properties.value] = text;
  
  return result;
}

function processElementWithChildren(node: XNode, config: any): JsonObject {
  const result: JsonObject = {};
  
  // Add attributes if present and configured to preserve
  if (node.attributes && Object.keys(node.attributes).length > 0 && config.preserveAttributes) {
    addAttributes(result, node, config);
  }
  
  // Handle mixed content
  const textNodes = node.children?.filter(c => 
    c.type === NodeType.TEXT_NODE || c.type === NodeType.CDATA_SECTION_NODE
  ) || [];
  
  const elementNodes = node.children?.filter(c => c.type === NodeType.ELEMENT_NODE) || [];
  
  const hasMixedContent = textNodes.length > 0 && elementNodes.length > 0;
  
  // Process mixed content according to strategy
  if (hasMixedContent) {
    switch (config.strategies.mixedContentStrategy) {
      case 'preserve':
        // Add text nodes as a property
        if (textNodes.length > 0 && config.preserveTextNodes) {
          const combinedText = textNodes.map(t => t.value).join('');
          result[config.properties.value] = combinedText;
        }
        // Then add elements normally
        processChildElements(result, elementNodes, config);
        break;
        
      case 'merge':
        // Merge all text and element content into readable text
        if (config.preserveTextNodes) {
          const mergedText = extractAllTextContent(node.children || []);
          if (mergedText.trim()) {
            result[config.properties.value] = mergedText;
          }
        }
        break;
    }
  } else {
    // Not mixed content, process normally
    if (textNodes.length > 0 && config.preserveTextNodes) {
      const combinedText = textNodes.map(t => t.value).join('');
      result[config.properties.value] = combinedText;
    } else if (elementNodes.length > 0) {
      processChildElements(result, elementNodes, config);
    }
  }
  
  return result;
}

function extractAllTextContent(nodes: XNode[]): string {
  return nodes.map(node => {
    if (node.type === NodeType.TEXT_NODE || node.type === NodeType.CDATA_SECTION_NODE) {
      return node.value || '';
    } else if (node.type === NodeType.ELEMENT_NODE) {
      // For element nodes, get their direct value if present
      if (node.value !== undefined) {
        return String(node.value);
      }
      // Or recursively extract text from their children
      if (node.children && node.children.length > 0) {
        return extractAllTextContent(node.children);
      }
      return '';
    }
    return '';
  }).join(' ').replace(/\s+/g, ' ').trim();
}

function processEmptyElement(node: XNode, config: any): JsonValue {
  // Handle attributes if present
  const hasAttributes = node.attributes && Object.keys(node.attributes).length > 0 && config.preserveAttributes;
  
  if (hasAttributes) {
    // If we have attributes, return an object with them
    const result: JsonObject = {};
    addAttributes(result, node, config);
    return result;
  }
  
  // No attributes, handle based on strategy
  switch (config.strategies.emptyElementStrategy) {
    case 'null':
      return null;
    case 'string':
      return '';
    case 'remove':
      // This will be handled by removeEmptyElements function
      return {};
    case 'object':
    default:
      return {};
  }
}

function addAttributes(result: JsonObject, node: XNode, config: any): void {
  if (!node.attributes) return;
  
  const { properties, prefixes } = config;
  const { attributeStrategy } = config.strategies;

  switch (attributeStrategy) {
    case 'merge':
      // Add attributes directly to the element object
      Object.entries(node.attributes).forEach(([key, value]) => {
        const attrName = getAttributeName(key, config.preservePrefixedNames);
        result[attrName] = value;
      });
      break;
      
    case 'prefix':
      // Add attributes with a prefix
      const prefix = prefixes.attribute;
      Object.entries(node.attributes).forEach(([key, value]) => {
        const attrName = getAttributeName(key, config.preservePrefixedNames);
        result[prefix + attrName] = value;
      });
      break;
      
    case 'property':
      // Add attributes as a separate property
      const attrs: JsonObject = {};
      Object.entries(node.attributes).forEach(([key, value]) => {
        const attrName = getAttributeName(key, config.preservePrefixedNames);
        attrs[attrName] = value;
      });
      result[properties.attribute] = attrs;
      break;
  }
}

function processChildElements(result: JsonObject, children: XNode[], config: any): void {
  // Group children by element name
  const childrenByName: Record<string, XNode[]> = {};
  
  // Build the groupings - include prefix in the name if configured
  children.forEach(child => {
    const childName = getElementName(child.name, child.prefix, config.preservePrefixedNames);
      
    if (!childrenByName[childName]) {
      childrenByName[childName] = [];
    }
    childrenByName[childName].push(child);
  });
  
  // Process each group
  Object.entries(childrenByName).forEach(([name, nodes]) => {
    // Determine if this should be an array
    const forcedArray = config.arrays.forceArrays.includes(name);
    const multipleNodes = nodes.length > 1;
    const alwaysArray = config.strategies.arrayStrategy === 'always';
    const neverArray = config.strategies.arrayStrategy === 'never';
    
    const shouldBeArray = forcedArray || (multipleNodes && !neverArray) || alwaysArray;
    
    if (shouldBeArray) {
      // Create an array of values
      const values: JsonArray = nodes.map(node => {
        // Convert the node and extract its value
        const converted = xnodeToJsonConverter.execute(node, { config: { get: () => config } } as any) as JsonObject;
        const nodeName = getElementName(node.name, node.prefix, config.preservePrefixedNames);
        
        return converted[nodeName];
      });
      
      result[name] = values;
    } else {
      // Just use the last node (or only node)
      const node = nodes[nodes.length - 1];
      
      const converted = xnodeToJsonConverter.execute(node, { config: { get: () => config } } as any) as JsonObject;
      const nodeName = getElementName(node.name, node.prefix, config.preservePrefixedNames);
      
      result[name] = converted[nodeName];
    }
  });
}

// === JSON HiFi Conversion Functions ===

function processHiFiSpecialNode(node: XNode, config: any): JsonValue {
  const { properties } = config;
  
  switch (node.type) {
    case NodeType.TEXT_NODE:
      if (config.preserveTextNodes) {
        return { [properties.value]: node.value };
      }
      break;
      
    case NodeType.CDATA_SECTION_NODE:
      if (config.preserveCDATA) {
        return { [properties.cdata]: node.value };
      }
      break;
      
    case NodeType.COMMENT_NODE:
      if (config.preserveComments) {
        return { [properties.comment]: node.value };
      }
      break;
      
    case NodeType.PROCESSING_INSTRUCTION_NODE:
      if (config.preserveProcessingInstr && node.attributes?.target) {
        const piObj: JsonObject = {
          [properties.target]: node.attributes.target
        };
        
        if (node.value !== undefined) {
          piObj[properties.value] = node.value;
        }
        
        return { [properties.processingInstr]: piObj };
      }
      break;
  }
  
  // Default for unknown or filtered node types
  return null;
}

function processHiFiElementNode(node: XNode, config: any): JsonValue {
  const result: JsonObject = {};
  const nodeObj: JsonObject = {};
  const { properties } = config;
  
  // Add namespace and prefix if present
  if (node.namespace && config.preserveNamespaces) {
    nodeObj[properties.namespace] = node.namespace;
  }

  if (node.prefix && config.preserveNamespaces) {
    nodeObj[properties.prefix] = node.prefix;
  }

  // Process attributes
  if (node.attributes && Object.keys(node.attributes).length > 0 && config.preserveAttributes) {
    nodeObj[properties.attribute] = processHiFiAttributes(node, config);
  }

  // Process namespace declarations
  if (node.namespaceDeclarations && Object.keys(node.namespaceDeclarations).length > 0 && 
      config.preserveNamespaces) {
    nodeObj.namespaceDeclarations = { ...node.namespaceDeclarations };
    
    // Flag if this is a default namespace
    if (node.isDefaultNamespace) {
      nodeObj.isDefaultNamespace = true;
    }
  }

  // Process value or children
  if (node.value !== undefined && config.preserveTextNodes) {
    nodeObj[properties.value] = node.value;
  } else if (node.children && node.children.length > 0) {
    // Process children
    const children = processHiFiChildren(node.children, config);
    if (children.length > 0) {
      nodeObj[properties.children] = children;
    }
  }
  
  // Add metadata if present
  if (node.metadata && Object.keys(node.metadata).length > 0) {
    nodeObj.metadata = { ...node.metadata };
  }
  
  // Create root object with node name - handle prefixed names if configured
  const elementName = getElementName(node.name, node.prefix, config.preservePrefixedNames);
  
  result[elementName] = nodeObj;
  
  return result;
}

function processHiFiAttributes(node: XNode, config: any): JsonArray {
  const attrs: JsonArray = [];
  const { properties } = config;

  // Process regular attributes
  for (const [name, value] of Object.entries(node.attributes || {})) {
    // Skip xmlns attributes if not preserving namespaces or if handled elsewhere
    if (name === "xmlns" || name.startsWith("xmlns:")) {
      continue; // Namespace declarations are handled separately
    }
    
    // Create attribute object
    const attrObj: JsonObject = {};
    
    let finalAttrName = name;
    
    // Handle attributes with namespaces/prefixes
    if (name.includes(':') && config.preserveNamespaces) {
      const [prefix, localName] = name.split(':');
      
      // Determine the attribute name to use based on preservePrefixedNames
      finalAttrName = config.preservePrefixedNames ? name : localName;
      
      // Find namespace URI for this prefix if available
      let namespaceURI = null;
      if (node.namespaceDeclarations) {
        namespaceURI = node.namespaceDeclarations[prefix];
      }
      
      // Create attribute with namespace info
      const attrValue: JsonObject = { 
        [properties.value]: value,
        [properties.prefix]: prefix
      };
      
      // Add namespace URI if available
      if (namespaceURI) {
        attrValue[properties.namespace] = namespaceURI;
      }
      
      attrObj[finalAttrName] = attrValue;
    } else {
      // Regular attribute or prefixed attribute without namespace preservation
      if (name.includes(':') && !config.preservePrefixedNames) {
        // Strip prefix if preservePrefixedNames is false
        const parts = name.split(':');
        finalAttrName = parts[parts.length - 1];
      }
      
      attrObj[finalAttrName] = { [properties.value]: value };
    }
    
    attrs.push(attrObj);
  }

  return attrs;
}

function processHiFiChildren(children: XNode[], config: any): JsonArray {
  const result: JsonArray = [];
  
  // Process each child in order to preserve mixed content
  for (const child of children) {
    const processedChild = processHiFiChild(child, config);
    if (processedChild !== null) {
      result.push(processedChild);
    }
  }
  
  return result;
}

function processHiFiChild(child: XNode, config: any): JsonValue {
  let result: JsonValue = null;

  switch (child.type) {
    case NodeType.TEXT_NODE:
      if (config.preserveTextNodes) {
        result = processHiFiSpecialNode(child, config);
      }
      break;
      
    case NodeType.CDATA_SECTION_NODE:
      if (config.preserveCDATA) {
        result = processHiFiSpecialNode(child, config);
      }
      break;
      
    case NodeType.COMMENT_NODE:
      if (config.preserveComments) {
        result = processHiFiSpecialNode(child, config);
      }
      break;
      
    case NodeType.PROCESSING_INSTRUCTION_NODE:
      if (config.preserveProcessingInstr) {
        result = processHiFiSpecialNode(child, config);
      }
      break;
      
    case NodeType.ELEMENT_NODE:
      // Recursively process element nodes
      result = processHiFiElementNode(child, config);
      break;
  }

  return result;
}