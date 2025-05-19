/**
 * XNode transformer implementation with functional core
 * 
 * Applies transformations to XNode based on transform targets.
 */
import { Configuration } from '../core/config';
import { XNode } from '../core/xnode';
import {
  Transform,
  TransformContext,
  TransformResult,
  TransformTarget,
  Format,
  createTransformResult,
  createRootContext,
  getContextTargetType,
  applyTransformsToValue
} from '../core/transform';
import { NodeType } from '../core/dom';
import { logger } from '../core/error';

/**
 * Apply transformations to an XNode
 * @param node XNode to transform
 * @param transforms Transformations to apply
 * @param targetFormat Target format identifier
 * @param config Configuration
 * @returns Transformed XNode
 */
export function transformXNode(
  node: XNode,
  transforms: Transform[],
  targetFormat: Format,
  config: Configuration
): XNode {
  // Skip if no transforms to apply
  if (!transforms || transforms.length === 0) {
    logger.debug('No transformations to apply, returning original node');
    return node;
  }

  // Create root context
  const context = createRootContext(targetFormat, node, config);
  
  logger.debug('Starting node transformation', { 
    nodeName: node.name, 
    transformCount: transforms.length,
    targetFormat 
  });

  // Apply transformations using functional core
  const transformedNode = processNode(node, context, transforms);

  if (!transformedNode) {
    logger.error('Root node was removed during transformation', {
      nodeName: node.name
    });
    return node; // Return original node as fallback
  }

  logger.debug('Successfully transformed node', { 
    nodeName: transformedNode.name, 
    hasChildren: !!transformedNode.children && transformedNode.children.length > 0 
  });
  
  return transformedNode;
}

/**
 * Process a node and its children
 * @param node Node to process
 * @param context Transform context
 * @param transforms Transforms to apply
 * @returns Processed node or null if removed
 */
function processNode(
  node: XNode,
  context: TransformContext,
  transforms: Transform[]
): XNode | null {
  try {
    // 1. Apply element transforms first
    const targetType = getContextTargetType(context);
    const elementResult = applyTransformsToValue(node, context, transforms, targetType);

    if (elementResult.remove) {
      return null;
    }

    const transformedNode = elementResult.value as XNode;

    // 2. Transform node value if present
    if (transformedNode.value !== undefined) {
      const valueContext: TransformContext = {
        ...context,
        isText: true,
      };

      const valueResult = applyTransformsToValue(
        transformedNode.value,
        valueContext,
        transforms,
        TransformTarget.Value
      );

      if (valueResult.remove) {
        delete transformedNode.value;
      } else {
        transformedNode.value = valueResult.value;
      }
    }

    // 3. Transform attributes
    transformAttributes(transformedNode, context, transforms);

    // 4. Transform children
    transformChildren(transformedNode, context, transforms);

    return transformedNode;
  } catch (err) {
    logger.error('Error applying transforms to node', {
      nodeName: node?.name,
      nodeType: node?.type,
      path: context.path,
      error: err
    });
    return node; // Return original node as fallback
  }
}

/**
 * Transform node attributes
 * @param node Node to transform
 * @param context Parent context
 * @param transforms Transforms to apply
 */
function transformAttributes(
  node: XNode,
  context: TransformContext,
  transforms: Transform[]
): void {
  if (!node.attributes) return;

  const attributeTransforms = transforms.filter(t => 
    t.targets.includes(TransformTarget.Attribute) || 
    t.targets.includes(TransformTarget.Value)
  );
  
  if (attributeTransforms.length === 0) return;

  const newAttributes: Record<string, any> = {};

  for (const [name, value] of Object.entries(node.attributes)) {
    // Skip xmlns attributes since they're handled separately
    if (name === "xmlns" || name.startsWith("xmlns:")) {
      newAttributes[name] = value;
      continue;
    }

    // Create attribute context
    const attrContext: TransformContext = {
      ...context,
      isAttribute: true,
      attributeName: name,
      path: `${context.path}.@${name}`,
    };

    // Transform attribute value
    const valueResult = applyTransformsToValue(
      value,
      attrContext,
      transforms,
      TransformTarget.Value
    );

    if (valueResult.remove) {
      continue;
    }

    let attrName = name;
    let attrValue = valueResult.value;

    // Apply attribute transforms
    for (const transform of attributeTransforms) {
      if (transform.targets.includes(TransformTarget.Attribute)) {
        const result = transform.transform([attrName, attrValue], attrContext);
        
        if (result.remove) {
          attrName = '';
          break;
        }
        
        const [newName, newValue] = result.value as [string, any];
        attrName = newName;
        attrValue = newValue;
      }
    }

    // Add transformed attribute if not removed
    if (attrName) {
      newAttributes[attrName] = attrValue;
    }
  }

  node.attributes = newAttributes;
}

/**
 * Transform child nodes
 * @param node Node to transform
 * @param context Parent context
 * @param transforms Transforms to apply
 */
function transformChildren(
  node: XNode,
  context: TransformContext,
  transforms: Transform[]
): void {
  if (!node.children) return;

  const newChildren: XNode[] = [];

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];

    // Create child context with appropriate type flags
    const childContext: TransformContext = {
      nodeName: child.name,
      nodeType: child.type,
      namespace: child.namespace,
      prefix: child.prefix,
      path: `${context.path}.${child.name}[${i}]`,
      config: context.config,
      targetFormat: context.targetFormat,
      parent: context,
      isText: child.type === NodeType.TEXT_NODE,
      isCDATA: child.type === NodeType.CDATA_SECTION_NODE,
      isComment: child.type === NodeType.COMMENT_NODE,
      isProcessingInstruction: child.type === NodeType.PROCESSING_INSTRUCTION_NODE,
    };

    // Process child based on its type
    const transformedChild = processNode(child, childContext, transforms);

    if (transformedChild) {
      newChildren.push(transformedChild);
    }
  }

  node.children = newChildren;
}