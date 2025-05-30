/**
 * XNode transformer implementation integrated with new hook system - FIXED
 *
 * This module handles node transformations for the map() operation using the new NodeHooks.
 * It applies transform functions to XNode structures with proper before/after hook timing.
 */
import { LoggerFactory } from "../core/logger";
const logger = LoggerFactory.create();

import { Configuration } from "../core/config";
import { XNode, cloneNode } from "../core/xnode";
import {
  Transform,
  TransformIntent,
  TransformContext,
} from "../core/transform";
import { NodeHooks } from "../core/converter";
import { NodeType } from "../core/dom";

/**
 * Apply node transformation with hooks - INTEGRATED WITH NEW SYSTEM
 *
 * This is the main function used by the map() operation to transform XNode trees.
 * It applies beforeTransform hook, main transform, then afterTransform hook.
 *
 * @param node XNode to transform
 * @param mainTransform Main transformation function (required)
 * @param hooks Optional before/after hooks
 * @param config Configuration
 * @param options Transform options including intent
 * @returns Transformed XNode
 */
export function transformXNodeWithHooks(
  node: XNode,
  mainTransform: Transform,
  hooks: NodeHooks | undefined,
  config: Configuration,
  options: { intent?: TransformIntent } = {}
): XNode {
  logger.debug("Starting node transformation with hooks", {
    nodeName: node.name,
    hasHooks: !!(hooks && (hooks.beforeTransform || hooks.afterTransform)),
    intent: options.intent || "PARSE",
  });

  try {
    // Create a deep clone of the node using cloneNode to avoid mutation
    let clonedNode = cloneNode(node, true);

    // Apply transformations to the node and its descendants
    const transformedNode = processNodeTreeWithHooks(
      clonedNode,
      mainTransform,
      hooks,
      options.intent
    );

    logger.debug("Successfully transformed node tree", {
      nodeName: transformedNode.name,
      hasChildren:
        !!transformedNode.children && transformedNode.children.length > 0,
    });

    return transformedNode;
  } catch (err) {
    logger.error("Error applying transform with hooks to node", {
      nodeName: node?.name,
      nodeType: node?.type,
      error: err,
    });
    return node; // Return original node as fallback
  }
}

/**
 * Process a node tree with main transform and hooks
 * @param node Node to process
 * @param mainTransform Main transform to apply
 * @param hooks Before/after hooks
 * @param intent Transform intent (PARSE or SERIALIZE)
 * @returns Processed node
 */
function processNodeTreeWithHooks(
  node: XNode,
  mainTransform: Transform,
  hooks: NodeHooks | undefined,
  intent?: TransformIntent
): XNode {
  let currentNode = node;

  // Apply beforeTransform hook first
  if (hooks?.beforeTransform) {
    try {
      const beforeResult = hooks.beforeTransform(currentNode);
      if (
        beforeResult &&
        typeof beforeResult === "object" &&
        typeof beforeResult.name === "string"
      ) {
        currentNode = beforeResult;
      }
    } catch (err) {
      logger.warn("Error in beforeTransform hook:", err);
    }
  }

  // Apply main transform to the entire node - FIXED
  currentNode = applyMainTransformToNode(currentNode, mainTransform, intent);

  // Process children recursively
  if (currentNode.children && currentNode.children.length > 0) {
    transformChildren(currentNode, mainTransform, hooks, intent);
  }

  // Apply afterTransform hook
  if (hooks?.afterTransform) {
    try {
      const afterResult = hooks.afterTransform(currentNode);
      if (
        afterResult &&
        typeof afterResult === "object" &&
        typeof afterResult.name === "string"
      ) {
        currentNode = afterResult;
      }
    } catch (err) {
      logger.warn("Error in afterTransform hook:", err);
    }
  }

  return currentNode;
}

/**
 * Apply main transform to a single node - FIXED TO WORK WITH NODE TRANSFORMS
 * @param node Node to transform
 * @param mainTransform Main transform function
 * @param intent Transform intent
 * @returns Transformed node
 */
