/**
 * TransformerManager - Handles registration and application of transformers
 * 
 * This class centralizes all transformer-related operations to simplify the main XJX class.
 */
import {
    ValueTransformer,
    AttributeTransformer,
    ChildrenTransformer,
    NodeTransformer,
    XNode,
    TransformContext,
    TransformDirection,
    TransformResult
  } from "../types/transform-types";
  
  /**
   * Manages registration and application of all transformer types
   */
  export class TransformerManager {
    private valueTransformers: Map<TransformDirection, ValueTransformer[]> = new Map([
      [TransformDirection.XML_TO_JSON, []],
      [TransformDirection.JSON_TO_XML, []]
    ]);
  
    private attributeTransformers: Map<TransformDirection, AttributeTransformer[]> = new Map([
      [TransformDirection.XML_TO_JSON, []],
      [TransformDirection.JSON_TO_XML, []]
    ]);
  
    private childrenTransformers: Map<TransformDirection, ChildrenTransformer[]> = new Map([
      [TransformDirection.XML_TO_JSON, []],
      [TransformDirection.JSON_TO_XML, []]
    ]);
  
    private nodeTransformers: Map<TransformDirection, NodeTransformer[]> = new Map([
      [TransformDirection.XML_TO_JSON, []],
      [TransformDirection.JSON_TO_XML, []]
    ]);
  
    /**
     * Register a value transformer
     * @param direction Direction of transformation
     * @param transformer Transformer to register
     * @returns This instance for chaining
     */
    public addValueTransformer(
      direction: TransformDirection,
      transformer: ValueTransformer
    ): this {
      const transformers = this.valueTransformers.get(direction);
      if (transformers) {
        transformers.push(transformer);
      }
      return this;
    }
  
    /**
     * Register an attribute transformer
     * @param direction Direction of transformation
     * @param transformer Transformer to register
     * @returns This instance for chaining
     */
    public addAttributeTransformer(
      direction: TransformDirection,
      transformer: AttributeTransformer
    ): this {
      const transformers = this.attributeTransformers.get(direction);
      if (transformers) {
        transformers.push(transformer);
      }
      return this;
    }
  
    /**
     * Register a children transformer
     * @param direction Direction of transformation
     * @param transformer Transformer to register
     * @returns This instance for chaining
     */
    public addChildrenTransformer(
      direction: TransformDirection,
      transformer: ChildrenTransformer
    ): this {
      const transformers = this.childrenTransformers.get(direction);
      if (transformers) {
        transformers.push(transformer);
      }
      return this;
    }
  
    /**
     * Register a node transformer
     * @param direction Direction of transformation
     * @param transformer Transformer to register
     * @returns This instance for chaining
     */
    public addNodeTransformer(
      direction: TransformDirection,
      transformer: NodeTransformer
    ): this {
      const transformers = this.nodeTransformers.get(direction);
      if (transformers) {
        transformers.push(transformer);
      }
      return this;
    }
  
    /**
     * Clear transformers for a specific direction or all directions
     * @param direction Optional direction to clear, or all if not specified
     * @returns This instance for chaining
     */
    public clearTransformers(direction?: TransformDirection): this {
      if (direction) {
        // Clear transformers for specific direction
        this.valueTransformers.set(direction, []);
        this.attributeTransformers.set(direction, []);
        this.childrenTransformers.set(direction, []);
        this.nodeTransformers.set(direction, []);
      } else {
        // Clear all transformers
        this.valueTransformers.set(TransformDirection.XML_TO_JSON, []);
        this.valueTransformers.set(TransformDirection.JSON_TO_XML, []);
        this.attributeTransformers.set(TransformDirection.XML_TO_JSON, []);
        this.attributeTransformers.set(TransformDirection.JSON_TO_XML, []);
        this.childrenTransformers.set(TransformDirection.XML_TO_JSON, []);
        this.childrenTransformers.set(TransformDirection.JSON_TO_XML, []);
        this.nodeTransformers.set(TransformDirection.XML_TO_JSON, []);
        this.nodeTransformers.set(TransformDirection.JSON_TO_XML, []);
      }
      return this;
    }
  
    /**
     * Apply value transformers to a value
     * @param value Value to transform
     * @param node Node containing the value
     * @param context Transformation context
     * @returns Transformed value or null if removed
     */
    public applyValueTransformers(
      value: any,
      node: XNode,
      context: TransformContext
    ): any {
      let transformedValue = value;
  
      // Get transformers for the current direction
      const transformers = this.valueTransformers.get(context.direction) || [];
  
      for (const transformer of transformers) {
        const result = transformer.transform(transformedValue, node, context);
        
        // Check if the value should be removed
        if (result.remove) {
          return null;
        }
        
        transformedValue = result.value;
      }
  
      return transformedValue;
    }
  
    /**
     * Apply attribute transformers
     * @param name Attribute name
     * @param value Attribute value
     * @param node Node containing the attribute
     * @param context Transformation context
     * @returns Transformed [name, value] tuple or null if removed
     */
    public applyAttributeTransformers(
      name: string,
      value: any,
      node: XNode,
      context: TransformContext
    ): [string, any] | null {
      let currentName = name;
      let currentValue = value;
  
      // Get transformers for the current direction
      const transformers = this.attributeTransformers.get(context.direction) || [];
  
      for (const transformer of transformers) {
        const result = transformer.transform(currentName, currentValue, node, context);
        
        // Check if the attribute should be removed
        if (result.remove) {
          return null;
        }
        
        [currentName, currentValue] = result.value;
      }
  
      return [currentName, currentValue];
    }
  
    /**
     * Apply node transformers
     * @param node Node to transform
     * @param context Transformation context
     * @returns Transformed node or null if removed
     */
    public applyNodeTransformers(node: XNode, context: TransformContext): XNode | null {
      let transformedNode = { ...node };
      
      // Get transformers for the current direction
      const transformers = this.nodeTransformers.get(context.direction) || [];
      
      for (const transformer of transformers) {
        const result = transformer.transform(transformedNode, context);
        
        // Check if the node should be removed
        if (result.remove) {
          return null;
        }
        
        transformedNode = result.value;
      }
      
      return transformedNode;
    }
  
    /**
     * Apply children transformers
     * @param children Children array
     * @param node Parent node
     * @param context Transformation context
     * @returns Transformed children array or null if removed
     */
    public applyChildrenTransformers(
      children: XNode[],
      node: XNode,
      context: TransformContext
    ): XNode[] | null {
      let transformedChildren = [...children];
  
      // Get transformers for the current direction
      const transformers = this.childrenTransformers.get(context.direction) || [];
  
      for (const transformer of transformers) {
        const result = transformer.transform(transformedChildren, node, context);
        
        // Check if the children should be removed
        if (result.remove) {
          return null;
        }
        
        transformedChildren = result.value;
      }
  
      return transformedChildren;
    }
  }