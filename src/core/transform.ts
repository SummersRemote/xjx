/**
 * Core transform interfaces and utilities
 */
import { Configuration } from './config';
import { XNode } from './xnode';
import { logger, validate, handleError, ErrorType } from './error';

/**
 * Format identifier type
 */
export type FormatId = string;

/**
 * Standard formats
 */
export const FORMATS = {
  XML: 'xml' as FormatId,
  JSON: 'json' as FormatId
};

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
  
  // Hierarchical context
  parent?: TransformContext;
  
  // Configuration
  config: Configuration;
  
  // Target format
  targetFormat: FormatId;
}

/**
 * Result of a transformation operation
 */
export interface TransformResult<T> {
  // The transformed value
  value: T;
  
  // Whether the node/value should be removed
  remove: boolean;
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
 * Abstract base class for all transforms
 */
export abstract class BaseTransform implements Transform {
  /**
   * Target node types this transformer can handle
   */
  public readonly targets: TransformTarget[];
  
  /**
   * Create a new transform
   * @param targets Target node types this transformer can handle
   */
  constructor(targets: TransformTarget[]) {
    this.validateTargets(targets);
    this.targets = targets;
  }
  
  /**
   * Transform a value based on the context
   * This method must be implemented by subclasses
   * @param value Value to transform
   * @param context Transformation context
   * @returns Transformation result
   */
  abstract transform(value: any, context: TransformContext): TransformResult<any>;
  
  /**
   * Validate transformation context
   * @param context Context to validate
   * @param errorMessage Optional error message
   * @returns Validated context
   * @protected
   */
  protected validateContext(context: TransformContext, errorMessage?: string): TransformContext {
    try {
      validate(
        context && typeof context === 'object',
        errorMessage || "Transformation context must be a valid object"
      );
      
      validate(
        context.config && typeof context.config === 'object',
        errorMessage || "Transformation context must have a valid config"
      );
      
      validate(
        typeof context.targetFormat === 'string',
        errorMessage || "Transformation context must have a valid targetFormat"
      );
      
      return context;
    } catch (err) {
      throw handleError(err, "validate transformation context", {
        data: { context },
        errorType: ErrorType.VALIDATION
      });
    }
  }
  
  /**
   * Validate transform targets
   * @param targets Targets to validate
   * @returns Validated targets
   * @private
   */
  private validateTargets(targets: TransformTarget[]): TransformTarget[] {
    try {
      validate(
        Array.isArray(targets),
        "Transform targets must be an array"
      );
      
      validate(
        targets.length > 0,
        "Transform targets array must not be empty"
      );
      
      // Validate each target is a valid TransformTarget
      for (const target of targets) {
        validate(
          Object.values(TransformTarget).includes(target),
          `Invalid transform target: ${target}`
        );
      }
      
      return targets;
    } catch (err) {
      throw handleError(err, "validate transform targets", {
        data: { targets },
        errorType: ErrorType.VALIDATION
      });
    }
  }
  
  /**
   * Create a successful transform result
   * @param value Transformed value
   * @returns Transform result
   * @protected
   */
  protected success<T>(value: T): TransformResult<T> {
    return createTransformResult(value);
  }
  
