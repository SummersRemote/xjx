/**
 * Updated transform extension for XJX - Now properly uses TransformOptions
 * 
 * Implements the transform function with simple targeting using existing options
 */
import { XJX } from "../XJX";
import { XNode, cloneNode } from "../core/xnode";
import { logger, validate } from "../core/error";
import { NonTerminalExtensionContext } from "../core/extension";
import { Transform, TransformOptions } from "../core/transform";

/**
 * Implementation for applying transforms to the current selection
 * Now properly respects TransformOptions for targeting
 * 
 * @example
 * ```
 * // Transform everything (default)
 * xjx.transform(toNumber());
 * 
 * // Transform only node values, not attributes
 * xjx.transform(trim(), { values: true, attributes: false });
 * 
 * // Transform only specific attributes
 * xjx.transform(toNumber(), { 
 *   values: false, 
 *   attributes: true,
 *   attributeFilter: 'price' 
 * });
 * ```
 * 
 * @param transformer Transform function to apply
 * @param options Transform options for targeting
 * @returns this for chaining
 */
export function transform(
  this: NonTerminalExtensionContext,
  transformer: Transform,
  options: TransformOptions = {}
): void {
  try {
    // API boundary validation
    validate(typeof transformer === 'function', "Transform must be a function");
    this.validateSource();
    
    // Default options - transform both values and attributes by default
    const {
      values = true,
      attributes = true,
      attributeFilter,
      pathFilter
    } = options;
    
    logger.debug('Applying transform with targeting options', { 
      values, 
      attributes, 
      hasAttributeFilter: !!attributeFilter,
      hasPathFilter: !!pathFilter
    });
    
    // Get current node
    const currentNode = this.xnode as XNode;
    
    // Clone to avoid mutating the original
    const clonedNode = cloneNode(currentNode, true);
    
    // Apply transform based on context
    if (isResultsContainer.call(this, clonedNode)) {
      // Multiple nodes in results container
      transformResultsContainer(clonedNode, transformer, { values, attributes, attributeFilter, pathFilter });
    } else {
      // Single node
      transformSingleNode(clonedNode, transformer, { values, attributes, attributeFilter, pathFilter }, '');
    }
    
    // Update the current node
    this.xnode = clonedNode;
    
    logger.debug('Successfully applied targeted transform');
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to apply transform: ${String(err)}`);
  }
}

/**
 * Check if current node is a results container from functional operations
 */
function isResultsContainer(this: NonTerminalExtensionContext, node: XNode): boolean {
  const fragmentRootName = typeof this.config.fragmentRoot === 'string' ? 
    this.config.fragmentRoot : 'results';
  
  return node.name === fragmentRootName && 
        Array.isArray(node.children) && 
        node.children.length > 0;
}

/**
 * Transform children in a results container
 */
function transformResultsContainer(
  containerNode: XNode, 
  transformer: Transform,
  options: { values: boolean; attributes: boolean; attributeFilter?: any; pathFilter?: any }
): void {
  if (!containerNode.children) return;
  
  // Transform each child node
  containerNode.children.forEach(child => {
    transformSingleNode(child, transformer, options, '');
  });
}

/**
 * Transform a single node and its children
 */
function transformSingleNode(
  node: XNode, 
  transformer: Transform,
  options: { values: boolean; attributes: boolean; attributeFilter?: any; pathFilter?: any },
  pathPrefix: string
): void {
  const nodePath = pathPrefix + (pathPrefix ? '/' : '') + node.name;
  
  // Check path filter if provided
  if (options.pathFilter && !matchesFilter(nodePath, options.pathFilter)) {
    // Skip this node and its children if path doesn't match
    return;
  }
  
  // Transform node value if enabled and present
  if (options.values && node.value !== undefined) {
    try {
      node.value = transformer(node.value);
    } catch (err) {
      logger.warn('Error transforming node value', { 
        nodePath, 
        nodeValue: node.value,
        error: err 
      });
      // Continue processing other values on error
    }
  }
  
  // Transform attributes if enabled
  if (options.attributes && node.attributes) {
    transformNodeAttributes(node, transformer, options.attributeFilter);
  }
  
  // Recursively transform children
  if (node.children && node.children.length > 0) {
    node.children.forEach(child => {
      transformSingleNode(child, transformer, options, nodePath);
    });
  }
}

/**
 * Transform node attributes with filtering
 */
function transformNodeAttributes(
  node: XNode,
  transformer: Transform,
  attributeFilter?: string | RegExp | ((name: string) => boolean)
): void {
  if (!node.attributes) return;

  for (const [name, value] of Object.entries(node.attributes)) {
    // Skip xmlns attributes since they're handled separately
    if (name === "xmlns" || name.startsWith("xmlns:")) {
      continue;
    }
    
    // Apply attribute filter if provided
    if (attributeFilter && !matchesFilter(name, attributeFilter)) {
      continue;
    }
    
    // Apply transform to attribute value
    try {
      node.attributes[name] = transformer(value);
    } catch (err) {
      logger.warn('Error transforming attribute', { 
        nodeName: node.name, 
        attributeName: name, 
        attributeValue: value,
        error: err 
      });
      // Continue processing other attributes on error
    }
  }
}

/**
 * Check if a string matches a filter (string, RegExp, or function)
 */
function matchesFilter(
  input: string, 
  filter: string | RegExp | ((input: string) => boolean)
): boolean {
  try {
    if (typeof filter === 'string') {
      return input === filter;
    } else if (filter instanceof RegExp) {
      return filter.test(input);
    } else if (typeof filter === 'function') {
      return filter(input);
    }
    return true;
  } catch (err) {
    logger.warn('Error in filter evaluation', { input, error: err });
    return false;
  }
}

// Register the transform extension with XJX
XJX.registerNonTerminalExtension("transform", transform);