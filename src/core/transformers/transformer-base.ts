/**
 * Base transformer implementations with path matching removed
 */
import {
  ValueTransformer,
  AttributeTransformer,
  NodeTransformer,
  ChildrenTransformer,
  XNode,
  TransformContext,
  TransformResult,
  transformResult
} from '../types/transform-types';

/**
 * Basic transformer options
 */
export interface TransformerOptions {
  // Can add common transformer options here if needed
}

/**
 * Base class for value transformers
 */
export abstract class BaseValueTransformer implements ValueTransformer {
  /**
   * Create a new value transformer
   */
  constructor(options?: TransformerOptions) {
    // No initialization needed - path matching removed
  }
  
  /**
   * Transform a value
   * @param value The value to transform
   * @param node The node containing the value
   * @param context The transformation context
   * @returns Transform result with the transformed value
   */
  transform(value: any, node: XNode, context: TransformContext): TransformResult<any> {
    // Directly call transformValue without path matching
    return this.transformValue(value, node, context);
  }
  
  /**
   * Transform a value (to be implemented by subclasses)
   * @param value The value to transform
   * @param node The node containing the value
   * @param context The transformation context
   * @returns Transform result with the transformed value
   */
  protected abstract transformValue(value: any, node: XNode, context: TransformContext): TransformResult<any>;
}

/**
 * Base class for attribute transformers
 */
export abstract class BaseAttributeTransformer implements AttributeTransformer {
  /**
   * Create a new attribute transformer
   */
  constructor(options?: TransformerOptions) {
    // No initialization needed - path matching removed
  }
  
  /**
   * Transform an attribute
   * @param name The attribute name
   * @param value The attribute value
   * @param node The node containing the attribute
   * @param context The transformation context
   * @returns Transform result with the transformed name and value tuple
   */
  transform(name: string, value: any, node: XNode, context: TransformContext): TransformResult<[string, any]> {
    // Directly call transformAttribute without path matching
    return this.transformAttribute(name, value, node, context);
  }
  
  /**
   * Transform an attribute (to be implemented by subclasses)
   * @param name The attribute name
   * @param value The attribute value
   * @param node The node containing the attribute
   * @param context The transformation context
   * @returns Transform result with the transformed name and value tuple
   */
  protected abstract transformAttribute(name: string, value: any, node: XNode, context: TransformContext): TransformResult<[string, any]>;
}

/**
 * Base class for children transformers
 */
export abstract class BaseChildrenTransformer implements ChildrenTransformer {
  /**
   * Create a new children transformer
   */
  constructor(options?: TransformerOptions) {
    // No initialization needed - path matching removed
  }
  
  /**
   * Transform children
   * @param children The children array
   * @param node The parent node
   * @param context The transformation context
   * @returns Transform result with the transformed children array
   */
  transform(children: XNode[], node: XNode, context: TransformContext): TransformResult<XNode[]> {
    // Directly call transformChildren without path matching
    return this.transformChildren(children, node, context);
  }
  
  /**
   * Transform children (to be implemented by subclasses)
   * @param children The children array
   * @param node The parent node
   * @param context The transformation context
   * @returns Transform result with the transformed children array
   */
  protected abstract transformChildren(children: XNode[], node: XNode, context: TransformContext): TransformResult<XNode[]>;
}

/**
 * Base class for node transformers
 */
export abstract class BaseNodeTransformer implements NodeTransformer {
  /**
   * Create a new node transformer
   */
  constructor(options?: TransformerOptions) {
    // No initialization needed - path matching removed
  }
  
  /**
   * Transform a node
   * @param node The node to transform
   * @param context The transformation context
   * @returns Transform result with the transformed node
   */
  transform(node: XNode, context: TransformContext): TransformResult<XNode> {
    // Directly call transformNode without path matching
    return this.transformNode(node, context);
  }
  
  /**
   * Transform a node (to be implemented by subclasses)
   * @param node The node to transform
   * @param context The transformation context
   * @returns Transform result with the transformed node
   */
  protected abstract transformNode(node: XNode, context: TransformContext): TransformResult<XNode>;
}