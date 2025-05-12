/**
 * Core module
 * 
 * This module provides access to the core functionality of the XJX library.
 * For most users, importing from the root package is sufficient, but this
 * export allows access to internal components if needed.
 */

// Export utilities
export * from './utils';

// Export models
export * from './models';

// Export services
export * from './services';

// Export types - use explicit re-exports to avoid name conflicts with models
export {
  Configuration,
  NodeType,
  XJXError, 
  XmlToJsonError, 
  JsonToXmlError, 
  EnvironmentError, 
  ConfigurationError,
  XJXContext,
  TerminalExtensionContext,
  NonTerminalExtensionContext,
  JSONPrimitive, 
  JSONArray, 
  JSONObject, 
  JSONValue, 
  XMLJSONNode, 
  XMLJSONElement,
  Transform,
  TransformTarget,
  TransformContext,
  TransformResult,
  FormatId,
  createTransformResult
} from './types';

// Export config defaults
export { DEFAULT_CONFIG } from './config/config';