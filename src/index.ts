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

// Extension system
export { ExtensionRegistry } from './core/extensions/registry';

// Utilities
export { ValidationResult } from './core/utils/xml-utils';
export { TransformUtil } from './core/utils/transform-utils';