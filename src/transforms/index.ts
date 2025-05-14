/**
 * Transforms module
 * 
 * This module provides the transformers for converting between data types
 * and modifying XML/JSON data during transformation.
 */
  
  // Core transformers for data type conversion
  export { BooleanTransform, BooleanTransformOptions } from './boolean-transform';
  export { NumberTransform, NumberTransformOptions } from './number-transform';
  export { RegexTransform, RegexOptions } from './regex-transform';
  export { MetadataTransform, MetadataTransformOptions } from './metadata-transform';
  
  // Add other transforms as they're implemented:
  // export { TextTransform, TextTransformOptions } from './text-transform';
  // export { ElementTransform, ElementTransformOptions } from './element-transform';
  // export { CommentTransform, CommentTransformOptions } from './comment-transform';
