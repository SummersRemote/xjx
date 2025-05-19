/**
 * MetadataTransform - General purpose transform for managing XNode metadata
 * 
 * Simplified implementation using the BaseTransform from core
 */
import { 
  TransformContext, 
  TransformResult, 
  TransformTarget, 
  BaseTransform,
  FORMAT
} from '../core/transform';
import { XNode } from '../core/xnode';
import { Common } from '../core/common';
import { handleError, ErrorType } from '../core/error';

/**
 * Type for node selector functions
 */
export type NodeSelector = string | RegExp | ((node: XNode, context: TransformContext) => boolean);

/**
 * Format-specific metadata configuration
 */
export interface FormatMetadata {
  /**
   * Format identifier this metadata applies to
   */
  format: FORMAT;
  
  /**
   * Metadata to apply for this format
   */
  metadata: Record<string, any>;
}

/**
 * Options for metadata transformer
 */
export interface MetadataTransformOptions {
  /**
   * Criteria for selecting nodes to apply metadata to
   */
  selector?: NodeSelector;
  
  /**
   * Whether to apply to the root node regardless of selector
   */
  applyToRoot?: boolean;
  
  /**
   * Whether to apply to all nodes regardless of selector
   */
  applyToAll?: boolean;
  
  /**
   * Metadata to apply to matching nodes
   * Used when no format-specific metadata is defined
   */
  metadata?: Record<string, any>;
  
  /**
   * Format-specific metadata configurations
   * When provided, the appropriate metadata will be applied based on the target format
   */
  formatMetadata?: FormatMetadata[];
  
  /**
   * Whether to replace existing metadata (true) or merge with it (false)
   */
  replace?: boolean;
  
  /**
   * List of metadata keys to remove (if any)
   */
  removeKeys?: string[];
  
  /**
   * Maximum depth to apply metadata (undefined = no limit)
   */
  maxDepth?: number;
}

/**
 * MetadataTransform - General purpose transform for managing XNode metadata
 * 
 * Example usage:
 * ```
 * // Add formatting metadata to all elements
 * XJX.fromXml(xml)
 *    .withTransforms(new MetadataTransform({
 *      applyToAll: true,
 *      metadata: { 'formatting': { indent: 2 } }
 *    }))
 *    .toXml();
 * 
 * // Add format-specific validation metadata to specific elements
 * XJX.fromXml(xml)
 *    .withTransforms(new MetadataTransform({
 *      selector: 'user',
 *      formatMetadata: [
 *        {
 *          format: 'json',
 *          metadata: { 'validate': { required: ['name', 'email'] } }
 *        },
 *        {
 *          format: 'xml',
 *          metadata: { 'schema': 'user.xsd' }
 *        }
 *      ]
 *    }))
 *    .toJson();
 * ```
 */
export class MetadataTransform extends BaseTransform {
  private selector?: NodeSelector;
  private applyToRoot: boolean;
  private applyToAll: boolean;
  private metadata?: Record<string, any>;
  private formatMetadata: Map<FORMAT, Record<string, any>>;
  private replace: boolean;
  private removeKeys: string[];
  private maxDepth?: number;
  
  /**
   * Create a new metadata transformer
   * @param options Transformer options
   */
  constructor(options: MetadataTransformOptions = {}) {
    // Initialize with Element, Text, CDATA, Comment, and PI targets
    super([
      TransformTarget.Element,
      TransformTarget.Text,
      TransformTarget.CDATA,
      TransformTarget.Comment,
      TransformTarget.ProcessingInstruction
    ]);

    try {
      // Store configuration options
      this.selector = options.selector;
      this.applyToRoot = options.applyToRoot || false;
      this.applyToAll = options.applyToAll || false;
      this.metadata = options.metadata;
      this.replace = options.replace || false;
      this.removeKeys = options.removeKeys || [];
      this.maxDepth = options.maxDepth;
      
      // Initialize format metadata map
      this.formatMetadata = new Map<FORMAT, Record<string, any>>();
      
      // Process format-specific metadata
      if (options.formatMetadata && options.formatMetadata.length > 0) {
        for (const formatMeta of options.formatMetadata) {
          this.formatMetadata.set(formatMeta.format, formatMeta.metadata);
        }
      }
      
      // Basic validation - options need to be checked
      if (!this.applyToAll && !this.applyToRoot && !this.selector) {
        throw new Error('MetadataTransform must have at least one application method (applyToAll, applyToRoot, or selector)');
      }
      
      if (!this.metadata && this.formatMetadata.size === 0 && this.removeKeys.length === 0) {
        throw new Error('MetadataTransform must have metadata to apply or keys to remove');
      }
    } catch (err) {
      throw handleError(err, "initialize metadata transform", {
        data: {
          hasSelector: !!options.selector,
          applyToRoot: options.applyToRoot,
          applyToAll: options.applyToAll,
          hasMetadata: !!options.metadata,
          formatMetadataCount: options.formatMetadata?.length || 0,
          removeKeysCount: options.removeKeys?.length || 0
        },
        errorType: ErrorType.TRANSFORM
      });
    }
  }
  
