/**
 * Core transform interfaces and utilities
 */
import { Configuration } from './config';
import { XNode } from './xnode';

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
  return { value, remove };
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
    return {
      nodeName: rootName,
      nodeType: 1, // Element node
      path: rootName,
      config,
      targetFormat
    };
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
  static createAttributeContext(
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
   * Compose multiple transforms into a single transform
   * @param transforms Array of transforms to compose
   * @returns A single transform that applies all transforms in sequence
   */
  static composeTransforms(...transforms: Transform[]): Transform {
    // Combine all target types
    const allTargets = transforms.reduce((targets, transform) => {
      transform.targets.forEach(target => {
        if (!targets.includes(target)) {
          targets.push(target);
        }
      });
      return targets;
    }, [] as TransformTarget[]);
    
    return {
      targets: allTargets,
      transform: (value, context) => {
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
      }
    };
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
    return {
      targets: transform.targets,
      transform: (value, context) => {
        if (condition(value, context)) {
          return transform.transform(value, context);
        }
        return { value, remove: false };
      }
    };
  }
  
  /**
   * Create a named transform for better debugging
   * @param name Name for the transform
   * @param transform Transform to name
   * @returns Named transform
   */
  static namedTransform(name: string, transform: Transform): Transform & { name: string } {
    return {
      ...transform,
      name,
      transform: transform.transform
    };
  }

  /**
   * Get the appropriate transform target type based on context
   * @param context Transform context
   * @returns Target type
   * @private
   */
  private static getContextTargetType(context: TransformContext): TransformTarget {
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