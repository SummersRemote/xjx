/**
 * Base transformer implementations
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
  import { createPathMatcher } from '../utils/path-matcher';
  
  /**
   * Base transformer options
   */
  export interface TransformerOptions {
    /**
     * Paths to apply this transformer to (optional)
     * Uses path matching syntax (e.g., "root.items.*")
     */
    paths?: string | string[];
  }
  
  /**
   * Base class for value transformers
   */
  export abstract class BaseValueTransformer implements ValueTransformer {
    private pathMatcher?: (path: string) => boolean;
    
    /**
     * Create a new value transformer
     */
    constructor(options?: TransformerOptions) {
      if (options?.paths) {
        this.pathMatcher = createPathMatcher(options.paths);
      }
    }
    
    /**
     * Transform a value
     */
    transform(value: any, node: XNode, context: TransformContext): TransformResult<any> {
      // Skip if path doesn't match
      if (this.pathMatcher && !this.pathMatcher(context.path)) {
        return transformResult(value);
      }
      
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
    private pathMatcher?: (path: string) => boolean;
    
    /**
     * Create a new attribute transformer
     */
    constructor(options?: TransformerOptions) {
      if (options?.paths) {
        this.pathMatcher = createPathMatcher(options.paths);
      }
    }
    
    /**
     * Transform an attribute
     */
    transform(name: string, value: any, node: XNode, context: TransformContext): TransformResult<[string, any]> {
      // Skip if path doesn't match
      if (this.pathMatcher && !this.pathMatcher(context.path)) {
        return transformResult([name, value]);
      }
      
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
    private pathMatcher?: (path: string) => boolean;
    
    /**
     * Create a new children transformer
     */
    constructor(options?: TransformerOptions) {
      if (options?.paths) {
        this.pathMatcher = createPathMatcher(options.paths);
      }
    }
    
    /**
     * Transform children
     */
    transform(children: XNode[], node: XNode, context: TransformContext): TransformResult<XNode[]> {
      // Skip if path doesn't match
      if (this.pathMatcher && !this.pathMatcher(context.path)) {
        return transformResult(children);
      }
      
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
    private pathMatcher?: (path: string) => boolean;
    
    /**
     * Create a new node transformer
     */
    constructor(options?: TransformerOptions) {
      if (options?.paths) {
        this.pathMatcher = createPathMatcher(options.paths);
      }
    }
    
    /**
     * Transform a node
     */
    transform(node: XNode, context: TransformContext): TransformResult<XNode> {
      // Skip if path doesn't match
      if (this.pathMatcher && !this.pathMatcher(context.path)) {
        return transformResult(node);
      }
      
      return this.transformNode(node, context);
    }
    
    /**
     * Transform a node (to be implemented by subclasses)
     */
    protected abstract transformNode(node: XNode, context: TransformContext): TransformResult<XNode>;
  }