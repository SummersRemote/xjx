// Core components
export { XJX } from './core/XJX';
export { Configuration } from './core/types/config-types';
export { DEFAULT_CONFIG } from './core/config/config';

// Types
export { 
  JSONPrimitive, 
  JSONArray, 
  JSONObject, 
  JSONValue, 
  XMLJSONNode, 
  XMLJSONElement 
} from './core/types/json-types';
export { NodeType } from './core/types/dom-types';

// Error handling
export { 
  XJXError, 
  XmlToJsonError, 
  JsonToXmlError, 
  EnvironmentError, 
  ConfigurationError 
} from './core/types/error-types';

// XML Entity utilities
export {
  escapeXML,
  unescapeXML,
  safeXmlText,
  containsSpecialChars
} from './core/utils/xml-escape-utils';

// Transformation API
export {
  TransformDirection,
  TransformContext,
  XNode,
  TransformResult,
  ValueTransformer,
  AttributeTransformer,
  ChildrenTransformer,
  NodeTransformer,
  transformResult
} from './core/types/transform-types';

// Base transformer classes
export {
  TransformerOptions,
  BaseValueTransformer,
  BaseAttributeTransformer,
  BaseChildrenTransformer,
  BaseNodeTransformer
} from './core/transformers/transformer-base';

// Transformers
export {
  BooleanTransformer,
  BooleanTransformerOptions,
  NumberTransformer,
  NumberTransformerOptions,
  StringReplaceTransformer,
  StringReplaceOptions
} from './core/transformers';

// Extension system
export { ExtensionRegistry } from './core/extensions/registry';

// Utilities
export { ValidationResult } from './core/utils/xml-utils';
export { TransformUtil } from './core/utils/transform-utils';
export { createPathMatcher } from './core/utils/path-matcher';