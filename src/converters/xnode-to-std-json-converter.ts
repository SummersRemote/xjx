/**
 * XNode to Standard JSON converter implementation with hybrid OO-functional approach
 * 
 * Converts XNode to standard JavaScript objects and arrays without redundant preservation checks.
 */
import { XNodeToStandardJsonConverter } from './converter-interfaces';
import { BaseConverter } from '../core/converter';
import { NodeType } from '../core/dom';
import { logger, handleError, ErrorType } from '../core/error';
import { XNode } from '../core/xnode';

/**
 * Converts XNode to standard JavaScript objects and arrays
 */
export class DefaultXNodeToStandardJsonConverter extends BaseConverter<XNode, any> implements XNodeToStandardJsonConverter {
  /**
   * Convert XNode to standard JavaScript object/array
   * @param node XNode to convert
   * @returns Standard JavaScript object or primitive
   */
  public convert(node: XNode): any {
    try {
      // Validate input
      this.validateInput(node, "Node must be an XNode instance", 
                         input => input instanceof XNode);
      
      logger.debug('Starting XNode to standard JSON conversion', {
        nodeName: node.name,
        nodeType: node.type
      });
      
      // Use pure functional core
      const result = processNode(node, this.config);
      
      logger.debug('Successfully converted XNode to standard JSON', {
        resultType: typeof result,
        isArray: Array.isArray(result)
      });
      
      return result;
    } catch (err) {
      return handleError(err, 'convert XNode to standard JSON', {
        data: { nodeName: node?.name, nodeType: node?.type },
        errorType: ErrorType.SERIALIZE
      });
    }
  }
}

// ===== PURE FUNCTIONAL CORE =====

/**
 * Process a node based on its type - pure function
 * @param node XNode to process
 * @param config Configuration
 * @returns Standard JavaScript value
 */
export function processNode(node: XNode, config: any): any {
  switch (node.type) {
    case NodeType.ELEMENT_NODE:
      return processElementNode(node, config);
      
    case NodeType.TEXT_NODE:
      return node.value;
      
    case NodeType.CDATA_SECTION_NODE:
      return node.value;
      
    case NodeType.COMMENT_NODE:
      // Comments are already filtered out during XML parsing if not preserved
      return undefined;
      
    case NodeType.PROCESSING_INSTRUCTION_NODE:
      // PIs are already filtered out during XML parsing if not preserved
      return undefined;
      
    default:
      logger.warn('Unknown node type during conversion', {
        nodeName: node.name,
        nodeType: node.type
      });
      return undefined;
  }
}

/**
 * Process an element node - pure function
 * @param node Element node to process
 * @param config Configuration
 * @returns JavaScript object, array, or primitive
 */
function processElementNode(node: XNode, config: any): any {
  // Get standard JSON options
  const options = config.converters.stdJson.options;
  
  // Handle special cases
  if (!node.children || node.children.length === 0) {
    // Element with no children but with a value
    if (node.value !== undefined) {
      return processElementWithValue(node, options);
    }
    
    // Empty element
    return options.emptyElementsAsNull ? null : {};
  }
  
  // Check if this is a text-only node
  const textOnlyChildren = node.children.filter(
    child => child.type === NodeType.TEXT_NODE || child.type === NodeType.CDATA_SECTION_NODE
  );
  
  if (textOnlyChildren.length === node.children.length) {
    // All children are text/CDATA nodes, combine them
    const combinedText = textOnlyChildren
      .map(child => child.value || '')
      .join('');
      
    if (combinedText.trim() === '' && options.emptyElementsAsNull) {
      return null;
    }
    
    return processElementWithValue(node, options, combinedText);
  }
  
  // Element with element children
  return processElementWithChildren(node, options, config);
}

/**
 * Process an element with only a value - pure function
 * @param node Element node
 * @param options Standard JSON options
 * @param textValue Optional explicit text value
 * @returns JavaScript value
 */