  /**
   * Create a removal transform result
   * @param value Optional value to include
   * @returns Transform result with remove flag set
   * @protected
   */
  protected remove<T>(value?: T): TransformResult<T> {
    return createTransformResult(value as T, true);
  }
}

/**
 * Helper function to create a transform result
 */
export function createTransformResult<T>(value: T, remove: boolean = false): TransformResult<T> {
  try {
    return { value, remove };
  } catch (err) {
    return handleError(err, "create transform result", {
      data: { valueType: typeof value, remove },
      fallback: { value, remove } // Return with original values as fallback
    });
  }
}

/**
 * Transform utilities for working with transformers
 */
export class TransformUtils {
  /**
   * Create a root transformation context
   * @param targetFormat Target format identifier
   * @param rootName Name of the root node
   * @param config Configuration
   * @returns Root transformation context
   */
  static createRootContext(
    targetFormat: FormatId,
    rootName: string,
    config: Configuration
  ): TransformContext {
    try {
      // VALIDATION: Check for valid inputs
      validate(typeof targetFormat === "string", "Target format must be a string");
      validate(typeof rootName === "string", "Root name must be a string");
      validate(config !== null && typeof config === 'object', "Configuration must be a valid object");
      
      const context = {
        nodeName: rootName,
        nodeType: 1, // Element node
        path: rootName,
        config,
        targetFormat
      };
      
      logger.debug('Created root transform context', { 
        rootName, 
        targetFormat 
      });
      
      return context;
    } catch (err) {
      return handleError(err, "create root transformation context", {
        data: {
          targetFormat,
          rootName
        },
        errorType: ErrorType.TRANSFORM,
        fallback: {
          nodeName: rootName || 'root',
          nodeType: 1,
          path: rootName || 'root',
          config,
          targetFormat
        }
      });
    }
  }
  
  /**
   * Create a child context from a parent context
   * @param parentContext Parent context
   * @param childNode Child node
   * @param index Index of child
   * @returns Child context
   */
  static createChildContext(
    parentContext: TransformContext,
    childNode: XNode,
    index: number
  ): TransformContext {
    try {
      // VALIDATION: Check for valid inputs
      validate(parentContext !== null && typeof parentContext === 'object', "Parent context must be a valid object");
      validate(childNode instanceof XNode, "Child node must be an XNode instance");
      validate(Number.isInteger(index) && index >= 0, "Index must be a non-negative integer");
      
      const context = {
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
      
      logger.debug('Created child transform context', { 
        nodeName: childNode.name, 
        nodeType: childNode.type,
        path: context.path
      });
      
      return context;
    } catch (err) {
      return handleError(err, "create child transformation context", {
        data: {
          parentPath: parentContext?.path,
          childName: childNode?.name,
          childType: childNode?.type,
          index
        },
        errorType: ErrorType.TRANSFORM,
        fallback: {
          nodeName: childNode?.name || 'unknown',
          nodeType: childNode?.type || 1,
          path: `${parentContext?.path || 'root'}.${childNode?.name || 'child'}[${index}]`,
          config: parentContext?.config,
          targetFormat: parentContext?.targetFormat || FORMATS.XML,
          parent: parentContext
        }
      });
    }
  }
  
  /**
   * Create an attribute context from a parent context
   * @param parentContext Parent context
   * @param attributeName Attribute name
   * @returns Attribute context
   */
  static createAttributeContext(
    parentContext: TransformContext,
    attributeName: string
  ): TransformContext {
    try {
      // VALIDATION: Check for valid inputs
      validate(parentContext !== null && typeof parentContext === 'object', "Parent context must be a valid object");
      validate(typeof attributeName === "string", "Attribute name must be a string");
      
      const context = {
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
      
      logger.debug('Created attribute transform context', { 
        nodeName: parentContext.nodeName, 
        attributeName,
        path: context.path
      });
      
      return context;
    } catch (err) {
      return handleError(err, "create attribute transformation context", {
        data: {
          parentPath: parentContext?.path,
          attributeName
        },
        errorType: ErrorType.TRANSFORM,
        fallback: {
          nodeName: parentContext?.nodeName || 'unknown',
          nodeType: parentContext?.nodeType || 1,
          path: `${parentContext?.path || 'root'}.@${attributeName}`,
          config: parentContext?.config,
          targetFormat: parentContext?.targetFormat || FORMATS.XML,
          parent: parentContext,
          isAttribute: true,
          attributeName
        }
      });
    }
  }
  
  /**
   * Get the appropriate transform target type based on context
   * @param context Transform context
   * @returns Target type
   */
  static getContextTargetType(context: TransformContext): TransformTarget {
    try {
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
    } catch (err) {
      return handleError(err, "get context target type", {
        data: { 
          nodeType: context?.nodeType,
          nodeName: context?.nodeName
        },
        fallback: TransformTarget.Value
      });
    }
  }
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