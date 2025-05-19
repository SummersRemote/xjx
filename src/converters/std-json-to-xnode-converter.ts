/**
 * Standard JSON to XNode converter implementation with hybrid OO-functional approach
 * 
 * Converts standard JSON objects to XNode representation with proper application of preservation settings.
 */
import { BaseConverter } from '../core/converter';
import { NodeType } from '../core/dom';
import { logger, handleError, ErrorType } from '../core/error';
import { XNode } from '../core/xnode';

/**
 * Converts standard JSON objects to XNode representation
 */
export class DefaultStandardJsonToXNodeConverter extends BaseConverter<Record<string, any> | any[], XNode> {
  /**
   * Convert standard JSON object to XNode
   * @param source Standard JSON object or array
   * @returns XNode representation
   */
  public convert(source: Record<string, any> | any[]): XNode {
    try {
      // Validate input
      this.validateInput(source, "Source must be a valid object or array", 
                         input => input !== null && typeof input === 'object');
      
      logger.debug('Starting standard JSON to XNode conversion', {
        sourceType: Array.isArray(source) ? 'array' : 'object'
      });
      
      // Create root node based on source type
      const rootName = Array.isArray(source) ? "array" : "root";
      const rootNode = new XNode(rootName, NodeType.ELEMENT_NODE);
      
      // Use pure functional core to process the source
      if (Array.isArray(source)) {
        // Process array
        processArray(source, rootNode, this.config);
      } else {
        // Process object
        processObject(source, rootNode, this.config);
      }
      
      logger.debug('Successfully converted standard JSON to XNode', {
        rootName: rootNode.name,
        childCount: rootNode.children?.length || 0
      });
      
      return rootNode;
    } catch (err) {
      return handleError(err, 'convert standard JSON to XNode', {
        data: { sourceType: Array.isArray(source) ? 'array' : 'object' },
        errorType: ErrorType.PARSE
      });
    }
  }
}

// ===== PURE FUNCTIONAL CORE =====

/**
 * Process a JSON array - pure function
 * @param array JSON array to process
 * @param parentNode Parent XNode to add children to
 * @param config Configuration
 */
export function processArray(
  array: any[],
  parentNode: XNode,
  config: any
): void {
  // Process array items using the configured array item name
  const arrayItemName = config.converters.stdJson.naming.arrayItem;
  
  array.forEach(item => {
    const childNode = convertValue(arrayItemName, item, config);
    if (childNode) {
      childNode.parent = parentNode;
      if (!parentNode.children) {
        parentNode.children = [];
      }
      parentNode.children.push(childNode);
    }
  });
}

/**
 * Process a JSON object - pure function
 * @param obj JSON object to process
 * @param parentNode Parent XNode to add children to
 * @param config Configuration
 */
export function processObject(
  obj: Record<string, any>,
  parentNode: XNode,
  config: any
): void {
  // Process object properties
  Object.entries(obj).forEach(([key, value]) => {
    const childNode = convertValue(sanitizeNodeName(key), value, config);
    if (childNode) {
      childNode.parent = parentNode;
      if (!parentNode.children) {
        parentNode.children = [];
      }
      parentNode.children.push(childNode);
    }
  });
}

/**
 * Convert a JSON value to an XNode - pure function
 * @param name Node name
 * @param value JSON value
 * @param config Configuration
 * @returns XNode representation or null if filtered
 */
function convertValue(
  name: string,
  value: any,
  config: any
): XNode | null {
  // Create node with sanitized name
  const node = new XNode(sanitizeNodeName(name), NodeType.ELEMENT_NODE);
  
  // Handle null/undefined
  if (value === null || value === undefined) {
    return node;
  }
  
  // Handle primitive values (apply preserveTextNodes)
  if (typeof value !== 'object') {
    if (config.preserveTextNodes) {
      const normalizedValue = typeof value === 'string' && !config.preserveWhitespace ? 
                            value.trim() : value;
      node.value = normalizedValue;
    }
    return node;
  }
  
  // Handle arrays
  if (Array.isArray(value)) {
    processArray(value, node, config);
    return node;
  }
  
  // Handle standard JavaScript objects
  const options = config.converters.stdJson.options;
  
  // Check for attribute handling based on the options
  if (config.preserveAttributes) {
    processObjectAttributes(node, value, options);
  }
  
  // Process object properties as child nodes
  processObjectChildren(node, value, options, config);
  
  return node;
}

