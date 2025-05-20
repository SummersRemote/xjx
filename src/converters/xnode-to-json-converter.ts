/**
 * XNode to JSON converter implementation
 */
import { Configuration, createJsonConfig } from '../core/config';
import { NodeType } from '../core/dom';
import { logger, ProcessingError } from '../core/error';
import { XNode, getTextContent } from '../core/xnode';
import { validateInput, Converter, JsonOptions, JsonProcessingContext, JsonValue, JsonObject, JsonArray } from '../core/converter';
import { createConverter } from '../core/converter';
import { createProcessingContext, createChildContext } from './json-xnode-common';
import { compact, ensureArray, shouldBeArray } from '../core/json-utils';

/**
 * Create an XNode to JSON converter
 * @param config Configuration for the converter
 * @returns Converter implementation
 */
export function createXNodeToJsonConverter(config: Configuration): Converter<XNode, JsonValue> {
  return createConverter(config, (node: XNode, config: Configuration) => {
    // Validate input
    validateInput(node, "Node must be an XNode instance", 
                  input => input !== null && typeof input === 'object');

    try {
      logger.debug('Starting XNode to JSON conversion', {
        nodeName: node.name,
        nodeType: node.type,
        highFidelity: config.highFidelity
      });

      // Create converter instance
      const converter = new XNodeToJsonConverterImpl(config);
      
      // Convert with default options
      return converter.convert(node);
    } catch (err) {
      throw new ProcessingError(`Failed to convert XNode to JSON: ${err instanceof Error ? err.message : String(err)}`);
    }
  });
}

/**
 * Implementation of XNode to JSON converter
 */
class XNodeToJsonConverterImpl implements Converter<XNode, JsonValue> {
  private readonly config: Configuration;
  
  /**
   * Create a new converter
   * @param config Base configuration
   */
  constructor(config: Configuration) {
    this.config = config;
  }
  
  /**
   * Convert XNode to JSON
   * @param node XNode to convert
   * @param options Conversion options
   * @returns JSON representation
   */
  convert(node: XNode, options?: JsonOptions): JsonValue {
    // Create processing context
    const context = createProcessingContext(this.config, options);
    
    // Process based on high-fidelity setting
    if (context.config.highFidelity) {
      return this.convertToHighFidelityJson(node, context);
    } else {
      return this.convertToStandardJson(node, context);
    }
  }
  
