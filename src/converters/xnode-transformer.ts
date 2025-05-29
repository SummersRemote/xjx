/**
 * XNode transformer implementation with functional approach
 * 
 * Applies transformations to XNode using transform functions.
 */
import { LoggerFactory } from "../core/logger";
const logger = LoggerFactory.create();

import { Configuration } from '../core/config';
import { XNode, cloneNode } from '../core/xnode';
import { Transform, TransformIntent, TransformContext } from '../core/transform';
import { NodeType } from '../core/dom';

/**
 * Apply transformations to an XNode
 * @param node XNode to transform
 * @param transforms Transformations to apply
 * @param config Configuration
 * @param options Transform options including intent
 * @returns Transformed XNode
 */
export function transformXNode(
  node: XNode,
  transforms: Transform[],
  config: Configuration,
  options: { intent?: TransformIntent } = {}
): XNode {
  // Skip if no transforms to apply
  if (!transforms || transforms.length === 0) {
    logger.debug('No transformations to apply, returning original node');
    return node;
  }

  logger.debug('Starting node transformation', { 
    nodeName: node.name, 
    transformCount: transforms.length,
    intent: options.intent || 'PARSE'
  });

  try {
    // Create a deep clone of the node using cloneNode instead of JSON.stringify/parse
    // This properly handles circular references like parent properties
    const clonedNode = cloneNode(node, true);
    
    // Apply transformations to the node and its descendants
    const transformedNode = processNode(clonedNode, transforms, options.intent);

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
 * @param intent Transform intent (PARSE or SERIALIZE)
 * @returns Processed node
 */
function processNode(
  node: XNode, 
  transforms: Transform[],
  intent?: TransformIntent
): XNode {
  // Apply transforms to node value
  if (node.value !== undefined) {
    node.value = applyTransforms(node.value, transforms, {
      intent,
      path: node.name
    });
  }

  // Apply transforms to attributes
  if (node.attributes) {
    transformAttributes(node, transforms, intent);
  }

  // Apply transforms to children
  if (node.children && node.children.length > 0) {
    transformChildren(node, transforms, intent);
  }

  return node;
}

/**
 * Apply a series of transforms to a value
 * @param value Value to transform
 * @param transforms Transforms to apply
 * @param context Transform context including intent
 * @returns Transformed value
 */
function applyTransforms(
  value: any,
  transforms: Transform[],
  context: TransformContext = {}
): any {
  return transforms.reduce((result, transform) => {
    try {
      // Pass the context to the transform
      return transform(result, context);
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
 * Transform node attributes with filtering
 * @param node Node to transform
 * @param transforms Transforms to apply
 * @param intent Transform intent (PARSE or SERIALIZE)
 */
function transformAttributes(
  node: XNode,
  transforms: Transform[],
  intent?: TransformIntent
): void {
  if (!node.attributes) return;

  for (const [key, value] of Object.entries(node.attributes)) {
    // Skip xmlns attributes since they're handled separately
    if (key === "xmlns" || key.startsWith("xmlns:")) continue;
    
    // Apply transforms to attribute value
    try {
      node.attributes[key] = applyTransforms(value, transforms, {
        intent,
        isAttribute: true,
        attributeName: key,
        path: `${node.name}[@${key}]`
      });
    } catch (err) {
      logger.warn('Error transforming attribute', { 
        nodeName: node.name, 
        attributeName: key, 
        attributeValue: value,
        error: err 
      });
      // Continue processing other attributes on error
    }
  }
}

/**
 * Transform child nodes
 * @param node Parent node
 * @param transforms Transforms to apply
 * @param intent Transform intent (PARSE or SERIALIZE)
 */
function transformChildren(
  node: XNode,
  transforms: Transform[],
  intent?: TransformIntent
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
          child.value = applyTransforms(child.value, transforms, {
            intent,
            path: `${node.name}/text()[${i}]`
          });
        }
        break;
        
      case NodeType.ELEMENT_NODE:
        // Recursively process element nodes
        processNode(child, transforms, intent);
        break;
        
      case NodeType.COMMENT_NODE:
      case NodeType.PROCESSING_INSTRUCTION_NODE:
        // Skip comments and processing instructions by default
        break;
    }
  }
}