/**
 * Process object attributes based on configuration - pure function
 * @param node XNode to add attributes to
 * @param obj Object containing potential attributes
 * @param options Standard JSON options
 */
function processObjectAttributes(
  node: XNode,
  obj: Record<string, any>,
  options: any
): void {
  // Define attribute properties based on attributeHandling option
  let attributeProps: Record<string, any> = {};
  
  switch (options.attributeHandling) {
    case 'property':
      // Attributes in a specific property
      const propName = options.attributePropertyName;
      if (obj[propName] && typeof obj[propName] === 'object') {
        attributeProps = obj[propName];
      }
      break;
      
    case 'prefix':
      // Attributes with a specific prefix
      const prefix = options.attributePrefix;
      Object.entries(obj).forEach(([key, value]) => {
        if (key.startsWith(prefix)) {
          const attrName = key.substring(prefix.length);
          attributeProps[attrName] = value;
        }
      });
      break;
      
    case 'merge':
      // All primitive properties could be attributes
      Object.entries(obj).forEach(([key, value]) => {
        // Only consider primitives, not objects/arrays, and not the text content property
        if ((typeof value !== 'object' || value === null) && 
            key !== options.textPropertyName) {
          attributeProps[key] = value;
        }
      });
      break;
      
    // For 'ignore', we don't process attributes
  }
  
  // Add attributes to the node
  if (Object.keys(attributeProps).length > 0) {
    node.attributes = {};
    
    Object.entries(attributeProps).forEach(([name, value]) => {
      node.attributes![name] = value;
    });
  }
}

/**
 * Process object properties as child nodes - pure function
 * @param node XNode to add children to
 * @param obj Object with properties to process
 * @param options Standard JSON options
 * @param config Main configuration
 */
function processObjectChildren(
  node: XNode,
  obj: Record<string, any>,
  options: any,
  config: any
): void {
  // Process text content property if it exists
  if (obj[options.textPropertyName] !== undefined && 
      typeof obj[options.textPropertyName] !== 'object' &&
      config.preserveTextNodes) {
    
    const textValue = obj[options.textPropertyName];
    const normalized = typeof textValue === 'string' && !config.preserveWhitespace ? 
                     textValue.trim() : textValue;
    node.value = normalized;
    
    // If there are no other meaningful properties, we can return early
    const otherProps = Object.keys(obj).filter(key => 
      key !== options.textPropertyName && 
      !isAttributeProperty(key, options)
    );
    
    if (otherProps.length === 0) {
      return;
    }
  }
  
  // Process other properties as child nodes
  Object.entries(obj).forEach(([key, value]) => {
    // Skip properties that might have been handled as attributes
    if (isAttributeProperty(key, options)) {
      return;
    }
    
    // Skip text property if it's designated as the text content holder
    if (key === options.textPropertyName && typeof value !== 'object') {
      return;
    }
    
    // Process regular properties as child nodes
    const childNode = convertValue(sanitizeNodeName(key), value, config);
    if (childNode) {
      if (!node.children) {
        node.children = [];
      }
      childNode.parent = node;
      node.children.push(childNode);
    }
  });
}

/**
 * Check if a property is an attribute based on the configuration - pure function
 * @param key Property key
 * @param options Standard JSON options
 * @returns True if it's an attribute property
 */
function isAttributeProperty(key: string, options: any): boolean {
  switch (options.attributeHandling) {
    case 'property':
      return key === options.attributePropertyName;
      
    case 'prefix':
      return key.startsWith(options.attributePrefix);
      
    case 'merge':
      // In merge mode, we can't definitively say which properties are attributes
      // since they're merged with regular properties
      return false;
      
    case 'ignore':
    default:
      return false;
  }
}

/**
 * Sanitize a string to be a valid XML node name - pure function
 * @param name Name to sanitize
 * @returns Sanitized name
 */
function sanitizeNodeName(name: string): string {
  // XML element names must start with a letter or underscore
  // and can only contain letters, digits, hyphens, underscores, and periods
  
  // Replace invalid start character
  let result = name.trim();
  if (!/^[a-zA-Z_]/.test(result)) {
    result = 'n_' + result;
  }
  
  // Replace invalid characters
  result = result.replace(/[^\w\-\.]/g, '_');
  
  return result || 'node'; // Default if empty after sanitization
}