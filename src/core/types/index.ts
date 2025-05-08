/**
 * Core type definitions
 * 
 * This module provides all the type definitions used throughout the XJX library.
 */

// Configuration types
export { Configuration } from './config-types';

// DOM types
export { NodeType } from './dom-types';

// Error types
export { 
  XJXError, 
  XmlToJsonError, 
  JsonToXmlError, 
  EnvironmentError, 
  ConfigurationError 
} from './error-types';

// Extension types for plugin authors
export {
  XJXContext,
  TerminalExtensionContext,
  NonTerminalExtensionContext
} from './extension-types';

// JSON types
export { 
  JSONPrimitive, 
  JSONArray, 
  JSONObject, 
  JSONValue, 
  XMLJSONNode, 
  XMLJSONElement 
} from './json-types';

// Transform interfaces
export {
  Transform,
  TransformTarget,
  TransformContext,
  TransformResult,
  TransformDirection,
  XNode,
  createTransformResult
} from './transform-interfaces';