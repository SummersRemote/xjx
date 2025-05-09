/**
 * TextTransform - Transforms text nodes
 */
import { 
    Transform, 
    TransformContext, 
    TransformResult, 
    TransformTarget, 
    createTransformResult 
  } from '../../core/types/transform-interfaces';
  
  /**
   * Options for text transformer
   */
  export interface TextTransformOptions {
    /**
     * Function to transform text content
     */
    transformFn?: (text: string) => string;
    
    /**
     * Whether to trim whitespace (default: false)
     */
    trim?: boolean;
    
    /**
     * Whether to normalize whitespace (default: false)
     * Replaces multiple whitespace characters with a single space
     */
    normalizeWhitespace?: boolean;
    
    /**
     * Whether to ensure consistent newlines (default: false)
     * Converts all newline formats to \n
     */
    normalizeNewlines?: boolean;
  }
  
  /**
   * TextTransform - Transforms text nodes
   * 
   * Example usage:
   * ```
   * // Capitalize all text
   * XJX.fromXml(xml)
   *    .withTransforms(new TextTransform({
   *      transformFn: text => text.toUpperCase(),
   *      trim: true
   *    }))
   *    .toXml();
   * ```
   */
  export class TextTransform implements Transform {
    // Target text nodes specifically
    targets = [TransformTarget.Text];
    
    private transformFn: (text: string) => string;
    private trim: boolean;
    private normalizeWhitespace: boolean;
    private normalizeNewlines: boolean;
    
    /**
     * Create a new text transformer
     */
    constructor(options: TextTransformOptions = {}) {
      this.transformFn = options.transformFn || (text => text);
      this.trim = options.trim || false;
      this.normalizeWhitespace = options.normalizeWhitespace || false;
      this.normalizeNewlines = options.normalizeNewlines || false;
    }
    
    /**
     * Transform text node
     * 
     * No need to check context type - the pipeline handles that
     */
    transform(node: any, context: TransformContext): TransformResult<any> {
      // Handle both node object and direct string value
      let text: string;
      const isNodeObject = typeof node === 'object' && node !== null;
      
      if (isNodeObject && node.value !== undefined) {
        text = String(node.value);
      } else if (typeof node === 'string') {
        text = node;
      } else {
        // Not a text node or string, return unchanged
        return createTransformResult(node);
      }
      
      // Apply transformations
      let result = text;
      
      if (this.normalizeNewlines) {
        // Convert all newline formats (\r\n, \r) to \n
        result = result.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      }
      
      if (this.trim) {
        result = result.trim();
      }
      
      if (this.normalizeWhitespace) {
        // Replace sequences of whitespace with a single space
        result = result.replace(/\s+/g, ' ');
      }
      
      // Apply custom transform function
      result = this.transformFn(result);
      
      // Return transformed text in the same format as input
      if (isNodeObject) {
        const newNode = { ...node, value: result };
        return createTransformResult(newNode);
      } else {
        return createTransformResult(result);
      }
    }
  }