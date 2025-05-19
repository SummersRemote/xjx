/**
 * MetadataTransform - General purpose transform for managing XNode metadata
 */
import { 
  TransformContext, 
  TransformResult, 
  TransformTarget,
  createTransformResult,
  Format
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
  format: Format;
  
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
 * Create a metadata transform
 * @param options Metadata transform options
 * @returns Transform implementation
 */
export function createMetadataTransform(options: MetadataTransformOptions = {}) {
  // Basic validation - options need to be checked
  validate(
    options.applyToAll || options.applyToRoot || options.selector,
    'MetadataTransform must have at least one application method (applyToAll, applyToRoot, or selector)'
  );
  
  validate(
    options.metadata || (options.formatMetadata && options.formatMetadata.length > 0) || (options.removeKeys && options.removeKeys.length > 0),
    'MetadataTransform must have metadata to apply or keys to remove'
  );
  
  // Get options with defaults
  const selector = options.selector;
  const applyToRoot = options.applyToRoot || false;
  const applyToAll = options.applyToAll || false;
  const metadata = options.metadata;
  const replace = options.replace || false;
  const removeKeys = options.removeKeys || [];
  const maxDepth = options.maxDepth;
  
  // Process format-specific metadata
  const formatMetadata = new Map<Format, Record<string, any>>();
  if (options.formatMetadata && options.formatMetadata.length > 0) {
    for (const formatMeta of options.formatMetadata) {
      formatMetadata.set(formatMeta.format, formatMeta.metadata);
    }
  }
  
  // Create the transform
  return {
    // Target all node types except namespace
    targets: [
      TransformTarget.Element,
      TransformTarget.Text,
      TransformTarget.CDATA,
      TransformTarget.Comment,
      TransformTarget.ProcessingInstruction
    ],
    
    // Transform implementation
    transform(node: XNode, context: TransformContext): TransformResult<XNode> {
      try {
        // Check depth constraint if specified
        if (maxDepth !== undefined) {
          const depth = context.path.split('.').length - 1;
          if (depth > maxDepth) {
            return createTransformResult(node);
          }
        }
        
        // Determine if we should apply metadata to this node
        const shouldApply = 
          applyToAll || 
          (applyToRoot && !context.parent) ||
          matchesSelector(node, context, selector);
        
        if (!shouldApply) {
          return createTransformResult(node);
        }
        
        // Clone the node to avoid modifying original
        const clonedNode = deepClone(node);
        
        // Apply metadata modifications
        applyMetadataToNode(clonedNode, context, formatMetadata, metadata, replace, removeKeys);
        
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
  };
}

/**
 * Apply metadata changes to a node
 */
function applyMetadataToNode(
  node: XNode,
  context: TransformContext,
  formatMetadata: Map<Format, Record<string, any>>,
  generalMetadata?: Record<string, any>,
  replace: boolean = false,
  removeKeys: string[] = []
): void {
  // Remove keys if specified
  if (removeKeys.length > 0 && node.metadata) {
    for (const key of removeKeys) {
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
  if (formatMetadata.has(context.targetFormat)) {
    metadataToApply = formatMetadata.get(context.targetFormat);
  } else {
    // Fall back to general metadata
    metadataToApply = generalMetadata;
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
  if (replace) {
    // Replace mode: overwrite with new metadata
    Object.assign(node.metadata, metadataToApply);
  } else {
    // Merge mode: deep merge with existing metadata
    for (const [key, value] of Object.entries(metadataToApply)) {
      if (typeof value === 'object' && value !== null && 
          typeof node.metadata[key] === 'object' && node.metadata[key] !== null) {
        // Deep merge objects
        node.metadata[key] = mergeObjects(node.metadata[key], value);
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
function matchesSelector(
  node: XNode,
  context: TransformContext,
  selector?: NodeSelector
): boolean {
  if (!selector) {
    return false;
  }
  
  // Function selector
  if (typeof selector === 'function') {
    return selector(node, context);
  }
  
  // String selector (simple name matching)
  if (typeof selector === 'string') {
    return selector === node.name;
  }
  
  // RegExp selector
  if (selector instanceof RegExp) {
    return selector.test(node.name);
  }
  
  return false;
}

/**
 * Merge two objects deeply (simplified version of deepMerge specifically for metadata)
 */
function mergeObjects(target: any, source: any): any {
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
      result[key] = mergeObjects(targetValue, sourceValue);
    } else {
      // Otherwise just replace the value
      result[key] = deepClone(sourceValue);
    }
  });

  return result;
}