/**
 * AttributeTransform - Transforms XML attributes
 */
import { 
    Transform, 
    TransformContext, 
    TransformResult, 
    TransformTarget, 
    transformResult 
  } from '../../core/types/transform-interfaces';
  
  /**
   * Options for attribute transformer
   */
  export interface AttributeTransformOptions {
    /**
     * Map of attribute names to rename
     * Original name -> new name
     */
    renameMap?: Record<string, string>;
    
    /**
     * Set of attribute names to remove
     */
    removeAttributes?: string[];
    
    /**
     * Regular expression pattern to match attributes to remove
     */
    removePattern?: RegExp;
  }
  
  /**
   * AttributeTransform - Transforms XML attributes
   * 
   * Example usage:
   * ```
   * XJX.fromXml(xml)
   *    .withTransforms(new AttributeTransform({
   *      renameMap: { 'old-attr': 'newAttr' },
   *      removeAttributes: ['internal-id', 'temp-data']
   *    }))
   *    .toXml();
   * ```
   */
  export class AttributeTransform implements Transform {
    // Target attributes
    targets = [TransformTarget.Attribute];
    
    private renameMap: Record<string, string>;
    private removeAttributes: Set<string>;
    private removePattern?: RegExp;
    
    /**
     * Create a new attribute transformer
     */
    constructor(options: AttributeTransformOptions = {}) {
      this.renameMap = options.renameMap || {};
      this.removeAttributes = new Set(options.removeAttributes || []);
      this.removePattern = options.removePattern;
    }
    
    /**
     * Transform by renaming or removing attributes
     * 
     * No need to check context type - the pipeline handles that
     */
    transform(value: any, context: TransformContext): TransformResult<any> {
      // Ensure we have an attribute name from context
      if (!context.attributeName) {
        return transformResult(value);
      }
      
      const attributeName = context.attributeName;
      
      // Check if attribute should be removed by name
      if (this.removeAttributes.has(attributeName)) {
        return transformResult(null, true);
      }
      
      // Check if attribute should be removed by pattern
      if (this.removePattern && this.removePattern.test(attributeName)) {
        return transformResult(null, true);
      }
      
      // Check if attribute should be renamed
      const newName = this.renameMap[attributeName];
      if (newName) {
        // For attribute transformers, we need to handle [name, value] tuples
        if (Array.isArray(value) && value.length === 2) {
          return transformResult([newName, value[1]]);
        }
        
        // If we're just processing the attribute name itself
        return transformResult([newName, value]);
      }
      
      // No changes needed
      return transformResult(value);
    }
  }