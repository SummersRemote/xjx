/**
 * Transform extension for XJX
 * 
 * Implements the transform function for the functional pipeline
 */
import { XJX } from "../XJX";
import { XNode, cloneNode } from "../core/xnode";
import { logger, validate } from "../core/error";
import { NonTerminalExtensionContext } from "../core/extension";
import { Transform } from "../core/transform";

/**
 * Implementation for applying transforms to the current selection
 * 
 * @example
 * ```
 * // Simple usage
 * xjx.fromXml(xml)
 *    .select(node => node.name === 'price')
 *    .transform(toNumber())
 *    .filter(node => node.value > 100)
 *    .toXml();
 * 
 * // With parameters
 * xjx.transform(toNumber({ precision: 2 }));
 * 
 * // Composing transforms
 * xjx.transform(compose(
 *    regex(/[^\d.]/g, ''),
 *    toNumber({ precision: 2 }),
 *    value => value * 1.1
 * ));
 * ```
 * 
 * @param transformer Transform function to apply
 * @returns this for chaining
 */
export function transform(
  this: NonTerminalExtensionContext,
  transformer: Transform
): void {
  try {
    // API boundary validation
    validate(typeof transformer === 'function', "Transform must be a function");
    this.validateSource();
    
    logger.debug('Applying transform to current node selection');
    
    // Get current node
    const currentNode = this.xnode as XNode;
    
    // Clone to avoid mutating the original
    const clonedNode = cloneNode(currentNode, true);
    
    // Apply transform based on context
    if (isResultsContainer.call(this, clonedNode)) {
      // Multiple nodes in results container
      transformResultsContainer(clonedNode, transformer);
    } else {
      // Single node
      transformSingleNode(clonedNode, transformer);
    }
    
    // Update the current node
    this.xnode = clonedNode;
    
    logger.debug('Successfully applied transform');
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
  transformer: Transform
): void {
  if (!containerNode.children) return;
  
  // Transform each child node
  containerNode.children.forEach(child => {
    transformSingleNode(child, transformer);
  });
}

/**
 * Transform a single node and its children
 */
function transformSingleNode(
  node: XNode, 
  transformer: Transform
): void {
  // Transform node value if present
  if (node.value !== undefined) {
    node.value = transformer(node.value);
  }
  
  // Transform attributes if present
  if (node.attributes) {
    for (const [name, value] of Object.entries(node.attributes)) {
      node.attributes[name] = transformer(value);
    }
  }
  
  // Recursively transform children if present
  if (node.children && node.children.length > 0) {
    node.children.forEach(child => {
      transformSingleNode(child, transformer);
    });
  }
}

// Register the extension with XJX
XJX.registerNonTerminalExtension("transform", transform);