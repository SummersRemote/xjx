/**
 * XJX Library - XML/JSON transformation with fluent API
 * 
 * Main entry point and exports for the library
 */

// Main XJX class with fluent API
export { XJX } from './core/XJX';

// Core interfaces and types
export {
  Transform,
  TransformTarget,
  TransformContext,
  TransformResult,
  TransformDirection,
  XNode,
  transformResult,
  Configuration
} from './core/types/transform-interfaces';

// Configuration
export { DEFAULT_CONFIG } from './core/config/config';

// JSON types
export { 
  JSONPrimitive, 
  JSONArray, 
  JSONObject, 
  JSONValue, 
  XMLJSONNode, 
  XMLJSONElement 
} from './core/types/json-types';

// DOM types
export { NodeType } from './core/types/dom-types';

// Error types
export { 
  XJXError, 
  XmlToJsonError, 
  JsonToXmlError, 
  EnvironmentError, 
  ConfigurationError 
} from './core/types/error-types';

// Transformers
export { BooleanTransform, BooleanTransformOptions } from './core/transforms/boolean-transform';
export { NumberTransform, NumberTransformOptions } from './core/transforms/number-transform';
export { StringReplaceTransform, StringReplaceOptions } from './core/transforms/string-replace-transform';
export { CommentTransform, CommentTransformOptions } from './core/transforms/comment-transform';
export { AttributeTransform, AttributeTransformOptions } from './core/transforms/attribute-transform';
export { TextTransform, TextTransformOptions } from './core/transforms/text-transform';
export { 
  ElementTransform, 
  ElementTransformOptions,
  SortChildrenTransform,
  SortChildrenOptions
} from './core/transforms/element-transform';

// Utilities
export { ValidationResult } from './core/utils/xml-utils';
export { TransformApplier } from './core/converters/processor-interfaces';