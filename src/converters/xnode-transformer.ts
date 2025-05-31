/**
 * XNode transformer implementation with minimal transform system
 *
 * This module handles node transformations for the map() operation using the new minimal Transform interface.
 * It applies transform functions to XNode structures with proper before/after hook timing.
 */
import { LoggerFactory } from "../core/logger";
const logger = LoggerFactory.create();

import { Configuration } from "../core/config";
import { XNode, cloneNode } from "../core/xnode";
import { Transform } from "../core/functional";
import { NodeHooks } from "../core/hooks";
import { NodeType } from "../core/dom";

/**
 * Apply node transformation with hooks
 *
 * This is the main function used by the map() operation to transform XNode trees.
 * It applies beforeTransform hook, main transform, then afterTransform hook.
 *
 * @param node XNode to transform
 * @param mainTransform Main transformation function (required)
 * @param hooks Optional before/after hooks
 * @param config Configuration
 * @returns Transformed XNode
 */
export function transformXNodeWithHooks(
  node: XNode,
  mainTransform: Transform,
  hooks: NodeHooks | undefined,
  config: Configuration
): XNode {
  logger.debug("Starting node transformation with hooks", {
    nodeName: node.name,
    hasHooks: !!(hooks && (hooks.beforeTransform || hooks.afterTransform))
  });

  try {
    // Create a deep clone of the node using cloneNode to avoid mutation
    let clonedNode = cloneNode(node, true);

    // Apply transformations to the node and its descendants
    const transformedNode = processNodeTreeWithHooks(
      clonedNode,
      mainTransform,
      hooks
    );

    logger.debug("Successfully transformed node tree", {
      nodeName: transformedNode.name,
      hasChildren: !!transformedNode.children && transformedNode.children.length > 0,
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
 * @returns Processed node
 */
function processNodeTreeWithHooks(
  node: XNode,
  mainTransform: Transform,
  hooks: NodeHooks | undefined
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

  // Apply main transform to the node
  try {
    currentNode = mainTransform(currentNode);
  } catch (err) {
    logger.warn(`Error in main transform on node '${currentNode.name}':`, err);
    // Continue with original node on error
  }

  // Process children recursively
  if (currentNode.children && currentNode.children.length > 0) {
    transformChildren(currentNode, mainTransform, hooks);
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
 * Transform child nodes recursively
 * @param parent Parent node
 * @param mainTransform Transform to apply
 * @param hooks Before/after hooks
 */
function transformChildren(
  parent: XNode,
  mainTransform: Transform,
  hooks: NodeHooks | undefined
): void {
  if (!parent.children || parent.children.length === 0) return;

  // Process each child node
  for (let i = 0; i < parent.children.length; i++) {
    const child = parent.children[i];

    // Apply transformations based on node type
    switch (child.type) {
      case NodeType.TEXT_NODE:
      case NodeType.CDATA_SECTION_NODE:
        // For text and CDATA nodes, apply transform directly
        try {
          parent.children[i] = mainTransform(child);
        } catch (err) {
          logger.warn(`Error transforming text content at ${parent.name}/text()[${i}]:`, err);
        }
        break;

      case NodeType.ELEMENT_NODE:
        // Recursively process element nodes with full hook support
        parent.children[i] = processNodeTreeWithHooks(
          child,
          mainTransform,
          hooks
        );
        break;

      case NodeType.COMMENT_NODE:
      case NodeType.PROCESSING_INSTRUCTION_NODE:
        // Apply transform to comments and processing instructions too
        try {
          parent.children[i] = mainTransform(child);
        } catch (err) {
          logger.warn(`Error transforming ${child.type === NodeType.COMMENT_NODE ? 'comment' : 'processing instruction'}:`, err);
        }
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
  config: Configuration
): XNode {
  // For legacy support, compose all transforms into one
  const composedTransform: Transform = (inputNode: XNode): XNode => {
    return transforms.reduce((result, transform) => {
      try {
        return transform(result);
      } catch (err) {
        logger.warn("Error applying legacy transform:", err);
        return result;
      }
    }, inputNode);
  };

  // Apply using new system without hooks
  return transformXNodeWithHooks(node, composedTransform, undefined, config);
}