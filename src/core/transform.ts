/**
 * Simplified transform system for XJX
 * 
 * Transforms are functions that take a value and return a value.
 * Simple, composable, and easy to use in the functional pipeline.
 */
import { XNode } from './xnode';

/**
 * Context information passed to transforms
 */
export interface TransformContext {
  /**
   * Transformation intent (PARSE or SERIALIZE)
   */
  intent?: TransformIntent;
  
  /**
   * Whether the current value is from an attribute
   */
  isAttribute?: boolean;
  
  /**
   * Name of the attribute (if isAttribute is true)
   */
  attributeName?: string;
  
  /**
   * Current path in the document
   */
  path?: string;
  
  /**
   * Additional context properties
   */
  [key: string]: any;
}

/**
 * Core Transform type - function that transforms a value with optional context
 */
export type Transform = (value: any, context?: TransformContext) => any;

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
   * Direction of transformation (default: TransformIntent.PARSE)
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
  return (value: any, context?: TransformContext) => {
    return transforms.reduce((result, transform) => transform(result, context), value);
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
  transformer: (value: any, context?: TransformContext) => any,
  options: TransformOptions = {}
): Transform {
  const {
    values = true,
    attributes = true,
    intent = TransformIntent.PARSE
  } = options;
  
  return (value: any, context?: TransformContext): any => {
    try {
      // Create a merged context with our options and passed context
      const mergedContext: TransformContext = {
        ...(context || {}),
        intent: context?.intent || intent
      };
      
      return transformer(value, mergedContext);
    } catch (err) {
      // If transformation fails, return original value
      console.warn(`Transform error: ${err instanceof Error ? err.message : String(err)}`);
      return value;
    }
  };
}