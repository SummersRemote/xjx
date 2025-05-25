/**
 * Simplified transform system for XJX
 * 
 * Transforms are just functions that take a value and return a value.
 * This makes them easy to create, compose, and use in the functional pipeline.
 */
import { XNode } from './xnode';
import { Configuration } from './config';

/**
 * Core Transform type - just a function that transforms a value
 */
export type Transform = (value: any) => any;

/**
 * Transform intent - determines direction of transformation
 */
export enum TransformIntent {
  /**
   * Parse mode: Convert strings to typed values (default)
   * Examples: "123" → 123, "true" → true, "2023-01-15" → Date
   */
  PARSE = 'parse',
  
  /**
   * Serialize mode: Convert typed values to strings
   * Examples: 123 → "123", true → "true", Date → "2023-01-15"
   */
  SERIALIZE = 'serialize'
}

/**
 * Options for customizing transform behavior
 */
export interface TransformOptions {
  /**
   * Apply to node values (default: true)
   */
  values?: boolean;
  
  /**
   * Apply to attribute values (default: true)
   */
  attributes?: boolean;
  
  /**
   * Filter for specific attributes (optional)
   * Only attributes matching this filter will be transformed
   */
  attributeFilter?: string | RegExp | ((name: string) => boolean);
  
  /**
   * Filter for specific nodes by path (optional)
   * Only nodes matching this path filter will be transformed
   */
  pathFilter?: string | RegExp | ((path: string) => boolean);
  
  /**
   * Direction of transformation (default: TransformIntent.PARSE)
   * - PARSE: Convert strings to typed values
   * - SERIALIZE: Convert typed values to strings
   */
  intent?: TransformIntent;
}

/**
 * Compose multiple transforms into a single transform
 * Transforms are applied in order (left to right)
 * 
 * @example
 * ```
 * const processPrice = compose(
 *   regex(/[^\d.]/g, ''),  // Remove non-digits and dots
 *   toNumber({ precision: 2 }),
 *   (value) => value * 1.1  // Add 10% markup
 * );
 * ```
 * 
 * @param transforms Array of transforms to compose
 * @returns A composed transform function
 */
export function compose(...transforms: Transform[]): Transform {
  return (value: any) => {
    return transforms.reduce((result, transform) => transform(result), value);
  };
}

/**
 * Create a transform with error handling and default behaviors
 * 
 * @param transformer Core transformation function
 * @param options Transform options
 * @returns A new transform function
 */
export function createTransform(
  transformer: (value: any) => any,
  options: TransformOptions = {}
): Transform {
  const {
    values = true,
    attributes = true,
    attributeFilter,
    pathFilter
  } = options;
  
  // Create a matcher function for attribute filter if provided
  const matchesAttribute = attributeFilter 
    ? createMatcher(attributeFilter)
    : () => true;
  
  // Create a matcher function for path filter if provided
  const matchesPath = pathFilter
    ? createMatcher(pathFilter)
    : () => true;
  
  // Return the transform function with proper error handling
  return (value: any) => {
    try {
      return transformer(value);
    } catch (err) {
      // If transformation fails, return original value
      console.warn(`Transform error: ${err instanceof Error ? err.message : String(err)}`);
      return value;
    }
  };
}

/**
 * Create a matcher function from a string, RegExp, or function
 */
function createMatcher(pattern: string | RegExp | ((input: string) => boolean)): (input: string) => boolean {
  if (typeof pattern === 'function') {
    return pattern;
  } else if (pattern instanceof RegExp) {
    return (input: string) => pattern.test(input);
  } else {
    return (input: string) => input === pattern;
  }
}

// Legacy exports to maintain compatibility with existing code
// These will be gradually phased out

/**
 * Standard formats (kept for backward compatibility in converters)
 */
export enum FORMAT {
  XML = 'xml',
  JSON = 'json'
}

/**
 * Legacy transform target enum
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
 * Legacy transform result interface
 */
export interface TransformResult<T> {
  value: T;
  remove?: boolean;
}

/**
 * Create a transform result (legacy)
 */
export function createTransformResult<T>(value: T, remove: boolean = false): TransformResult<T> {
  return { value, remove };
}

/**
 * Legacy context for transforms
 */
export interface TransformContext {
  nodeName: string;
  nodeType: number;
  path: string;
  config: Configuration;
  targetFormat: FORMAT;
  parent?: TransformContext;
  namespace?: string;
  prefix?: string;
  isAttribute?: boolean;
  attributeName?: string;
  isText?: boolean;
  isCDATA?: boolean;
  isComment?: boolean;
  isProcessingInstruction?: boolean;
}

/**
 * Create a root transformation context (legacy)
 */
export function createRootContext(
  targetFormat: FORMAT,
  rootNode: XNode,
  config: Configuration
): TransformContext {
  return {
    nodeName: rootNode.name,
    nodeType: rootNode.type,
    path: rootNode.name,
    namespace: rootNode.namespace,
    prefix: rootNode.prefix,
    config: config,
    targetFormat
  };
}

/**
 * Legacy transform interface
 */
export interface LegacyTransform {
  targets: TransformTarget[];
  transform(value: any, context: TransformContext): TransformResult<any>;
}

/**
 * Get context target type (legacy)
 */
export function getContextTargetType(context: TransformContext): TransformTarget {
  if (context.isAttribute) {
    return TransformTarget.Attribute;
  }
  
  if (context.isText) {
    return TransformTarget.Text;
  }
  
  return TransformTarget.Element;
}

/**
 * Apply transforms (legacy)
 */
export function applyTransforms<T>(
  value: T,
  context: TransformContext,
  transforms: LegacyTransform[],
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
      console.warn(`Transform error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  
  return result;
}