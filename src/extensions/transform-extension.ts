/**
 * Simplified transform extension for XJX
 * 
 * Implements the transform function with basic targeting and intent support
 * Relies on select() and filter() for more complex node targeting
 */
import { XJX } from "../XJX";
import { XNode, cloneNode } from "../core/xnode";
import { logger, validate } from "../core/error";
import { NonTerminalExtensionContext } from "../core/extension";
import { Transform, TransformOptions, TransformIntent, TransformContext } from "../core/transform";
import { transformXNode } from "../converters/xnode-transformer";

/**
 * Implementation for applying transforms to the current selection
 * Simplified to focus on basic targeting (values/attributes) and intent
 * 
 * @example
 * ```
 * // Transform everything (default - PARSE mode)
 * xjx.transform(toNumber());
 * 
 * // Transform only node values, not attributes
 * xjx.transform(toNumber(), { values: true, attributes: false });
 * 
 * // Transform only attributes, not node values
 * xjx.transform(toNumber(), { values: false, attributes: true });
 * 
 * // Serialize mode - convert numbers to strings
 * xjx.transform(toNumber({ format: '0.00' }), { 
 *   intent: TransformIntent.SERIALIZE 
 * });
 * 
 * // For more complex targeting, use select() and filter() first:
 * xjx.select(node => node.name === 'price')
 *    .filter(node => node.attributes && node.attributes.currency === 'USD')
 *    .transform(toNumber());
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
      intent = TransformIntent.PARSE
    } = options;
    
    logger.debug('Applying transform with targeting options', { 
      values, 
      attributes, 
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
      [wrapTransformWithOptions(transformer, { values, attributes })],
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
  }
): Transform {
  const { values, attributes } = options;
  
  return (value: any, context?: TransformContext): any => {
    // If no context is provided, create an empty one
    const ctx = context || {};
    
    // Check if the value is from an attribute
    const isAttribute = ctx.isAttribute || false;
    
    // Check if we should apply the transform based on options
    if (isAttribute) {
      if (!attributes) {
        return value;
      }
    } else {
      if (!values) {
        return value;
      }
    }
    
    // Apply the transform with the provided context
    return transform(value, ctx);
  };
}

// Register the transform extension with XJX
XJX.registerNonTerminalExtension("transform", transform);