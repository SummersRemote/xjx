/**
 * Transformer Factory Functions
 * 
 * Provides convenient factory functions to create common transformers
 */
import { BooleanTransformer, BooleanTransformerOptions } from './boolean-transformer';
import { NumberTransformer, NumberTransformerOptions } from './number-transformer';
import { StringReplaceTransformer, StringReplaceOptions } from './string-replace-transformer';
import { XNode, TransformContext, ValueTransformer } from '../types/transform-types';

/**
 * Create a boolean transformer that converts string values to boolean types
 * @param options Configuration options
 * @returns A BooleanTransformer instance
 */
export function createBooleanTransformer(options: BooleanTransformerOptions = {}): BooleanTransformer {
  return new BooleanTransformer(options);
}

/**
 * Create a number transformer that converts string values to numeric types
 * @param options Configuration options
 * @returns A NumberTransformer instance
 */
export function createNumberTransformer(options: NumberTransformerOptions = {}): NumberTransformer {
  return new NumberTransformer(options);
}

/**
 * Create a string replace transformer that performs regex replacements
 * @param options Configuration options
 * @returns A StringReplaceTransformer instance 
 */
export function createStringReplaceTransformer(options: StringReplaceOptions): StringReplaceTransformer {
  return new StringReplaceTransformer(options);
}

/**
 * Create a simple value transformer from a function
 * @param transformFn Function to transform values
 * @param paths Optional paths to restrict the transformer to
 * @returns A ValueTransformer instance
 */
export function createValueTransformer(
  transformFn: (value: any, node: XNode, context: TransformContext) => any,
  paths?: string | string[]
): ValueTransformer {
  return {
    transform(value: any, node: XNode, context: TransformContext): any {
      // Skip if paths don't match
      if (paths) {
        const transformUtil = new (require('../utils/transform-utils').TransformUtil)(context.config);
        const pathMatcher = transformUtil.createPathMatcher(paths);
        
        if (!pathMatcher(context.path)) {
          return value;
        }
      }
      
      // Apply transformation
      return transformFn(value, node, context);
    }
  };
}

// Export everything
export {
  BooleanTransformer,
  NumberTransformer,
  StringReplaceTransformer
};