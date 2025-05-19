/**
 * Core transform interfaces and utilities
 */
import { XNode } from './xnode';
import { logger } from './error';

/**
 * Standard formats
 */
export enum FORMAT {
  XML = 'xml',
  JSON = 'json'
}

/**
 * Transform target types enum - specifies which nodes a transformer can target
 */
export enum TransformTarget {
  Value = 'value',
  Attribute = 'attribute',
  Element = 'element',
  Text = 'text',
  CDATA = 'cdata',
  Comment = 'comment',
  ProcessingInstruction = 'processingInstruction',
  Namespace = 'namespace'
}

/**
 * Context for transformation operations
 */
export interface TransformContext {
  // Node information
  nodeName: string;
  nodeType: number;
  path: string;
  
  // Type-specific information
  isAttribute?: boolean;
  attributeName?: string;
  isText?: boolean;
  isCDATA?: boolean;
  isComment?: boolean;
  isProcessingInstruction?: boolean;
  
  // Namespace information
  namespace?: string;
  prefix?: string;
  
  // Parent context for hierarchy
  parent?: TransformContext;
  
  // Configuration
  config: any;
  
  // Target format
  targetFormat: FORMAT;
}

/**
 * Result of a transformation operation
 */
export interface TransformResult<T> {
  // The transformed value
  value: T;
  
  // Whether the node/value should be removed
  remove?: boolean;
}

/**
 * Unified Transform interface
 */
export interface Transform {
  // Target types this transformer can handle
  targets: TransformTarget[];
  
  // Transform method with context
  transform(value: any, context: TransformContext): TransformResult<any>;
}

/**
 * Create a transform result
 * @param value Result value
 * @param remove Whether to remove the node
 * @returns Transform result object
 */
export function createTransformResult<T>(value: T, remove: boolean = false): TransformResult<T> {
  return { value, remove };
}

/**
 * Create a root transformation context
 * @param targetFormat Target format identifier
 * @param rootNode Root node
 * @param config Configuration
 * @returns Root transformation context
 */
export function createRootContext(
  targetFormat: FORMAT,
  rootNode: XNode,
  config: any
): TransformContext {
  return {
    nodeName: rootNode.name,
    nodeType: rootNode.type,
    path: rootNode.name,
    namespace: rootNode.namespace,
    prefix: rootNode.prefix,
    config: config,
    targetFormat,
  };
}

/**
 * Create a child context from a parent context
 * @param parentContext Parent context
 * @param childNode Child node
 * @param index Index of child in parent
 * @returns Child context
 */
export function createChildContext(
  parentContext: TransformContext,
  childNode: XNode,
  index: number
): TransformContext {
  return {
    nodeName: childNode.name,
    nodeType: childNode.type,
    namespace: childNode.namespace,
    prefix: childNode.prefix,
    path: `${parentContext.path}.${childNode.name}[${index}]`,
    config: parentContext.config,
    targetFormat: parentContext.targetFormat,
    parent: parentContext,
    isText: childNode.type === 3, // Text node
    isCDATA: childNode.type === 4, // CDATA
    isComment: childNode.type === 8, // Comment
    isProcessingInstruction: childNode.type === 7 // Processing instruction
  };
}

/**
 * Create an attribute context from a parent context
 * @param parentContext Parent context
 * @param attributeName Attribute name
 * @returns Attribute context
 */
export function createAttributeContext(
  parentContext: TransformContext,
  attributeName: string
): TransformContext {
  return {
    nodeName: parentContext.nodeName,
    nodeType: parentContext.nodeType,
    namespace: parentContext.namespace,
    prefix: parentContext.prefix,
    path: `${parentContext.path}.@${attributeName}`,
    config: parentContext.config,
    targetFormat: parentContext.targetFormat,
    parent: parentContext,
    isAttribute: true,
    attributeName
  };
}

/**
 * Get the appropriate transform target type based on context
 * @param context Transform context
 * @returns Target type
 */
export function getContextTargetType(context: TransformContext): TransformTarget {
  if (context.isAttribute) {
    return TransformTarget.Attribute;
  }
  
  if (context.isText) {
    return TransformTarget.Text;
  }
  
  if (context.isCDATA) {
    return TransformTarget.CDATA;
  }
  
  if (context.isComment) {
    return TransformTarget.Comment;
  }
  
  if (context.isProcessingInstruction) {
    return TransformTarget.ProcessingInstruction;
  }
  
  if (context.nodeType === 1) { // Element node
    return TransformTarget.Element;
  }
  
  // Default to Value
  return TransformTarget.Value;
}

/**
 * Apply transforms to a value
 * @param value Value to transform
 * @param context Transformation context
 * @param transforms Transforms to apply
 * @param targetType Target type to filter transforms
 * @returns Transform result
 */
export function applyTransforms<T>(
  value: T,
  context: TransformContext,
  transforms: Transform[],
  targetType: TransformTarget
): TransformResult<T> {
  // Filter applicable transforms
  const applicableTransforms = transforms.filter(t => 
    t.targets.includes(targetType)
  );
  
  // No applicable transforms? Return original value
  if (applicableTransforms.length === 0) {
    return { value };
  }
  
  // Apply each transform in sequence
  let result: TransformResult<any> = { value };
  
  for (const transform of applicableTransforms) {
    try {
      result = transform.transform(result.value, context);
      
      // If a transform says to remove, we're done
      if (result.remove) {
        return result;
      }
    } catch (err) {
      logger.error(`Transform error: ${err instanceof Error ? err.message : String(err)}`, {
        transform: transform.targets,
        path: context.path
      });
    }
  }
  
  return result;
}

/**
 * Interface for XML validation result
 */
export interface ValidationResult {
  /**
   * Whether the XML is valid
   */
  isValid: boolean;

  /**
   * Error message if the XML is invalid
   */
  message?: string;
}