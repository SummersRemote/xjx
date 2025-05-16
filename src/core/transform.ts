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
   * Compose multiple transforms into a single transform
   * @param transforms Array of transforms to compose
   * @returns A single transform that applies all transforms in sequence
   */
  static composeTransforms(...transforms: Transform[]): Transform {
    try {
      // VALIDATION: Check for valid input
      validate(Array.isArray(transforms), "Transforms must be an array");
      
      // Combine all target types
      const allTargets = transforms.reduce((targets, transform) => {
        transform.targets.forEach(target => {
          if (!targets.includes(target)) {
            targets.push(target);
          }
        });
        return targets;
      }, [] as TransformTarget[]);
      
      logger.debug('Composing transforms', { 
        transformCount: transforms.length,
        targetTypes: allTargets
      });
      
      return {
        targets: allTargets,
        transform: (value, context) => {
          try {
            // Find transforms that match this context's target
            const targetType = TransformUtils.getContextTargetType(context);
            const applicableTransforms = transforms.filter(t => 
              t.targets.includes(targetType)
            );
            
            // Apply each transform in sequence
            let result = { value, remove: false };
            
            for (const transform of applicableTransforms) {
              result = transform.transform(result.value, context);
              
              // If a transform says to remove, we're done
              if (result.remove) {
                break;
              }
            }
            
            return result;
          } catch (err) {
            return handleError(err, "apply composed transform", {
              data: {
                context,
                valueType: typeof value
              },
              errorType: ErrorType.TRANSFORM,
              fallback: { value, remove: false } // Return original as fallback
            });
          }
        }
      };
    } catch (err) {
      return handleError(err, "compose transforms", {
        data: {
          transformCount: transforms?.length
        },
        errorType: ErrorType.TRANSFORM,
        fallback: {
          targets: [TransformTarget.Value],
          transform: (value: any) => ({ value, remove: false })
        }
      });
    }
  }
  
  /**
   * Create a conditional transform that only applies when condition is true
   * @param condition Condition function
   * @param transform Transform to apply when condition is true
   * @returns Conditional transform
   */
  static conditionalTransform(
    condition: (value: any, context: TransformContext) => boolean,
    transform: Transform
  ): Transform {
    try {
      // VALIDATION: Check for valid inputs
      validate(typeof condition === "function", "Condition must be a function");
      validate(transform !== null && typeof transform === 'object', "Transform must be a valid object");
      validate(Array.isArray(transform.targets), "Transform must have a targets array");
      validate(typeof transform.transform === "function", "Transform must have a transform method");
      
      logger.debug('Creating conditional transform', { 
        transformTargets: transform.targets 
      });
      
      return {
        targets: transform.targets,
        transform: (value, context) => {
          try {
            if (condition(value, context)) {
              return transform.transform(value, context);
            }
            return { value, remove: false };
          } catch (err) {
            return handleError(err, "apply conditional transform", {
              data: {
                context,
                valueType: typeof value
              },
              errorType: ErrorType.TRANSFORM,
              fallback: { value, remove: false } // Return original as fallback
            });
          }
        }
      };
    } catch (err) {
      return handleError(err, "create conditional transform", {
        data: {
          transformTargets: transform?.targets
        },
        errorType: ErrorType.TRANSFORM,
        fallback: {
          targets: transform?.targets || [TransformTarget.Value],
          transform: (value: any) => ({ value, remove: false })
        }
      });
    }
  }
  
  /**
   * Create a named transform for better debugging
   * @param name Name for the transform
   * @param transform Transform to name
   * @returns Named transform
   */
  static namedTransform(name: string, transform: Transform): Transform & { name: string } {
    try {
      // VALIDATION: Check for valid inputs
      validate(typeof name === "string", "Name must be a string");
      validate(transform !== null && typeof transform === 'object', "Transform must be a valid object");
      validate(Array.isArray(transform.targets), "Transform must have a targets array");
      validate(typeof transform.transform === "function", "Transform must have a transform method");
      
      logger.debug('Creating named transform', { 
        name, 
        transformTargets: transform.targets 
      });
      
      return {
        ...transform,
        name,
        transform: transform.transform
      };
    } catch (err) {
      return handleError(err, "create named transform", {
        data: {
          name,
          transformTargets: transform?.targets
        },
        errorType: ErrorType.TRANSFORM,
        fallback: {
          ...transform,
          name,
          transform: transform?.transform || ((value: any) => ({ value, remove: false })),
          targets: transform?.targets || [TransformTarget.Value]
        }
      });
    }
  }

  /**
   * Get the appropriate transform target type based on context
   * @param context Transform context
   * @returns Target type
   * @private
   */
  private static getContextTargetType(context: TransformContext): TransformTarget {
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