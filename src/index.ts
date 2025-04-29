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

// Allow custom transformers
export { 
  ValueTransformer, 
  TransformContext, 
  TransformDirection 
} from './core/transformers/ValueTransformer';

// Utilities
export { ValidationResult } from './core/utils/xml-utils';
