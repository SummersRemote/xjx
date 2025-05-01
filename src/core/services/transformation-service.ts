/**
 * TransformationService - Handles the transformation pipeline
 * 
 * This class implements the transformation pipeline logic,
 * separating it from the main XJX class.
 */
import { Configuration } from "../types/config-types";
import {
  XNode,
  TransformContext,
  TransformDirection
} from "../types/transform-types";
import { TransformUtil } from "../utils/transform-utils";
import { TransformerManager } from "./transformer-manager";

/**
 * Service for applying transformations to nodes
 */
export class TransformationService {
  private transformUtil: TransformUtil;
  
  /**
   * Constructor
   * @param config Configuration
   * @param transformerManager Transformer manager instance
   */
  constructor(
    private config: Configuration,
    private transformerManager: TransformerManager
  ) {
    this.transformUtil = new TransformUtil(this.config);
  }
  
  /**
   * Apply transformations to an XNode
   * @param node XNode to transform
   * @param context Transformation context
   * @returns Transformed XNode or null if removed
   */
  public applyTransformations(node: XNode, context: TransformContext): XNode | null {
    // 1. Apply node transformers to the node itself
    const transformedNode = this.transformerManager.applyNodeTransformers(node, context);
    if (transformedNode === null) {
      return null;
    }
    
    // 2. Apply value transformers to node's value
    this.transformNodeValue(transformedNode, context);
    
    // 3. Apply attribute transformers to node's attributes
    this.transformNodeAttributes(transformedNode, context);
    
    // 4. Apply children transformers to node's children
    this.transformNodeChildren(transformedNode, context);
    
    return transformedNode;
  }
  
  /**
   * Transform node value
   * @param node Node to modify
   * @param context Transformation context
   */
  private transformNodeValue(node: XNode, context: TransformContext): void {
    if (node.value === undefined) return;
    
    const transformedValue = this.transformerManager.applyValueTransformers(
      node.value,
      node,
      context
    );
    
    if (transformedValue === null) {
      // Value was removed, remove the value property
      delete node.value;
    } else {
      // Update value
      node.value = transformedValue;
    }
  }
  
  /**
   * Transform node attributes
   * @param node Node to modify
   * @param context Transformation context
   */
  private transformNodeAttributes(node: XNode, context: TransformContext): void {
    if (!node.attributes) return;
    
    const newAttributes: Record<string, any> = {};
    
    for (const [name, value] of Object.entries(node.attributes)) {
      // Create attribute-specific context
      const attrContext: TransformContext =
        this.transformUtil.createAttributeContext(context, name);
      
      // Apply value transformers to attribute value
      let attrValue = this.transformerManager.applyValueTransformers(value, node, attrContext);
      if (attrValue === null) continue; // Skip this attribute if value becomes null
      
      // Apply attribute transformers
      const result = this.transformerManager.applyAttributeTransformers(
        name,
        attrValue,
        node,
        attrContext
      );
      
      // Add transformed attribute if not null
      if (result !== null) {
        const [newName, newValue] = result;
        newAttributes[newName] = newValue;
      }
    }
    
    node.attributes = newAttributes;
  }
  
  /**
   * Transform node children
   * @param node Node to modify
   * @param context Transformation context
   */
  private transformNodeChildren(node: XNode, context: TransformContext): void {
    if (!node.children) return;
    
    const transformedChildren = this.transformerManager.applyChildrenTransformers(
      node.children,
      node,
      context
    );
    
    if (transformedChildren === null) {
      node.children = [];
      return;
    }
    
    node.children = transformedChildren;
    
    // Recursively apply transformations to each child
    if (node.children && node.children.length > 0) {
      const newChildren: XNode[] = [];
      
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        const childContext = this.transformUtil.createChildContext(context, child, i);
        
        const transformedChild = this.applyTransformations(child, childContext);
        if (transformedChild !== null) {
          newChildren.push(transformedChild);
        }
      }
      
      node.children = newChildren;
    }
  }
  
  /**
   * Create a root context for transformation
   * @param direction Direction of transformation
   * @param rootName Root node name
   * @returns Root transformation context
   */
  public createRootContext(direction: TransformDirection, rootName: string): TransformContext {
    return this.transformUtil.createRootContext(direction, rootName);
  }
}