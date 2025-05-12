/**
 * XNode transformer implementation
 *
 * Applies transformations to XNode using the new static utilities.
 */
import { XNodeTransformer } from "./converter-interfaces";
import {
  Configuration,
  Transform,
  XNode,
  TransformContext,
  TransformResult,
  TransformTarget,
  TransformDirection,
  FormatId,
  FORMATS,
  createTransformResult,
} from "../core/types/transform-interfaces";
import { NodeType } from "../core/types/dom-types";
import { ErrorUtils } from "../core/utils/error-utils";
import { CommonUtils } from "../core/utils/common-utils";

/**
 * Applies transformations to XNode
 */
export class DefaultXNodeTransformer implements XNodeTransformer {
  private config: Configuration;

  /**
   * Create a new XNode transformer
   * @param config Configuration
   */
  constructor(config: Configuration) {
    this.config = config;
  }

  /**
   * Apply transformations to XNode
   * @param node XNode to transform
   * @param transforms Transformations to apply
   * @param targetFormat Target format identifier
   * @returns Transformed XNode
   */
  public transform(
    node: XNode,
    transforms: Transform[],
    targetFormat: FormatId
  ): XNode {
    return ErrorUtils.try(
      () => {
        if (!transforms || transforms.length === 0) {
          return node; // No transformations to apply
        }

        // Determine direction from the target format (for backward compatibility)
        const direction =
          targetFormat === FORMATS.JSON
            ? TransformDirection.XML_TO_JSON
            : TransformDirection.JSON_TO_XML;

        // Create root context
        const context = this.createRootContext(node, targetFormat, direction);

        // Apply transformations
        const transformedNode = this.applyTransforms(node, context, transforms);

        if (!transformedNode) {
          throw new Error("Root node was removed during transformation");
        }

        return transformedNode;
      },
      "Transformation failed",
      "general"
    );
  }

  /**
   * Create root transformation context
   * @param node Root node
   * @param targetFormat Target format
   * @param direction Transformation direction (for backward compatibility)
   * @returns Transformation context
   */
  public createRootContext(
    node: XNode,
    targetFormat: FormatId,
    direction: TransformDirection
  ): TransformContext {
    return {
      nodeName: node.name,
      nodeType: node.type,
      path: node.name,
      namespace: node.namespace,
      prefix: node.prefix,
      config: this.config,
      targetFormat,
      direction,
    };
  }

  /**
   * Apply transforms to an XNode
   * @param node XNode to transform
   * @param context Transformation context
   * @param transforms Transforms to apply
   * @returns Transformed XNode or null if removed
   * @private
   */
  private applyTransforms(
    node: XNode,
    context: TransformContext,
    transforms: Transform[]
  ): XNode | null {
    // 1. Apply element transforms first
    const elementResult = this.applyElementTransforms(
      node,
      context,
      transforms
    );

    if (elementResult.remove) {
      return null;
    }

    const transformedNode = elementResult.value as XNode;

    // 2. Transform node value if present
    if (transformedNode.value !== undefined) {
      const textContext: TransformContext = {
        ...context,
        isText: true,
      };

      const valueResult = this.applyValueTransforms(
        transformedNode.value,
        textContext,
        transforms
      );

      if (valueResult.remove) {
        delete transformedNode.value;
      } else {
        transformedNode.value = valueResult.value;
      }
    }

    // 3. Transform attributes
    this.transformAttributes(transformedNode, context, transforms);

    // 4. Transform children
    this.transformChildren(transformedNode, context, transforms);

    return transformedNode;
  }

  /**
   * Apply transforms to element node
   * @param node Node to transform
   * @param context Transformation context
   * @param transforms Transforms to apply
   * @returns Transform result
   * @private
   */
  private applyElementTransforms(
    node: XNode,
    context: TransformContext,
    transforms: Transform[]
  ): TransformResult<XNode> {
    // Filter transforms that target elements
    const applicableTransforms = transforms.filter((transform) =>
      transform.targets.includes(TransformTarget.Element)
    );

    // If no applicable transforms, return original value
    if (applicableTransforms.length === 0) {
      return createTransformResult(node);
    }

    // Apply each applicable transform in sequence
    let result: TransformResult<XNode> = createTransformResult(node);

    for (const transform of applicableTransforms) {
      result = transform.transform(result.value, context);

      // If a transform says to remove, we're done
      if (result.remove) {
        return result;
      }
    }

    return result;
  }