function applyMainTransformToNode(
  node: XNode,
  mainTransform: Transform,
  intent?: TransformIntent
): XNode {
  try {
    // FIXED: Check if this is a node transform (expects XNode) or value transform
    // Node transforms like toBoolean(), toNumber(), regex() expect XNode and return XNode
    // Try calling with the node first
    const transformResult = mainTransform(node, {
      intent,
      path: node.name,
    });

    // If the result is an XNode, use it directly
    if (
      transformResult &&
      typeof transformResult === "object" &&
      typeof transformResult.name === "string" &&
      transformResult.type !== undefined
    ) {
      return transformResult;
    }

    // If the result is not an XNode, assume it's a value transform
    // and apply it to the node's value
    if (node.value !== undefined) {
      const transformedValue = mainTransform(node.value, {
        intent,
        path: node.name,
      });
      return { ...node, value: transformedValue };
    }

    // If no value to transform, apply to attributes
    if (node.attributes) {
      const updatedNode = { ...node };
      transformNodeAttributes(updatedNode, mainTransform, intent);
      return updatedNode;
    }

    return node;
  } catch (err) {
    logger.warn(`Error transforming node ${node.name}:`, err);
    return node;
  }
}

/**
 * Transform node attributes with filtering
 * @param node Node to transform
 * @param mainTransform Transform to apply
 * @param intent Transform intent (PARSE or SERIALIZE)
 */
function transformNodeAttributes(
  node: XNode,
  mainTransform: Transform,
  intent?: TransformIntent
): void {
  if (!node.attributes) return;

  for (const [key, value] of Object.entries(node.attributes)) {
    // Skip xmlns attributes since they're handled separately
    if (key === "xmlns" || key.startsWith("xmlns:")) continue;

    // Apply transform to attribute value
    try {
      const transformedValue = mainTransform(value, {
        intent,
        isAttribute: true,
        attributeName: key,
        path: `${node.name}[@${key}]`,
      });
      node.attributes[key] = transformedValue;
    } catch (err) {
      logger.warn("Error transforming attribute", {
        nodeName: node.name,
        attributeName: key,
        attributeValue: value,
        error: err,
      });
      // Continue processing other attributes on error
    }
  }
}

/**
 * Transform child nodes recursively
 * @param parent Parent node
 * @param mainTransform Transform to apply
 * @param hooks Before/after hooks
 * @param intent Transform intent (PARSE or SERIALIZE)
 */
function transformChildren(
  parent: XNode,
  mainTransform: Transform,
  hooks: NodeHooks | undefined,
  intent?: TransformIntent
): void {
  if (!parent.children || parent.children.length === 0) return;

  // Process each child node
  for (let i = 0; i < parent.children.length; i++) {
    const child = parent.children[i];

    // Apply appropriate transformations based on node type
    switch (child.type) {
      case NodeType.TEXT_NODE:
      case NodeType.CDATA_SECTION_NODE:
        // For text and CDATA nodes, transform the value directly
        if (child.value !== undefined) {
          try {
            child.value = mainTransform(child.value, {
              intent,
              path: `${parent.name}/text()[${i}]`,
            });
          } catch (err) {
            logger.warn(
              `Error transforming text content at ${parent.name}/text()[${i}]:`,
              err
            );
          }
        }
        break;

      case NodeType.ELEMENT_NODE:
        // Recursively process element nodes with full hook support
        parent.children[i] = processNodeTreeWithHooks(
          child,
          mainTransform,
          hooks,
          intent
        );
        break;

      case NodeType.COMMENT_NODE:
      case NodeType.PROCESSING_INSTRUCTION_NODE:
        // Skip comments and processing instructions by default
        break;
    }
  }
}

/**
 * Legacy wrapper for backwards compatibility with old transform system
 * @deprecated Use transformXNodeWithHooks instead
 */
export function transformXNode(
  node: XNode,
  transforms: Transform[],
  config: Configuration,
  options: { intent?: TransformIntent } = {}
): XNode {
  // For legacy support, compose all transforms into one
  const composedTransform = (value: any, context?: TransformContext) => {
    return transforms.reduce((result, transform) => {
      try {
        return transform(result, context);
      } catch (err) {
        logger.warn("Error applying legacy transform:", err);
        return result;
      }
    }, value);
  };

  // Apply using new system without hooks
  return transformXNodeWithHooks(
    node,
    composedTransform,
    undefined,
    config,
    options
  );
}