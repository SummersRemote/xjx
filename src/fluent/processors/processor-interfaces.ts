/**
 * Processor interfaces for XJX transformation pipeline
 */
import { 
    Configuration, 
    Transform, 
    XNode, 
    TransformContext, 
    TransformResult, 
    TransformTarget 
  } from '../../core/types/transform-interfaces';
  
  /**
   * Base processor interface
   */
  export interface Processor<TInput, TOutput> {
    /**
     * Process a source with transformations
     * @param source Input data
     * @param transforms Transforms to apply
     * @returns Processed output
     */
    process(source: TInput, transforms: Transform[]): TOutput;
  }
  
  /**
   * XML to JSON processor
   */
  export interface XmlProcessor extends Processor<string, Record<string, any>> {
    /**
     * Convert XML string to internal XNode representation
     * @param source XML string
     * @returns XNode representation
     */
    xmlToXNode(element: Element, parentNode?: XNode): XNode;
    
    /**
     * Convert XNode to JSON object
     * @param node XNode representation
     * @returns JSON object
     */
    xnodeToJson(node: XNode): Record<string, any>;
    
    /**
     * Apply transforms to an XNode
     * @param node XNode to transform
     * @param context Transformation context
     * @param transforms Transforms to apply
     * @returns Transformed XNode or null if removed
     */
    applyTransforms(node: XNode, context: TransformContext, transforms: Transform[]): XNode | null;
  }
  
  /**
   * JSON to XML processor
   */
  export interface JsonProcessor extends Processor<Record<string, any>, string> {
    /**
     * Convert JSON object to internal XNode representation
     * @param source JSON object
     * @returns XNode representation
     */
    jsonToXNode(source: Record<string, any>, parentNode?: XNode): XNode;
    
    /**
     * Convert XNode to XML string
     * @param node XNode representation
     * @returns XML string
     */
    xnodeToXml(node: XNode): string;
    
    /**
     * Apply transforms to an XNode
     * @param node XNode to transform
     * @param context Transformation context
     * @param transforms Transforms to apply
     * @returns Transformed XNode or null if removed
     */
    applyTransforms(node: XNode, context: TransformContext, transforms: Transform[]): XNode | null;
  }
  
  /**
   * Helper class for applying transforms
   */
  export class TransformApplier {
    /**
     * Apply transforms to a value based on target type
     * 
     * This method handles context type checking at the pipeline level,
     * filtering transforms by their declared target types before applying them.
     * This eliminates the need for individual transforms to check context types.
     * 
     * @param value Value to transform
     * @param context Transformation context
     * @param transforms All available transforms
     * @param target Target type for this transformation
     * @returns Transform result
     */
    static applyTransforms(
      value: any,
      context: TransformContext,
      transforms: Transform[],
      target: TransformTarget
    ): TransformResult<any> {
      // Filter transforms that target this specific type
      const applicableTransforms = transforms.filter(transform => 
        transform.targets.includes(target)
      );
      
      // If no applicable transforms, return original value
      if (applicableTransforms.length === 0) {
        return { value, remove: false };
      }
      
      // Apply each applicable transform in sequence
      let result = { value, remove: false };
      
      for (const transform of applicableTransforms) {
        // Apply the transform without context type checking (already filtered)
        const transformResult = transform.transform(result.value, context);
        
        // Ensure remove has a value
        const removeValue = transformResult.remove === undefined ? false : transformResult.remove;
        
        // If a transform says to remove, we're done
        if (removeValue) {
          return { value: transformResult.value, remove: true };
        }
        
        // Update value for next transform
        result = { value: transformResult.value, remove: false };
      }
      
      return result;
    }
    
    /**
     * Apply transforms to an attribute
     * 
     * Special case handling for attributes which need to handle [name, value] tuples
     * 
     * @param name Attribute name
     * @param value Attribute value
     * @param context Transformation context
     * @param transforms All available transforms
     * @returns Transform result for [name, value] tuple
     */
    static applyAttributeTransforms(
      name: string,
      value: any,
      context: TransformContext,
      transforms: Transform[]
    ): TransformResult<[string, any]> {
      // First transform the value (respecting value transformers)
      const valueResult = TransformApplier.applyTransforms(
        value,
        context,
        transforms,
        TransformTarget.Value
      );
      
      if (valueResult.remove) {
        return { value: [name, null], remove: true };
      }
      
      // Then apply attribute transformers to the [name, value] tuple
      // Filter only attribute transformers
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
     * Get the appropriate transform target type based on node and context
     * @param node XNode
     * @param context TransformContext
     * @returns Target type
     */
    static getTargetType(node: XNode, context: TransformContext): TransformTarget {
      // If context has specific type flags, use them
      if (context.isAttribute) return TransformTarget.Attribute;
      if (context.isText) return TransformTarget.Text;
      if (context.isCDATA) return TransformTarget.CDATA;
      if (context.isComment) return TransformTarget.Comment;
      if (context.isProcessingInstruction) return TransformTarget.ProcessingInstruction;
      
      // Otherwise determine based on node type
      switch (node.type) {
        case 1: // Element node
          return TransformTarget.Element;
        case 2: // Attribute node
          return TransformTarget.Attribute;
        case 3: // Text node
          return TransformTarget.Text;
        case 4: // CDATA node
          return TransformTarget.CDATA;
        case 8: // Comment node
          return TransformTarget.Comment;
        case 7: // Processing Instruction node
          return TransformTarget.ProcessingInstruction;
        default:
          // Unknown node type, default to Value for primitive values
          return TransformTarget.Value;
      }
    }
  }