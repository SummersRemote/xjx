/**
 * Updated transform extension for XJX - Now properly handles TransformIntent
 * 
 * Implements the transform function with proper targeting and intent support
 */
import { XJX } from "../XJX";
import { XNode, cloneNode } from "../core/xnode";
import { logger, validate } from "../core/error";
import { NonTerminalExtensionContext } from "../core/extension";
import { Transform, TransformOptions, TransformIntent, TransformContext } from "../core/transform";
import { transformXNode } from "../converters/xnode-transformer";

/**
 * Implementation for applying transforms to the current selection
 * Now properly supports TransformIntent for bidirectional transformations
 * 
 * @example
 * ```
 * // Transform everything (default - PARSE mode)
 * xjx.transform(toNumber());
 * 
 * // Transform only node values, not attributes
 * xjx.transform(toNumber(), { values: true, attributes: false });
 * 
 * // Transform only specific attributes
 * xjx.transform(toNumber(), { 
 *   values: false, 
 *   attributes: true,
 *   attributeFilter: 'price' 
 * });
 * 
 * // Serialize mode - convert numbers to strings
 * xjx.transform(toNumber({ format: '0.00' }), { 
 *   intent: TransformIntent.SERIALIZE 
 * });
 * ```
 * 
 * @param transformer Transform function to apply
 * @param options Transform options for targeting and intent
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
    
    // Get all options with defaults
    const {
      values = true,
      attributes = true,
      attributeFilter,
      pathFilter,
      intent = TransformIntent.PARSE
    } = options;
    
    logger.debug('Applying transform with targeting options', { 
      values, 
      attributes, 
      hasAttributeFilter: !!attributeFilter,
      hasPathFilter: !!pathFilter,
      intent: intent === TransformIntent.PARSE ? 'PARSE' : 'SERIALIZE'
    });
    
    // Get current node
    const currentNode = this.xnode as XNode;
    
    // Apply transform based on context, respecting the targeting options
    if (!values && !attributes) {
      logger.debug('Both values and attributes are set to false, no transformation applied');
      return;
    }
    
    // Apply the transforms to the node, including intent
    this.xnode = transformXNode(
      currentNode, 
      [wrapTransformWithOptions(transformer, { values, attributes, attributeFilter, pathFilter })],
      this.config,
      { intent }
    );
    
    logger.debug('Successfully applied targeted transform');
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to apply transform: ${String(err)}`);
  }
}

/**
 * Wrap a transform function with options to control its application
 * This creates a new transform that respects the values/attributes options
 */
function wrapTransformWithOptions(
  transform: Transform,
  options: { 
    values: boolean; 
    attributes: boolean; 
    attributeFilter?: string | RegExp | ((name: string) => boolean);
    pathFilter?: string | RegExp | ((path: string) => boolean);
  }
): Transform {
  const { values, attributes, attributeFilter, pathFilter } = options;
  
  return (value: any, context?: TransformContext): any => {
    // If no context is provided, create an empty one
    const ctx = context || {};
    
    // Get path and attribute information from context
    const path = ctx.path || '';
    const isAttribute = ctx.isAttribute || false;
    const attributeName = ctx.attributeName || '';
    
    // Check if we should apply the transform based on options
    if (isAttribute) {
      if (!attributes) {
        return value;
      }
      
      // Check attribute filter if provided
      if (attributeFilter && !matchesFilter(attributeName, attributeFilter)) {
        return value;
      }
    } else {
      if (!values) {
        return value;
      }
      
      // Check path filter if provided
      if (pathFilter && !matchesFilter(path, pathFilter)) {
        return value;
      }
    }
    
    // Apply the transform with the provided context
    return transform(value, ctx);
  };
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