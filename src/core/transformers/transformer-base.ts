/**
 * Simplified base transformer implementations
 * Path matching feature has been removed for simplicity
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
 * Simplified transformer options
 * No longer includes path matching functionality
 */
export interface TransformerOptions {
  // Add any common transformer options here (none by default after removing paths)
}

/**
 * Base class for value transformers
 */
export abstract class BaseValueTransformer implements ValueTransformer {
  /**
   * Create a new value transformer
   */
  constructor(options?: TransformerOptions) {
    // No path matcher initialization
  }
  
  /**
   * Transform a value
   * Directly calls transformValue without path matching
   */
  transform(value: any, node: XNode, context: TransformContext): TransformResult<any> {
    // No path matching check - call transformValue directly
    return this.transformValue(value, node, context);
  }
  
  /**
   * Transform a value (to be implemented by subclasses)
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
    // No path matcher initialization
  }
  
  /**
   * Transform an attribute
   * Directly calls transformAttribute without path matching
   */
  transform(name: string, value: any, node: XNode, context: TransformContext): TransformResult<[string, any]> {
    // No path matching check - call transformAttribute directly
    return this.transformAttribute(name, value, node, context);
  }
  
  /**
   * Transform an attribute (to be implemented by subclasses)
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
    // No path matcher initialization
  }
  
  /**
   * Transform children
   * Directly calls transformChildren without path matching
   */
  transform(children: XNode[], node: XNode, context: TransformContext): TransformResult<XNode[]> {
    // No path matching check - call transformChildren directly
    return this.transformChildren(children, node, context);
  }
  
  /**
   * Transform children (to be implemented by subclasses)
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
    // No path matcher initialization
  }
  
  /**
   * Transform a node
   * Directly calls transformNode without path matching
   */
  transform(node: XNode, context: TransformContext): TransformResult<XNode> {
    // No path matching check - call transformNode directly
    return this.transformNode(node, context);
  }
  
  /**
   * Transform a node (to be implemented by subclasses)
   */
  protected abstract transformNode(node: XNode, context: TransformContext): TransformResult<XNode>;
}