/**
 * CommentTransform - Handles XML comments
 */
import { 
    Transform, 
    TransformContext, 
    TransformResult, 
    TransformTarget, 
    createTransformResult 
  } from '../../core/types/transform-interfaces';
  
  /**
   * Options for comment transformer
   */
  export interface CommentTransformOptions {
    /**
     * Whether to remove all comments (default: false)
     */
    removeAll?: boolean;
    
    /**
     * Regular expression to match comments to remove
     * If not provided but removeAll is true, all comments will be removed
     */
    removePattern?: RegExp;
    
    /**
     * Regular expression to match comments to keep
     * If provided, comments matching this pattern will be kept even if removeAll is true
     */
    keepPattern?: RegExp;
  }
  
  /**
   * CommentTransform - Handles XML comments
   * 
   * Example usage:
   * ```
   * // Remove all comments
   * XJX.fromXml(xml)
   *    .withTransforms(new CommentTransform({ removeAll: true }))
   *    .toXml();
   * 
   * // Remove only comments containing "REMOVE"
   * XJX.fromXml(xml)
   *    .withTransforms(new CommentTransform({
   *      removePattern: /REMOVE/i
   *    }))
   *    .toXml();
   * ```
   */
  export class CommentTransform implements Transform {
    // Only target comments
    targets = [TransformTarget.Comment];
    
    private removeAll: boolean;
    private removePattern?: RegExp;
    private keepPattern?: RegExp;
    
    /**
     * Create a new comment transformer
     */
    constructor(options: CommentTransformOptions = {}) {
      this.removeAll = options.removeAll || false;
      this.removePattern = options.removePattern;
      this.keepPattern = options.keepPattern;
    }
    
    /**
     * Transform by removing or keeping comments based on options
     * 
     * No need to check context type - the pipeline handles that
     */
    transform(value: any, context: TransformContext): TransformResult<any> {
      // Get comment content
      const commentValue = typeof value === 'object' && value.value 
        ? value.value 
        : String(value);
      
      // Check if comment should be kept based on keepPattern
      if (this.keepPattern && this.keepPattern.test(commentValue)) {
        return createTransformResult(value);
      }
      
      // Check if comment should be removed based on removeAll or removePattern
      if (this.removeAll || (this.removePattern && this.removePattern.test(commentValue))) {
        return createTransformResult(null, true);
      }
      
      // Default case: keep the comment
      return createTransformResult(value);
    }
  }