/**
 * XNode transformer implementation with format-only approach
 */
import { XNodeTransformer } from "./converter-interfaces";
import { Config, Configuration } from "../core/config";
import { XNode } from "../core/xnode";
import {
  Transform,
  TransformContext,
  TransformResult,
  TransformTarget,
  FormatId,
  createTransformResult,
} from "../core/transform";
import { NodeType } from "../core/dom";
import { logger, validate, TransformError, handleError, ErrorType } from "../core/error";
import { Common } from "../core/common";

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
    // Initialize properties first to satisfy TypeScript
    this.config = config;
    
    try {
      // Then validate and potentially update
      if (!Config.isValid(config)) {
        this.config = Config.createOrUpdate({}, config);
      }
    } catch (err) {
      // If validation/update fails, use default config
      this.config = Config.getDefault();
      handleError(err, "initialize XNode converter", {
        errorType: ErrorType.CONFIGURATION
      });
    }
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
    try {
      // VALIDATION: Check for valid inputs
      validate(node instanceof XNode, "Node must be an XNode instance");
      validate(Array.isArray(transforms), "Transforms must be an array");
      validate(typeof targetFormat === "string", "Target format must be a string");
      
      if (!transforms || transforms.length === 0) {
        logger.debug('No transformations to apply, returning original node');
        return node; // No transformations to apply
      }

      // Create root context
      const context = this.createRootContext(node, targetFormat);
      
      logger.debug('Starting node transformation', { 
        nodeName: node.name, 
        transformCount: transforms.length,
        targetFormat 
      });

      // Apply transformations
      const transformedNode = this.applyTransforms(node, context, transforms);

      if (!transformedNode) {
        throw new TransformError("Root node was removed during transformation", {
          nodeName: node.name,
          transforms: transforms.map(t => t.targets)
        });
      }

      logger.debug('Successfully transformed node', { 
        nodeName: transformedNode.name, 
        hasChildren: !!transformedNode.children && transformedNode.children.length > 0 
      });
      
      return transformedNode;
    } catch (err) {
      return handleError(err, 'transform XNode', {
        data: { 
          nodeName: node?.name,
          transformCount: transforms?.length,
          targetFormat
        },
        errorType: ErrorType.TRANSFORM
      });
    }
  }

  /**
   * Create root transformation context
   * @param node Root node
   * @param targetFormat Target format identifier
   * @returns Transformation context
   */
  public createRootContext(
    node: XNode,
    targetFormat: FormatId
  ): TransformContext {
    try {
      // VALIDATION: Check for valid inputs
      validate(node instanceof XNode, "Node must be an XNode instance");
      validate(typeof targetFormat === "string", "Target format must be a string");
      
      return {
        nodeName: node.name,
        nodeType: node.type,
        path: node.name,
        namespace: node.namespace,
        prefix: node.prefix,
        config: this.config,
        targetFormat,
      };
    } catch (err) {
      return handleError(err, 'create root transform context', {
        data: { 
          nodeName: node?.name,
          targetFormat
        },
        errorType: ErrorType.TRANSFORM
      });
    }
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
    try {
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
    } catch (err) {
      return handleError(err, 'apply transforms to node', {
        data: {
          nodeName: node?.name,
          nodeType: node?.type,
          path: context.path
        },
        errorType: ErrorType.TRANSFORM,
        fallback: node // Return original node as fallback
      });
    }
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
    try {
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
    } catch (err) {
      return handleError(err, 'apply element transforms', {
        data: {
          nodeName: node?.name,
          path: context.path
        },
        fallback: createTransformResult(node) // Return original node as fallback
      });
    }
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
    try {
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
    } catch (err) {
      return handleError(err, 'apply value transforms', {
        data: {
          value,
          path: context.path
        },
        fallback: createTransformResult(value) // Return original value as fallback
      });
    }
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

    try {
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
    } catch (err) {
      handleError(err, 'transform attributes', {
        data: {
          nodeName: node?.name,
          attributeCount: Object.keys(node?.attributes || {}).length
        }
      });
      // Continue execution even if attribute transformation fails
    }
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
    try {
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
    } catch (err) {
      return handleError(err, 'transform attribute', {
        data: {
          name,
          value,
          path: context.path
        },
        fallback: createTransformResult([name, value]) // Return original as fallback
      });
    }
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

    try {
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
          targetFormat: context.targetFormat, // Maintain targetFormat from parent
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
    } catch (err) {
      handleError(err, 'transform children', {
        data: {
          nodeName: node?.name,
          childCount: node?.children?.length
        }
      });
      // Continue execution even if child transformation fails
    }
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
    try {
      // Apply text node transforms
      const textTransforms = transforms.filter((transform) =>
        transform.targets.includes(TransformTarget.Text)
      );

      let transformedNode = Common.deepClone(node);
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
    } catch (err) {
      return handleError(err, 'transform text node', {
        data: {
          value: node?.value,
          path: context.path
        },
        fallback: node // Return original node as fallback
      });
    }
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
    try {
      // Apply CDATA transforms
      const cdataTransforms = transforms.filter((transform) =>
        transform.targets.includes(TransformTarget.CDATA)
      );

      let transformedNode = Common.deepClone(node);
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
    } catch (err) {
      return handleError(err, 'transform CDATA node', {
        data: {
          value: node?.value,
          path: context.path
        },
        fallback: node // Return original node as fallback
      });
    }
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
    try {
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
    } catch (err) {
      return handleError(err, 'transform comment node', {
        data: {
          value: node?.value,
          path: context.path
        },
        fallback: node // Return original node as fallback
      });
    }
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
    try {
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
    } catch (err) {
      return handleError(err, 'transform processing instruction node', {
        data: {
          target: node?.attributes?.target,
          value: node?.value,
          path: context.path
        },
        fallback: node // Return original node as fallback
      });
    }
  }
}