  /**
   * Apply transforms to value
   * @param value Value to transform
   * @param context Transformation context
   * @param transforms Transforms to apply
   * @returns Transform result
   * @private
   */
  private applyValueTransforms(
    value: any,
    context: TransformContext,
    transforms: Transform[]
  ): TransformResult<any> {
    // Filter transforms that target values
    const applicableTransforms = transforms.filter((transform) =>
      transform.targets.includes(TransformTarget.Value)
    );

    // If no applicable transforms, return original value
    if (applicableTransforms.length === 0) {
      return createTransformResult(value);
    }

    // Apply each applicable transform in sequence
    let result: TransformResult<any> = createTransformResult(value);

    for (const transform of applicableTransforms) {
      result = transform.transform(result.value, context);

      // If a transform says to remove, we're done
      if (result.remove) {
        return result;
      }
    }

    return result;
  }

  /**
   * Transform node attributes
   * @param node Node to transform
   * @param context Parent context
   * @param transforms Transforms to apply
   * @private
   */
  private transformAttributes(
    node: XNode,
    context: TransformContext,
    transforms: Transform[]
  ): void {
    if (!node.attributes) return;

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

      // Apply attribute transforms
      const result = this.applyAttributeTransforms(
        name,
        value,
        attrContext,
        transforms
      );

      // Add transformed attribute if not removed
      if (!result.remove) {
        const [newName, newValue] = result.value;
        newAttributes[newName] = newValue;
      }
    }

