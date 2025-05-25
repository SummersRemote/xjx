/**
 * XNode transformer implementation with functional approach
 * 
 * Applies transformations to XNode using transform functions.
 */
import { Configuration } from '../core/config';
import { XNode } from '../core/xnode';
import { Transform } from '../core/transform';
import { NodeType } from '../core/dom';
import { logger } from '../core/error';

/**
 * Apply transformations to an XNode
 * @param node XNode to transform
 * @param transforms Transformations to apply
 * @param config Configuration
 * @returns Transformed XNode
 */
export function transformXNode(
  node: XNode,
  transforms: Transform[],
  config: Configuration
): XNode {
  // Skip if no transforms to apply
  if (!transforms || transforms.length === 0) {
    logger.debug('No transformations to apply, returning original node');
    return node;
  }

  logger.debug('Starting node transformation', { 
    nodeName: node.name, 
    transformCount: transforms.length
  });

  try {
    // Create a deep clone of the node to avoid modifying the original
    // Note: We're not using XNode.cloneNode here to avoid circular dependencies
    const clonedNode = JSON.parse(JSON.stringify(node));
    
    // Apply transformations to the node and its descendants
    const transformedNode = processNode(clonedNode, transforms);

    logger.debug('Successfully transformed node', { 
      nodeName: transformedNode.name, 
      hasChildren: !!transformedNode.children && transformedNode.children.length > 0 
    });
    
    return transformedNode;
  } catch (err) {
    logger.error('Error applying transforms to node', {
      nodeName: node?.name,
      nodeType: node?.type,
      error: err
    });
    return node; // Return original node as fallback
  }
}

/**
 * Process a node and its descendants with transforms
 * @param node Node to process
 * @param transforms Transforms to apply
 * @returns Processed node
 */
function processNode(
  node: XNode,
  transforms: Transform[]
): XNode {
  // Apply transforms to node value
  if (node.value !== undefined) {
    node.value = applyTransforms(node.value, transforms);
  }

  // Apply transforms to attributes
  if (node.attributes) {
    transformAttributes(node, transforms);
  }

  // Apply transforms to children
  if (node.children && node.children.length > 0) {
    transformChildren(node, transforms);
  }

  return node;
}

/**
 * Apply a series of transforms to a value
 * @param value Value to transform
 * @param transforms Transforms to apply
 * @returns Transformed value
 */
function applyTransforms(
  value: any,
  transforms: Transform[]
): any {
  return transforms.reduce((result, transform) => {
    try {
      return transform(result);
    } catch (err) {
      logger.warn('Error applying transform to value', {
        value,
        error: err
      });
      return result; // Return unchanged value on error
    }
  }, value);
}

/**
 * Transform node attributes
 * @param node Node to transform
 * @param transforms Transforms to apply
 */
function transformAttributes(
  node: XNode,
  transforms: Transform[]
): void {
  if (!node.attributes) return;

  // Apply transforms to each attribute value
  for (const [key, value] of Object.entries(node.attributes)) {
    // Skip xmlns attributes since they're handled separately
    if (key === "xmlns" || key.startsWith("xmlns:")) continue;
    
    // Apply transforms to attribute value
    node.attributes[key] = applyTransforms(value, transforms);
  }
}

/**
 * Transform child nodes
 * @param node Parent node
 * @param transforms Transforms to apply
 */
function transformChildren(
  node: XNode,
  transforms: Transform[]
): void {
  if (!node.children || node.children.length === 0) return;

  // Process each child node
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    
    // Apply appropriate transformations based on node type
    switch (child.type) {
      case NodeType.TEXT_NODE:
      case NodeType.CDATA_SECTION_NODE:
        // For text and CDATA nodes, transform the value
        if (child.value !== undefined) {
          child.value = applyTransforms(child.value, transforms);
        }
        break;
        
      case NodeType.ELEMENT_NODE:
        // Recursively process element nodes
        processNode(child, transforms);
        break;
        
      case NodeType.COMMENT_NODE:
      case NodeType.PROCESSING_INSTRUCTION_NODE:
        // Skip comments and processing instructions by default
        break;
    }
  }
}