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

// Transformation API
export {
  XNode,
  TransformContext,
  TransformDirection,
  Transformer,
  ValueTransformer,
  AttributeTransformer,
  ChildrenTransformer,
  NodeTransformer
} from './core/types/transform-types';

// Base transformer classes
export {
  BaseTransformer,
  BaseValueTransformer,
  BaseAttributeTransformer,
  BaseChildrenTransformer,
  BaseNodeTransformer
} from './core/transformers/transformer-base';

// Value transformers
export {
  BooleanTransformer,
  BooleanTransformerOptions
} from './core/transformers/boolean-transformer';

export {
  NumberTransformer,
  NumberTransformerOptions
} from './core/transformers/number-transformer';

export {
  StringReplaceTransformer,
  StringReplaceOptions
} from './core/transformers/string-replace-transformer';

// Structural transformers
export {
  FilterTransformer,
  FilterTransformerOptions,
  FilterPredicate,
  FilterCondition,
  FilterOp
} from './core/transformers/filter-transformer';

// Extension system
export { ExtensionRegistry } from './core/extensions/registry';

// Utilities
export { ValidationResult } from './core/utils/xml-utils';
export { TransformUtil } from './core/utils/transform-utils';