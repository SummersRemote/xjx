/**
 * Boolean node transform - Converts string node values to booleans
 */
import { XNode } from '../core/xnode';

/**
 * Options for boolean node transform
 */
export interface BooleanTransformOptions {
  /**
   * Values to consider as true (default: ['true', 'yes', '1', 'on'])
   */
  trueValues?: string[];
  
  /**
   * Values to consider as false (default: ['false', 'no', '0', 'off'])
   */
  falseValues?: string[];
  
  /**
   * Whether to ignore case when matching (default: true)
   */
  ignoreCase?: boolean;
  
  /**
   * Only transform nodes with these names (default: transform all)
   */
  nodeNames?: string[];
  
  /**
   * Skip nodes with these names (default: none)
   */
  skipNodes?: string[];
}

/**
 * Default values for boolean conversion
 */
const DEFAULT_TRUE_VALUES = ['true', 'yes', '1', 'on'];
const DEFAULT_FALSE_VALUES = ['false', 'no', '0', 'off'];

/**
 * Create a node transformer that converts string values to booleans
 * 
 * @example
 * ```typescript
 * // Transform all nodes with boolean-like values
 * xjx.fromXml(xml).map(toBoolean()).toJson();
 * 
 * // Transform only specific nodes
 * xjx.fromXml(xml).map(toBoolean({ 
 *   nodeNames: ['active', 'enabled', 'visible'] 
 * })).toJson();
 * 
 * // Custom true/false values
 * xjx.fromXml(xml).map(toBoolean({ 
 *   trueValues: ['yes', 'y', '1'], 
 *   falseValues: ['no', 'n', '0'] 
 * })).toJson();
 * ```
 * 
 * @param options Boolean transform options
 * @returns A node transformer function for use with map()
 */
export function toBoolean(options: BooleanTransformOptions = {}): (node: XNode) => XNode {
  const {
    trueValues = DEFAULT_TRUE_VALUES,
    falseValues = DEFAULT_FALSE_VALUES,
    ignoreCase = true,
    nodeNames,
    skipNodes = []
  } = options;
  
  // Pre-process values for case insensitive comparison
  const normalizedTrueValues = ignoreCase 
    ? trueValues.map(v => v.toLowerCase()) 
    : trueValues;
  const normalizedFalseValues = ignoreCase 
    ? falseValues.map(v => v.toLowerCase()) 
    : falseValues;
  
  return (node: XNode): XNode => {
    // Skip if this node should be skipped
    if (skipNodes && skipNodes.length > 0 && skipNodes.includes(node.name)) {
      return node;
    }
    
    // Skip if nodeNames is specified with items and this node isn't included
    if (nodeNames && nodeNames.length > 0 && !nodeNames.includes(node.name)) {
      return node;
    }
    
    // Skip if node has no value or value is not a string
    if (node.value === undefined || typeof node.value !== 'string') {
      return node;
    }
    
    const strValue = node.value.trim();
    if (!strValue) {
      return node;
    }
    
    const compareValue = ignoreCase ? strValue.toLowerCase() : strValue;
    
    // Check for true values
    if (normalizedTrueValues.includes(compareValue)) {
      return { ...node, value: true };
    }
    
    // Check for false values
    if (normalizedFalseValues.includes(compareValue)) {
      return { ...node, value: false };
    }
    
    // No match, return original node unchanged
    return node;
  };
}