function processElementWithValue(
  node: XNode,
  options: any,
  textValue?: string
): any {
  const value = textValue !== undefined ? textValue : node.value;
  const hasAttributes = node.attributes && Object.keys(node.attributes).length > 0;
  
  // Simple case - no attributes
  if (!hasAttributes || options.attributeHandling === 'ignore') {
    return value;
  }
  
  // Complex case - has attributes
  const textProperty = options.textPropertyName;
  
  switch (options.attributeHandling) {
    case 'merge':
      // Create object with attributes and value
      const result: Record<string, any> = { ...processAttributes(node, options) };
      result[textProperty] = value;
      return result;
      
    case 'prefix':
      // Create object with prefixed attributes and direct value
      return { 
        ...processAttributes(node, options), 
        [textProperty]: value 
      };
      
    case 'property':
      // Create object with attributes property and direct value
      const attrProperty = options.attributePropertyName;
      return {
        [attrProperty]: processAttributes(node, options),
        [textProperty]: value
      };
      
    default:
      return value;
  }
}

/**
 * Process element with child elements - pure function
 * @param node Element node with children
 * @param options Standard JSON options
 * @param config Main configuration
 * @returns JavaScript object
 */
function processElementWithChildren(
  node: XNode,
  options: any,
  config: any
): any {
  const result: Record<string, any> = {};
  
  // Add attributes if needed
  if (node.attributes && Object.keys(node.attributes).length > 0) {
    const attrProperty = options.attributePropertyName;
    
    switch (options.attributeHandling) {
      case 'merge':
        Object.assign(result, processAttributes(node, options));
        break;
        
      case 'prefix':
        Object.assign(result, processAttributes(node, options));
        break;
        
      case 'property':
        result[attrProperty] = processAttributes(node, options);
        break;
    }
  }
  
  // Track text content for mixed content handling
  let textContent = '';
  let hasMixedContent = false;
  
  // Group children by name for array detection
  const childrenByName: Record<string, XNode[]> = {};
  
  // Process each child
  if (node.children) {
    node.children.forEach(child => {
      if (child.type === NodeType.TEXT_NODE || child.type === NodeType.CDATA_SECTION_NODE) {
        // Collect text content
        const text = child.value || '';
        if (text.trim() !== '') {
          textContent += text;
          hasMixedContent = true;
        }
      } else if (child.type === NodeType.ELEMENT_NODE) {
        // Group element children by name
        if (!childrenByName[child.name]) {
          childrenByName[child.name] = [];
        }
        childrenByName[child.name].push(child);
      }
      // Comments and processing instructions were already filtered if not preserved
    });
  }
  
  // Add mixed content if present and configured to preserve
  if (hasMixedContent && options.preserveMixedContent) {
    const textProperty = options.textPropertyName;
    result[textProperty] = textContent;
  }
  
  // Process grouped children
  Object.entries(childrenByName).forEach(([name, children]) => {
    const shouldBeArray = options.alwaysCreateArrays || children.length > 1;
    
    if (shouldBeArray) {
      // Process as array
      result[name] = children.map(child => processNode(child, config));
    } else {
      // Process as single value
      result[name] = processNode(children[0], config);
    }
  });
  
  return result;
}

/**
 * Process element attributes based on configuration - pure function
 * @param node Element node with attributes
 * @param options Standard JSON options
 * @returns Object with processed attributes
 */
function processAttributes(node: XNode, options: any): Record<string, any> {
  const result: Record<string, any> = {};
  
  if (!node.attributes) {
    return result;
  }
  
  const attrPrefix = options.attributePrefix;
  
  Object.entries(node.attributes).forEach(([name, value]) => {
    // Apply attribute handling based on configuration
    switch (options.attributeHandling) {
      case 'prefix':
        // Add prefix to attribute names
        result[attrPrefix + name] = value;
        break;
        
      default:
        // Default to direct property
        result[name] = value;
        break;
    }
  });
  
  return result;
}