  /**
   * Apply metadata transformation to a node
   * @param node Node to transform
   * @param context Transformation context
   * @returns Transform result with possibly modified node
   */
  transform(node: XNode, context: TransformContext): TransformResult<XNode> {
    try {
      // Validate context using base class method
      this.validateContext(context);
      
      // Check depth constraint if specified
      if (this.maxDepth !== undefined) {
        const depth = context.path.split('.').length - 1;
        if (depth > this.maxDepth) {
          return this.success(node);
        }
      }
      
      // Determine if we should apply metadata to this node
      const shouldApply = 
        this.applyToAll || 
        (this.applyToRoot && !context.parent) ||
        this.matchesSelector(node, context);
      
      if (!shouldApply) {
        return this.success(node);
      }
      
      // Clone the node to avoid modifying original
      const clonedNode = node.clone(false);
      
      // Preserve children
      clonedNode.children = node.children;
      
      // Apply metadata modifications
      this.applyMetadataToNode(clonedNode, context);
      
      return this.success(clonedNode);
    } catch (err) {
      return handleError(err, "transform metadata", {
        data: {
          nodeName: node?.name,
          nodeType: node?.type,
          path: context.path,
          targetFormat: context.targetFormat
        },
        errorType: ErrorType.TRANSFORM,
        fallback: this.success(node) // Return original node as fallback
      });
    }
  }
  
  /**
   * Apply metadata changes to a node
   * @param node Node to modify
   * @param context Transformation context
   * @private
   */
  private applyMetadataToNode(node: XNode, context: TransformContext): void {
    try {
      // Remove keys if specified
      if (this.removeKeys.length > 0 && node.metadata) {
        for (const key of this.removeKeys) {
          delete node.metadata[key];
        }
        
        // If metadata is now empty, remove it completely
        if (Object.keys(node.metadata).length === 0) {
          node.metadata = undefined;
        }
      }
      
      // Get the metadata to apply based on target format
      let metadataToApply: Record<string, any> | undefined;
      
      // Check for format-specific metadata first
      if (this.formatMetadata.has(context.targetFormat)) {
        metadataToApply = this.formatMetadata.get(context.targetFormat);
      } else {
        // Fall back to general metadata
        metadataToApply = this.metadata;
      }
      
      // If no metadata to add, we're done
      if (!metadataToApply || Object.keys(metadataToApply).length === 0) {
        return;
      }
      
      // Initialize metadata if needed
      if (!node.metadata) {
        node.metadata = {};
      }
      
      // Apply new metadata
      if (this.replace) {
        // Replace mode: overwrite with new metadata
        Object.assign(node.metadata, metadataToApply);
      } else {
        // Merge mode: deep merge with existing metadata
        for (const [key, value] of Object.entries(metadataToApply)) {
          if (typeof value === 'object' && value !== null && 
              typeof node.metadata[key] === 'object' && node.metadata[key] !== null) {
            // Deep merge objects
            node.metadata[key] = Common.deepMerge(node.metadata[key], value);
          } else {
            // Simple assignment for primitives or when target doesn't exist
            node.metadata[key] = value;
          }
        }
      }
    } catch (err) {
      handleError(err, "apply metadata to node", {
        data: {
          nodeName: node?.name,
          nodeType: node?.type,
          targetFormat: context.targetFormat,
          replace: this.replace,
          removeKeysCount: this.removeKeys.length
        },
        errorType: ErrorType.TRANSFORM
      });
    }
  }
  
  /**
   * Check if a node matches the selector
   * @param node Node to check
   * @param context Transformation context
   * @returns True if node matches selector
   * @private
   */
  private matchesSelector(node: XNode, context: TransformContext): boolean {
    try {
      if (!this.selector) {
        return false;
      }
      
      // Function selector
      if (typeof this.selector === 'function') {
        return this.selector(node, context);
      }
      
      // String selector (simple name matching)
      if (typeof this.selector === 'string') {
        return this.selector === node.name;
      }
      
      // RegExp selector
      if (this.selector instanceof RegExp) {
        return this.selector.test(node.name);
      }
      
      return false;
    } catch (err) {
      return handleError(err, "check if node matches selector", {
        data: {
          nodeName: node?.name,
          nodeType: node?.type,
          selectorType: typeof this.selector
        },
        fallback: false
      });
    }
  }
}