  /**
   * Convert XNode to high-fidelity JSON
   * @param node XNode to convert
   * @param context Processing context
   * @returns High-fidelity JSON
   */
  private convertToHighFidelityJson(node: XNode, context: JsonProcessingContext): JsonValue {
    const result: JsonObject = {};
    const nodeObj: JsonObject = {};
    const { properties } = context.config;
    
    // Add namespace and prefix if present
    if (node.namespace && context.config.preserveNamespaces) {
      nodeObj[properties.namespace] = node.namespace;
    }

    if (node.prefix && context.config.preserveNamespaces) {
      nodeObj[properties.prefix] = node.prefix;
    }

    // Process based on node type
    switch (node.type) {
      case NodeType.ELEMENT_NODE:
        // Process attributes
        if (node.attributes && Object.keys(node.attributes).length > 0 && context.config.preserveAttributes) {
          nodeObj[properties.attribute] = this.processHighFidelityAttributes(node, context);
        }

        // Process value or children
        if (node.value !== undefined && context.config.preserveTextNodes) {
          // Direct value
          nodeObj[properties.value] = node.value;
        } else if (node.children && node.children.length > 0) {
          // Process children
          nodeObj[properties.children] = this.processHighFidelityChildren(node.children, context);
        }
        break;
        
      case NodeType.TEXT_NODE:
        // Text node - add value
        if (context.config.preserveTextNodes) {
          return { [properties.value]: node.value };
        }
        break;
        
      case NodeType.CDATA_SECTION_NODE:
        // CDATA - add with marker
        if (context.config.preserveCDATA) {
          return { [properties.cdata]: node.value };
        }
        break;
        
      case NodeType.COMMENT_NODE:
        // Comment - add with marker
        if (context.config.preserveComments) {
          return { [properties.comment]: node.value };
        }
        break;
        
      case NodeType.PROCESSING_INSTRUCTION_NODE:
        // Processing instruction
        if (context.config.preserveProcessingInstr && node.attributes?.target) {
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
    
    // Create root object with node name
    result[node.name] = nodeObj;
    
    // Apply compact mode if configured
    if (context.config.properties.compact) {
      const compacted = compact(result);
      return compacted === undefined ? {} : compacted;
    }
    
    return result;
  }
  
  /**
   * Process attributes for high-fidelity format
   * @param node Node with attributes
   * @param context Processing context
   * @returns Attributes representation
   */
  private processHighFidelityAttributes(
    node: XNode,
    context: JsonProcessingContext
  ): JsonArray {
    const attrs: JsonArray = [];
    const { properties } = context.config;

    // Add regular attributes
    for (const [name, value] of Object.entries(node.attributes || {})) {
      // Skip xmlns attributes if not preserving namespaces
      if ((name === "xmlns" || name.startsWith("xmlns:")) && !context.config.preserveNamespaces) {
        continue;
      }
      
      const attrObj: JsonObject = {
        [name]: { [properties.value]: value }
      };
      attrs.push(attrObj);
    }

    // Add namespace declarations if present and preserving namespaces
    if (node.namespaceDeclarations && context.config.preserveNamespaces) {
      for (const [prefix, uri] of Object.entries(node.namespaceDeclarations)) {
        const attrName = prefix === "" ? "xmlns" : `xmlns:${prefix}`;
        const attrObj: JsonObject = {
          [attrName]: { [properties.value]: uri }
        };
        attrs.push(attrObj);
      }
    }

    return attrs;
  }
  
  /**
   * Process children for high-fidelity format
   * @param children Child nodes
   * @param context Processing context
   * @returns Children representation
   */
  private processHighFidelityChildren(
    children: XNode[],
    context: JsonProcessingContext
  ): JsonArray {
    const result: JsonArray = [];
    const childContext = createChildContext(context, "children");
    
    for (const child of children) {
      switch (child.type) {
        case NodeType.TEXT_NODE:
          if (context.config.preserveTextNodes) {
            result.push({ [context.config.properties.value]: child.value });
          }
          break;
          
        case NodeType.CDATA_SECTION_NODE:
          if (context.config.preserveCDATA) {
            result.push({ [context.config.properties.cdata]: child.value });
          }
          break;
          
        case NodeType.COMMENT_NODE:
          if (context.config.preserveComments) {
            result.push({ [context.config.properties.comment]: child.value });
          }
          break;
          
        case NodeType.PROCESSING_INSTRUCTION_NODE:
          if (context.config.preserveProcessingInstr && child.attributes?.target) {
            const piObj: JsonObject = {
              [context.config.properties.target]: child.attributes.target
            };
            
            if (child.value !== undefined) {
              piObj[context.config.properties.value] = child.value;
            }
            
            result.push({ [context.config.properties.processingInstr]: piObj });
          }
          break;
          
        case NodeType.ELEMENT_NODE:
          // Recursively convert element nodes
          const childJson = this.convertToHighFidelityJson(child, childContext);
          if (childJson && typeof childJson === 'object') {
            result.push(childJson);
          }
          break;
      }
    }
    
    return result;
  }
  
  /**
   * Convert XNode to standard JSON
   * @param node XNode to convert
   * @param context Processing context
   * @returns Standard JSON
   */
  private convertToStandardJson(node: XNode, context: JsonProcessingContext): JsonValue {
    // Handle non-element nodes
    if (node.type !== NodeType.ELEMENT_NODE) {
      // Text nodes become direct values
      if (node.type === NodeType.TEXT_NODE && context.config.preserveTextNodes) {
        return node.value;
      }
      
      // Skip non-element, non-text nodes in standard format
      return null;
    }
    
    // Process element node
    const result: JsonObject = {};
    const nodeObj: JsonObject = {};
    
    // Handle simple case - element with direct value
    if (node.value !== undefined && (!node.children || node.children.length === 0) && context.config.preserveTextNodes) {
      return this.processElementWithValue(node, context);
    }
    
    // Check for text-only content
    if (node.children && node.children.length > 0) {
      const textOnlyChildren = node.children.filter(
        child => child.type === NodeType.TEXT_NODE || child.type === NodeType.CDATA_SECTION_NODE
      );
      
      const hasTextOnly = textOnlyChildren.length === node.children.length;
      
      if (hasTextOnly && context.config.preserveTextNodes) {
        // Combine text content
        const combinedText = textOnlyChildren
          .map(child => child.value || '')
          .join('');
          
        return this.processElementWithValue(node, context, combinedText);
      }
    }
    
    // Process with children
    const childResult = this.processElementWithChildren(node, context);
    result[node.name] = childResult;
    
    return result;
  }
  
  /**
   * Process an element with only a value
   * @param node Element node
   * @param context Processing context
   * @param textValue Optional explicit text value
   * @returns JavaScript value
   */
  private processElementWithValue(
    node: XNode,
    context: JsonProcessingContext,
    textValue?: string
  ): JsonValue {
    const { attributeStrategy, textStrategy } = context.config;
    const value = textValue !== undefined ? textValue : node.value;
    const hasAttributes = node.attributes && Object.keys(node.attributes).length > 0 && context.config.preserveAttributes;
    
    // Simple case - no attributes and direct text strategy
    if (!hasAttributes || !context.config.preserveAttributes) {
      // If text strategy is direct and we have a value, return it directly
      if (textStrategy === 'direct') {
        return this.createResultObject(node.name, value);
      }
      
      // Otherwise wrap in an object with text property
      const textObj: JsonObject = {};
      textObj[context.config.properties.text] = value;
      return this.createResultObject(node.name, textObj);
    }
    
    // Complex case - has attributes
    const textProperty = context.config.properties.text;
    
    switch (attributeStrategy) {
      case 'merge':
        // Create object with attributes and value
        const mergeResult: JsonObject = { 
          ...this.processStandardAttributes(node, context) 
        };
        
        if (textStrategy === 'direct') {
          // Direct value - add with special text property
          mergeResult[textProperty] = value;
        } else {
          // Text strategy property - add with configured text property
          mergeResult[textProperty] = value;
        }
        
        return this.createResultObject(node.name, mergeResult);
        
      case 'prefix':
        // Create object with prefixed attributes and text
        const prefixResult: JsonObject = { 
          ...this.processStandardAttributes(node, context)
        };
        
        if (textStrategy === 'direct') {
          // Direct value - add with special text property
          prefixResult[textProperty] = value;
        } else {
          // Text strategy property - add with configured text property
          prefixResult[textProperty] = value;
        }
        
        return this.createResultObject(node.name, prefixResult);
        
      case 'property':
        // Create object with attributes property and text
        const attrProperty = context.config.properties.attribute;
        const propertyResult: JsonObject = {
          [attrProperty]: this.processStandardAttributes(node, context, true)
        };
        
        if (textStrategy === 'direct') {
          // Direct value - add with special text property
          propertyResult[textProperty] = value;
        } else {
          // Text strategy property - add with configured text property
          propertyResult[textProperty] = value;
        }
        
        return this.createResultObject(node.name, propertyResult);
        
      default:
        // Default - just return the value
        if (textStrategy === 'direct') {
          return this.createResultObject(node.name, value);
        } else {
          const defaultResult: JsonObject = {};
          defaultResult[textProperty] = value;
          return this.createResultObject(node.name, defaultResult);
        }
    }
  }
  
  /**
   * Process element with child elements
   * @param node Element node with children
   * @param context Processing context
   * @returns JavaScript object
   */
  private processElementWithChildren(
    node: XNode,
    context: JsonProcessingContext
  ): JsonObject {
    const result: JsonObject = {};
    
    // Add attributes if needed
    if (node.attributes && Object.keys(node.attributes).length > 0 && context.config.preserveAttributes) {
      const { attributeStrategy } = context.config;
      const attrProperty = context.config.properties.attribute;
      
      switch (attributeStrategy) {
        case 'merge':
          Object.assign(result, this.processStandardAttributes(node, context));
          break;
          
        case 'prefix':
          Object.assign(result, this.processStandardAttributes(node, context));
          break;
          
        case 'property':
          result[attrProperty] = this.processStandardAttributes(node, context, true);
          break;
      }
    }
    
    // Track mixed content
    let textContent = '';
    let hasMixedContent = false;
    
    // Group children by name for array detection
    const childrenByName: Record<string, XNode[]> = {};
    
    // Process each child
    if (node.children) {
      node.children.forEach(child => {
        if (child.type === NodeType.TEXT_NODE || child.type === NodeType.CDATA_SECTION_NODE) {
          // Collect text content if preserving text nodes
          if (context.config.preserveTextNodes) {
            const text = child.value || '';
            if (text.trim() !== '') {
              textContent += text;
              hasMixedContent = true;
            }
          }
        } else if (child.type === NodeType.ELEMENT_NODE) {
          // Group element children by name
          if (!childrenByName[child.name]) {
            childrenByName[child.name] = [];
          }
          childrenByName[child.name].push(child);
          hasMixedContent = hasMixedContent || context.config.preserveTextNodes;
        }
        // Other node types were already filtered if not preserved
      });
    }
    
    // Add mixed content if present and configured to preserve
    if (hasMixedContent && textContent.trim() !== '') {
      const { mixedContentStrategy } = context.config;
      
      switch (mixedContentStrategy) {
        case 'preserve':
          // Add as text property
          result[context.config.properties.text] = textContent;
          break;
          
        case 'prioritize-text':
          // If prioritizing text and we have text, skip children
          result[context.config.properties.text] = textContent;
          return result;
          
        case 'prioritize-elements':
          // If prioritizing elements and we have elements, skip text
          if (Object.keys(childrenByName).length === 0) {
            result[context.config.properties.text] = textContent;
          }
          break;
      }
    }
    
    // Process grouped children
    const childContext = createChildContext(context, "child");
    
    Object.entries(childrenByName).forEach(([name, children]) => {
      const shouldCreateArray = shouldBeArray(name, children, context.config);
      
      if (children.length === 1 && !shouldCreateArray) {
        // Single value
        const childJson = this.convertToStandardJson(children[0], childContext);
        
        // Extract value from wrapper object
        if (childJson && typeof childJson === 'object' && !Array.isArray(childJson)) {
          const obj = childJson as JsonObject;
          const childValue = obj[name];
          result[name] = childValue;
        } else {
          // Direct value
          result[name] = childJson;
        }
      } else {
        // Multiple values or forced array
        const childArray: JsonArray = [];
        
        children.forEach(child => {
          const childJson = this.convertToStandardJson(child, childContext);
          
          // Extract value from wrapper object
          if (childJson && typeof childJson === 'object' && !Array.isArray(childJson)) {
            const obj = childJson as JsonObject;
            const childValue = obj[name];
            childArray.push(childValue);
          } else {
            // Direct value
            childArray.push(childJson);
          }
        });
        
        result[name] = childArray;
      }
    });
    
    return result;
  }
  
  /**
   * Process element attributes for standard format
   * @param node Element node
   * @param context Processing context
   * @param asObject Whether to return as object (for property strategy)
   * @returns Processed attributes
   */
  private processStandardAttributes(
    node: XNode,
    context: JsonProcessingContext,
    asObject: boolean = false
  ): JsonObject {
    const result: JsonObject = {};
    
    if (!node.attributes) {
      return result;
    }
    
    const { attributeStrategy, prefixes } = context.config;
    const attrPrefix = prefixes.attribute;
    
    Object.entries(node.attributes).forEach(([name, value]) => {
      // Skip xmlns attributes if not preserving namespaces
      if ((name === "xmlns" || name.startsWith("xmlns:")) && !context.config.preserveNamespaces) {
        return;
      }
      
      // Apply attribute handling based on configuration
      switch (attributeStrategy) {
        case 'prefix':
          // Add prefix to attribute names if not returning as object
          if (!asObject) {
            result[attrPrefix + name] = value;
          } else {
            result[name] = value;
          }
          break;
          
        default:
          // Default to direct property
          result[name] = value;
          break;
      }
    });
    
    // Add namespace declarations if present and preserving namespaces
    if (node.namespaceDeclarations && context.config.preserveNamespaces) {
      for (const [prefix, uri] of Object.entries(node.namespaceDeclarations)) {
        const nsName = prefix === "" ? "xmlns" : `xmlns:${prefix}`;
        
        // Apply attribute handling based on configuration
        switch (attributeStrategy) {
          case 'prefix':
            // Add prefix to attribute names if not returning as object
            if (!asObject) {
              result[attrPrefix + nsName] = uri;
            } else {
              result[nsName] = uri;
            }
            break;
            
          default:
            // Default to direct property
            result[nsName] = uri;
            break;
        }
      }
    }
    
    return result;
  }
  
  /**
   * Create result object with node name
   * @param nodeName Node name
   * @param value Node value
   * @returns Result object or direct value
   */
  private createResultObject(nodeName: string, value: any): JsonValue {
    // For standard format, return an object with node name as key
    const result: JsonObject = {};
    result[nodeName] = value;
    return result;
  }
}