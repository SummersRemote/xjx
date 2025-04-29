/**
 * Base classes for transformers
 *
 * These base classes provide common functionality for all transformers
 * and ensure consistent behavior across the library.
 */
import {
  ValueTransformer,
  AttributeTransformer,
  ChildrenTransformer,
  NodeTransformer,
  XNode,
  TransformContext,
} from "../types/transform-types";
import { TransformUtil } from "../utils/transform-utils";

/**
 * Base class for all transformers that provides path matching functionality
 */
export abstract class BaseTransformer {
  /**
   * Paths this transformer should apply to
   */
  protected paths?: string | string[];

  /**
   * Path matcher function (created lazily)
   */
  private pathMatcher?: (path: string) => boolean;

  /**
   * Check if a path matches the transformer's paths
   * @param path Path to check
   * @param context Context containing the configuration
   * @returns Whether the path matches
   */
  protected matchesPath(path: string, context: TransformContext): boolean {
    // If no paths specified, match everything
    if (!this.paths) {
      return true;
    }

    // Create path matcher if needed
    if (!this.pathMatcher) {
      const transformUtil = new TransformUtil(context.config);
      this.pathMatcher = transformUtil.createPathMatcher(this.paths);
    }

    // Check if path matches
    return this.pathMatcher(path);
  }
}

/**
 * Base class for value transformers
 */
export abstract class BaseValueTransformer
  extends BaseTransformer
  implements ValueTransformer
{
  /**
   * Create a new value transformer
   * @param paths Optional paths to restrict this transformer to
   */
  constructor(paths?: string | string[]) {
    super();
    this.paths = paths;
  }

  /**
   * Transform a value
   * @param value Value to transform
   * @param node Node containing the value
   * @param context Transformation context
   * @returns Transformed value
   */
  transform(value: any, node: XNode, context: TransformContext): any {
    // Skip if path doesn't match
    if (!this.matchesPath(context.path, context)) {
      return value;
    }

    // Perform transformation
    return this.transformValue(value, node, context);
  }

  /**
   * Transform a value (to be implemented by subclasses)
   * @param value Value to transform
   * @param node Node containing the value
   * @param context Transformation context
   * @returns Transformed value
   */
  protected abstract transformValue(
    value: any,
    node: XNode,
    context: TransformContext
  ): any;
}

/**
 * Base class for attribute transformers
 */
export abstract class BaseAttributeTransformer
  extends BaseTransformer
  implements AttributeTransformer
{
  /**
   * Create a new attribute transformer
   * @param paths Optional paths to restrict this transformer to
   */
  constructor(paths?: string | string[]) {
    super();
    this.paths = paths;
  }

  /**
   * Transform an attribute
   * @param name Attribute name
   * @param value Attribute value
   * @param node Node containing the attribute
   * @param context Transformation context
   * @returns Transformed attribute [name, value] tuple
   */
  transform(
    name: string,
    value: any,
    node: XNode,
    context: TransformContext
  ): [string, any] {
    // Skip if path doesn't match
    if (!this.matchesPath(context.path, context)) {
      return [name, value];
    }

    // Perform transformation
    return this.transformAttribute(name, value, node, context);
  }

  /**
   * Transform an attribute (to be implemented by subclasses)
   * @param name Attribute name
   * @param value Attribute value
   * @param node Node containing the attribute
   * @param context Transformation context
   * @returns Transformed attribute [name, value] tuple
   */
  protected abstract transformAttribute(
    name: string,
    value: any,
    node: XNode,
    context: TransformContext
  ): [string, any];
}

/**
 * Base class for children transformers
 */
export abstract class BaseChildrenTransformer
  extends BaseTransformer
  implements ChildrenTransformer
{
  /**
   * Create a new children transformer
   * @param paths Optional paths to restrict this transformer to
   */
  constructor(paths?: string | string[]) {
    super();
    this.paths = paths;
  }

  /**
   * Transform children
   * @param children Children to transform
   * @param node Parent node
   * @param context Transformation context
   * @returns Transformed children array
   */
  transform(
    children: XNode[],
    node: XNode,
    context: TransformContext
  ): XNode[] {
    // Skip if path doesn't match
    if (!this.matchesPath(context.path, context)) {
      return children;
    }

    // Perform transformation
    return this.transformChildren(children, node, context);
  }

  /**
   * Transform children (to be implemented by subclasses)
   * @param children Children to transform
   * @param node Parent node
   * @param context Transformation context
   * @returns Transformed children array
   */
  protected abstract transformChildren(
    children: XNode[],
    node: XNode,
    context: TransformContext
  ): XNode[];
}

/**
 * Base class for node transformers
 */
export abstract class BaseNodeTransformer
  extends BaseTransformer
  implements NodeTransformer
{
  /**
   * Create a new node transformer
   * @param paths Optional paths to restrict this transformer to
   */
  constructor(paths?: string | string[]) {
    super();
    this.paths = paths;
  }

  /**
   * Transform a node
   * @param node Node to transform
   * @param context Transformation context
   * @returns Transformed node
   */
  transform(node: XNode, context: TransformContext): XNode {
    // Skip if path doesn't match
    if (!this.matchesPath(context.path, context)) {
      return node;
    }

    // Perform transformation
    return this.transformNode(node, context);
  }

  /**
   * Transform a node (to be implemented by subclasses)
   * @param node Node to transform
   * @param context Transformation context
   * @returns Transformed node
   */
  protected abstract transformNode(
    node: XNode,
    context: TransformContext
  ): XNode;
}
