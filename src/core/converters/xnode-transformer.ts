/**
 * XNode transformer implementation
 */
import { XNodeTransformer } from './converter-interfaces';
import {
  Configuration,
  Transform,
  NodeModel,
  TransformContext,
  TransformResult,
  TransformTarget,
  TransformDirection
} from '../types/transform-interfaces';
import { NodeType } from '../types/dom-types';
import { XJXError } from '../types/error-types';

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
   * @param direction Direction of transformation
   * @returns Transformed XNode
   */
  public transform(node: NodeModel, transforms: Transform[], direction: TransformDirection): NodeModel {
    try {
      if (!transforms || transforms.length === 0) {
        return node; // No transformations to apply
      }

      // Create root context
      const context = this.createRootContext(node, direction);

      // Apply transformations
      const transformedNode = this.applyTransforms(node, context, transforms);

      if (!transformedNode) {
        throw new XJXError("Root node was removed during transformation");
      }

      return transformedNode;
    } catch (error) {
      throw new XJXError(
        `Transformation failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Create root transformation context
   * @param node Root node
   * @param direction Direction of transformation
   * @returns Transformation context
   */
  public createRootContext(node: NodeModel, direction: TransformDirection): TransformContext {
    return {
      nodeName: node.name,
      nodeType: node.type,
      path: node.name,
      namespace: node.namespace,
      prefix: node.prefix,
      config: this.config,
      direction
    };
  }

  /**
   * Apply transforms to an XNode
   * @param node XNode to transform
   * @param context Transformation context
   * @param transforms Transforms to apply
   * @returns Transformed XNode or null if removed
   */
  private applyTransforms(
    node: NodeModel,
    context: TransformContext,
    transforms: Transform[]
  ): NodeModel | null {
    // 1. Apply element transforms first
    const elementResult = this.applyElementTransforms(node, context, transforms);
    
    if (elementResult.remove) {
      return null;
    }
    
    const transformedNode = elementResult.value as NodeModel;
    
    // 2. Transform node value if present
    if (transformedNode.value !== undefined) {
      const textContext: TransformContext = {
        ...context,
        isText: true
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
   */
  private applyElementTransforms(
    node: NodeModel,
    context: TransformContext,
    transforms: Transform[]
  ): TransformResult<NodeModel> {
    // Filter transforms that target elements
    const applicableTransforms = transforms.filter(transform => 
      transform.targets.includes(TransformTarget.Element)
    );
    
    // If no applicable transforms, return original value
    if (applicableTransforms.length === 0) {
      return { value: node, remove: false };
    }
    
    // Apply each applicable transform in sequence
    let result: TransformResult<NodeModel> = { value: node, remove: false };
    
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
   */
  private applyValueTransforms(
    value: any,
    context: TransformContext,
    transforms: Transform[]
  ): TransformResult<any> {
    // Filter transforms that target values
    const applicableTransforms = transforms.filter(transform => 
      transform.targets.includes(TransformTarget.Value)
    );
    
    // If no applicable transforms, return original value
    if (applicableTransforms.length === 0) {
      return { value, remove: false };
    }
    
    // Apply each applicable transform in sequence
    let result: TransformResult<any> = { value, remove: false };
    
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
   */
  private transformAttributes(
    node: NodeModel,
    context: TransformContext,
    transforms: Transform[]
  ): void {
    if (!node.attributes) return;
    
    const newAttributes: Record<string, any> = {};
    
    for (const [name, value] of Object.entries(node.attributes)) {
      // Skip xmlns attributes since they're handled separately
      if (name === 'xmlns' || name.startsWith('xmlns:')) continue;
      
      // Create attribute context
      const attrContext: TransformContext = {
        ...context,
        isAttribute: true,
        attributeName: name,
        path: `${context.path}.@${name}`
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
   */
  private applyAttributeTransforms(
    name: string,
    value: any,
    context: TransformContext,
    transforms: Transform[]
  ): TransformResult<[string, any]> {
    // First transform the value
    const valueResult = this.applyValueTransforms(
      value,
      context,
      transforms
    );
    
    if (valueResult.remove) {
      return { value: [name, null], remove: true };
    }
    
    // Then apply attribute transformers
    const attributeTransformers = transforms.filter(transform => 
      transform.targets.includes(TransformTarget.Attribute)
    );
    
    if (attributeTransformers.length === 0) {
      return { value: [name, valueResult.value], remove: false };
    }
    
    // Create tuple for attribute transformers
    let result: [string, any] = [name, valueResult.value];
    
    // Apply each attribute transformer
    for (const transform of attributeTransformers) {
      const transformResult = transform.transform(result, context);
      
      // Ensure remove has a value
      const removeValue = transformResult.remove === undefined ? false : transformResult.remove;
      
      if (removeValue) {
        return { value: transformResult.value as [string, any], remove: true };
      }
      
      result = transformResult.value as [string, any];
    }
    
    return { value: result, remove: false };
  }

  /**
   * Transform child nodes
   * @param node Node to transform
   * @param context Parent context
   * @param transforms Transforms to apply
   */
  private transformChildren(
    node: NodeModel,
    context: TransformContext,
    transforms: Transform[]
  ): void {
    if (!node.children) return;
    
    const newChildren: NodeModel[] = [];
    
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
        parent: context,
        isText: child.type === NodeType.TEXT_NODE,
        isCDATA: child.type === NodeType.CDATA_SECTION_NODE,
        isComment: child.type === NodeType.COMMENT_NODE,
        isProcessingInstruction: child.type === NodeType.PROCESSING_INSTRUCTION_NODE
      };
      
      // Apply transforms based on node type
      let transformedChild: NodeModel | null = null;
      
      switch (child.type) {
        case NodeType.TEXT_NODE:
          transformedChild = this.transformTextNode(child, childContext, transforms);
          break;
          
        case NodeType.CDATA_SECTION_NODE:
          transformedChild = this.transformCDATANode(child, childContext, transforms);
          break;
          
        case NodeType.COMMENT_NODE:
          transformedChild = this.transformCommentNode(child, childContext, transforms);
          break;
          
        case NodeType.PROCESSING_INSTRUCTION_NODE:
          transformedChild = this.transformProcessingInstructionNode(child, childContext, transforms);
          break;
          
        case NodeType.ELEMENT_NODE:
          transformedChild = this.applyTransforms(child, childContext, transforms);
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
   */
  private transformTextNode(
    node: NodeModel,
    context: TransformContext,
    transforms: Transform[]
  ): NodeModel | null {
    // Apply text node transforms
    const textTransforms = transforms.filter(transform => 
      transform.targets.includes(TransformTarget.Text)
    );
    
    let transformedNode = { ...node };
    let shouldRemove = false;
    
    if (textTransforms.length > 0) {
      let result: TransformResult<NodeModel> = { value: transformedNode, remove: false };
      
      for (const transform of textTransforms) {
        result = transform.transform(result.value, context);
        
        if (result.remove) {
          shouldRemove = true;
          break;
        }
        
        transformedNode = result.value as NodeModel;
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
   */
  private transformCDATANode(
    node: NodeModel,
    context: TransformContext,
    transforms: Transform[]
  ): NodeModel | null {
    // Apply CDATA transforms
    const cdataTransforms = transforms.filter(transform => 
      transform.targets.includes(TransformTarget.CDATA)
    );
    
    let transformedNode = { ...node };
    let shouldRemove = false;
    
    if (cdataTransforms.length > 0) {
      let result: TransformResult<NodeModel> = { value: transformedNode, remove: false };
      
      for (const transform of cdataTransforms) {
        result = transform.transform(result.value, context);
        
        if (result.remove) {
          shouldRemove = true;
          break;
        }
        
        transformedNode = result.value as NodeModel;
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
   */
  private transformCommentNode(
    node: NodeModel,
    context: TransformContext,
    transforms: Transform[]
  ): NodeModel | null {
    // Apply comment transforms
    const commentTransforms = transforms.filter(transform => 
      transform.targets.includes(TransformTarget.Comment)
    );
    
    if (commentTransforms.length === 0) {
      return node;
    }
    
    let result: TransformResult<NodeModel> = { value: node, remove: false };
    
    for (const transform of commentTransforms) {
      result = transform.transform(result.value, context);
      
      if (result.remove) {
        return null;
      }
    }
    
    return result.value as NodeModel;
  }

  /**
   * Transform a processing instruction node
   * @param node Processing instruction node
   * @param context Transformation context
   * @param transforms Transforms to apply
   * @returns Transformed node or null if removed
   */
  private transformProcessingInstructionNode(
    node: NodeModel,
    context: TransformContext,
    transforms: Transform[]
  ): NodeModel | null {
    // Apply PI transforms
    const piTransforms = transforms.filter(transform => 
      transform.targets.includes(TransformTarget.ProcessingInstruction)
    );
    
    if (piTransforms.length === 0) {
      return node;
    }
    
    let result: TransformResult<NodeModel> = { value: node, remove: false };
    
    for (const transform of piTransforms) {
      result = transform.transform(result.value, context);
      
      if (result.remove) {
        return null;
      }
    }
    
    return result.value as NodeModel;
  }

  /**
   * Deep clone an object
   * @private
   */
  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }
}