/**
 * FilterTransformer 
 * 
 * Filters attributes or nodes based on custom predicates
 */
import { TransformContext, XNode } from '../types/transform-types';
import { BaseAttributeTransformer, BaseNodeTransformer } from './transformer-base';

/**
 * Options for AttributeFilterTransformer
 */
export interface AttributeFilterOptions {
  /**
   * Predicate function that determines if an attribute should be kept
   * @returns true to keep the attribute, false to remove it
   */
  predicate: (name: string, value: any, node: XNode, context: TransformContext) => boolean;
  
  /**
   * Optional paths to apply the filter to
   */
  paths?: string | string[];
}

/**
 * Transformer that filters attributes based on a predicate
 */
export class AttributeFilterTransformer extends BaseAttributeTransformer {
  /**
   * Predicate function for filtering
   */
  private predicate: (name: string, value: any, node: XNode, context: TransformContext) => boolean;
  
  /**
   * Create a new AttributeFilterTransformer
   * @param options Configuration options
   */
  constructor(options: AttributeFilterOptions) {
    super(options.paths);
    this.predicate = options.predicate;
  }
  
  /**
   * Transform an attribute
   * @param name Attribute name
   * @param value Attribute value
   * @param node Node containing the attribute
   * @param context Transformation context
   * @returns Transformed attribute [name, value] tuple or null to remove
   */
  protected transformAttribute(
    name: string, 
    value: any, 
    node: XNode, 
    context: TransformContext
  ): [string, any] | null {
    // Apply the predicate
    if (this.predicate(name, value, node, context)) {
      // Keep the attribute
      return [name, value];
    } else {
      // Remove the attribute
      return null;
    }
  }
}

/**
 * Options for NodeFilterTransformer
 */
export interface NodeFilterOptions {
  /**
   * Predicate function that determines if a node should be kept
   * @returns true to keep the node, false to remove it
   */
  predicate: (node: XNode, context: TransformContext) => boolean;
  
  /**
   * Optional paths to apply the filter to
   */
  paths?: string | string[];
}

/**
 * Transformer that filters nodes based on a predicate
 */
export class NodeFilterTransformer extends BaseNodeTransformer {
  /**
   * Predicate function for filtering
   */
  private predicate: (node: XNode, context: TransformContext) => boolean;
  
  /**
   * Create a new NodeFilterTransformer
   * @param options Configuration options
   */
  constructor(options: NodeFilterOptions) {
    super(options.paths);
    this.predicate = options.predicate;
  }
  
  /**
   * Transform a node
   * @param node Node to transform
   * @param context Transformation context
   * @returns The node itself or null to remove
   */
  protected transformNode(node: XNode, context: TransformContext): XNode | null {
    // Apply the predicate
    if (this.predicate(node, context)) {
      // Keep the node
      return node;
    } else {
      // Remove the node
      return null;
    }
  }
}

// Export the classes
export { AttributeFilterTransformer, NodeFilterTransformer };