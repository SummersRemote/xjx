/**
 * MetadataTransform - General purpose transform for managing XNode metadata
 */
import { 
  TransformContext, 
  TransformResult, 
  TransformTarget,
  createTransformResult,
  FORMAT
} from '../core/transform';
import { XNode } from '../core/xnode';
import { logger, validate } from '../core/error';
import { deepClone } from '../core/common';

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
 * MetadataTransform class for managing XNode metadata
 * 
 * Example usage:
 * ```
 * XJX.fromXml(xml)
 *    .withTransforms(new MetadataTransform({
 *      selector: 'user',
 *      metadata: { validation: { required: ['name', 'email'] } }
 *    }))
 *    .toJson();
 * ```
 */
export class MetadataTransform {
  private selector?: NodeSelector;
  private applyToRoot: boolean;
  private applyToAll: boolean;
  private metadata?: Record<string, any>;
  private formatMetadata: Map<FORMAT, Record<string, any>>;
  private replace: boolean;
  private removeKeys: string[];
  private maxDepth?: number;
  
  /**
   * Array of transform targets
   */
  public readonly targets = [
    TransformTarget.Element,
    TransformTarget.Text,
    TransformTarget.CDATA,
    TransformTarget.Comment,
    TransformTarget.ProcessingInstruction
  ];
  
  /**
   * Create a new MetadataTransform
   * @param options Options for customizing the transform behavior
   */
  constructor(options: MetadataTransformOptions = {}) {
    // Basic validation - options need to be checked
    validate(
      !!options.applyToAll || !!options.applyToRoot || !!options.selector,
      'MetadataTransform must have at least one application method (applyToAll, applyToRoot, or selector)'
    );
    
    validate(
      !!options.metadata || !!(options.formatMetadata && options.formatMetadata.length > 0) || !!(options.removeKeys && options.removeKeys.length > 0),
      'MetadataTransform must have metadata to apply or keys to remove'
    );
    
    // Get options with defaults
    this.selector = options.selector;
    this.applyToRoot = options.applyToRoot || false;
    this.applyToAll = options.applyToAll || false;
    this.metadata = options.metadata;
    this.replace = options.replace || false;
    this.removeKeys = options.removeKeys || [];
    this.maxDepth = options.maxDepth;
    
    // Process format-specific metadata
    this.formatMetadata = new Map<FORMAT, Record<string, any>>();
    if (options.formatMetadata && options.formatMetadata.length > 0) {
      for (const formatMeta of options.formatMetadata) {
        this.formatMetadata.set(formatMeta.format, formatMeta.metadata);
      }
    }
  }
  
  /**
   * Transform implementation
   * @param node Node to transform
   * @param context Transform context
   * @returns Transform result
   */
  transform(node: XNode, context: TransformContext): TransformResult<XNode> {
    try {
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
      const clonedNode = deepClone(node);
      
      // Apply metadata modifications
      this.applyMetadataToNode(clonedNode, context);
      
      return createTransformResult(clonedNode);
    } catch (err) {
      logger.error(`Metadata transform error: ${err instanceof Error ? err.message : String(err)}`, {
        nodeName: node?.name,
        nodeType: node?.type,
        path: context.path
      });
      
      // Return original node on error
      return createTransformResult(node);
    }
  }
  
  /**
   * Apply metadata changes to a node
   */
  private applyMetadataToNode(
    node: XNode,
    context: TransformContext
  ): void {
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
          node.metadata[key] = this.mergeObjects(node.metadata[key], value);
        } else {
          // Simple assignment for primitives or when target doesn't exist
          node.metadata[key] = value;
        }
      }
    }
  }
  
  /**
   * Check if a node matches the selector
   */
  private matchesSelector(
    node: XNode,
    context: TransformContext
  ): boolean {
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
   * Merge two objects deeply (simplified version of deepMerge specifically for metadata)
   */
  private mergeObjects(target: any, source: any): any {
    if (!source || typeof source !== 'object' || source === null) {
      return deepClone(target);
    }
  
    if (!target || typeof target !== 'object' || target === null) {
      return deepClone(source);
    }
  
    const result = deepClone(target);
  
    Object.keys(source).forEach((key) => {
      const sourceValue = source[key];
      const targetValue = result[key];
  
      // If both values are objects, recursively merge them
      if (
        sourceValue !== null &&
        targetValue !== null &&
        typeof sourceValue === 'object' &&
        typeof targetValue === 'object' &&
        !Array.isArray(sourceValue) &&
        !Array.isArray(targetValue)
      ) {
        result[key] = this.mergeObjects(targetValue, sourceValue);
      } else {
        // Otherwise just replace the value
        result[key] = deepClone(sourceValue);
      }
    });
  
    return result;
  }
}

/**
 * Create a MetadataTransform instance
 * @param options Options for customizing the transform behavior
 * @returns A new MetadataTransform instance
 */
export function createMetadataTransform(options: MetadataTransformOptions = {}): MetadataTransform {
  return new MetadataTransform(options);
}