    node.attributes = newAttributes;
  }

  /**
   * Apply transforms to an attribute
   * @param name Attribute name
   * @param value Attribute value
   * @param context Transformation context
   * @param transforms Transforms to apply
   * @returns Transform result
   * @private
   */
  private applyAttributeTransforms(
    name: string,
    value: any,
    context: TransformContext,
    transforms: Transform[]
  ): TransformResult<[string, any]> {
    // First transform the value
    const valueResult = this.applyValueTransforms(value, context, transforms);

    if (valueResult.remove) {
      return createTransformResult([name, null], true);
    }

    // Then apply attribute transformers
    const attributeTransformers = transforms.filter((transform) =>
      transform.targets.includes(TransformTarget.Attribute)
    );

    if (attributeTransformers.length === 0) {
      return createTransformResult([name, valueResult.value]);
    }

    // Create tuple for attribute transformers
    let result: [string, any] = [name, valueResult.value];

    // Apply each attribute transformer
    for (const transform of attributeTransformers) {
      const transformResult = transform.transform(result, context);

      // Ensure remove has a value
      const removeValue =
        transformResult.remove === undefined ? false : transformResult.remove;

      if (removeValue) {
        return createTransformResult(
          transformResult.value as [string, any],
          true
        );
      }

      result = transformResult.value as [string, any];
    }

    return createTransformResult(result);
  }

  /**
   * Transform child nodes
   * @param node Node to transform
   * @param context Parent context
   * @param transforms Transforms to apply
   * @private
   */
  private transformChildren(
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
        direction: context.direction,
        targetFormat: context.targetFormat, // Add the targetFormat property
        parent: context,
        isText: child.type === NodeType.TEXT_NODE,
        isCDATA: child.type === NodeType.CDATA_SECTION_NODE,
        isComment: child.type === NodeType.COMMENT_NODE,
        isProcessingInstruction:
          child.type === NodeType.PROCESSING_INSTRUCTION_NODE,
      };

      // Apply transforms based on node type
      let transformedChild: XNode | null = null;

      switch (child.type) {
        case NodeType.TEXT_NODE:
          transformedChild = this.transformTextNode(
            child,
            childContext,
            transforms
          );
          break;

        case NodeType.CDATA_SECTION_NODE:
          transformedChild = this.transformCDATANode(
            child,
            childContext,
            transforms
          );
          break;

        case NodeType.COMMENT_NODE:
          transformedChild = this.transformCommentNode(
            child,
            childContext,
            transforms
          );
          break;

        case NodeType.PROCESSING_INSTRUCTION_NODE:
          transformedChild = this.transformProcessingInstructionNode(
            child,
            childContext,
            transforms
          );
          break;

        case NodeType.ELEMENT_NODE:
          transformedChild = this.applyTransforms(
            child,
            childContext,
            transforms
          );
          break;
      }

      if (transformedChild) {
        newChildren.push(transformedChild);
      }
    }

    node.children = newChildren;
  }

  /**
   * Transform a text node
   * @param node Text node
   * @param context Transformation context
   * @param transforms Transforms to apply
   * @returns Transformed node or null if removed
   * @private
   */
  private transformTextNode(
    node: XNode,
    context: TransformContext,
    transforms: Transform[]
  ): XNode | null {
    // Apply text node transforms
    const textTransforms = transforms.filter((transform) =>
      transform.targets.includes(TransformTarget.Text)
    );

    let transformedNode = CommonUtils.deepClone(node);
    let shouldRemove = false;

    if (textTransforms.length > 0) {
      let result: TransformResult<XNode> =
        createTransformResult(transformedNode);

      for (const transform of textTransforms) {
        result = transform.transform(result.value, context);

        if (result.remove) {
          shouldRemove = true;
          break;
        }

        transformedNode = result.value as XNode;
      }
    }

    if (shouldRemove) {
      return null;
    }

    // Also transform the value
    const valueResult = this.applyValueTransforms(
      transformedNode.value,
      context,
      transforms
    );

    if (valueResult.remove) {
      return null;
    }

    transformedNode.value = valueResult.value;
    return transformedNode;
  }

  /**
   * Transform a CDATA node
   * @param node CDATA node
   * @param context Transformation context
   * @param transforms Transforms to apply
   * @returns Transformed node or null if removed
   * @private
   */
  private transformCDATANode(
    node: XNode,
    context: TransformContext,
    transforms: Transform[]
  ): XNode | null {
    // Apply CDATA transforms
    const cdataTransforms = transforms.filter((transform) =>
      transform.targets.includes(TransformTarget.CDATA)
    );

    let transformedNode = CommonUtils.deepClone(node);
    let shouldRemove = false;

    if (cdataTransforms.length > 0) {
      let result: TransformResult<XNode> =
        createTransformResult(transformedNode);

      for (const transform of cdataTransforms) {
        result = transform.transform(result.value, context);

        if (result.remove) {
          shouldRemove = true;
          break;
        }

        transformedNode = result.value as XNode;
      }
    }

    if (shouldRemove) {
      return null;
    }

    // Also transform the value
    const valueResult = this.applyValueTransforms(
      transformedNode.value,
      context,
      transforms
    );

    if (valueResult.remove) {
      return null;
    }

    transformedNode.value = valueResult.value;
    return transformedNode;
  }

  /**
   * Transform a comment node
   * @param node Comment node
   * @param context Transformation context
   * @param transforms Transforms to apply
   * @returns Transformed node or null if removed
   * @private
   */
  private transformCommentNode(
    node: XNode,
    context: TransformContext,
    transforms: Transform[]
  ): XNode | null {
    // Apply comment transforms
    const commentTransforms = transforms.filter((transform) =>
      transform.targets.includes(TransformTarget.Comment)
    );

    if (commentTransforms.length === 0) {
      return node;
    }

    let result: TransformResult<XNode> = createTransformResult(node);

    for (const transform of commentTransforms) {
      result = transform.transform(result.value, context);

      if (result.remove) {
        return null;
      }
    }

    return result.value as XNode;
  }

  /**
   * Transform a processing instruction node
   * @param node Processing instruction node
   * @param context Transformation context
   * @param transforms Transforms to apply
   * @returns Transformed node or null if removed
   * @private
   */
  private transformProcessingInstructionNode(
    node: XNode,
    context: TransformContext,
    transforms: Transform[]
  ): XNode | null {
    // Apply PI transforms
    const piTransforms = transforms.filter((transform) =>
      transform.targets.includes(TransformTarget.ProcessingInstruction)
    );

    if (piTransforms.length === 0) {
      return node;
    }

    let result: TransformResult<XNode> = createTransformResult(node);

    for (const transform of piTransforms) {
      result = transform.transform(result.value, context);

      if (result.remove) {
        return null;
      }
    }

    return result.value as XNode;
  }
}
