/**
 * MetadataTransform - General purpose transform for managing XNode metadata
 * 
 * Updated to use target format instead of direction.
 */
import { 
  Transform, 
  TransformContext, 
  TransformResult, 
  TransformTarget, 
  FormatId,
  createTransformResult 
} from '../core/transform';
import { XNode } from '../core/xnode';
import { catchAndRelease, validate, ErrorType } from "../core/error";

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
  format: FormatId;
  
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
export class MetadataTransform implements Transform {
  // Target elements and other node types
  targets = [
    TransformTarget.Element,
    TransformTarget.Text,
    TransformTarget.CDATA,
    TransformTarget.Comment,
    TransformTarget.ProcessingInstruction
  ];
  
  private selector?: NodeSelector;
  private applyToRoot: boolean;
  private applyToAll: boolean;
  private metadata?: Record<string, any>;
  private formatMetadata: Map<FormatId, Record<string, any>>;
  private replace: boolean;
  private removeKeys: string[];
  private maxDepth?: number;
  
  /**
   * Create a new metadata transformer
   * @param options Transformer options
   */
  constructor(options: MetadataTransformOptions = {}) {
    validate(
      !!options && typeof options === 'object',
      'MetadataTransform requires options object'
    );
    
    this.selector = options.selector;
    this.applyToRoot = options.applyToRoot || false;
    this.applyToAll = options.applyToAll || false;
    this.metadata = options.metadata;
    this.replace = options.replace || false;
    this.removeKeys = options.removeKeys || [];
    this.maxDepth = options.maxDepth;
    
    // Initialize format metadata map
    this.formatMetadata = new Map<FormatId, Record<string, any>>();
    
    // Process format-specific metadata
    if (options.formatMetadata && options.formatMetadata.length > 0) {
      for (const formatMeta of options.formatMetadata) {
        this.formatMetadata.set(formatMeta.format, formatMeta.metadata);
      }
    }
    
    // Validate that we have at least one application method
    validate(
      this.applyToAll || this.applyToRoot || !!this.selector,
      'MetadataTransform must have at least one application method (applyToAll, applyToRoot, or selector)'
    );
    
    // Validate that we have metadata to apply
    validate(
      !!this.metadata || this.formatMetadata.size > 0 || this.removeKeys.length > 0,
      'MetadataTransform must have metadata to apply or keys to remove'
    );
  }
  
  /**
   * Apply metadata transformation to a node
   * @param node Node to transform
   * @param context Transformation context
   * @returns Transform result with possibly modified node
   */
  transform(node: XNode, context: TransformContext): TransformResult<XNode> {
    // Check depth constraint if specified
    if (this.maxDepth !== undefined) {
      const depth = context.path.split('.').length - 1;
      if (depth > this.maxDepth) {
        return createTransformResult(node);
      }
    }
    
    // Determine if we should apply metadata to this node
    const shouldApply = 
      this.applyToAll || 
      (this.applyToRoot && !context.parent) ||
      this.matchesSelector(node, context);
    
    if (!shouldApply) {
      return createTransformResult(node);
    }
    
    // Clone the node to avoid modifying original
    const clonedNode = node.clone(false);
    
    // Preserve children
    clonedNode.children = node.children;
    
    // Apply metadata modifications
    this.applyMetadataToNode(clonedNode, context);
    
    return createTransformResult(clonedNode);
  }
  
  /**
   * Apply metadata changes to a node
   * @param node Node to modify
   * @param context Transformation context
   * @private
   */
  private applyMetadataToNode(node: XNode, context: TransformContext): void {
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
          node.metadata[key] = this.deepMerge(node.metadata[key], value);
        } else {
          // Simple assignment for primitives or when target doesn't exist
          node.metadata[key] = value;
        }
      }
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
  }
  
  /**
   * Deep merge two objects
   * @param target Target object
   * @param source Source object
   * @returns Merged object
   * @private
   */
  private deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
    const result = { ...target };
    
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        const sourceValue = source[key];
        const targetValue = target[key];
        
        if (typeof sourceValue === 'object' && sourceValue !== null &&
            typeof targetValue === 'object' && targetValue !== null &&
            !Array.isArray(sourceValue) && !Array.isArray(targetValue)) {
          // Recursively merge nested objects
          result[key] = this.deepMerge(targetValue, sourceValue);
        } else {
          // Simple assignment for primitives or arrays
          result[key] = sourceValue as any;
        }
      }
    }
    
    return result;
  }
}